import React, { useState, useMemo, ChangeEvent } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Order, Role } from '../types';
import { Upload, Search, Truck, BrainCircuit } from 'lucide-react';

declare const XLSX: any;

const OrdersPage: React.FC = () => {
  const { orders, addOrders, updateOrderStatus, updateOrderPriority, autoUpdatePriorities } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'Pending' | 'Delivered'>('Pending');

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates:true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        const newOrders: Order[] = json.map((row: any) => ({
          id: row['Order ID'] || `ORD-${Date.now()}-${Math.random()}`,
          customerName: row['Customer Name'],
          product: row['Product/Material'],
          quantity: Number(row['Quantity']),
          priority: row['Priority'],
          dueDate: new Date(row['Due Date']).toISOString().split('T')[0],
          destination: row['Destination'],
          status: 'Pending',
        }));
        addOrders(newOrders);
      } catch (err) {
        setError('Failed to parse the file. Please check the format.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
      setIsLoading(false);
    }
    reader.readAsArrayBuffer(file);
  };
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = Object.values(order).some(val =>
        val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesPriority = priorityFilter === 'All' || order.priority === priorityFilter;
      const matchesStatus = order.status === activeTab;
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [orders, searchTerm, priorityFilter, activeTab]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Upload New Orders</h2>
        <div className="flex items-center space-x-4">
          <label htmlFor="file-upload" className="cursor-pointer flex items-center px-4 py-2 bg-sail-blue text-white rounded-md hover:bg-blue-800 transition-colors">
            <Upload className="mr-2" size={20} />
            <span>Choose Excel File</span>
          </label>
          <input id="file-upload" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
          {fileName && <span className="text-gray-600">{fileName}</span>}
          {isLoading && <span className="text-gray-600">Processing...</span>}
        </div>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        <p className="text-xs text-gray-500 mt-2">Required columns: Order ID, Customer Name, Product/Material, Quantity, Priority, Due Date, Destination.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('Pending')}
              className={`${activeTab === 'Pending' ? 'border-sail-orange text-sail-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pending Orders
            </button>
            <button
              onClick={() => setActiveTab('Delivered')}
              className={`${activeTab === 'Delivered' ? 'border-sail-orange text-sail-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Delivered Orders
            </button>
          </nav>
        </div>
        
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                  type="text"
                  placeholder="Search orders..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sail-orange"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="flex w-full md:w-auto md:space-x-4 flex-col md:flex-row gap-4 md:gap-0">
                <select
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sail-orange"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                >
                    <option>All</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                </select>
                {user?.role === Role.ADMIN && activeTab === 'Pending' && (
                  <button
                      onClick={() => autoUpdatePriorities()}
                      title="Automatically escalate priorities based on due dates"
                      className="w-full md:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sail-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sail-blue transition-colors"
                  >
                      <BrainCircuit size={18} className="mr-2" />
                      Auto-prioritize
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    {['Order ID', 'Customer', 'Product', 'Quantity (T)', 'Priority', 'Due Date', 'Destination', 'Actions'].map(header => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map(order => (
                    <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.product}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.quantity.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {activeTab === 'Pending' && user?.role === Role.ADMIN ? (
                          <select
                              value={order.priority}
                              onChange={(e) => updateOrderPriority(order.id, e.target.value as 'High' | 'Medium' | 'Low')}
                              className={`w-full p-1 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-sail-orange font-semibold text-xs ${
                                  order.priority === 'High' ? 'bg-red-100 text-red-800' :
                                  order.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                              }`}
                          >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                          </select>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.priority === 'High' ? 'bg-red-100 text-red-800' :
                          order.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                          }`}>
                          {order.priority}
                          </span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.dueDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.destination}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {activeTab === 'Pending' && user?.role === Role.ADMIN && (
                            <button onClick={() => updateOrderStatus(order.id, 'Delivered')} title="Mark as Delivered" className="text-green-600 hover:text-green-900"><Truck size={18} /></button>
                        )}
                        {activeTab === 'Delivered' && user?.role === Role.ADMIN && (
                            <button onClick={() => updateOrderStatus(order.id, 'Pending')} title="Move to Pending" className="text-yellow-600 hover:text-yellow-900">Undo</button>
                        )}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;