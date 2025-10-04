export enum Role {
  ADMIN = 'Admin',
  BASE_MANAGER = 'Base Manager',
}

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  role: Role;
  baseId?: number; // Only for Base Manager
  baseName?: string;
}

export interface Order {
  id: string;
  customerName: string;
  product: string;
  quantity: number;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  destination: string;
  status: 'Pending' | 'Delivered';
  assignedManagerId?: number;
}

export interface InventoryItem {
    name: string;
    quantity: number; // in tonnage
}

export interface InventoryUpdate {
    updatedBy: string;
    timestamp: string;
    updates: { product: string; oldQuantity: number; newQuantity: number }[];
}

export interface Inventory {
    baseId: number;
    baseName: string;
    lat: number;
    lon: number;
    products: InventoryItem[];
    history: InventoryUpdate[];
}

export interface RakeSuggestion {
    rakeId: string;
    base: string;
    destination: string;
    products: { name: string; quantity: number }[];
    cost: number;
    slaCompliance: number; // percentage
    utilization: number; // percentage
    fulfilledOrderIds: string[];
    // New fields for live tracking
    status: 'suggested' | 'dispatched' | 'arrived';
    dispatchTime?: number; // timestamp
    progress?: number; // 0 to 1
    currentLat?: number;
    currentLon?: number;
}

export interface Notification {
  id: string;
  message: string;
  baseId: number;
  timestamp: string;
  read: boolean;
}