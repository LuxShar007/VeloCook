import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  DollarSign, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  BookOpen, 
  HelpCircle,
  TrendingDown,
  Info
} from 'lucide-react';

// Default static templates for our local simulator fallback
const MOCK_PLANS = {
  vegan: {
    is_feasible: true,
    total_cost: 22.00,
    remaining_balance: 8.00,
    meals: {
      breakfast: { name: "Chia Seed & Coconut Pudding", cost: 4.50, description: "Chia seeds soaked in coconut milk, topped with fresh berries and crushed almonds." },
      lunch: { name: "Mediterranean Chickpea Salad", cost: 8.00, description: "Tossed chickpeas, cucumber, cherry tomatoes, red onion, and parsley with a zesty lemon-tahini dressing." },
      dinner: { name: "Lentil & Sweet Potato Curry", cost: 9.50, description: "Rich coconut-based curry loaded with red lentils, sweet potato cubes, and fresh spinach, served with brown rice." }
    },
    grocery_list: [
      { id: "v1", item: "Chia seeds & Coconut milk", cost: 4.50 },
      { id: "v2", item: "Fresh berries & Almonds", cost: 3.00 },
      { id: "v3", item: "Canned chickpeas & Cucumbers", cost: 2.50 },
      { id: "v4", item: "Cherry tomatoes & Red onions", cost: 2.50 },
      { id: "v5", item: "Red lentils & Sweet potatoes", cost: 3.00 },
      { id: "v6", item: "Spinach & Coconut milk (curry)", cost: 4.00 },
      { id: "v7", item: "Brown rice", "cost": 2.50 }
    ],
    substitutions: [
      { original: "Fresh berries", substitute: "Frozen mixed berries", reason: "Reduces budget cost by 40% while preserving nutritional value." },
      { original: "Tahini dressing", substitute: "Olive oil & Lemon juice", reason: "Saves money if tahini is not already in your pantry." }
    ]
  },
  keto: {
    is_feasible: true,
    total_cost: 30.50,
    remaining_balance: -0.50,
    meals: {
      breakfast: { name: "Avocado & Bacon Scramble", cost: 6.50, description: "Three eggs scrambled in grass-fed butter with crispy bacon pieces and half a fresh sliced avocado." },
      lunch: { name: "Keto Caesar Salad with Chicken", cost: 9.50, description: "Romaine lettuce, grilled chicken breast, shaved parmesan, and creamy Caesar dressing." },
      dinner: { name: "Garlic Butter Steak & Zucchini", cost: 14.50, description: "Pan-seared sirloin steak basted in garlic-herb butter, paired with sautéed zucchini spirals." }
    },
    grocery_list: [
      { id: "k1", item: "Eggs & Butter", cost: 3.00 },
      { id: "k2", item: "Bacon strips", cost: 3.50 },
      { id: "k3", item: "Avocado", cost: 2.00 },
      { id: "k4", item: "Chicken breast & Romaine lettuce", cost: 6.00 },
      { id: "k5", item: "Caesar dressing & Parmesan", cost: 4.00 },
      { id: "k6", item: "Sirloin steak", cost: 9.00 },
      { id: "k7", item: "Zucchini spirals", cost: 3.00 }
    ],
    substitutions: [
      { original: "Sirloin steak", substitute: "Chicken thighs", reason: "Lowers protein cost by 55% while maintaining the high fat-to-protein ratio." },
      { original: "Zucchini spirals", substitute: "Sautéed cabbage", reason: "Cabbage is cheaper per ounce and holds butter exceptionally well." }
    ]
  },
  default: {
    is_feasible: true,
    total_cost: 27.00,
    remaining_balance: 3.00,
    meals: {
      breakfast: { name: "Sourdough Toast & Poached Eggs", cost: 5.00, description: "Two organic poached eggs served on toasted artisanal sourdough bread with a drizzle of olive oil." },
      lunch: { name: "Quinoa Salad with Grilled Chicken", cost: 9.00, description: "Fluffy quinoa mixed with diced cucumber, cherry tomatoes, and sliced grilled chicken breast." },
      dinner: { name: "Pan-Seared Salmon with Asparagus", cost: 13.00, description: "Crispy skin-on salmon fillet basted with lemon butter, served alongside roasted asparagus." }
    },
    grocery_list: [
      { id: "d1", item: "Sourdough bread", cost: 2.00 },
      { id: "d2", item: "Eggs & Olive oil", cost: 3.00 },
      { id: "d3", item: "Quinoa & Salad greens", cost: 3.50 },
      { id: "d4", item: "Chicken breast", cost: 5.50 },
      { id: "d5", item: "Salmon fillet", cost: 8.00 },
      { id: "d6", item: "Asparagus & Lemon", cost: 5.00 }
    ],
    substitutions: [
      { original: "Salmon fillet", substitute: "Rainbow Trout", reason: "Trout is often fresher locally and generally costs 25% less than salmon." },
      { original: "Sourdough bread", substitute: "Whole wheat bread", reason: "Budget option that provides similar complex carbohydrates." }
    ]
  }
};

