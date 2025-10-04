import { useRef, useState, useMemo, useEffect, FC } from 'react';
import { createRoot } from 'react-dom/client';
import { useData } from '../context/DataContext';
import { MOCK_DESTINATIONS } from '../constants';
import { Loader2, Train, Warehouse } from 'lucide-react';
import { RakeSuggestion } from '../types';

declare const mapmyindia: any;

const RakeMarker: FC = () => {
    return (
        <div className="cursor-pointer">
            <Train size={32} className="text-sail-blue bg-white rounded-full p-1 shadow-lg" />
        </div>
    );
};

const LogisticsMapPage: FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const rakeMarkersRef = useRef<{ [key: string]: any }>({});
    const popupRef = useRef<any>(null);

    const { inventories, rakePlans } = useData();
    const [mapStatus, setMapStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const [selectedRakeId, setSelectedRakeId] = useState<string | null>(null);

    const inTransitPlans = useMemo(() => {
        return rakePlans.filter(plan => plan.status === 'dispatched');
    }, [rakePlans]);

    const drawHighlightRoute = (plan: RakeSuggestion) => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const source = inventories.find(inv => inv.baseName === plan.base);
        const destCoords = MOCK_DESTINATIONS[plan.destination];

        if (!source || !destCoords) return;

        const routeCoordinates = [
            [source.lon, source.lat],
            [destCoords.lon, destCoords.lat]
        ];

        if (map.getLayer('highlight-route')) map.removeLayer('highlight-route');
        if (map.getSource('highlight-route')) map.removeSource('highlight-route');

        map.addSource('highlight-route', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoordinates } }
        });

        map.addLayer({
            id: 'highlight-route',
            type: 'line',
            source: 'highlight-route',
            paint: { 'line-color': '#FF6600', 'line-width': 3, 'line-dasharray': [2, 2] }
        });
    };

    const removeHighlightRoute = () => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (map.getLayer('highlight-route')) map.removeLayer('highlight-route');
        if (map.getSource('highlight-route')) map.removeSource('highlight-route');
    };

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;
        let isMounted = true;

        try {
            if (typeof mapmyindia === 'undefined' || typeof mapmyindia.Map === 'undefined') {
                throw new Error('MapMyIndia library not loaded.');
            }
            const map = new mapmyindia.Map(mapContainerRef.current, { center: [22, 82], zoom: 5 });
            mapInstanceRef.current = map;

            map.on('load', () => {
                if (!isMounted) return;
                setMapStatus('loaded');
                inventories.forEach(inv => {
                    const el = document.createElement('div');
                    createRoot(el).render(<Warehouse size={28} className="text-sail-orange bg-white rounded-full p-1 shadow-md" />);
                    new mapmyindia.Marker({ element: el, position: [inv.lat, inv.lon] }).setPopup(new mapmyindia.Popup({offset: 25}).setHTML(`<strong>${inv.baseName}</strong>`)).addTo(map);
                });
            });
            
            map.on('click', () => setSelectedRakeId(null));

        } catch (error) {
            console.error("MapMyIndia initialization failed:", error);
            if (isMounted) setMapStatus('error');
        }

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [inventories]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (mapStatus !== 'loaded' || !map) return;
        
        const currentMarkerIds = Object.keys(rakeMarkersRef.current);
        const inTransitPlanIds = inTransitPlans.map(p => p.rakeId);

        currentMarkerIds.forEach(rakeId => {
            if (!inTransitPlanIds.includes(rakeId)) {
                rakeMarkersRef.current[rakeId].remove();
                delete rakeMarkersRef.current[rakeId];
            }
        });

        inTransitPlans.forEach(plan => {
            const { rakeId, currentLat, currentLon } = plan;
            if (typeof currentLat !== 'number' || typeof currentLon !== 'number') return;
            
            if (rakeMarkersRef.current[rakeId]) {
                rakeMarkersRef.current[rakeId].setLngLat([currentLon, currentLat]);
            } else {
                const el = document.createElement('div');
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setSelectedRakeId(plan.rakeId);
                });

                createRoot(el).render(<RakeMarker />);

                const marker = new mapmyindia.Marker({ element: el, position: [currentLat, currentLon] }).addTo(map);
                rakeMarkersRef.current[rakeId] = marker;
            }
        });

    }, [inTransitPlans, mapStatus]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        popupRef.current?.remove();
        removeHighlightRoute();

        if (selectedRakeId) {
            const plan = inTransitPlans.find(p => p.rakeId === selectedRakeId);
            if (plan && typeof plan.currentLat === 'number' && typeof plan.currentLon === 'number') {
                drawHighlightRoute(plan);

                const progress = (plan.progress || 0) * 100;
                const content = `
                    <div class="w-64 p-1">
                        <h4 class="font-bold text-sail-blue">${plan.rakeId}</h4>
                        <p class="text-sm text-gray-600">${plan.base} &rarr; ${plan.destination}</p>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div class="bg-green-600 h-2.5 rounded-full" style="width: ${progress}%"></div>
                        </div>
                        <p class="text-xs text-gray-500 text-right mt-1">${Math.round(progress)}% Complete</p>
                    </div>
                `;

                popupRef.current = new mapmyindia.Popup({ closeButton: false, offset: 25, className: 'sail-map-popup' })
                    .setLngLat([plan.currentLon, plan.currentLat])
                    .setHTML(content)
                    .addTo(map);
            }
        }
    }, [selectedRakeId, inTransitPlans, inventories]);

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 pb-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 border-b dark:border-gray-700">
                 <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Live Logistics Network</h1>
                 <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time overview of plant locations and in-transit rakes.</p>
            </div>
            <div className="flex-grow relative bg-gray-200">
                <div ref={mapContainerRef} className="absolute inset-0"></div>
                
                {mapStatus === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-80 p-4 pointer-events-none">
                        <div className="flex items-center gap-2 text-gray-600"><Loader2 className="animate-spin" /><span>Loading map...</span></div>
                    </div>
                )}
                
                <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg z-10 w-48">
                    <h3 className="font-bold mb-2 text-sm dark:text-gray-200">Legend</h3>
                    <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                        <li className="flex items-center">
                            <Warehouse size={18} className="text-sail-orange mr-2" />
                            <span>Steel Plant</span>
                        </li>
                        <li className="flex items-center">
                            <Train size={18} className="text-sail-blue mr-2" />
                            <span>Active Rake</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LogisticsMapPage;