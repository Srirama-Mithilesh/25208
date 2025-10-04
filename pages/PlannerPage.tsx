import { useState, FC } from 'react';
import { useData } from '../context/DataContext';
import { BrainCircuit, Loader2, Info, Map, CheckCircle, Beaker, Send } from 'lucide-react';
import { RakeSuggestion, Order, Inventory } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import RouteModal from '../components/RouteModal';
import ExplainabilityModal from '../components/ExplainabilityModal';
import SimulationModal from '../components/SimulationModal';

export interface SimulationParams {
  rakeCapacity?: number;
  priorityWeighting?: string; 
  highPriorityProduct?: string;
  specificOrderIds?: string;
}

const PlannerPage: FC = () => {
  const { orders, inventories, rakePlans, setRakePlans, dispatchRake, addNotification } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedPlanForRoute, setSelectedPlanForRoute] = useState<RakeSuggestion | null>(null);
  const [selectedPlanForExplanation, setSelectedPlanForExplanation] = useState<RakeSuggestion | null>(null);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);

  const pendingOrders = orders.filter(o => o.status === 'Pending');

  const generatePlan = async (simulationParams: SimulationParams = {}) => {
    setIsLoading(true);
    setError('');

    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

    if (!apiKey) {
        setError("API key is not configured. Please contact the administrator.");
        setIsLoading(false);
        return;
    }
    
    const { rakeCapacity = 4000, priorityWeighting = 'balanced', highPriorityProduct, specificOrderIds } = simulationParams;

    // Construct the prompt for the Gemini API
    const prompt = `
      You are a logistics planning expert for a major steel authority. Your task is to create an optimal rake formation plan.
      
      **CONTEXT:**
      - A standard rake has a capacity of approximately ${rakeCapacity} tons.
      - Planning Strategy: ${priorityWeighting === 'high_priority_focus' ? 'Strongly prioritize orders with \'High\' priority, even if it results in lower rake utilization.' : 'Balance fulfilling high-priority orders with achieving high rake utilization.'}
      ${highPriorityProduct ? `- Give special consideration to fulfilling orders for the product: ${highPriorityProduct}.` : ''}
      ${specificOrderIds ? `- A user has requested that you prioritize including these specific Order IDs in your plan: ${specificOrderIds}. Please try to include them if feasible.` : ''}
      - Aim for high rake utilization (close to 100%) but do not exceed capacity.
      - Fulfill multiple orders in a single rake if they have the same destination and fit within capacity.
      - Consider inventory levels at each base. A plan is only viable if the base has enough stock.

      **INPUT DATA:**

      **1. Pending Orders:**
      ${JSON.stringify(pendingOrders, null, 2)}

      **2. Current Inventory:**
      ${JSON.stringify(inventories, null, 2)}

      **TASK:**
      Generate a list of rake suggestions. For each suggestion, provide:
      - A unique rakeId (e.g., "RAKE-BH-MUM-01").
      - The source base.
      - The destination.
      - A list of products and their quantities.
      - The total cost (estimate: $50 per ton).
      - SLA compliance as a percentage (estimate based on priority and due date).
      - Rake utilization percentage.
      - A list of order IDs fulfilled by this rake.

      Return the response as a JSON array of objects.
    `;

    try {
      const ai = new GoogleGenAI({apiKey: apiKey});

      const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            rakeId: { type: Type.STRING },
            base: { type: Type.STRING },
            destination: { type: Type.STRING },
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                },
                required: ['name', 'quantity'],
              }
            },
            cost: { type: Type.NUMBER },
            slaCompliance: { type: Type.NUMBER },
            utilization: { type: Type.NUMBER },
            fulfilledOrderIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['rakeId', 'base', 'destination', 'products', 'cost', 'slaCompliance', 'utilization', 'fulfilledOrderIds'],
        }
      };
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        }
      });
      
      const jsonResponse = response.text.trim();
      let parsedPlans: Omit<RakeSuggestion, 'status'>[] = JSON.parse(jsonResponse);
      
      if (!Array.isArray(parsedPlans)) {
        throw new Error("AI response was not a valid array of plans.");
      }

      const plansWithStatus: RakeSuggestion[] = parsedPlans.map(p => ({...p, status: 'suggested' }));
      
      setRakePlans(plansWithStatus);

      // Add a notification for plan generation
      if (plansWithStatus.length > 0) {
        const message = simulationParams.rakeCapacity || simulationParams.specificOrderIds ? `Generated ${plansWithStatus.length} new rake suggestions based on simulation.` : `Generated ${plansWithStatus.length} new rake suggestions.`;
        addNotification(message, 0); // 0 for system/all bases
      }

    } catch (e) {
      console.error("Error generating rake plan:", e);
      setError("Failed to generate rake plan. The AI model might be unavailable or the request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDispatchPlan = (plan: RakeSuggestion) => {
    dispatchRake(plan.rakeId);
    addNotification(`Rake plan ${plan.rakeId} has been dispatched from ${plan.base}.`, inventories.find(inv => inv.baseName === plan.base)?.baseId || 0);
  };

  const getSourceForPlan = (plan: RakeSuggestion): Inventory | undefined => {
      return inventories.find(inv => inv.baseName === plan.base);
  }

  const getStatusChip = (status: RakeSuggestion['status']) => {
    switch (status) {
        case 'dispatched':
            return <span className="text-xs font-bold uppercase text-blue-600">In Transit</span>;
        case 'arrived':
            return <span className="text-xs font-bold uppercase text-green-600">Arrived</span>;
        default:
            return <span className="text-xs font-bold uppercase text-gray-500">Suggested</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Rake Formation Planner</h1>
            <p className="text-gray-500 mt-1">Generate optimal rake plans based on pending orders and inventory.</p>
        </div>
        <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSimulationModalOpen(true)}
              disabled={isLoading}
              className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sail-blue disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
                <Beaker className="-ml-1 mr-3 h-5 w-5 text-sail-blue" />
                Simulate
            </button>
            <button
              onClick={() => generatePlan()}
              disabled={isLoading}
              className="flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-sail-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sail-orange disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Generating...
                </>
              ) : (
                <>
                  <BrainCircuit className="-ml-1 mr-3 h-5 w-5" />
                  Generate AI Plan
                </>
              )}
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Rake Suggestions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Generated Rake Suggestions</h2>
        {rakePlans.length === 0 && !isLoading ? (
          <div className="text-center bg-white p-12 rounded-lg shadow-md">
            <p className="text-gray-500">No rake plans have been generated yet.</p>
            <p className="text-sm text-gray-400 mt-2">Click "Generate AI Plan" or "Simulate" to get started.</p>
          </div>
        ) : (
          rakePlans.map(plan => (
            <div key={plan.rakeId} className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${plan.status === 'dispatched' ? 'border-blue-500' : plan.status === 'arrived' ? 'border-green-500' : 'border-sail-blue'}`}>
              <div className="flex flex-col md:flex-row justify-between md:items-center">
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-lg text-sail-blue">{plan.rakeId}</h3>
                    {getStatusChip(plan.status)}
                  </div>
                  <p className="text-sm text-gray-600">{plan.base} &rarr; {plan.destination}</p>
                   <div className="mt-2 text-xs">
                    {plan.products.map(p => (
                        <span key={p.name} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">{p.name}: {p.quantity.toLocaleString()} T</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center md:text-right flex-shrink-0 md:pl-6">
                    <div>
                        <p className="text-xs text-gray-500">Cost</p>
                        <p className="font-semibold">${plan.cost.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-500">Utilization</p>
                        <p className={`font-semibold ${plan.utilization > 90 ? 'text-green-600' : 'text-yellow-600'}`}>{plan.utilization}%</p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-500">SLA</p>
                        <p className={`font-semibold ${plan.slaCompliance > 95 ? 'text-green-600' : 'text-yellow-600'}`}>{plan.slaCompliance}%</p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-500">Orders</p>
                        <p className="font-semibold">{plan.fulfilledOrderIds.length}</p>
                    </div>
                </div>
              </div>
              <div className="border-t mt-4 pt-3 flex flex-wrap gap-3 items-center justify-end">
                <button onClick={() => setSelectedPlanForExplanation(plan)} className="text-sm flex items-center text-gray-600 hover:text-sail-blue">
                  <Info size={16} className="mr-1"/> Explain
                </button>
                <button onClick={() => setSelectedPlanForRoute(plan)} className="text-sm flex items-center text-gray-600 hover:text-sail-blue">
                  <Map size={16} className="mr-1"/> View Route
                </button>
                <button 
                  onClick={() => handleDispatchPlan(plan)}
                  disabled={plan.status !== 'suggested'}
                  className="text-sm flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {plan.status === 'suggested' ? <Send size={16} className="mr-1"/> : <CheckCircle size={16} className="mr-1"/>}
                  {plan.status === 'suggested' ? 'Dispatch' : plan.status === 'dispatched' ? 'In Transit' : 'Arrived'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPlanForRoute && getSourceForPlan(selectedPlanForRoute) && (
        <RouteModal 
          plan={selectedPlanForRoute}
          source={getSourceForPlan(selectedPlanForRoute)!}
          onClose={() => setSelectedPlanForRoute(null)}
        />
      )}

      {selectedPlanForExplanation && (
        <ExplainabilityModal 
          plan={selectedPlanForExplanation}
          orders={orders}
          inventories={inventories}
          onClose={() => setSelectedPlanForExplanation(null)}
        />
      )}

      {isSimulationModalOpen && (
        <SimulationModal
          inventories={inventories}
          onClose={() => setIsSimulationModalOpen(false)}
          onRunSimulation={(params) => {
            setIsSimulationModalOpen(false);
            generatePlan(params);
          }}
        />
      )}
    </div>
  );
};

export default PlannerPage;