export default function App() {
  const [dayDescription, setDayDescription] = useState("Keto day with high-protein lunch and easy dinner");
  const [maxBudget, setMaxBudget] = useState(35.00);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [groceryChecked, setGroceryChecked] = useState({});
  const [apiOnline, setApiOnline] = useState(null);
  const [generationCount, setGenerationCount] = useState(0);

  const [animationState, setAnimationState] = useState('active'); // 'active', 'glow', 'zooming', 'completed'
  const [zoomOrigin, setZoomOrigin] = useState({ x: '50%', y: '50%' });
  const textRef = useRef(null);
  const letterRef = useRef(null);

  // Handle Startup Animation Layer
  useEffect(() => {
    const glowTimer = setTimeout(() => {
      setAnimationState('glow');
    }, 600);

    const zoomTimer = setTimeout(() => {
      if (textRef.current && letterRef.current) {
        const textRect = textRef.current.getBoundingClientRect();
        const letterRect = letterRef.current.getBoundingClientRect();
        const x = letterRect.left - textRect.left + letterRect.width / 2;
        const y = letterRect.top - textRect.top + letterRect.height * 0.45;
        setZoomOrigin({ x: `${x}px`, y: `${y}px` });
      }
      setAnimationState('zooming');
    }, 2400);

    const completeTimer = setTimeout(() => {
      setAnimationState('completed');
    }, 3600);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(zoomTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  // Check API health on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        const url = window.location.hostname === 'localhost' 
          ? 'http://localhost:8000/api/generate-plan' 
          : '/_/backend/api/generate-plan';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day_description: "ping", max_budget: 10 })
        });
        if (res.ok) {
          setApiOnline(true);
        } else {
          setApiOnline(false);
        }
      } catch (err) {
        setApiOnline(false);
      }
    };
    checkApi();
  }, []);

  const fillPreset = (desc, budget) => {
    setDayDescription(desc);
    setMaxBudget(budget);
  };

  const handleCheckboxToggle = (itemId) => {
    setGroceryChecked(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Asynchronous plan generator function matching exact JSON guidelines
  const generatePlan = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setGroceryChecked({});

    const payload = {
      day_description: dayDescription,
      max_budget: parseFloat(maxBudget) || 0
    };

    try {
      const url = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000/api/generate-plan' 
        : '/_/backend/api/generate-plan';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setApiOnline(true);
    } catch (err) {
      console.warn("Failed to reach API server. Falling back to high-fidelity client-side simulator.", err);
      
      // Auto-fallback simulation logic (Senior UX Specialist touch)
      setTimeout(() => {
        const descLower = dayDescription.toLowerCase();
        let simulatedPlan;

        if (descLower.includes("vegan") || descLower.includes("plant") || descLower.includes("vegetarian")) {
          simulatedPlan = JSON.parse(JSON.stringify(MOCK_PLANS.vegan));
        } else if (descLower.includes("keto") || descLower.includes("low carb") || descLower.includes("high fat")) {
          simulatedPlan = JSON.parse(JSON.stringify(MOCK_PLANS.keto));
        } else {
          simulatedPlan = JSON.parse(JSON.stringify(MOCK_PLANS.default));
        }

        // Adjust feasibility and remaining balance according to inputs dynamically
        const budget = parseFloat(maxBudget) || 0;
        simulatedPlan.is_feasible = simulatedPlan.total_cost <= budget;
        simulatedPlan.remaining_balance = budget - simulatedPlan.total_cost;
        
        setResult(simulatedPlan);
        setApiOnline(false);
        setError("Warning: Backend API offline. Local fallback simulator initialized.");
      }, 500); 
    } finally {
      setLoading(false);
      setGenerationCount(prev => prev + 1);
    }
  };

  // Grocery progress calculations
  const totalGroceryItems = result?.grocery_list?.length || 0;
  const checkedGroceryItems = Object.values(groceryChecked).filter(Boolean).length;
  const progressPercent = totalGroceryItems > 0 ? Math.round((checkedGroceryItems / totalGroceryItems) * 100) : 0;  return (
    <>
      {/* Startup Intro Animation Overlay */}
      {animationState !== 'completed' && (
        <div 
          className={`layer ${animationState === 'active' || animationState === 'glow' || animationState === 'zooming' ? 'active' : ''} ${animationState === 'zooming' ? 'zoom-bg' : ''}`}
        >
          <div className={`liquid-bg ${animationState !== 'zooming' ? 'show' : 'hide'}`}>
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>
          </div>
          <div className={`glass-overlay ${animationState !== 'zooming' ? 'show' : 'hide'}`}></div>
          <h1 
            ref={textRef}
            className={`velocook-text ${animationState === 'glow' ? 'glow' : ''} ${animationState === 'zooming' ? 'zoom' : ''}`}
            style={{
              transformOrigin: animationState === 'zooming' ? `${zoomOrigin.x} ${zoomOrigin.y}` : '50% 50%'
            }}
          >
            <span className="velocook-text-inner">
              VeloC<span ref={letterRef} style={{ display: 'inline-block' }}>o</span>ok
            </span>
          </h1>
        </div>
      )}

      {/* Main Bright Theme Application UI */}
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
        {/* Consulting Header */}
        <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 light-shadow-sm">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-md">
                <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
              </div>
              <div>
                <h1 className="font-sans font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-500 via-emerald-600 to-emerald-800 bg-clip-text text-transparent flex items-center gap-1.5">
                  VeloCook <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-semibold px-2 py-0.5 rounded">v1.2</span>
                </h1>
                <p className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">
                  Cooking To-Do Generator & Budget Feasibility
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-start md:self-auto text-xs">
              <span className="text-slate-500">System Connection:</span>
              {apiOnline === null ? (
                <span className="flex items-center gap-1.5 text-slate-500 font-medium bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                </span>
              ) : apiOnline ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live API
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full" title="Serving local mock data">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Simulator Active
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Main Layout Grid */}
        <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Inputs Panel */}
          <section aria-labelledby="inputs-heading" className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-5 md:p-6 light-shadow-md">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h2 id="inputs-heading" className="text-lg font-semibold tracking-tight text-slate-800">
                Model Inputs
              </h2>
            </div>

            <form onSubmit={generatePlan} className="space-y-5">
              <div>
                <label htmlFor="day-desc" className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                  Describe your day layout
                </label>
                <textarea
                  id="day-desc"
                  className="w-full min-h-[110px] bg-slate-50 border border-slate-200 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 resize-none transition-colors"
                  placeholder="Describe your day schedule and targets..."
                  value={dayDescription}
                  onChange={(e) => setDayDescription(e.target.value)}
                  required
                />
                {/* UX Quick Fill Tags */}
                <div className="mt-2.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Templates:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => fillPreset("Keto day with high-protein lunch and easy dinner", 35.00)}
                      className="text-[11px] bg-slate-100/80 hover:bg-slate-200/50 border border-slate-200 text-slate-600 hover:text-slate-800 px-2.5 py-1 rounded transition-all cursor-pointer"
                    >
                      ⚡ Keto ($35)
                    </button>
                    <button
                      type="button"
                      onClick={() => fillPreset("Vegan cleansing day with fresh vegetable focus", 25.00)}
                      className="text-[11px] bg-slate-100/80 hover:bg-slate-200/50 border border-slate-200 text-slate-600 hover:text-slate-800 px-2.5 py-1 rounded transition-all cursor-pointer"
                    >
                      🌱 Vegan ($25)
                    </button>
                    <button
                      type="button"
                      onClick={() => fillPreset("Busy corporate meeting day with easy prep comfort food", 18.00)}
                      className="text-[11px] bg-slate-100/80 hover:bg-slate-200/50 border border-slate-200 text-slate-600 hover:text-slate-800 px-2.5 py-1 rounded transition-all cursor-pointer"
                    >
                      💼 Tight Budget ($18)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="max-budget" className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                  Max Budget ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <input
                    id="max-budget"
                    type="number"
                    step="0.01"
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 font-medium transition-colors"
                    placeholder="e.g. 30.00"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold tracking-wide text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  loading
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 hover:border-emerald-600 text-white font-extrabold shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    <span>Processing Analysis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            </form>

            {/* Guidelines info card */}
            <div className="mt-6 border-t border-slate-100 pt-5 text-[11px] text-slate-500 leading-relaxed space-y-2.5">
              <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>VeloCook Optimisation Model:</strong> Automatically coordinates caloric yields and raw cost thresholds. Pre-fill schedules on the left to analyze budget feasibility metrics.
                </span>
              </div>
            </div>
          </section>

          {/* Right Side: Generated Output Dashboard */}
          <section 
            aria-labelledby="results-heading" 
            aria-live="polite"
            className="lg:col-span-7 space-y-6"
          >
            <h2 id="results-heading" className="sr-only">Analysis Output</h2>
            
            {loading ? (
              /* Sleek spinner placeholder */
              <div className="min-h-[400px] flex flex-col items-center justify-center bg-white border border-slate-200/80 rounded-xl p-8 shadow-sm">
                <div className="relative mb-4 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-emerald-600 absolute animate-pulse" />
                </div>
                <h3 className="text-slate-800 font-semibold text-base mb-1">Evaluating Daily Feasibility</h3>
                <p className="text-xs text-slate-500 text-center max-w-xs leading-relaxed">
                  Querying optimization formulas and verifying supply cost structures...
                </p>
              </div>
            ) : result ? (
              /* Analysis Presenter */
              <div className="space-y-6">
                {/* Warnings / Offline Alert Banner */}
                {error && (
                  <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-lg">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Feasibility Badge */}
                <div className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 light-shadow-md ${
                  result.is_feasible 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50/60 border-rose-200 text-rose-800'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {result.is_feasible ? (
                        <span className="flex items-center gap-1 text-xs font-black bg-emerald-600 text-white px-2.5 py-0.5 rounded uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" /> FEASIBLE
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-black bg-rose-600 text-white px-2.5 py-0.5 rounded uppercase tracking-wider">
                          <XCircle className="w-3.5 h-3.5 stroke-[3]" /> EXCEEDED
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Budget Feasibility Assessment
                      </span>
                    </div>
                    <h3 className="text-slate-800 font-semibold text-sm mt-1">
                      {result.is_feasible 
                        ? "Calculated daily expenses reside within allocated boundaries." 
                        : "The target budget is insufficient for the suggested high-quality ingredients."
                      }
                    </h3>
                  </div>

                  {/* Balance Sheet Numbers */}
                  <div className="flex items-center gap-5 border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-3 sm:pt-0 sm:pl-5 shrink-0 justify-between sm:justify-start">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total Cost</div>
                      <div className="text-xl font-bold text-slate-800">${result.total_cost.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                        {result.remaining_balance >= 0 ? "Remaining" : "Deficit"}
                      </div>
                      <div className={`text-xl font-bold ${
                        result.remaining_balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {result.remaining_balance >= 0 ? '+' : ''}${result.remaining_balance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meal Plan Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Daily Plan Architecture
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(result.meals).map(([time, meal]) => (
                      <article 
                        key={time} 
                        className="transition-card bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between light-shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              {time}
                            </span>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              ${meal.cost.toFixed(2)}
                            </span>
                          </div>
                          <h5 className="text-slate-800 font-semibold text-sm tracking-tight mb-1">
                            {meal.name}
                          </h5>
                          <p className="text-xs text-slate-600 leading-relaxed font-light">
                            {meal.description}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                {/* Grocery Checklist */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 md:p-6 space-y-4 light-shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 tracking-tight">
                        Sourcing Procurement Checklist
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mark off items as purchased during grocery trip.
                      </p>
                    </div>
                    {/* Progress Indicator */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-slate-600">
                        {progressPercent}% Complete
                      </span>
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {result.grocery_list.map((item) => {
                      const isChecked = !!groceryChecked[item.id];
                      return (
                        <li key={item.id} className="focus-within:bg-slate-50 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleCheckboxToggle(item.id)}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200/60 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all text-left text-xs cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 pr-2 min-w-0">
                              <span className="text-slate-400 shrink-0 group-hover:text-emerald-600">
                                {isChecked ? (
                                  <CheckSquare className="w-4.5 h-4.5 text-emerald-600 fill-emerald-50" />
                                ) : (
                                  <Square className="w-4.5 h-4.5 text-slate-400 group-hover:border-emerald-400" />
                                )}
                              </span>
                              <span className={`font-medium truncate ${isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {item.item}
                              </span>
                            </div>
                            <span className={`font-bold shrink-0 ${isChecked ? 'text-slate-400' : 'text-emerald-600'}`}>
                              ${item.cost.toFixed(2)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Substitutions Section */}
                <div className="bg-amber-50/30 border border-amber-200/60 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-amber-500/10 border border-amber-500/20 rounded">
                      <TrendingDown className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div className="space-y-3 w-full">
                      <div>
                        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                          Strategic Ingredient Substitutions
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          Lower your sourcing costs by replacing high-premium elements with budget alternatives of equivalent value.
                        </p>
                      </div>
                      
                      <div className="space-y-2.5">
                        {result.substitutions.map((sub, i) => (
                          <div 
                            key={i} 
                            className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-3 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <div className="sm:w-1/3">
                              <span className="text-[10px] font-bold text-rose-600 uppercase block">Replace</span>
                              <span className="font-semibold text-slate-800">{sub.original}</span>
                            </div>
                            <div className="sm:w-1/3">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase block">Alternative</span>
                              <span className="font-semibold text-slate-800">{sub.substitute}</span>
                            </div>
                            <div className="sm:w-1/2 text-slate-600 leading-relaxed font-light">
                              {sub.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Welcome / Empty State Presenter */
              <div className="min-h-[480px] flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center shadow-inner">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 mb-4">
                  <HelpCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-emerald-700 font-semibold text-base mb-1.5">No Analysis Generated Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
                  Fill in your schedule parameters and daily budget limits on the left inputs panel, then click <strong>"Generate Report"</strong> to calculate financial margins.
                </p>
                
                {/* Feature grid tags */}
                <div className="grid grid-cols-2 gap-3 max-w-sm text-left border-t border-slate-100 pt-6 w-full">
                  <div className="text-[11px] text-slate-500 flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">★</span>
                    <span><strong>Dynamic Checklists:</strong> Interactive sourcing tasks.</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">★</span>
                    <span><strong>Feasibility Badging:</strong> Visual status and balance tracking.</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">★</span>
                    <span><strong>Smart Substitutes:</strong> Strategic advice on swaps.</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">★</span>
                    <span><strong>Premium Light UI:</strong> Clean high-contrast yellow & green dashboard.</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white text-[10px] text-slate-400 py-6 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>&copy; 2026 VeloCook Analytics Consulting Group. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Calculations Model</a>
              <a href="#" className="hover:text-gray-600 transition-colors">Client Services</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
