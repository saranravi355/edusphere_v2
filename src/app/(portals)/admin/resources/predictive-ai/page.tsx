"use client";

import PageHeader from "@/components/ui/PageHeader";
import { BrainCircuit, PackageOpen, TrendingDown, ShoppingCart, CheckCircle2, Box } from "lucide-react";
import { useState } from "react";

export default function PredictiveResourceAI() {
  const [analyzing, setAnalyzing] = useState(false);
  const [complete, setComplete] = useState(false);

  const runPrediction = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setComplete(true);
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <PageHeader 
        title="Predictive Resource Allocation" 
        description="Machine Learning forecasts for inventory depletion and automated purchase ordering."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Forecast Engine */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <BrainCircuit size={18} className="text-emerald-500" />
              Forecast Engine
            </h3>
            
            <p className="text-sm text-slate-500 mb-6">
              Analyze historical consumption rates across 1,200+ school assets to predict upcoming shortages.
            </p>

            {!complete ? (
              <button 
                onClick={runPrediction}
                disabled={analyzing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md"
              >
                {analyzing ? <><BrainCircuit className="animate-pulse" size={18}/> Running ML Models...</> : "Run 30-Day Forecast"}
              </button>
            ) : (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-4 rounded-xl text-center">
                <p className="font-bold text-green-700 dark:text-green-400 text-sm mb-1">Forecast Complete</p>
                <p className="text-xs text-green-600 dark:text-green-500">Identified 2 critical shortages.</p>
              </div>
            )}
          </div>
        </div>

        {/* Predictions */}
        <div className="lg:col-span-2">
          {complete ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                <TrendingDown className="text-orange-500" size={18} /> Predicted Shortages (Next 30 Days)
              </h3>

              {/* Prediction 1 */}
              <div className="bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                      <Box size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Epson Projector Bulbs (Model 4X)</h4>
                      <p className="text-sm text-slate-500">Category: IT Hardware</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs font-bold font-mono">
                    Depletion Date: Nov 18
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-slate-100 dark:border-zinc-700/50">
                  <strong className="text-slate-800 dark:text-slate-200">AI Logic:</strong> Historical data shows a 40% increase in projector bulb burnouts during midterm presentation weeks (Nov 15-30). Current inventory (3 units) is insufficient to cover the predicted failure rate (8 units).
                </p>

                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                    <ShoppingCart size={16} /> Auto-Draft Purchase Order
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 shadow-sm">
              <PackageOpen size={64} className="mb-4 opacity-20" />
              <p className="font-medium text-slate-600 dark:text-slate-300">Awaiting Forecast</p>
              <p className="text-sm max-w-xs text-center mt-2">Run the ML model to analyze consumption patterns.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
