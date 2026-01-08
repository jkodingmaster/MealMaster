
import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCw, Play, Plus, Trash2, Settings2, Sparkles, Utensils, RefreshCcw } from 'lucide-react';

interface WheelOption {
  id: string;
  label: string;
  weight: number;
  color: string;
}

interface DecisionWheelProps {
  isOpen: boolean;
  onClose: () => void;
  initialOptions?: { label: string }[];
}

const COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
];

const DecisionWheel: React.FC<DecisionWheelProps> = ({ isOpen, onClose, initialOptions }) => {
  const [options, setOptions] = useState<WheelOption[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<WheelOption | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinRef = useRef<number>(0);

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (initialOptions && initialOptions.length > 0) {
      const formatted = initialOptions.slice(0, 8).map((opt, i) => ({
        id: crypto.randomUUID(),
        label: opt.label,
        weight: 1,
        color: COLORS[i % COLORS.length]
      }));
      setOptions(formatted);
    } else if (options.length === 0) {
      setOptions([
        { id: '1', label: 'Pizza', weight: 1, color: COLORS[0] },
        { id: '2', label: 'Salad', weight: 1, color: COLORS[1] },
        { id: '3', label: 'Tacos', weight: 1, color: COLORS[2] },
      ]);
    }
  }, [initialOptions, isOpen]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let currentAngle = rotation;

    options.forEach((opt) => {
      const sliceAngle = (opt.weight / totalWeight) * 2 * Math.PI;
      
      // Draw Slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = opt.color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Inter';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.fillText(opt.label.substring(0, 15), radius - 20, 5);
      ctx.restore();

      currentAngle += sliceAngle;
    });

    // Outer Rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // Center Cap
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel();
  }, [options, rotation]);

  const spin = () => {
    if (isSpinning || options.length < 2) return;
    setIsSpinning(true);
    setWinner(null);

    const spinDuration = 3000 + Math.random() * 2000;
    const startTime = performance.now();
    const startRotation = rotation;
    const extraSpins = 5 + Math.random() * 5;
    const totalRotation = extraSpins * 2 * Math.PI;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRotation + easeProgress * totalRotation;
      
      setRotation(currentRot);

      if (progress < 1) {
        spinRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        determineWinner(currentRot);
      }
    };

    spinRef.current = requestAnimationFrame(animate);
  };

  const determineWinner = (finalRotation: number) => {
    const normalizedRotation = ((finalRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    
    let pointerAngle = (1.5 * Math.PI - normalizedRotation);
    while (pointerAngle < 0) pointerAngle += 2 * Math.PI;
    pointerAngle = pointerAngle % (2 * Math.PI);

    let cumulativeAngle = 0;
    for (const opt of options) {
      const sliceAngle = (opt.weight / totalWeight) * 2 * Math.PI;
      if (pointerAngle >= cumulativeAngle && pointerAngle < cumulativeAngle + sliceAngle) {
        setWinner(opt);
        break;
      }
      cumulativeAngle += sliceAngle;
    }
  };

  const updateWeight = (id: string, delta: number) => {
    setOptions(prev => prev.map(opt => {
      if (opt.id === id) {
        const newWeight = Math.max(0.1, Math.min(10, opt.weight + delta));
        return { ...opt, weight: newWeight };
      }
      return opt;
    }));
  };

  const addOption = () => {
    if (options.length >= 8) return;
    const newOpt: WheelOption = {
      id: crypto.randomUUID(),
      label: 'New Choice',
      weight: 1,
      color: COLORS[options.length % COLORS.length]
    };
    setOptions([...options, newOpt]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(o => o.id !== id));
  };

  const resetWheel = () => {
    setOptions([
      { id: '1', label: 'Pizza', weight: 1, color: COLORS[0] },
      { id: '2', label: 'Salad', weight: 1, color: COLORS[1] },
      { id: '3', label: 'Tacos', weight: 1, color: COLORS[2] },
    ]);
    setWinner(null);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[90vh] animate-scaleIn relative"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Close Button - Universal and Functional */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-20 p-3 bg-white/90 backdrop-blur-md rounded-full text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:scale-110 active:scale-95 flex items-center justify-center border border-slate-100"
          aria-label="Close Wheel"
        >
          <X size={24} />
        </button>

        {/* Left: Configuration */}
        <div className="flex-1 p-8 overflow-y-auto border-r border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Settings2 className="text-blue-600" /> Probability
            </h2>
          </div>
          
          <div className="space-y-3 mb-6 flex-1">
            {options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                <input 
                  className="flex-1 bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none"
                  value={opt.label}
                  onChange={(e) => setOptions(prev => prev.map(o => o.id === opt.id ? {...o, label: e.target.value} : o))}
                />
                
                <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2 shadow-sm">
                  <button onClick={() => updateWeight(opt.id, -0.2)} className="p-1.5 text-slate-400 hover:text-blue-600">
                    <span className="text-xl leading-none font-bold">-</span>
                  </button>
                  <span className="w-12 text-center text-[10px] font-black text-slate-600">
                    {Math.round((opt.weight / options.reduce((s,o) => s+o.weight, 0)) * 100)}%
                  </span>
                  <button onClick={() => updateWeight(opt.id, 0.2)} className="p-1.5 text-slate-400 hover:text-blue-600">
                    <span className="text-xl leading-none font-bold">+</span>
                  </button>
                </div>

                <button 
                  onClick={() => removeOption(opt.id)}
                  className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {options.length < 8 && (
              <button 
                onClick={addOption}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add Choice
              </button>
            )}
            
            <button 
              onClick={resetWheel}
              className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              title="Reset to defaults"
            >
              <RefreshCcw size={18} /> Reset Wheel
            </button>
          </div>
        </div>

        {/* Right: The Wheel */}
        <div className="flex-[1.2] bg-slate-50 p-8 flex flex-col items-center justify-center relative min-h-[450px]">
          <div className="relative mb-12">
            {/* Top Indicator */}
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-10">
              <div className="w-8 h-8 bg-slate-900 rounded-b-full border-4 border-white shadow-lg flex items-center justify-center">
                 <div className="w-2 h-4 bg-red-500 rounded-full" />
              </div>
            </div>

            <canvas 
              ref={canvasRef} 
              width={400} 
              height={400} 
              className="max-w-full h-auto drop-shadow-2xl"
            />
            
            <button 
              onClick={spin}
              disabled={isSpinning}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-8 border-white shadow-2xl transition-all flex flex-col items-center justify-center ${isSpinning ? 'bg-slate-200' : 'bg-slate-900 text-white hover:scale-110 active:scale-95'}`}
            >
              {isSpinning ? <RotateCw className="animate-spin" /> : <><span className="text-xs font-black uppercase tracking-widest mb-1">Spin</span><Play fill="currentColor" size={20}/></>}
            </button>
          </div>

          {winner ? (
            <div className="text-center animate-bounceIn">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-3">
                <Sparkles size={14} /> The winner is...
              </div>
              <h3 className="text-3xl font-black text-slate-900 drop-shadow-sm px-4">{winner.label}</h3>
              <p className="text-slate-500 mt-2 font-medium">Bon Appétit!</p>
            </div>
          ) : (
             <div className="text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Can't decide? Let fate choose.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DecisionWheel;
