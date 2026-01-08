import React from 'react';
import { ShoppingItem } from '../types';
import { Trash2, CheckSquare, Square, ShoppingCart, ChefHat, Utensils } from 'lucide-react';

interface ShoppingListProps {
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ 
  items, 
  onToggleItem, 
  onRemoveItem, 
  onClearCompleted,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const completedCount = items.filter(i => i.checked).length;
  
  // Calculate total price roughly by parsing strings like "$2.50"
  const totalCost = items.reduce((sum, item) => {
    if (!item.estimatedPrice) return sum;
    // Remove non-numeric chars except dot
    const priceNum = parseFloat(item.estimatedPrice.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(priceNum) ? 0 : priceNum);
  }, 0);

  const getIngredientImage = (term: string) => {
    // Use a high-quality web search proxy to find a REAL picture of the item.
    // 'tse2.mm.bing.net' is a standard endpoint for fetching image search thumbnails.
    // We add 'c=7' for smart cropping to a square.
    const query = encodeURIComponent(term);
    return `https://tse2.mm.bing.net/th?q=${query}&w=200&h=200&c=7&rs=1&p=0`;
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="p-6 bg-gradient-to-r from-green-600 to-green-500 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6" />
            <h2 className="text-xl font-bold">Shopping List</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p>Your list is empty.</p>
              <p className="text-sm mt-2">Add ingredients from your recipes!</p>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id} 
                className={`group flex items-center p-3 rounded-xl border transition-all ${
                  item.checked 
                    ? 'bg-gray-50 border-gray-100' 
                    : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
                }`}
              >
                <button 
                  onClick={() => onToggleItem(item.id)}
                  className={`mr-3 transition-colors ${item.checked ? 'text-green-500' : 'text-gray-400 hover:text-green-600'}`}
                >
                  {item.checked ? <CheckSquare size={24} /> : <Square size={24} />}
                </button>
                
                {/* Ingredient Image */}
                <div className="w-14 h-14 flex-shrink-0 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden flex items-center justify-center mr-3 relative shadow-sm">
                   <img 
                        src={getIngredientImage(item.imageTerm || item.name)} 
                        alt={item.name}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${item.checked ? 'opacity-50 grayscale' : 'opacity-100'}`}
                        loading="lazy"
                        onError={(e) => {
                            // Hide broken images
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center -z-10">
                        <Utensils size={18} className="text-gray-300" />
                    </div>
                </div>

                <div className="flex-1 min-w-0 mr-2">
                  <p className={`font-medium truncate ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {item.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{item.amount}</span>
                    {item.recipeRef && (
                      <span className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                        <ChefHat size={10} /> {item.recipeRef}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {item.estimatedPrice && (
                    <span className={`text-sm font-semibold ${item.checked ? 'text-gray-300' : 'text-green-600'}`}>
                      {item.estimatedPrice}
                    </span>
                  )}
                  <button 
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-4">
             {totalCost > 0 && (
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <span className="text-sm font-medium text-gray-600">Estimated Total</span>
                    <span className="text-lg font-bold text-slate-800">${totalCost.toFixed(2)}</span>
                </div>
             )}

            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>{items.length} items</span>
              <span>{completedCount} completed</span>
            </div>
            {completedCount > 0 && (
              <button 
                onClick={onClearCompleted}
                className="w-full py-2.5 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Clear Completed
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;