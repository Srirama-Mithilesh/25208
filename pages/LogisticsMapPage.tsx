import * as React from 'react';
import { useData } from '../context/DataContext';
import { MOCK_DESTINATIONS } from '../constants';
import { Loader2 } from 'lucide-react';

declare const mapmyindia: any;

const LogisticsMapPage: React.FC = () => {
    const mapContainerRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<any>(null);
    const { inventories, rakePlans, orders } = useData();
    const [mapStatus, setMapStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = React.useState('');

    const activePlans = React.useMemo(() => {
        const deliveredOrderIds = new Set(orders.filter(o => o.status === 'Delivered').map(o => o.id));
        return rakePlans.filter(plan =>
            !plan.fulfilledOrderIds.every(id => deliveredOrderIds.has(id))
        );
    }, [rakePlans, orders]);

    React.useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) {
            return;
        }

        let isMounted = true;

        const initializeMap = () => {
            try {
                if (typeof mapmyindia === 'undefined' || typeof mapmyindia.Map === 'undefined') {
                    throw new Error('MapMyIndia library not loaded.');
                }
                const map = new mapmyindia.Map(mapContainerRef.current, {
                    center: [22, 82], // Centered on India
                    zoom: 5,
                });
                mapInstanceRef.current = map;

                map.on('load', () => {
                    if (!isMounted) return;
                    setMapStatus('loaded');
                    
                    // Add markers for all inventory bases
                    inventories.forEach(inv => {
                        new mapmyindia.Marker({
                            position: [inv.lat, inv.lon],
                            map: map,
                            title: inv.baseName
                        });
                    });

                    // Draw routes for all active plans
                    let apiKey: string | undefined;
                    if (typeof process !== 'undefined' && process.env) {
                      apiKey = process.env.API_KEY;
                    }
                    
                    if (!apiKey) {
                        setErrorMessage('API key not configured. Showing simulated straight-line routes.');
                    }

                    activePlans.forEach((plan, index) => {
                        const source = inventories.find(inv => inv.baseName === plan.base);
                        const destCoords = MOCK_DESTINATIONS[plan.destination];
                        if (!source || !destCoords) return;

                        const origin = { lat: source.lat, lng: source.lon };
                        const destination = { lat: destCoords.lat, lng: destCoords.lon };
                        const routeId = `route-${plan.rakeId}`;
                        const color = ['#FF6600', '#003366', '#0077B6', '#FDB813'][index % 4];

                        const drawLine = (coordinates: number[][], isSimulated: boolean) => {
                            if (!mapInstanceRef.current) return;
                            map.addSource(routeId, {
                                type: 'geojson',
                                data: { type: 'Feature', geometry: { type: 'LineString', coordinates } }
                            });
                            map.addLayer({
                                id: routeId,
                                type: 'line',
                                source: routeId,
                                layout: { 'line-join': 'round', 'line-cap': 'round' },
                                paint: {
                                    'line-color': color,
                                    'line-width': isSimulated ? 3 : 4,
                                    'line-dasharray': isSimulated ? [2, 2] : [1]
                                }
                            });
                        };

                        if (!apiKey) {
                            drawLine([[origin.lng, origin.lat], [destination.lng, destination.lat]], true);
                            return;
                        }

                        fetch(`https://apis.mapmyindia.com/advancedmaps/v1/${apiKey}/route_adv/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson`)
                            .then(res => res.json())
                            .then(data => {
                                if (isMounted && data.responseCode === 200 && data.routes?.length > 0) {
                                    drawLine(data.routes[0].geometry.coordinates, false);
                                } else {
                                    drawLine([[origin.lng, origin.lat], [destination.lng, destination.lat]], true);
                                }
                            })
                            .catch(err => {
                                console.error(`Failed to fetch route for ${plan.rakeId}`, err);
                                if (isMounted) {
                                    drawLine([[origin.lng, origin.lat], [destination.lng, destination.lat]], true);
                                }
                            });
                    });
                });

            } catch (error) {
                console.error("MapMyIndia initialization failed:", error);
                if (isMounted) {
                    setErrorMessage((error as Error).message || 'Failed to initialize the map.');
                    setMapStatus('error');
                }
            }
        };

        initializeMap();

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [inventories, activePlans, orders]);


    return (
        <div className="h-full flex flex-col">
            <div className="p-6 pb-4 bg-white/80 backdrop-blur-sm z-10 border-b">
                 <h1 className="text-3xl font-bold text-gray-800">Logistics Network Map</h1>
                 <p className="text-gray-500 mt-1">Real-time overview of plant locations and active rake routes.</p>
            </div>
            <div className="flex-grow relative bg-gray-200">
                <div ref={mapContainerRef} className="absolute inset-0"></div>
                {(mapStatus !== 'loaded' || errorMessage) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-80 p-4 pointer-events-none">
                        {mapStatus === 'loading' && <div className="flex items-center gap-2 text-gray-600"><Loader2 className="animate-spin" /><span>Loading map...</span></div>}
                        {mapStatus === 'error' && <p className="text-red-600 text-center text-sm font-medium">{errorMessage}</p>}
                        {mapStatus === 'loaded' && errorMessage && 
                            <div className="absolute top-2 left-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 text-sm font-medium shadow-lg rounded-r-md" role="alert">
                                {errorMessage}
                            </div>
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogisticsMapPage;