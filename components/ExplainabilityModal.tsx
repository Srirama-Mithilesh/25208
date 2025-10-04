import * as React from 'react';
import { X, Loader2, Lightbulb } from 'lucide-react';
import { RakeSuggestion, Order, Inventory } from '../types';
// FIX: The file was missing. I will create its content based on the application's context.
// This component should provide an AI-generated explanation for a given rake plan.
import { GoogleGenAI } from "@google/genai";

interface ExplainabilityModalProps {
  plan: RakeSuggestion;
  orders: Order[];
  inventories: Inventory[];
  onClose: () => void;
}

const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({ plan, orders, inventories, onClose }) => {
  const [explanation, setExplanation] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchExplanation = async () => {
      setIsLoading(true);
      setError('');
      
      const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

      if (!apiKey) {
          setError("API key is not configured. Cannot generate explanation.");
          setIsLoading(false);
          return;
      }

      const relatedOrders = orders.filter(o => plan.fulfilledOrderIds.includes(o.id));

      const prompt = `
        **CONTEXT:**
        You are a logistics analyst explaining the reasoning behind a specific transportation plan.
        The goal is to provide a clear, concise, and insightful explanation for why this particular plan was chosen.
        Focus on key performance indicators like cost-effectiveness, fulfillment of high-priority orders, and efficient use of resources.

        **DATA:**

        **1. The Suggested Rake Plan:**
        ${JSON.stringify(plan, null, 2)}

        **2. Orders Fulfilled by this Plan:**
        ${JSON.stringify(relatedOrders, null, 2)}

        **3. Full Inventory Picture:**
        ${JSON.stringify(inventories, null, 2)}
        
        **4. All Pending Orders:**
        ${JSON.stringify(orders.filter(o => o.status === 'Pending'), null, 2)}

        **TASK:**
        Generate a brief explanation for why this rake plan is a good decision. Structure your explanation into the following sections:
        - **Strategic Value:** A high-level summary of why this plan is strategically sound.
        - **Key Benefits (Bulleted List):** Detail the specific advantages, such as:
          - Meeting urgent deadlines or high-priority orders.
          - High rake utilization, which reduces per-ton transportation costs.
          - Combining multiple orders to the same destination for efficiency.
          - Utilizing stock from a base with sufficient inventory, preventing stockouts.
        - **Potential Risks or Considerations:** Briefly mention any trade-offs, if applicable (e.g., uses up a large portion of a specific product's stock).

        Keep the language professional and data-driven.
      `;

      try {
        // FIX: Use the GoogleGenAI constructor with the apiKey option.
        const ai = new GoogleGenAI({apiKey: apiKey});
        
        // FIX: Use ai.models.generateContent instead of deprecated methods.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        // FIX: Access the response text directly from the response object.
        setExplanation(response.text);

      } catch (e) {
        console.error("Error fetching explanation:", e);
        setError("Could not generate an explanation at this time. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExplanation();
  }, [plan, orders, inventories]);

  // A simple markdown-to-HTML parser
  const formatExplanation = (text: string) => {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">{listItems}</ul>);
            listItems = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('* ') || line.startsWith('- ')) {
            listItems.push(<li key={`li-${i}`}>{line.substring(2)}</li>);
        } else {
            flushList();
            if (line.match(/^\s*$/)) {
                elements.push(<div key={`div-${i}`} className="h-4"></div>);
            } else if (line.includes('**')) {
                const parts = line.split('**');
                elements.push(<p key={`p-${i}`} className="font-bold text-gray-800 my-2">{parts[1]}</p>);
            } else {
                elements.push(<p key={`p-${i}`}>{line}</p>);
            }
        }
    }
    flushList(); // Add any remaining list items
    return elements;
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <Lightbulb className="text-sail-orange" size={24}/>
            <h2 className="text-xl font-bold text-gray-800">Plan Explanation: {plan.rakeId}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48">
              <Loader2 className="animate-spin text-sail-orange h-12 w-12" />
              <p className="mt-4 text-gray-600">Generating insights...</p>
            </div>
          )}
          {error && (
            <div className="text-center text-red-600 p-4 bg-red-50 rounded-md">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          )}
          {!isLoading && !error && (
            <div className="prose prose-sm max-w-none text-gray-600 space-y-2">
              {formatExplanation(explanation)}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t text-right">
          <button onClick={onClose} className="px-4 py-2 bg-sail-blue text-white rounded-md hover:bg-blue-800">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityModal;