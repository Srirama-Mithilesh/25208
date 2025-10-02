import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Order, Inventory, InventoryItem, InventoryUpdate, Notification, RakeSuggestion } from '../types';
import { MOCK_ORDERS, MOCK_INVENTORY } from '../constants';
import { useAuth } from './AuthContext';

interface DataContextType {
  orders: Order[];
  inventories: Inventory[];
  notifications: Notification[];
  rakePlans: RakeSuggestion[];
  setRakePlans: (plans: RakeSuggestion[]) => void;
  addOrders: (newOrders: Order[]) => void;
  updateInventory: (baseId: number, updates: { productName: string; newQuantity: number }[]) => void;
  updateOrderStatus: (orderId: string, status: 'Pending' | 'Delivered') => void;
  updateOrderPriority: (orderId: string, priority: 'High' | 'Medium' | 'Low') => void;
  autoUpdatePriorities: () => void;
  addNotification: (message: string, baseId: number) => void;
  markNotificationAsRead: (notificationId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [inventories, setInventories] = useState<Inventory[]>(MOCK_INVENTORY);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rakePlans, setRakePlans] = useState<RakeSuggestion[]>([]);

  const addOrders = (newOrders: Order[]) => {
    setOrders(prevOrders => [...prevOrders, ...newOrders]);
  };

  const updateOrderStatus = (orderId: string, status: 'Pending' | 'Delivered') => {
    setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const updateOrderPriority = (orderId: string, priority: 'High' | 'Medium' | 'Low') => {
    setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, priority } : o));
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

  return (
    <DataContext.Provider value={{ orders, inventories, notifications, rakePlans, setRakePlans, addOrders, updateInventory, updateOrderStatus, addNotification, markNotificationAsRead, updateOrderPriority, autoUpdatePriorities }}>
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