
import { User, Role, Order, Inventory } from './types';

export const MOCK_PRODUCT_WAGON_COMPATIBILITY: { [product: string]: string[] } = {
  'TMT Bars': ['Open Wagon', 'Flat Wagon'],
  'Steel Plates': ['Flat Wagon', 'Box Wagon'],
  'Iron Ore Fines': ['Hopper Wagon', 'Gondola Wagon'],
  'Coking Coal': ['Hopper Wagon', 'Gondola Wagon'],
  'Hot Rolled Coils': ['Coil Wagon', 'Flat Wagon'],
  'Cold Rolled Coils': ['Coil Wagon', 'Covered Wagon'],
  'Galvanized Steel': ['Covered Wagon', 'Flat Wagon'],
};

export const MOCK_USERS: User[] = [
  { id: 1, name: 'Admin User', username: 'admin', password: 'password', role: Role.ADMIN },
  { id: 2, name: 'Manager - Bhilai', username: 'manager_bhilai', password: 'password', role: Role.BASE_MANAGER, baseId: 1, baseName: 'Bhilai Steel Plant' },
  { id: 3, name: 'Manager - Rourkela', username: 'manager_rourkela', password: 'password', role: Role.BASE_MANAGER, baseId: 2, baseName: 'Rourkela Steel Plant' },
  { id: 4, name: 'Manager - Bokaro', username: 'manager_bokaro', password: 'password', role: Role.BASE_MANAGER, baseId: 3, baseName: 'Bokaro Steel Plant' },
];

export const MOCK_ORDERS: Order[] = [
  { 
    id: 'ORD-001', 
    customerName: 'Tata Projects', 
    products: [
      { name: 'TMT Bars', quantity: 5000 },
      { name: 'Steel Plates', quantity: 2000 }
    ],
    priority: 'High', 
    dueDate: '2025-08-15', 
    destination: 'Mumbai', 
    status: 'Pending', 
    assignedManagerId: 2,
    specialRequirements: 'Requires anti-rust coating for plates.'
  },
  { id: 'ORD-002', customerName: 'L&T Construction', products: [{ name: 'Steel Plates', quantity: 12000 }], priority: 'High', dueDate: '2025-08-20', destination: 'Chennai', status: 'Pending', assignedManagerId: 3 },
  { id: 'ORD-003', customerName: 'Adani Infra', products: [{ name: 'Iron Ore Fines', quantity: 25000 }], priority: 'Medium', dueDate: '2025-08-25', destination: 'Vizag Port', status: 'Pending' },
  { 
    id: 'ORD-004', 
    customerName: 'JSW Steel', 
    products: [
        { name: 'Coking Coal', quantity: 30000 },
        { name: 'Iron Ore Fines', quantity: 10000 }
    ],
    priority: 'Medium', 
    dueDate: '2025-09-01', 
    destination: 'Paradip Port', 
    status: 'Delivered' 
  },
  { id: 'ORD-005', customerName: 'Local Builders Inc.', products: [{ name: 'TMT Bars', quantity: 1500 }], priority: 'Low', dueDate: '2025-09-10', destination: 'Delhi', status: 'Pending' },
  { id: 'ORD-006', customerName: 'Patna CMO Stockyard', products: [{ name: 'Hot Rolled Coils', quantity: 7000 }], priority: 'High', dueDate: '2025-08-18', destination: 'Patna Stockyard', status: 'Pending', assignedManagerId: 4 },
  { id: 'ORD-007', customerName: 'Kolkata CMO Stockyard', products: [{ name: 'Cold Rolled Coils', quantity: 10000 }], priority: 'Medium', dueDate: '2025-08-28', destination: 'Kolkata Stockyard', status: 'Pending', assignedManagerId: 4 },
  { id: 'ORD-008', customerName: 'Delhi Metro Rail', products: [{ name: 'Galvanized Steel', quantity: 4000 }], priority: 'High', dueDate: '2025-08-22', destination: 'Delhi', status: 'Pending', specialRequirements: 'Just-in-time delivery required.' },
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
    availableRakes: 5,
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
    availableRakes: 4,
  },
  {
    baseId: 3,
    baseName: 'Bokaro Steel Plant',
    lat: 23.67,
    lon: 86.15,
    products: [
      { name: 'Hot Rolled Coils', quantity: 25000 },
      { name: 'Cold Rolled Coils', quantity: 18000 },
      { name: 'Galvanized Steel', quantity: 10000 },
      { name: 'TMT Bars', quantity: 5000 },
    ],
    history: [
       { updatedBy: 'System', timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), updates: [{ product: 'Hot Rolled Coils', oldQuantity: 24000, newQuantity: 25000 }] },
    ],
    availableRakes: 6,
  }
];

export const MOCK_DESTINATIONS: { [key: string]: { lat: number, lon: number } } = {
  'Mumbai': { lat: 19.07, lon: 72.87 },
  'Chennai': { lat: 13.08, lon: 80.27 },
  'Vizag Port': { lat: 17.68, lon: 83.21 },
  'Paradip Port': { lat: 20.26, lon: 86.67 },
  'Delhi': { lat: 28.70, lon: 77.10 },
  'Patna Stockyard': { lat: 25.61, lon: 85.13 },
  'Kolkata Stockyard': { lat: 22.57, lon: 88.36 },
};
