
import React, { useState, useEffect } from 'react';
import { AppView, Recipe, Ingredient, ShoppingItem, MealPlan, MealType, Person, PersonMealPlans } from './types';
import { suggestRecipesFromChat } from './services/geminiService';
import RecipeCard from './components/RecipeCard';
import ShoppingList from './components/ShoppingList';
import Cookbook from './components/Cookbook';
import ChefChat from './components/ChefChat';
import DecisionWheel from './components/DecisionWheel';
import { 
  ShoppingCart, 
  ArrowLeft,
  Loader2,
  Globe,
  Book,
  RotateCw,
  Search,
  Shuffle,
  Filter,
  Cpu,
  Moon,
  Sun
} from 'lucide-react';

/**
 * Cyborg Chef Hat Logo
 * Simplified: Toque shape + visor base. No antenna "sprout".
 */
const CyborgChefLogo = ({ size = 40, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`${className}`}
  >
    <path 
      d="M6 10C6 7.5 7.5 5 10 5C10 3.5 12 3.5 12 3.5C12 3.5 14 3.5 14 5C16.5 5 18 7.5 18 10V12H6V10Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 5V12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.2" />
    <path d="M12 3.5V12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.2" />
    <path d="M15 5V12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.2" />
    <rect x="5" y="12" width="14" height="7" rx="1.5" fill="currentColor" />
    <rect x="7" y="14" width="10" height="2.5" rx="0.5" fill="black" fillOpacity="0.4" />
    <rect x="8" y="15" width="2" height="0.5" rx="0.25" fill="#10b981">
      <animate attributeName="x" values="8;14;8" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
    </rect>
  </svg>
);

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [people, setPeople] = useState<Person[]>([]);
  const [activePersonId, setActivePersonId] = useState<string>('');

  const [isShoppingListOpen, setShoppingListOpen] = useState(false);
  const [isWheelOpen, setWheelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [luckyFilter, setLuckyFilter] = useState('');
  
  const [personMealPlans, setPersonMealPlans] = useState<PersonMealPlans>({});
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  const createEmptyMealPlan = () => {
    const plan: MealPlan = {};
    DAYS.forEach(day => plan[day] = { breakfast: null, lunch: null, dinner: null });
    return plan;
  };

  useEffect(() => {
    const savedList = localStorage.getItem('mealmaster_list');
    const savedCookbook = localStorage.getItem('mealmaster_cookbook');
    const savedPeople = localStorage.getItem('mealmaster_people');
    const savedMealPlans = localStorage.getItem('mealmaster_mealplans');
    const savedTheme = localStorage.getItem('mealmaster_theme');
    
    if (savedList) setShoppingList(JSON.parse(savedList));
    if (savedCookbook) setSavedRecipes(JSON.parse(savedCookbook));
    if (savedTheme) setIsDarkMode(savedTheme === 'dark');
    
    if (savedPeople) {
      const parsedPeople = JSON.parse(savedPeople);
      setPeople(parsedPeople);
      if (parsedPeople.length > 0) setActivePersonId(parsedPeople[0].id);
    } else {
      const defaultId = crypto.randomUUID();
      const initialPeople = [{ id: defaultId, name: 'Lead Chef' }];
      setPeople(initialPeople);
      setActivePersonId(defaultId);
      setPersonMealPlans({ [defaultId]: createEmptyMealPlan() });
    }

    if (savedMealPlans) setPersonMealPlans(JSON.parse(savedMealPlans));
  }, []);

  useEffect(() => {
    localStorage.setItem('mealmaster_list', JSON.stringify(shoppingList));
    localStorage.setItem('mealmaster_cookbook', JSON.stringify(savedRecipes));
    localStorage.setItem('mealmaster_people', JSON.stringify(people));
    localStorage.setItem('mealmaster_mealplans', JSON.stringify(personMealPlans));
    localStorage.setItem('mealmaster_theme', isDarkMode ? 'dark' : 'light');
  }, [shoppingList, savedRecipes, people, personMealPlans, isDarkMode]);

  const performSearch = async (query: string) => {
    setView('results');
    setLoading(true);
    setError(null);
    try {
      const suggestedRecipes = await suggestRecipesFromChat(query);
      setRecipes(suggestedRecipes);
    } catch (e) {
      setError("Search failed. Please try a different query.");
      setView('home');
    } finally {
      setLoading(false);
      setChatInput('');
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    performSearch(chatInput);
  };

  const handleLuckyClick = () => {
    const luckyPrompts = [
      "Surprise me with a unique world cuisine dinner",
      "Give me something comforting and cheesy",
      "Suggest a healthy, high-protein lunch",
      "Decide on a vibrant Mediterranean meal for me",
      "Choose a random, highly-rated viral recipe"
    ];
    let randomPrompt = luckyPrompts[Math.floor(Math.random() * luckyPrompts.length)];
    if (luckyFilter.trim()) {
      randomPrompt += `. Ensure the recipes are ${luckyFilter.trim()}.`;
    }
    performSearch(randomPrompt);
  };

  const toggleSaveRecipe = (recipe: Recipe) => {
    setSavedRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id);
      if (exists) return prev.filter(r => r.id !== recipe.id);
      return [...prev, recipe];
    });
  };

  const updateMealPlan = (personId: string, day: string, type: MealType, recipe: Recipe | null) => {
    setPersonMealPlans(prev => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        [day]: {
          ...prev[personId][day],
          [type]: recipe
        }
      }
    }));
  };

  const addPerson = (name: string) => {
    const newPerson: Person = { id: crypto.randomUUID(), name };
    setPeople(prev => [...prev, newPerson]);
    setPersonMealPlans(prev => ({
      ...prev,
      [newPerson.id]: createEmptyMealPlan()
    }));
    setActivePersonId(newPerson.id);
  };

  const updatePersonName = (id: string, newName: string) => {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const removePerson = (id: string) => {
    if (people.length <= 1) return;
    setPeople(prev => prev.filter(p => p.id !== id));
    setPersonMealPlans(prev => {
      const newPlans = { ...prev };
      delete newPlans[id];
      return newPlans;
    });
    const remaining = people.filter(p => p.id !== id);
    if (activePersonId === id) setActivePersonId(remaining[0].id);
  };

  const addToShoppingList = (ingredients: Ingredient[], recipeTitle: string) => {
    const newItems: ShoppingItem[] = ingredients.map(ing => ({
      id: crypto.randomUUID(),
      name: ing.name,
      amount: ing.amount,
      checked: false,
      recipeRef: recipeTitle,
      estimatedPrice: ing.estimatedPrice,
      imageTerm: ing.imageTerm
    }));
    
    setShoppingList(prev => [...prev, ...newItems]);
    setShoppingListOpen(true);
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const removeShoppingItem = (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  const clearCompletedShopping = () => {
    setShoppingList(prev => prev.filter(item => !item.checked));
  };

  const themeClasses = isDarkMode 
    ? "bg-black text-[#00ff9d] selection:bg-[#00ff9d]/20" 
    : "bg-[#f8fafc] text-slate-800 selection:bg-emerald-100";

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 space-y-12 pb-12">
      <div className="text-center space-y-4 animate-fadeIn">
        <div className={`p-5 rounded-[2.5rem] w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-2xl border ${isDarkMode ? 'bg-slate-900 text-[#00ff9d] border-[#00ff9d]/30' : 'bg-slate-900 text-[#10b981] border-white/10'}`}>
          <CyborgChefLogo size={56} />
        </div>
        <h1 className={`text-4xl font-bold tracking-tight uppercase italic ${isDarkMode ? 'text-[#00ff9d] drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]' : 'text-slate-900'}`}>
          MealMaster
        </h1>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
           {people.map((p, idx) => (
             <div key={idx} className={`border rounded-full px-3 py-1 text-xs font-semibold shadow-sm flex items-center gap-2 ${isDarkMode ? 'bg-slate-900 border-emerald-900 text-emerald-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                Planner: {p.name}
             </div>
           ))}
        </div>
        <p className={`max-w-xs mx-auto text-lg mt-6 leading-relaxed ${isDarkMode ? 'text-emerald-500/80' : 'text-slate-500'}`}>
          Meal planning redefined with Deep Search and neural intelligence.
        </p>
      </div>

      <div className="w-full max-w-md grid grid-cols-1 gap-4">
        <button 
          onClick={() => setView('chat')}
          className={`group p-6 border rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 text-left flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border-emerald-900 hover:border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-400'}`}
        >
          <div>
            <h3 className={`text-lg font-bold transition-colors ${isDarkMode ? 'text-[#00ff9d] group-hover:text-white' : 'text-slate-800 group-hover:text-emerald-600'}`}>Deep Search</h3>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-emerald-600' : 'text-slate-500'}`}>AI-driven recipe optimization</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-emerald-900/30 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white'}`}>
            <Search size={24} />
          </div>
        </button>

        <button 
          onClick={() => setView('cookbook')}
          className={`group p-6 border rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 text-left flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border-emerald-900 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400'}`}
        >
          <div>
            <h3 className={`text-lg font-bold transition-colors ${isDarkMode ? 'text-[#00ff9d] group-hover:text-white' : 'text-slate-800 group-hover:text-blue-600'}`}>Your Cookbook</h3>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-emerald-600' : 'text-slate-500'}`}>Manage library & meal schedules</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-blue-900/30 text-blue-400 group-hover:bg-blue-500 group-hover:text-black' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-500 group-hover:text-white'}`}>
            <Book size={24} />
          </div>
        </button>

        <button 
          onClick={() => setWheelOpen(true)}
          className={`group p-4 border rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 mt-4 ${isDarkMode ? 'bg-emerald-500 text-black border-emerald-400 hover:bg-[#00ff9d]' : 'bg-slate-900 text-white border-slate-800 hover:shadow-emerald-500/10'}`}
        >
          <RotateCw className={`${isDarkMode ? 'text-black' : 'text-emerald-400'} group-hover:rotate-180 transition-transform duration-500`} size={20} />
          <span className="font-bold text-sm tracking-wide uppercase">DECIDE FOR ME</span>
        </button>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-[80vh] justify-center px-6 max-w-lg mx-auto w-full">
      <div className="text-center mb-8">
         <div className={`p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 border shadow-lg ${isDarkMode ? 'bg-slate-900 text-[#00ff9d] border-[#00ff9d]/20' : 'bg-slate-900 text-emerald-400 border-white/10'}`}>
          <Cpu size={28} />
        </div>
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-[#00ff9d]' : 'text-slate-900'}`}>Deep Search</h2>
        <p className={`${isDarkMode ? 'text-emerald-600' : 'text-slate-500'} mt-2`}>What are you craving today?</p>
      </div>

      <div className="flex flex-col gap-4">
        <form onSubmit={handleChatSubmit} className="relative">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="e.g. 'Healthy lemon salmon dinner' or 'Spicy tofu stir-fry'..."
            className={`w-full p-6 pb-16 rounded-3xl shadow-lg border-2 border-transparent focus:ring-0 outline-none resize-none text-lg transition-all min-h-[160px] ${isDarkMode ? 'bg-slate-900 text-[#00ff9d] placeholder-emerald-900/50 focus:border-[#00ff9d]' : 'bg-white text-slate-800 placeholder-slate-300 focus:border-emerald-500'}`}
            autoFocus
          />
          <div className="absolute bottom-4 right-4">
            <button 
              type="submit"
              disabled={!chatInput.trim()}
              className={`px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg border ${isDarkMode ? 'bg-emerald-500 text-black border-emerald-400 hover:bg-[#00ff9d] disabled:opacity-30' : 'bg-slate-900 text-emerald-400 border-white/10 hover:bg-black disabled:opacity-50'}`}
            >
              Search
            </button>
          </div>
        </form>

        <div className={`p-5 rounded-3xl shadow-md border flex flex-col gap-3 animate-fadeIn ${isDarkMode ? 'bg-slate-900 border-emerald-900' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-2 text-slate-400">
            <Filter size={14} className={isDarkMode ? "text-[#00ff9d]" : "text-emerald-500"} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-emerald-600' : 'text-slate-400'}`}>dietary restrictions and preferences</span>
          </div>
          <div className="flex gap-2">
            <input 
              type="text"
              value={luckyFilter}
              onChange={(e) => setLuckyFilter(e.target.value)}
              placeholder="e.g. gluten free, vegan..."
              className={`flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${isDarkMode ? 'bg-black border-emerald-900 text-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]' : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500'}`}
            />
            <button 
              type="button"
              onClick={handleLuckyClick}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border ${isDarkMode ? 'bg-emerald-900/20 text-[#00ff9d] border-emerald-800 hover:bg-emerald-900/40' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
            >
              <Shuffle size={18} className={isDarkMode ? "text-[#00ff9d]" : "text-emerald-600"} />
              <span className="text-sm">I'm feeling lucky</span>
            </button>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => setView('home')} 
        className={`mt-6 text-sm font-medium mx-auto flex items-center gap-2 transition-colors ${isDarkMode ? 'text-emerald-700 hover:text-[#00ff9d]' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <ArrowLeft size={16} /> Back to Menu
      </button>
    </div>
  );

  const renderResults = () => {
    if (loading) {
      return (
        <div className={`flex flex-col items-center justify-center min-h-[60vh] text-center px-6 ${isDarkMode ? 'text-[#00ff9d]' : 'text-slate-500'}`}>
          <div className="relative mb-6">
            <Loader2 className={`w-16 h-16 animate-spin ${isDarkMode ? 'text-[#00ff9d]' : 'text-emerald-500'}`} />
            <Globe className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-blue-500'}`} />
          </div>
          <p className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-[#00ff9d]' : 'text-slate-900'}`}>Deep Search Active...</p>
          <p className={`text-sm opacity-70 max-w-xs mx-auto ${isDarkMode ? 'text-emerald-700' : ''}`}>Sourcing highest-performing recipes for your request.</p>
        </div>
      );
    }

    if (recipes.length === 0 && !error) {
        return (
             <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
                <Cpu size={48} className={`mb-4 ${isDarkMode ? 'text-emerald-900' : 'text-slate-300'}`} />
                <p className={`text-lg font-bold ${isDarkMode ? 'text-emerald-600' : 'text-slate-500'}`}>No matches found.</p>
                <button onClick={() => setView('home')} className={`mt-4 px-6 py-2 rounded-xl font-medium ${isDarkMode ? 'bg-[#00ff9d] text-black' : 'bg-slate-900 text-white'}`}>Try Again</button>
            </div>
        )
    }

    return (
      <div className="px-4 pb-20 max-w-6xl mx-auto">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('home')} className={`p-2 rounded-full shadow-sm border transition-colors ${isDarkMode ? 'bg-slate-900 border-emerald-900 text-[#00ff9d] hover:bg-black' : 'bg-white border-slate-100 text-slate-500 hover:text-slate-800'}`}>
                  <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-[#00ff9d]' : 'text-slate-900'}`}>Optimized Selections</h2>
                <p className={`text-xs flex items-center gap-1 mt-1 font-semibold ${isDarkMode ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <Globe size={12} className={isDarkMode ? "text-[#00ff9d]" : "text-emerald-500"} /> Web grounding verification active
                </p>
              </div>
            </div>
            <button 
              onClick={() => setWheelOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${isDarkMode ? 'bg-[#00ff9d] text-black hover:bg-emerald-400' : 'bg-slate-900 text-white hover:shadow-xl'}`}
            >
              <RotateCw size={16} /> Randomize
            </button>
         </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              onAddIngredients={addToShoppingList} 
              onSaveRecipe={toggleSaveRecipe}
              isSaved={!!savedRecipes.find(r => r.id === recipe.id)}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      <nav className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${isDarkMode ? 'bg-black/80 border-emerald-900/50' : 'bg-white/80 border-slate-100'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
             <div className={`rounded-xl p-1.5 border transition-colors ${isDarkMode ? 'bg-slate-900 border-emerald-800 group-hover:bg-black' : 'bg-slate-900 border-white/10 group-hover:bg-black'}`}>
                <CyborgChefLogo size={24} className={isDarkMode ? "text-[#00ff9d]" : "text-[#10b981]"} />
             </div>
            <span className={`font-bold text-xl tracking-tight uppercase italic ${isDarkMode ? 'text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.3)]' : 'text-slate-900'}`}>MealMaster</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl transition-all border ${isDarkMode ? 'bg-slate-900 border-emerald-900 text-[#00ff9d] hover:bg-black' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              title="Toggle Neural Overlay"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setShoppingListOpen(true)}
              className={`relative p-2.5 rounded-xl transition-colors border ${isDarkMode ? 'bg-slate-900 border-emerald-900 text-[#00ff9d] hover:bg-black' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <ShoppingCart size={20} />
              {shoppingList.filter(i => !i.checked).length > 0 && (
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 shadow-lg ${isDarkMode ? 'bg-[#00ff9d] ring-black shadow-[#00ff9d]/50' : 'bg-emerald-500 ring-white'}`} />
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-6">
        {error && (
            <div className={`max-w-md mx-auto mb-6 p-4 rounded-xl flex items-center justify-between border ${isDarkMode ? 'bg-red-950 border-red-900 text-red-400' : 'bg-red-50 text-red-600 border-red-100'}`}>
                <span className="font-semibold text-sm">{error}</span>
                <button onClick={() => setError(null)}><ArrowLeft size={16} /></button>
            </div>
        )}

        {view === 'home' && renderHome()}
        {view === 'chat' && renderChat()}
        {view === 'results' && renderResults()}
        {view === 'cookbook' && (
          <Cookbook 
            savedRecipes={savedRecipes} 
            people={people}
            activePersonId={activePersonId}
            onSetActivePerson={setActivePersonId}
            onAddPerson={addPerson}
            onUpdatePersonName={updatePersonName}
            onRemovePerson={removePerson}
            mealPlans={personMealPlans}
            onUpdateMealPlan={updateMealPlan}
            onAddCustomRecipe={(r) => setSavedRecipes(prev => [...prev, r])}
            onRemoveRecipe={(id) => setSavedRecipes(prev => prev.filter(r => r.id !== id))}
            onAddIngredients={addToShoppingList}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      <ShoppingList 
        isOpen={isShoppingListOpen} 
        onClose={() => setShoppingListOpen(false)}
        items={shoppingList}
        onToggleItem={toggleShoppingItem}
        onRemoveItem={removeShoppingItem}
        onClearCompleted={clearCompletedShopping}
        isDarkMode={isDarkMode}
      />
      
      <DecisionWheel 
        isOpen={isWheelOpen} 
        onClose={() => setWheelOpen(false)} 
        initialOptions={recipes.length > 0 ? recipes.map(r => ({ label: r.title })) : undefined}
        isDarkMode={isDarkMode}
      />

      <ChefChat isDarkMode={isDarkMode} />
    </div>
  );
};

export default App;
