import { FC, useState, useMemo } from 'react';
import { Download, FileText, BarChart3, Settings, Printer, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Order, Inventory, RakeSuggestion } from '../types';
import ReportPreviewModal from '../components/ReportPreviewModal';

type ReportType = 'inventory' | 'orders' | 'rakes';

const ReportsPage: FC = () => {
  const { inventories, orders, rakePlans } = useData();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filter states
  const [inventoryFilters, setInventoryFilters] = useState({ baseId: 'all' });
  const [orderFilters, setOrderFilters] = useState({
    status: 'all',
    priority: 'all',
    dateStart: '',
    dateEnd: '',
  });
  const [rakeFilters, setRakeFilters] = useState({
    status: 'all',
    baseId: 'all',
  });

  const productNames = useMemo(() => 
    [...new Set(inventories.flatMap(inv => inv.products.map(p => p.name)))].sort(), 
  [inventories]);

  const handleGenerateReport = (type: ReportType) => {
    let data: any = {};
    let title = '';
    let filtersUsed: { [key: string]: string } = {};

    switch (type) {
      case 'inventory':
        title = 'Inventory Summary Report';
        filtersUsed['Base'] = inventoryFilters.baseId === 'all' ? 'All' : inventories.find(i => i.baseId.toString() === inventoryFilters.baseId)?.baseName || 'N/A';
        const filteredInventories = inventories.filter(inv => 
          inventoryFilters.baseId === 'all' || inv.baseId.toString() === inventoryFilters.baseId
        );
        data = {
          columns: ['Base', ...productNames],
          rows: filteredInventories.map(inv => {
            const productQuantities = productNames.reduce((acc, name) => {
              acc[name] = inv.products.find(p => p.name === name)?.quantity || 0;
              return acc;
            }, {} as { [key: string]: number });
            return [inv.baseName, ...productNames.map(name => productQuantities[name].toLocaleString() + ' T')];
          }),
          summary: {
            'Total Bases': filteredInventories.length,
            'Total Stock (Tons)': filteredInventories.flatMap(i => i.products).reduce((sum, p) => sum + p.quantity, 0).toLocaleString(),
          }
        };
        break;
      
      case 'orders':
        title = 'Order Fulfillment Report';
        filtersUsed['Status'] = orderFilters.status;
        filtersUsed['Priority'] = orderFilters.priority;
        filtersUsed['Due Date'] = `${orderFilters.dateStart || 'any'} to ${orderFilters.dateEnd || 'any'}`;
        
        const filteredOrders = orders.filter(order => 
          (orderFilters.status === 'all' || order.status === orderFilters.status) &&
          (orderFilters.priority === 'all' || order.priority === orderFilters.priority) &&
          (!orderFilters.dateStart || new Date(order.dueDate) >= new Date(orderFilters.dateStart)) &&
          (!orderFilters.dateEnd || new Date(order.dueDate) <= new Date(orderFilters.dateEnd))
        );
        data = {
          columns: ['Order ID', 'Customer', 'Destination', 'Priority', 'Due Date', 'Status', 'Total Quantity (T)'],
          rows: filteredOrders.map(o => [
            o.id,
            o.customerName,
            o.destination,
            o.priority,
            o.dueDate,
            o.status,
            o.products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()
          ]),
          summary: {
            'Total Orders': filteredOrders.length,
            'Pending': filteredOrders.filter(o => o.status === 'Pending').length,
            'Delivered': filteredOrders.filter(o => o.status === 'Delivered').length,
          }
        };
        break;

      case 'rakes':
        title = 'Rake Utilization Report';
        filtersUsed['Status'] = rakeFilters.status;
        filtersUsed['Origin Base'] = rakeFilters.baseId === 'all' ? 'All' : inventories.find(i => i.baseId.toString() === rakeFilters.baseId)?.baseName || 'N/A';
        
        const filteredRakes = rakePlans.filter(rake => 
          (rakeFilters.status === 'all' || rake.status === rakeFilters.status) &&
          (rakeFilters.baseId === 'all' || inventories.find(i => i.baseName === rake.base)?.baseId.toString() === rakeFilters.baseId)
        );
        data = {
          columns: ['Rake ID', 'Origin', 'Destination', 'Utilization', 'Cost', 'SLA', 'Status'],
          rows: filteredRakes.map(r => [
            r.rakeId,
            r.base,
            r.destination,
            `${r.utilization}%`,
            `$${r.cost.toLocaleString()}`,
            `${r.slaCompliance}%`,
            r.status.charAt(0).toUpperCase() + r.status.slice(1)
          ]),
          summary: {
            'Total Rakes': filteredRakes.length,
            'Average Utilization': (filteredRakes.reduce((sum, r) => sum + r.utilization, 0) / (filteredRakes.length || 1)).toFixed(2) + '%',
            'Total Cost': '$' + filteredRakes.reduce((sum, r) => sum + r.cost, 0).toLocaleString(),
          }
        };
        break;
    }

    setReportData({ ...data, title, filtersUsed });
    setIsPreviewOpen(true);
  };

  const ReportCard = ({ type, title, description, icon: Icon, color }: { type: ReportType, title: string, description: string, icon: any, color: string }) => (
    <div
      onClick={() => setSelectedReport(type)}
      className={`border p-4 rounded-lg flex flex-col items-center text-center cursor-pointer transition-all duration-300
        ${selectedReport === type ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800' : 'hover:shadow-lg hover:scale-105'}
      `}
      style={{ borderColor: selectedReport === type ? color : 'var(--border-color, #e5e7eb)', '--tw-ring-color': color } as React.CSSProperties}
    >
      <Icon size={40} className="mb-2" style={{ color }} />
      <h3 className="font-semibold dark:text-gray-200">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>
    </div>
  );

  const renderFilters = () => {
    if (!selectedReport) return null;

    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg shadow-inner mt-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Set Filters</h3>
           <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Inventory Filters */}
        {selectedReport === 'inventory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base</label>
              <select
                value={inventoryFilters.baseId}
                onChange={e => setInventoryFilters({ ...inventoryFilters, baseId: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-sail-orange focus:border-sail-orange sm:text-sm rounded-md"
              >
                <option value="all">All Bases</option>
                {inventories.map(inv => <option key={inv.baseId} value={inv.baseId}>{inv.baseName}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Order Filters */}
        {selectedReport === 'orders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select value={orderFilters.status} onChange={e => setOrderFilters({ ...orderFilters, status: e.target.value })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-sail-orange focus:border-sail-orange sm:text-sm rounded-md">
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <select value={orderFilters.priority} onChange={e => setOrderFilters({ ...orderFilters, priority: e.target.value })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-sail-orange focus:border-sail-orange sm:text-sm rounded-md">
                <option value="all">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date Start</label>
              <input type="date" value={orderFilters.dateStart} onChange={e => setOrderFilters({ ...orderFilters, dateStart: e.target.value })} className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-sail-orange focus:border-sail-orange sm:text-sm rounded-md"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date End</label>
              <input type="date" value={orderFilters.dateEnd} onChange={e => setOrderFilters({ ...orderFilters, dateEnd: e.target.value })} className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-sail-orange focus:border-sail-orange sm:text-sm rounded-md"/>
            </div>
          </div>
        )}

        {/* Rake Filters */}
        {selectedReport === 'rakes' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Origin Base</label>
              <select value={rakeFilters.baseId} onChange={e => setRakeFilters({ ...rakeFilters, baseId: e.target.value })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-sail-orange focus:border-sail-orange sm:text-sm rounded-md">
                <option value="all">All Bases</option>
                {inventories.map(inv => <option key={inv.baseId} value={inv.baseId}>{inv.baseName}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select value={rakeFilters.status} onChange={e => setRakeFilters({ ...rakeFilters, status: e.target.value })} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-sail-orange focus:border-sail-orange sm:text-sm rounded-md">
                <option value="all">All</option>
                <option value="suggested">Suggested</option>
                <option value="dispatched">Dispatched</option>
                <option value="arrived">Arrived</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-6 text-right">
          <button
            onClick={() => handleGenerateReport(selectedReport)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sail-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sail-blue"
          >
            Generate Report
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Reports</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Select a Report to Generate</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Choose a report type below, apply filters, and then generate a preview.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ReportCard
            type="inventory"
            title="Inventory Summary"
            description="A complete summary of stock levels across all bases."
            icon={FileText}
            color="#003366"
          />
          <ReportCard
            type="orders"
            title="Order Fulfillment"
            description="Track order status, delivery times, and SLA compliance."
            icon={FileText}
            color="#FF6600"
          />
          <ReportCard
            type="rakes"
            title="Rake Utilization"
            description="Analysis of rake efficiency and cost-effectiveness."
            icon={BarChart3}
            color="#0077B6"
          />
        </div>

        {renderFilters()}

      </div>

      {isPreviewOpen && reportData && (
        <ReportPreviewModal 
            title={reportData.title}
            filtersUsed={reportData.filtersUsed}
            columns={reportData.columns}
            rows={reportData.rows}
            summary={reportData.summary}
            onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
};

export default ReportsPage;