import { useRef, useState, useEffect, FC } from 'react';
import { X, MapPin, Truck, Clock } from 'lucide-react';
import { RakeSuggestion, Inventory } from '../types';
import { MOCK_DESTINATIONS } from '../constants';

declare const mapmyindia: any;

// Haversine distance formula
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

interface RouteModalProps {
  plan: RakeSuggestion;
  source: Inventory;
  onClose: () => void;
}

const RouteModal: FC<RouteModalProps> = ({ plan, source, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const destCoords = MOCK_DESTINATIONS[plan.destination];
  const distance = destCoords ? getDistance(source.lat, source.lon, destCoords.lat, destCoords.lon) : 0;
  const estimatedTime = Math.round(distance / 50); // Assuming avg speed of 50km/h for rail
  
  const [mapStatus, setMapStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!mapContainerRef.current || !destCoords || mapInstanceRef.current) {
      return;
    }

    let isMounted = true;
    
    const initializeMap = () => {
        try {
            if (typeof mapmyindia === 'undefined' || typeof mapmyindia.Map === 'undefined') {
                throw new Error('MapMyIndia library not loaded.');
            }

            const origin = { lat: source.lat, lng: source.lon };
            const destination = { lat: destCoords.lat, lng: destCoords.lon };

            const map = new mapmyindia.Map(mapContainerRef.current, {
                center: [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2],
                zoom: 5,
            });
            mapInstanceRef.current = map;

            map.on('load', () => {
                if (!isMounted) return;

                setMapStatus('loaded');
                
                // Add markers for origin and destination
                new mapmyindia.Marker({ position: [origin.lat, origin.lng], map: map, title: source.baseName });
                new mapmyindia.Marker({ position: [destination.lat, destination.lng], map: map, title: plan.destination });

                // Helper function to draw the route on the map
                const drawRoute = (coordinates: number[][], isSimulated: boolean) => {
                    if (!mapInstanceRef.current) return;
                    if (map.getSource('route')) {
                        map.removeLayer('route');
                        map.removeSource('route');
                    }
                    map.addSource('route', {
                        type: 'geojson',
                        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordinates } }
                    });
                    map.addLayer({
                        id: 'route',
                        type: 'line',
                        source: 'route',
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: isSimulated ? 
                            // Style for simulated (straight) line
                            { 'line-color': '#0077B6', 'line-width': 4, 'line-dasharray': [2, 2] } :
                            // Style for actual API route
                            { 'line-color': '#FF6600', 'line-width': 5 }
                    });
                    // Fit map to the route bounds
                    const bounds = coordinates.reduce((bounds, coord) => {
                        return bounds.extend(coord);
                    }, new mapmyindia.LngLatBounds(coordinates[0], coordinates[0]));
                    map.fitBounds(bounds, { padding: 80 });
                };

                // Check for the MapMyIndia API Key from environment variables
                let apiKey: string | undefined;
                if (typeof process !== 'undefined' && process.env) {
                  apiKey = process.env.API_KEY;
                }
                
                // If no API key, show a message and draw a simulated straight line
                if (!apiKey) {
                    setErrorMessage('API key not configured. Showing simulated straight-line route.');
                    drawRoute([[origin.lng, origin.lat], [destination.lng, destination.lat]], true);
                    return;
                }
                
                // If API key is present, fetch the actual route
                const routeUrl = `https://apis.mapmyindia.com/advancedmaps/v1/${apiKey}/route_adv/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson`;
                fetch(routeUrl)
                    .then(response => response.json())
                    .then(data => {
                        if (isMounted && data.responseCode === 200 && data.routes && data.routes.length > 0) {
                            drawRoute(data.routes[0].geometry.coordinates, false);
                        } else {
                            throw new Error('Invalid route data from API.');
                        }
                    })
                    .catch(error => {
                        // If fetching fails, show an error and fall back to the simulated route
                        if (isMounted) {
                            console.error('Error fetching MapMyIndia route:', error);
                            setErrorMessage('Could not fetch route. Showing simulated straight-line route.');
                            drawRoute([[origin.lng, origin.lat], [destination.lng, destination.lat]], true);
                        }
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

    // Cleanup function to remove the map instance when the modal closes
    return () => {
        isMounted = false;
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, [source, plan, destCoords]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Route Simulation: {plan.rakeId}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Route Details</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin size={20} className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Origin</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{source.baseName}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin size={20} className="text-red-600 mt-1 mr-3 flex-shrink-0" />
                   <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Destination</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{plan.destination}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Truck size={20} className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                   <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Distance</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{Math.round(distance).toLocaleString()} km</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock size={20} className="text-orange-600 mt-1 mr-3 flex-shrink-0" />
                   <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Travel Time</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">~{estimatedTime} hours</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative bg-gray-200 dark:bg-gray-700 rounded-lg h-64 md:h-auto min-h-[250px]">
                <div ref={mapContainerRef} className="absolute inset-0"></div>
                {(mapStatus !== 'loaded' || errorMessage) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 bg-opacity-80 dark:bg-opacity-80 p-4 pointer-events-none">
                        {mapStatus === 'loading' && <p className="text-gray-500 dark:text-gray-300">Loading map...</p>}
                        {mapStatus === 'error' && <p className="text-red-600 text-center text-sm font-medium">{errorMessage}</p>}
                        {mapStatus === 'loaded' && errorMessage && 
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 text-center text-xs font-medium" role="alert">
                                {errorMessage}
                            </div>
                        }
                    </div>
                )}
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600 text-right">
             <button onClick={onClose} className="px-4 py-2 bg-sail-orange text-white rounded-md hover:bg-orange-700">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default RouteModal;