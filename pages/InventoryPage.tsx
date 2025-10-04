import { useState, useMemo, FC } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Role, Inventory, InventoryItem } from '../types';
import { Edit, Train } from 'lucide-react';

const UpdateInventoryModal: FC<{
  inventory: Inventory;
  onClose: () => void;
  onSave: (updates: { 
      productUpdates?: { productName: string; newQuantity: number }[],
      rakeUpdate?: number 
  }) => void;
}> = ({ inventory, onClose, onSave }) => {
  const [updatedProducts, setUpdatedProducts] = useState<InventoryItem[]>(
    JSON.parse(JSON.stringify(inventory.products))
  );
  const [availableRakes, setAvailableRakes] = useState<number>(inventory.availableRakes);


  const handleQuantityChange = (productName: string, value: string) => {
    const newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity) || newQuantity < 0) return;

    setUpdatedProducts(prev =>
      prev.map(p => (p.name === productName ? { ...p, quantity: newQuantity } : p))
    );
  };

  const handleSaveChanges = () => {
    const productUpdates = updatedProducts
      .map(p => ({ productName: p.name, newQuantity: p.quantity }))
      .filter((p, i) => p.newQuantity !== inventory.products[i].quantity);

    const rakeUpdate = availableRakes !== inventory.availableRakes ? availableRakes : undefined;

    onSave({ productUpdates, rakeUpdate });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Update Inventory for {inventory.baseName}</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {updatedProducts.map(product => (
            <div key={product.name} className="flex items-center justify-between">
              <label className="text-gray-700">{product.name}</label>
              <input
                type="number"
                value={product.quantity}
                onChange={e => handleQuantityChange(product.name, e.target.value)}
                className="w-32 px-2 py-1 border rounded-md"
              />
            </div>
          ))}
            <div className="flex items-center justify-between pt-4 border-t">
              <label className="text-gray-700 font-medium">Available Rakes</label>
              <input
                type="number"
                value={availableRakes}
                onChange={e => setAvailableRakes(parseInt(e.target.value, 10) || 0)}
                className="w-32 px-2 py-1 border rounded-md"
              />
            </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleSaveChanges} className="px-4 py-2 bg-sail-orange text-white rounded-md hover:bg-orange-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const InventoryPage: FC = () => {
  const { user } = useAuth();
  const { inventories, updateInventory, updateRakeAvailability } = useData();
  const [selectedBaseId, setSelectedBaseId] = useState<number | 'all'>(user?.role === Role.ADMIN ? 'all' : user?.baseId || 'all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inventoryToEdit, setInventoryToEdit] = useState<Inventory | null>(null);

  const displayInventories = useMemo(() => {
    if (user?.role === Role.BASE_MANAGER) {
      return inventories.filter(inv => inv.baseId === user.baseId);
    }
    if (selectedBaseId === 'all') return inventories;
    return inventories.filter(inv => inv.baseId === selectedBaseId);
  }, [user, inventories, selectedBaseId]);

  const handleEdit = (inventory: Inventory) => {
    setInventoryToEdit(inventory);
    setIsModalOpen(true);
  };

  const handleSave = (updates: { 
      productUpdates?: { productName: string; newQuantity: number }[],
      rakeUpdate?: number 
  }) => {
    if (inventoryToEdit) {
      if (updates.productUpdates && updates.productUpdates.length > 0) {
        updateInventory(inventoryToEdit.baseId, updates.productUpdates);
      }
      if (updates.rakeUpdate !== undefined) {
        updateRakeAvailability(inventoryToEdit.baseId, updates.rakeUpdate);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
        {user?.role === Role.ADMIN && (
          <select
            value={selectedBaseId}
            onChange={e => setSelectedBaseId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Bases</option>
            {inventories.map(inv => <option key={inv.baseId} value={inv.baseId}>{inv.baseName}</option>)}
          </select>
        )}
      </div>

      {displayInventories.map(inv => (
        <div key={inv.baseId} className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">{inv.baseName}</h2>
            {user?.role === Role.BASE_MANAGER && user.baseId === inv.baseId && (
              <button onClick={() => handleEdit(inv)} className="flex items-center text-sm text-sail-orange hover:underline">
                <Edit size={16} className="mr-1" /> Update Inventory
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {inv.products.map(p => (
              <div key={p.name} className="bg-gray-50 p-4 rounded-md text-center">
                <p className="text-sm text-gray-500">{p.name}</p>
                <p className="text-2xl font-bold text-sail-blue">{p.quantity.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Tons</p>
              </div>
            ))}
            <div className="bg-blue-50 p-4 rounded-md text-center flex flex-col justify-center">
                <p className="text-sm text-blue-500">Available Rakes</p>
                <div className="flex items-center justify-center gap-2">
                    <Train size={24} className="text-sail-blue" />
                    <p className="text-2xl font-bold text-sail-blue">{inv.availableRakes}</p>
                </div>
                <p className="text-xs text-blue-400">Units</p>
            </div>
          </div>
          <div>
             <h3 className="text-lg font-semibold text-gray-700 mb-2">Update History</h3>
             <div className="overflow-x-auto max-h-60">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="p-2 text-left">Timestamp</th>
                            <th className="p-2 text-left">Updated By</th>
                            <th className="p-2 text-left">Changes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inv.history.map(h => (
                            <tr key={h.timestamp} className="border-b">
                                <td className="p-2">{new Date(h.timestamp).toLocaleString()}</td>
                                <td className="p-2">{h.updatedBy}</td>
                                <td className="p-2">
                                    {h.updates.map(u => `${u.product}: ${u.oldQuantity.toLocaleString()} -> ${u.newQuantity.toLocaleString()}`).join(', ')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
        </div>
      ))}
      
      {isModalOpen && inventoryToEdit && (
        <UpdateInventoryModal 
          inventory={inventoryToEdit} 
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default InventoryPage;
