import { useState, useMemo, FC } from 'react';
import { X, Beaker, Zap } from 'lucide-react';
import { Inventory } from '../types';
import { SimulationParams } from '../pages/PlannerPage';

interface SimulationModalProps {
  inventories: Inventory[];
  onClose: () => void;
  onRunSimulation: (params: SimulationParams) => void;
}

const SimulationModal: FC<SimulationModalProps> = ({ inventories, onClose, onRunSimulation }) => {
  const [rakeCapacity, setRakeCapacity] = useState(4000);
  const [priorityWeighting, setPriorityWeighting] = useState('balanced');
  const [highPriorityProduct, setHighPriorityProduct] = useState('none');
  const [specificOrderIds, setSpecificOrderIds] = useState('');
  
  const productNames = useMemo(() => 
    [...new Set(inventories.flatMap(inv => inv.products.map(p => p.name)))].sort(), 
  [inventories]);

  const handleRunSimulation = () => {
    onRunSimulation({
      rakeCapacity,
      priorityWeighting,
      highPriorityProduct: highPriorityProduct === 'none' ? undefined : highPriorityProduct,
      specificOrderIds: specificOrderIds.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
           <div className="flex items-center gap-2">
            <Beaker className="text-sail-blue" size={24}/>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Simulation Parameters</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
            <div>
                <label htmlFor="rakeCapacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rake Capacity (tons)
                </label>
                <input
                    type="number"
                    id="rakeCapacity"
                    value={rakeCapacity}
                    onChange={(e) => setRakeCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-sail-orange focus:border-sail-orange"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Adjust the assumed capacity of a standard rake.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Planning Strategy
                </label>
                <div className="flex space-x-4">
                    <label className="flex items-center p-3 border dark:border-gray-600 rounded-md cursor-pointer flex-1">
                        <input
                            type="radio"
                            name="priorityWeighting"
                            value="balanced"
                            checked={priorityWeighting === 'balanced'}
                            onChange={(e) => setPriorityWeighting(e.target.value)}
                            className="h-4 w-4 text-sail-orange border-gray-300 focus:ring-sail-orange"
                        />
                        <span className="ml-3 text-sm dark:text-gray-300">Balanced</span>
                    </label>
                    <label className="flex items-center p-3 border dark:border-gray-600 rounded-md cursor-pointer flex-1">
                        <input
                            type="radio"
                            name="priorityWeighting"
                            value="high_priority_focus"
                            checked={priorityWeighting === 'high_priority_focus'}
                            onChange={(e) => setPriorityWeighting(e.target.value)}
                            className="h-4 w-4 text-sail-orange border-gray-300 focus:ring-sail-orange"
                        />
                        <span className="ml-3 text-sm dark:text-gray-300">High-Priority Focus</span>
                    </label>
                </div>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose between balancing efficiency and prioritizing urgent orders.</p>
            </div>
            
            <div>
                <label htmlFor="highPriorityProduct" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prioritize Specific Product
                </label>
                <select
                    id="highPriorityProduct"
                    value={highPriorityProduct}
                    onChange={(e) => setHighPriorityProduct(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-sail-orange focus:border-sail-orange"
                >
                    <option value="none">None</option>
                    {productNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Give special preference to orders containing a specific product.</p>
            </div>

             <div>
                <label htmlFor="specificOrderIds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Specific Order IDs (optional)
                </label>
                <textarea
                    id="specificOrderIds"
                    rows={2}
                    value={specificOrderIds}
                    onChange={(e) => setSpecificOrderIds(e.target.value)}
                    placeholder="e.g., ORD-001, ORD-003"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-sail-orange focus:border-sail-orange"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter comma-separated order IDs to prioritize in the simulation.</p>
            </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600 flex justify-end items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                Cancel
            </button>
            <button onClick={handleRunSimulation} className="flex items-center px-4 py-2 bg-sail-blue text-white rounded-md hover:bg-blue-800 transition-colors">
                <Zap size={16} className="mr-2"/>
                Run Simulation
            </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationModal;