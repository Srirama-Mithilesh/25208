import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { RakeSuggestion, Role, Order, Inventory } from '../types';
import { Play, Filter, Loader2, Bell, CheckCircle, Map } from 'lucide-react';
import { MOCK_DESTINATIONS } from '../constants';
import RouteModal from '../components/RouteModal';

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


const PlannerPage: React.FC = () => {
  const { inventories, orders, notifications, addNotification, markNotificationAsRead, rakePlans, setRakePlans } = useData();
  const { user } = useAuth();
  const [productFilter, setProductFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<RakeSuggestion | null>(null);

  const productOptions = [...new Set(inventories.flatMap(inv => inv.products.map(p => p.name)))];
  const destinationOptions = Object.keys(MOCK_DESTINATIONS);

  const runSimulation = () => {
    setIsLoading(true);

    setTimeout(() => {
        const allPendingOrders = orders.filter(o => o.status === 'Pending');
        const activePlanOrderIds = new Set(rakePlans.flatMap(p => p.fulfilledOrderIds));

        const ordersToProcess = allPendingOrders.filter(o =>
            !activePlanOrderIds.has(o.id) &&
            (priorityFilter === 'all' || o.priority === priorityFilter) &&
            (productFilter === 'all' || o.product === productFilter) &&
            (destinationFilter === 'all' || o.destination === destinationFilter)
        );
        
        if (ordersToProcess.length === 0) {
            setIsLoading(false);
            return;
        }

        const highPriorityOrders = ordersToProcess.filter(o => o.priority === 'High');
        const otherOrders = ordersToProcess.filter(o => o.priority !== 'High');
        
        const newSuggestions: RakeSuggestion[] = [];
        let tempInventories = JSON.parse(JSON.stringify(inventories)); // Create a mutable copy for simulation

        // Function to update local inventory after a plan is made
        const commitToInventory = (baseName: string, products: {name: string, quantity: number}[]) => {
            const base = tempInventories.find((inv: Inventory) => inv.baseName === baseName);
            if (!base) return;
            products.forEach(p => {
                const productStock = base.products.find((item: any) => item.name === p.name);
                if (productStock) {
                    productStock.quantity -= p.quantity;
                }
            });
        };

        // 1. Process HIGH priority for SPEED (closest base, one order per rake)
        highPriorityOrders.forEach(order => {
            const destCoords = MOCK_DESTINATIONS[order.destination];
            if (!destCoords) return;

            let bestBase: Inventory | null = null;
            let minDistance = Infinity;
            
            tempInventories.forEach((base: Inventory) => {
                const productStock = base.products.find(p => p.name === order.product);
                if (productStock && productStock.quantity >= order.quantity) {
                    const distance = getDistance(base.lat, base.lon, destCoords.lat, destCoords.lon);
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestBase = base;
                    }
                }
            });

            if (bestBase) {
                 const planProducts = [{ name: order.product, quantity: order.quantity }];
                 newSuggestions.push({
                    rakeId: `RAKE-H-${Math.floor(Math.random() * 900) + 100}`,
                    base: bestBase.baseName,
                    destination: order.destination,
                    products: planProducts,
                    cost: Math.round(minDistance * 150), // Simplified cost model
                    slaCompliance: 99,
                    utilization: Math.min(98, Math.round((order.quantity / 4200) * 100)),
                    fulfilledOrderIds: [order.id],
                });
                commitToInventory(bestBase.baseName, planProducts);
            }
        });

        // 2. Process MEDIUM/LOW priority for EFFICIENCY (grouping and splitting across bases)
        const groupedByDest = otherOrders.reduce((acc, order) => {
            acc[order.destination] = acc[order.destination] || [];
            acc[order.destination].push(order);
            return acc;
        }, {} as Record<string, Order[]>);

        Object.entries(groupedByDest).forEach(([destination, orderGroup]) => {
            let remainingOrdersInGroup = [...orderGroup];
            const destCoords = MOCK_DESTINATIONS[destination];
            if (!destCoords) return;

            while (remainingOrdersInGroup.length > 0) {
                let bestPlan = { base: null as Inventory | null, orders: [] as Order[], totalQuantity: 0, score: 0 };

                for (const base of tempInventories) {
                    const sortedFulfillable = remainingOrdersInGroup
                        .filter(order => {
                            const productStock = base.products.find(p => p.name === order.product);
                            return productStock && productStock.quantity >= order.quantity;
                        })
                        .sort((a,b) => (a.priority > b.priority) ? -1 : (a.priority < b.priority) ? 1 : b.quantity - a.quantity);
                    
                    let currentQuantity = 0;
                    const ordersForThisBaseRake = [];
                    for (const order of sortedFulfillable) {
                        if (currentQuantity + order.quantity <= 4200) {
                            currentQuantity += order.quantity;
                            ordersForThisBaseRake.push(order);
                        }
                    }

                    if (ordersForThisBaseRake.length > 0) {
                        const score = currentQuantity;
                        if (score > bestPlan.score) {
                            bestPlan = { base, orders: ordersForThisBaseRake, totalQuantity: currentQuantity, score };
                        }
                    }
                }

                if (bestPlan.base && bestPlan.orders.length > 0) {
                    const requiredProducts = bestPlan.orders.reduce((acc, order) => {
                        acc[order.product] = (acc[order.product] || 0) + order.quantity;
                        return acc;
                    }, {} as Record<string, number>);
                    
                    const planProducts = Object.entries(requiredProducts).map(([name, quantity]) => ({ name, quantity }));
                    const distance = getDistance(bestPlan.base.lat, bestPlan.base.lon, destCoords.lat, destCoords.lon);

                    newSuggestions.push({
                        rakeId: `RAKE-C-${Math.floor(Math.random() * 900) + 100}`,
                        base: bestPlan.base.baseName,
                        destination: destination,
                        products: planProducts,
                        cost: Math.round(distance * 120),
                        slaCompliance: Math.floor(Math.random() * 10) + 90,
                        utilization: Math.min(98, Math.round((bestPlan.totalQuantity / 4200) * 100)),
                        fulfilledOrderIds: bestPlan.orders.map(o => o.id),
                    });
                    
                    commitToInventory(bestPlan.base.baseName, planProducts);

                    const fulfilledIds = new Set(bestPlan.orders.map(o => o.id));
                    remainingOrdersInGroup = remainingOrdersInGroup.filter(o => !fulfilledIds.has(o.id));
                } else {
                    break; 
                }
            }
        });
        
        if (newSuggestions.length > 0) {
            setRakePlans([...rakePlans, ...newSuggestions]);
            newSuggestions.forEach(suggestion => {
                const sourceBase = inventories.find(inv => inv.baseName === suggestion.base);
                if (sourceBase) {
                    const message = `New plan ${suggestion.rakeId} created from your base for ${suggestion.destination}.`;
                    addNotification(message, sourceBase.baseId);
                }
            });
        }
        
        setIsLoading(false);
    }, 2000);
  };
  
  const managerNotifications = user?.role === Role.BASE_MANAGER 
    ? notifications.filter(n => n.baseId === user.baseId && !n.read) 
    : [];

  const activePlans = useMemo(() => {
    const deliveredOrderIds = new Set(orders.filter(o => o.status === 'Delivered').map(o => o.id));
    return rakePlans.filter(plan => 
      !plan.fulfilledOrderIds.every(id => deliveredOrderIds.has(id))
    );
  }, [rakePlans, orders]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Rake Formation Planner</h1>
      
      {user?.role === Role.BASE_MANAGER && managerNotifications.length > 0 && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg shadow-md" role="alert">
            <div className="flex items-center">
                <Bell size={20} className="mr-3" />
                <p className="font-bold text-lg">New Plan Notifications</p>
            </div>
            <ul className="mt-2 list-disc list-inside space-y-2">
                {managerNotifications.map(n => (
                    <li key={n.id} className="flex justify-between items-center">
                        <span>{n.message} (Received: {new Date(n.timestamp).toLocaleTimeString()})</span>
                        <button onClick={() => markNotificationAsRead(n.id)} className="flex items-center text-sm text-green-600 hover:text-green-800 font-semibold">
                            <CheckCircle size={16} className="mr-1" /> Mark as Read
                        </button>
                    </li>
                ))}
            </ul>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">Plan Generation Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="w-full p-2 border rounded-md">
            <option value="all">All Products</option>
            {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="w-full p-2 border rounded-md">
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select value={destinationFilter} onChange={e => setDestinationFilter(e.target.value)} className="w-full p-2 border rounded-md">
            <option value="all">All Destinations</option>
            {destinationOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button
            onClick={runSimulation}
            disabled={isLoading || user?.role === Role.BASE_MANAGER}
            className="w-full flex justify-center items-center p-2 bg-sail-orange text-white rounded-md hover:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Play className="mr-2" size={20} />}
            <span>{isLoading ? 'Generating...' : 'Generate Plans'}</span>
          </button>
        </div>
        {user?.role === Role.BASE_MANAGER && <p className="text-xs text-gray-500 mt-2">Plan generation can only be run by an Admin.</p>}
        <p className="text-xs text-gray-500 mt-2">The AI generates plans for pending orders that match filters and don't have a plan.</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Active Rake Plans ({activePlans.length})</h2>
        {isLoading && <p className="text-center text-gray-500">Refreshing plan list...</p>}
        {!isLoading && activePlans.length === 0 && (
            <p className="text-center text-gray-500">No active rake plans. Generate plans for pending orders above.</p>
        )}
        <div className="space-y-4">
          {activePlans.map(rake => {
              const fulfilledOrders = rake.fulfilledOrderIds.map(id => orders.find(o => o.id === id)).filter(Boolean) as Order[];
              return (
                <div key={rake.rakeId} className="border rounded-lg p-4 transition-shadow hover:shadow-lg">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-lg text-sail-blue">{rake.rakeId}</p>
                        <p className="text-sm text-gray-600">{rake.base} → {rake.destination}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{rake.products.map(p => `${p.name} (${p.quantity.toLocaleString()} T)`).join(', ')}</span>
                        <button onClick={() => setSelectedPlan(rake)} className="flex items-center text-sm text-blue-600 hover:underline">
                            <Map size={16} className="mr-1" /> View Route
                        </button>
                      </div>
                  </div>
                  <div className="mt-4 border-t pt-3">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Fulfilling Orders:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        {fulfilledOrders.map(order => (
                            <li key={order.id} className="text-xs text-gray-700">
                                <span className="font-medium">{order.id}</span> ({order.product}, {order.quantity.toLocaleString()} T) for {order.customerName}
                            </li>
                        ))}
                    </ul>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-center border-t pt-3">
                      <div>
                          <p className="text-xs text-gray-500">Est. Cost</p>
                          <p className="font-semibold text-gray-800">₹{rake.cost.toLocaleString()}</p>
                      </div>
                       <div>
                          <p className="text-xs text-gray-500">SLA Compliance</p>
                          <p className="font-semibold text-green-600">{rake.slaCompliance}%</p>
                      </div>
                       <div>
                          <p className="text-xs text-gray-500">Rake Utilization</p>
                          <p className="font-semibold text-orange-600">{rake.utilization}%</p>
                      </div>
                  </div>
                </div>
              )
          })}
        </div>
      </div>
      
      {selectedPlan && (
        <RouteModal
            plan={selectedPlan}
            source={inventories.find(inv => inv.baseName === selectedPlan.base)!}
            onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
};

export default PlannerPage;