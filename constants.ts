
import { User, Role, Order, Inventory } from './types';

export const MOCK_USERS: User[] = [
  { id: 1, name: 'Admin User', username: 'admin', password: 'password', role: Role.ADMIN },
  { id: 2, name: 'Manager - Bhilai', username: 'manager_bhilai', password: 'password', role: Role.BASE_MANAGER, baseId: 1, baseName: 'Bhilai Steel Plant' },
  { id: 3, name: 'Manager - Rourkela', username: 'manager_rourkela', password: 'password', role: Role.BASE_MANAGER, baseId: 2, baseName: 'Rourkela Steel Plant' },
];

export const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', customerName: 'Tata Projects', product: 'TMT Bars', quantity: 5000, priority: 'High', dueDate: '2025-08-15', destination: 'Mumbai', status: 'Pending' },
  { id: 'ORD-002', customerName: 'L&T Construction', product: 'Steel Plates', quantity: 12000, priority: 'High', dueDate: '2025-08-20', destination: 'Chennai', status: 'Pending' },
  { id: 'ORD-003', customerName: 'Adani Infra', product: 'Iron Ore Fines', quantity: 25000, priority: 'Medium', dueDate: '2025-08-25', destination: 'Vizag Port', status: 'Pending' },
  { id: 'ORD-004', customerName: 'JSW Steel', product: 'Coking Coal', quantity: 30000, priority: 'Medium', dueDate: '2025-09-01', destination: 'Paradip Port', status: 'Delivered' },
  { id: 'ORD-005', customerName: 'Local Builders Inc.', product: 'TMT Bars', quantity: 1500, priority: 'Low', dueDate: '2025-09-10', destination: 'Delhi', status: 'Pending' },
];

export const MOCK_INVENTORY: Inventory[] = [
  {
    baseId: 1,
    baseName: 'Bhilai Steel Plant',
    lat: 21.21,
    lon: 81.38,
    products: [
      { name: 'TMT Bars', quantity: 15000 },
      { name: 'Steel Plates', quantity: 8000 },
      { name: 'Iron Ore Fines', quantity: 150000 },
      { name: 'Coking Coal', quantity: 75000 },
    ],
    history: [
      { updatedBy: 'System', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), updates: [{ product: 'TMT Bars', oldQuantity: 14500, newQuantity: 15000 }] },
    ],
  },
  {
    baseId: 2,
    baseName: 'Rourkela Steel Plant',
    lat: 22.25,
    lon: 84.85,
    products: [
      { name: 'TMT Bars', quantity: 12000 },
      { name: 'Steel Plates', quantity: 20000 },
      { name: 'Iron Ore Fines', quantity: 120000 },
      { name: 'Coking Coal', quantity: 60000 },
    ],
    history: [
       { updatedBy: 'System', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), updates: [{ product: 'Steel Plates', oldQuantity: 21000, newQuantity: 20000 }] },
    ],
  }
];

export const MOCK_DESTINATIONS: { [key: string]: { lat: number, lon: number } } = {
  'Mumbai': { lat: 19.07, lon: 72.87 },
  'Chennai': { lat: 13.08, lon: 80.27 },
  'Vizag Port': { lat: 17.68, lon: 83.21 },
  'Paradip Port': { lat: 20.26, lon: 86.67 },
  'Delhi': { lat: 28.70, lon: 77.10 },
};
