
import * as React from 'react';
import KpiCard from '../components/KpiCard';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, Truck, Clock, Percent } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const DashboardPage: React.FC = () => {
  const { orders, inventories } = useData();
  const { user } = useAuth();

  const totalStock = inventories
    .flatMap(inv => inv.products)
    .reduce((acc, product) => acc + product.quantity, 0);

  const pendingOrders = orders.length;

  const upcomingDeadlines = orders.filter(order => {
    const dueDate = new Date(order.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  }).length;

  const chartData = inventories.map(inv => ({
    name: inv.baseName.replace(' Steel Plant', ''),
    ...inv.products.reduce((acc, p) => ({ ...acc, [p.name]: p.quantity }), {})
  }));
  const productNames = [...new Set(inventories.flatMap(inv => inv.products.map(p => p.name)))];
  const colors = ['#003366', '#FF6600', '#0077B6', '#FDB813'];


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h1>
        <p className="text-gray-500 mt-1">Here's a summary of the logistics operations.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Available Stock (Tons)" value={totalStock.toLocaleString()} icon={Package} color="#003366" />
        <KpiCard title="Pending Orders" value={pendingOrders.toString()} icon={Truck} color="#FF6600" />
        <KpiCard title="Upcoming Deadlines (7 days)" value={upcomingDeadlines.toString()} icon={Clock} color="#0077B6" />
        <KpiCard title="Avg. Rake Utilization" value="87%" icon={Percent} color="#FDB813" />
      </div>
      
      {user?.role !== Role.BASE_MANAGER && (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Inventory Levels Across Bases</h2>
            <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${(value as number / 1000)}k`} />
                <Tooltip formatter={(value) => `${(value as number).toLocaleString()} tons`} />
                <Legend />
                {productNames.map((name, index) => (
                    <Bar key={name} dataKey={name} stackId="a" fill={colors[index % colors.length]} />
                ))}
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;