
import React, { useState, useMemo } from 'react';
import { Recipe, Ingredient } from '../types';
import { Clock, Flame, ChevronDown, ChevronUp, Plus, Check, Utensils, Globe, BookmarkPlus, BookmarkCheck, Trash2, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { getIngredientAlternative } from '../services/geminiService';

interface RecipeCardProps {
  recipe: Recipe;
  onAddIngredients: (ingredients: Ingredient[], recipeTitle: string) => void;
  onSaveRecipe?: (recipe: Recipe) => void;
  isSaved?: boolean;
  isDarkMode?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe: initialRecipe, onAddIngredients, onSaveRecipe, isSaved, isDarkMode }) => {
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [multiplier, setMultiplier] = useState<number>(1);
  
  const [replacingIngredient, setReplacingIngredient] = useState<Ingredient | null>(null);
  const [replacementLoading, setReplacementLoading] = useState(false);
  const [alternativeFound, setAlternativeFound] = useState<Ingredient | null>(null);

  const decimalToFraction = (decimal: number): string => {
    const whole = Math.floor(decimal);
    const fraction = decimal - whole;
    const epsilon = 0.01;
    let fractionStr = "";
    if (fraction > epsilon) {
      if (Math.abs(fraction - 0.125) < epsilon) fractionStr = "1/8";
      else if (Math.abs(fraction - 0.25) < epsilon) fractionStr = "1/4";
      else if (Math.abs(fraction - 0.333) < 0.02) fractionStr = "1/3";
      else if (Math.abs(fraction - 0.5) < epsilon) fractionStr = "1/2";
      else if (Math.abs(fraction - 0.666) < 0.02) fractionStr = "2/3";
      else if (Math.abs(fraction - 0.75) < epsilon) fractionStr = "3/4";
      else fractionStr = parseFloat(fraction.toFixed(2)).toString();
    }
    if (whole > 0 && fractionStr) return `${whole} ${fractionStr}`;
    if (whole > 0) return whole.toString();
    if (fractionStr) return fractionStr;
    return "0";
  };

  const scaleAmount = (amount: string, factor: number) => {
    if (factor === 1) return amount;
    const fractionRegex = /(\d+)\s+(\d+)\/(\d+)|(\d+)\/(\d+)|(\d+(\.\d+)?)/g;
    return amount.replace(fractionRegex, (match, m1, m2, m3, f1, f2, n1) => {
      let val = 0;
      if (m1 && m2 && m3) { val = parseInt(m1) + (parseInt(m2) / parseInt(m3)); }
      else if (f1 && f2) { val = parseInt(f1) / parseInt(f2); }
      else if (n1) { val = parseFloat(n1); }
      return decimalToFraction(val * factor);
    });
  };

  const scaledIngredients = useMemo(() => {
    return recipe.ingredients.map(ing => ({
      ...ing,
      amount: scaleAmount(ing.amount, multiplier)
    }));
  }, [recipe.ingredients, multiplier]);

  const handleAddAll = () => {
    onAddIngredients(scaledIngredients, `${recipe.title} (${multiplier}x)`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const removeIngredient = (ingName: string) => {
    const target = recipe.ingredients.find(i => i.name === ingName);
    if (target?.isEssential) {
      setReplacingIngredient(target);
      return;
    }
    setRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(i => i.name !== ingName)
    }));
  };

  const findReplacement = async () => {
    if (!replacingIngredient) return;
    setReplacementLoading(true);
    const alt = await getIngredientAlternative(replacingIngredient, recipe.title);
    setAlternativeFound(alt);
    setReplacementLoading(false);
  };

  const applyReplacement = () => {
    if (!alternativeFound || !replacingIngredient) return;
    setRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(i => 
        i.name === replacingIngredient.name ? alternativeFound : i
      )
    }));
    setReplacingIngredient(null);
    setAlternativeFound(null);
  };

  const recipeImageUrl = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(recipe.title + " high quality food photography")}&w=800&h=400&c=7&rs=1&p=0`;

  const getIngredientImage = (term: string) => {
      return `https://tse2.mm.bing.net/th?q=${encodeURIComponent(term)}&w=200&h=200&c=7&rs=1&p=0`;
  }

  const baseClasses = isDarkMode 
    ? "bg-slate-900 border-emerald-900/50 shadow-lg" 
    : "bg-white border-slate-100 shadow-sm";

  const textPrimary = isDarkMode ? "text-[#00ff9d]" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-emerald-700" : "text-slate-500";
  const accentBorder = isSaved 
    ? (isDarkMode ? "border-[#00ff9d]" : "border-emerald-500") 
    : (isDarkMode ? "border-emerald-900/50" : "border-slate-100");

  return (
    <div className={`${baseClasses} rounded-3xl border transition-all duration-300 flex flex-col h-full overflow-hidden ${accentBorder} hover:shadow-xl`}>
      <div className="h-48 w-full bg-slate-100 relative overflow-hidden group">
        {!imageError ? (
            <img 
                src={recipeImageUrl} 
                alt={recipe.title}
                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isDarkMode ? 'brightness-75 contrast-125' : ''}`}
                onError={() => setImageError(true)}
                loading="lazy"
            />
        ) : (
            <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-slate-950 text-emerald-900' : 'bg-slate-100 text-slate-300'}`}>
                <Utensils size={48} />
            </div>
        )}
        
        <div className="absolute top-4 right-4 flex flex-col gap-2">
             <div className="bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center justify-center gap-1.5 self-end">
                <Clock size={12} className={isDarkMode ? "text-[#00ff9d]" : "text-emerald-400"} /> {recipe.prepTime}
             </div>
             
             {onSaveRecipe && (
               <button 
                 onClick={() => onSaveRecipe(recipe)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md transition-all shadow-lg font-bold text-[10px] uppercase tracking-wider ${isSaved ? (isDarkMode ? 'bg-[#00ff9d] text-black' : 'bg-emerald-500 text-white') : 'bg-white/95 text-slate-700 hover:text-emerald-600'}`}
               >
                 {isSaved ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
                 {isSaved ? 'Saved' : 'Save'}
               </button>
             )}
        </div>

        {recipe.sources && recipe.sources.length > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-semibold tracking-wide">
            <Globe size={10} className={isDarkMode ? "text-[#00ff9d]" : "text-emerald-400"} /> Web Verified
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2 gap-3">
            <h3 className={`text-xl font-bold leading-tight flex-1 ${textPrimary}`}>{recipe.title}</h3>
            <div className={`flex p-1 rounded-lg border shrink-0 ${isDarkMode ? 'bg-black border-emerald-900' : 'bg-slate-100 border-slate-200'}`}>
              {[0.5, 1, 2].map((m) => (
                <button
                  key={m}
                  onClick={() => setMultiplier(m)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                    multiplier === m 
                      ? (isDarkMode ? 'bg-[#00ff9d] text-black shadow-lg' : 'bg-white text-slate-900 shadow-sm border border-slate-200') 
                      : (isDarkMode ? 'text-emerald-900 hover:text-[#00ff9d]' : 'text-slate-400 hover:text-slate-600')
                  }`}
                >
                  {m === 0.5 ? '½x' : `${m}x`}
                </button>
              ))}
            </div>
          </div>
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>
            <Flame size={14} className="text-orange-500" /> {Math.round(recipe.calories * multiplier)} cal
          </div>
        </div>
        
        <p className={`text-sm mb-6 line-clamp-2 flex-1 leading-relaxed ${isDarkMode ? 'text-emerald-800' : 'text-slate-500'}`}>{recipe.description}</p>

        <div className="flex gap-2.5 mt-auto">
          <button 
            onClick={() => setExpanded(!expanded)}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${expanded ? (isDarkMode ? 'bg-[#00ff9d] text-black border-[#00ff9d]' : 'bg-slate-900 text-white') : (isDarkMode ? 'bg-black border-emerald-900 text-[#00ff9d] hover:bg-emerald-900/20' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200')}`}
          >
            {expanded ? (
              <>Less <ChevronUp size={16} /></>
            ) : (
              <>More Info <ChevronDown size={16} /></>
            )}
          </button>
          
          <button 
            onClick={handleAddAll}
            disabled={added}
            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              added 
              ? (isDarkMode ? 'bg-[#00ff9d] text-black' : 'bg-emerald-500 text-white') 
              : (isDarkMode ? 'bg-emerald-900/40 text-[#00ff9d] border border-emerald-800 hover:bg-[#00ff9d] hover:text-black' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200')
            }`}
          >
            {added ? <Check size={16} /> : <Plus size={16} />}
            <span className="hidden sm:inline">{added ? 'Added' : 'Add to List'}</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className={`border-t p-6 animate-fadeIn ${isDarkMode ? 'bg-black border-emerald-950' : 'bg-slate-50/50 border-slate-100'}`}>
          <div className="mb-8">
            <h4 className={`font-bold text-sm mb-4 ${isDarkMode ? 'text-[#00ff9d]' : 'text-slate-800'}`}>Ingredients</h4>
            <ul className="space-y-3">
              {scaledIngredients.map((ing, idx) => (
                <li key={idx} className={`group relative flex justify-between text-sm items-center p-3 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-emerald-950' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-0.5 overflow-hidden shrink-0 ${isDarkMode ? 'bg-black border border-emerald-900' : 'bg-slate-50'}`}>
                        <img 
                            src={getIngredientImage(ing.imageTerm || ing.name)} 
                            alt={ing.name}
                            className={`w-full h-full object-cover rounded-lg ${isDarkMode ? 'brightness-75 contrast-125' : ''}`}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                     </div>
                     <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-slate-700'}`}>{ing.name}</span>
                           {ing.isEssential && (
                             <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${isDarkMode ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-100 text-slate-500'}`}>Essential</span>
                           )}
                        </div>
                        <span className={`text-xs ${isDarkMode ? 'text-emerald-900' : 'text-slate-400'}`}>{ing.amount}</span>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => removeIngredient(ing.name)}
                      className={`p-2 rounded-lg transition-all ${isDarkMode ? 'text-emerald-900 hover:text-red-500 hover:bg-red-950/30' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={`font-bold text-sm mb-4 ${isDarkMode ? 'text-[#00ff9d]' : 'text-slate-800'}`}>Instructions</h4>
            <ol className="space-y-6">
              {recipe.instructions.map((step, idx) => (
                <li key={idx} className="flex gap-4 text-sm group">
                  <span className={`flex-shrink-0 w-7 h-7 border rounded-xl flex items-center justify-center text-[10px] font-bold shadow-sm ${isDarkMode ? 'bg-slate-900 border-emerald-900 text-[#00ff9d]' : 'bg-white border-slate-200 text-slate-400'}`}>
                    {idx + 1}
                  </span>
                  <span className={`leading-relaxed pt-1 ${isDarkMode ? 'text-emerald-800' : 'text-slate-600'}`}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {replacingIngredient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className={`rounded-[2rem] w-full max-w-sm p-8 shadow-2xl animate-scaleIn border ${isDarkMode ? 'bg-black border-emerald-900' : 'bg-white border-white'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${isDarkMode ? 'bg-red-950 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertCircle size={32} />
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${isDarkMode ? 'text-[#00ff9d]' : 'text-slate-900'}`}>Essential Ingredient</h3>
            <p className={`text-center text-sm mb-8 ${isDarkMode ? 'text-emerald-800' : 'text-slate-500'}`}>
              <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-slate-800'}`}>"{replacingIngredient.name}"</span> is key to this dish. Find a high-quality substitute?
            </p>
            
            {alternativeFound ? (
              <div className={`p-4 rounded-2xl border mb-6 animate-fadeIn ${isDarkMode ? 'bg-emerald-950/20 border-emerald-900' : 'bg-emerald-50 border-emerald-100'}`}>
                <p className={`text-[10px] font-bold uppercase mb-1 ${isDarkMode ? 'text-[#00ff9d]' : 'text-emerald-600'}`}>Recommended Substitute</p>
                <div className="flex items-center gap-3">
                  <RefreshCw className={isDarkMode ? "text-[#00ff9d]" : "text-emerald-600"} size={16} />
                  <div>
                    <p className={`font-bold text-sm ${isDarkMode ? 'text-emerald-300' : 'text-slate-800'}`}>{alternativeFound.name}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-emerald-900' : 'text-slate-400'}`}>{alternativeFound.amount}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {!alternativeFound ? (
                <>
                  <button 
                    onClick={findReplacement}
                    disabled={replacementLoading}
                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${isDarkMode ? 'bg-[#00ff9d] text-black hover:bg-emerald-400' : 'bg-slate-900 text-white hover:bg-black'}`}
                  >
                    {replacementLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                    Find Alternative
                  </button>
                  <button 
                    onClick={() => {
                      setRecipe(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i.name !== replacingIngredient.name) }));
                      setReplacingIngredient(null);
                    }}
                    className={`w-full font-bold py-2 text-xs transition-colors ${isDarkMode ? 'text-emerald-900 hover:text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                  >
                    Remove anyway
                  </button>
                </>
              ) : (
                <button 
                  onClick={applyReplacement}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${isDarkMode ? 'bg-[#00ff9d] text-black' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                >
                  <Check size={20} /> Apply Substitute
                </button>
              )}
              
              <button 
                onClick={() => { setReplacingIngredient(null); setAlternativeFound(null); }}
                className={`w-full py-4 font-bold text-xs ${isDarkMode ? 'text-emerald-900 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeCard;
