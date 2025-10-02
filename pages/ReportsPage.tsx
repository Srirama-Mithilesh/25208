
import React from 'react';
import { Download, FileText } from 'lucide-react';

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Generate & Export Reports</h2>
        <p className="text-gray-600 mb-6">
          This section will allow you to generate custom reports and export data in various formats.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border p-4 rounded-lg flex flex-col items-center text-center">
            <FileText size={40} className="text-sail-blue mb-2" />
            <h3 className="font-semibold">Inventory Summary</h3>
            <p className="text-sm text-gray-500 mb-3">A complete summary of stock levels across all bases.</p>
            <button className="w-full flex justify-center items-center mt-auto p-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              <Download size={16} className="mr-2" />
              Export as XLSX
            </button>
          </div>
          <div className="border p-4 rounded-lg flex flex-col items-center text-center">
            <FileText size={40} className="text-sail-orange mb-2" />
            <h3 className="font-semibold">Order Fulfillment Report</h3>
            <p className="text-sm text-gray-500 mb-3">Track order status, delivery times, and SLA compliance.</p>
            <button className="w-full flex justify-center items-center mt-auto p-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              <Download size={16} className="mr-2" />
              Export as PDF
            </button>
          </div>
          <div className="border p-4 rounded-lg flex flex-col items-center text-center">
            <FileText size={40} className="text-green-600 mb-2" />
            <h3 className="font-semibold">Rake Utilization</h3>
            <p className="text-sm text-gray-500 mb-3">Analysis of rake efficiency and cost-effectiveness.</p>
            <button className="w-full flex justify-center items-center mt-auto p-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              <Download size={16} className="mr-2" />
              Export as CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
