import { createContext, useState, useCallback, useContext, FC, ReactNode, useEffect, useRef } from 'react';
import { Order, Inventory, InventoryItem, InventoryUpdate, Notification, RakeSuggestion, Role } from '../types';
import { MOCK_ORDERS, MOCK_INVENTORY, MOCK_DESTINATIONS } from '../constants';
import { useAuth } from './AuthContext';

interface DataContextType {
  orders: Order[];
  inventories: Inventory[];
  notifications: Notification[];
  rakePlans: RakeSuggestion[];
  setRakePlans: (plans: RakeSuggestion[]) => void;
  addOrders: (newOrders: Order[]) => void;
  updateInventory: (baseId: number, updates: { productName: string; newQuantity: number }[]) => void;
  updateRakeAvailability: (baseId: number, newCount: number) => void;
  updateOrderStatus: (orderId: string, status: 'Pending' | 'Delivered') => void;
  updateOrderPriority: (orderId: string, priority: 'High' | 'Medium' | 'Low') => void;
  updateOrderAssignedManager: (orderId: string, managerId: number | null) => void;
  autoUpdatePriorities: () => void;
  addNotification: (message: string, baseId: number) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dispatchRake: (rakeId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

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


export const DataProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [inventories, setInventories] = useState<Inventory[]>(MOCK_INVENTORY);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rakePlans, setRakePlans] = useState<RakeSuggestion[]>([]);
  const processedArrivals = useRef(new Set());

  const addOrders = (newOrders: Order[]) => {
    setOrders(prevOrders => [...prevOrders, ...newOrders]);
  };

  const updateOrderStatus = (orderId: string, status: 'Pending' | 'Delivered') => {
    setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const updateOrderPriority = (orderId: string, priority: 'High' | 'Medium' | 'Low') => {
    setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, priority } : o));
  };

  const updateOrderAssignedManager = (orderId: string, managerId: number | null) => {
    setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, assignedManagerId: managerId === null ? undefined : managerId } : o));
  };

  const autoUpdatePriorities = () => {
    setOrders(prevOrders => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day

      return prevOrders.map(order => {
        if (order.status === 'Delivered') {
          return order;
        }

        const dueDate = new Date(order.dueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let finalPriority = order.priority;
        if (diffDays <= 3) {
            finalPriority = 'High';
        } else if (diffDays <= 14 && order.priority === 'Low') {
            finalPriority = 'Medium';
        }

        return { ...order, priority: finalPriority };
      });
    });
  };

  const addNotification = (message: string, baseId: number) => {
    const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        message,
        baseId,
        timestamp: new Date().toISOString(),
        read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => {
        if (!user) return n;
        let shouldMark = false;
        
        if (user.role === Role.ADMIN) {
          shouldMark = true;
        } else if (user.role === Role.BASE_MANAGER && n.baseId === user.baseId) {
          shouldMark = true;
        }

        if (shouldMark && !n.read) {
          return { ...n, read: true };
        }
        return n;
      })
    );
  };


  const updateInventory = useCallback((baseId: number, updates: { productName: string; newQuantity: number }[]) => {
    if (!user) return;
    
    setInventories(prevInventories => {
        const newInventories = [...prevInventories];
        const inventoryIndex = newInventories.findIndex(inv => inv.baseId === baseId);
        if (inventoryIndex === -1) return prevInventories;

        const inventoryToUpdate = { ...newInventories[inventoryIndex] };
        const updateLogEntries: InventoryUpdate['updates'] = [];
        
        updates.forEach(({ productName, newQuantity }) => {
            const productIndex = inventoryToUpdate.products.findIndex(p => p.name === productName);
            if (productIndex !== -1) {
                const oldQuantity = inventoryToUpdate.products[productIndex].quantity;
                inventoryToUpdate.products[productIndex] = { ...inventoryToUpdate.products[productIndex], quantity: newQuantity };
                updateLogEntries.push({ product: productName, oldQuantity, newQuantity });
            }
        });
        
        const newHistoryEntry: InventoryUpdate = {
            updatedBy: user.name,
            timestamp: new Date().toISOString(),
            updates: updateLogEntries
        };
        
        inventoryToUpdate.history = [newHistoryEntry, ...inventoryToUpdate.history];
        newInventories[inventoryIndex] = inventoryToUpdate;

        return newInventories;
    });
  }, [user]);
  
  const updateRakeAvailability = (baseId: number, newCount: number) => {
    setInventories(prevInventories => 
        prevInventories.map(inv => 
            inv.baseId === baseId ? { ...inv, availableRakes: newCount } : inv
        )
    );
  };

  const dispatchRake = (rakeId: string) => {
      setRakePlans(prevPlans => prevPlans.map(p => {
          if (p.rakeId === rakeId) {
              const source = inventories.find(inv => inv.baseName === p.base);
              if (!source) return p;
              return {
                  ...p,
                  status: 'dispatched',
                  dispatchTime: Date.now(),
                  progress: 0,
                  currentLat: source.lat,
                  currentLon: source.lon
              };
          }
          return p;
      }));
  };

  // Real-time rake simulation engine
  useEffect(() => {
    const simulationInterval = setInterval(() => {
        setRakePlans(prevPlans => {
            return prevPlans.map(plan => {
                if (plan.status === 'dispatched' && plan.dispatchTime) {
                    const source = MOCK_INVENTORY.find(inv => inv.baseName === plan.base);
                    const destCoords = MOCK_DESTINATIONS[plan.destination];
                    if (!source || !destCoords) return plan;

                    const distance = getDistance(source.lat, source.lon, destCoords.lat, destCoords.lon);
                    const estimatedDuration = (distance / 50) * 60 * 60 * 1000; // in ms, assuming 50km/h avg speed
                    
                    const elapsedTime = Date.now() - plan.dispatchTime;
                    const progress = Math.min(1, elapsedTime / estimatedDuration);
                    
                    if (progress >= 1) {
                        return { ...plan, status: 'arrived', progress: 1, currentLat: destCoords.lat, currentLon: destCoords.lon };
                    }
                    
                    const currentLat = source.lat + (destCoords.lat - source.lat) * progress;
                    const currentLon = source.lon + (destCoords.lon - source.lon) * progress;
                    
                    return { ...plan, progress, currentLat, currentLon };
                }
                return plan;
            });
        });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(simulationInterval);
  }, []); // Run once on mount

  // Process arrivals to update order status
  useEffect(() => {
    rakePlans.forEach(plan => {
        if (plan.status === 'arrived' && !processedArrivals.current.has(plan.rakeId)) {
            plan.fulfilledOrderIds.forEach(orderId => {
                updateOrderStatus(orderId, 'Delivered');
            });
            addNotification(`Rake ${plan.rakeId} has arrived at ${plan.destination}. Orders fulfilled.`, inventories.find(inv => inv.baseName === plan.base)?.baseId || 0);
            processedArrivals.current.add(plan.rakeId);
        }
    });
  }, [rakePlans]);

  return (
    <DataContext.Provider value={{ orders, inventories, notifications, rakePlans, setRakePlans, addOrders, updateInventory, updateOrderStatus, addNotification, markNotificationAsRead, updateOrderPriority, autoUpdatePriorities, markAllAsRead, dispatchRake, updateOrderAssignedManager, updateRakeAvailability }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
