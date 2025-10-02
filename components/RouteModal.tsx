import React, { useEffect, useRef, useState } from 'react';
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

const RouteModal: React.FC<RouteModalProps> = ({ plan, source, onClose }) => {
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
    let loadCheckInterval: NodeJS.Timeout;

    const initializeMap = () => {
        try {
            if (typeof mapmyindia === 'undefined' || typeof mapmyindia.Map === 'undefined') {
                setMapStatus('loading');
                loadCheckInterval = setInterval(() => {
                    if (typeof mapmyindia !== 'undefined' && typeof mapmyindia.Map !== 'undefined') {
                        clearInterval(loadCheckInterval);
                        initializeMap();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(loadCheckInterval);
                    if (typeof mapmyindia === 'undefined' || typeof mapmyindia.Map === 'undefined') {
                        setErrorMessage('MapMyIndia library not loaded.');
                        setMapStatus('error');
                    }
                }, 5000);
                return;
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
                
                // Add markers
                new mapmyindia.Marker({ position: [origin.lat, origin.lng], map: map, title: source.baseName });
                new mapmyindia.Marker({ position: [destination.lat, destination.lng], map: map, title: plan.destination });

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
                            { 'line-color': '#0077B6', 'line-width': 4, 'line-dasharray': [2, 2] } :
                            { 'line-color': '#FF6600', 'line-width': 5 }
                    });
                    const bounds = coordinates.reduce((bounds, coord) => {
                        return bounds.extend(coord);
                    }, new mapmyindia.LngLatBounds(coordinates[0], coordinates[0]));
                    map.fitBounds(bounds, { padding: 80 });
                };

                const apiKey = import.meta.env.VITE_MAPMYINDIA_API_KEY;

                if (!apiKey || apiKey === 'your_mapmyindia_api_key_here') {
                    setErrorMessage('API key not configured. Showing simulated straight-line route.');
                    drawRoute([[origin.lng, origin.lat], [destination.lng, destination.lat]], true);
                    return;
                }

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

    return () => {
        isMounted = false;
        if (loadCheckInterval) {
            clearInterval(loadCheckInterval);
        }
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, [source, plan, destCoords]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Route Simulation: {plan.rakeId}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Route Details</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin size={20} className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Origin</p>
                    <p className="font-medium text-gray-800">{source.baseName}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin size={20} className="text-red-600 mt-1 mr-3 flex-shrink-0" />
                   <div>
                    <p className="text-xs text-gray-500">Destination</p>
                    <p className="font-medium text-gray-800">{plan.destination}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Truck size={20} className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                   <div>
                    <p className="text-xs text-gray-500">Estimated Distance</p>
                    <p className="font-medium text-gray-800">{Math.round(distance).toLocaleString()} km</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock size={20} className="text-orange-600 mt-1 mr-3 flex-shrink-0" />
                   <div>
                    <p className="text-xs text-gray-500">Estimated Travel Time</p>
                    <p className="font-medium text-gray-800">~{estimatedTime} hours</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative bg-gray-200 rounded-lg h-64 md:h-auto min-h-[250px]">
                <div ref={mapContainerRef} className="absolute inset-0"></div>
                {(mapStatus !== 'loaded' || errorMessage) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-80 p-4 pointer-events-none">
                        {mapStatus === 'loading' && <p className="text-gray-500">Loading map...</p>}
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
        <div className="p-4 bg-gray-50 border-t text-right">
             <button onClick={onClose} className="px-4 py-2 bg-sail-orange text-white rounded-md hover:bg-orange-700">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default RouteModal;