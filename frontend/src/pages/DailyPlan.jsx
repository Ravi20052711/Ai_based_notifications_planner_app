import { useState, useEffect } from 'react';
import api from '../services/api';
import { Brain, Clock, ChevronLeft, Sparkles, LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const DailyPlan = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await api.post('/ai/plan');
        setPlan(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to generate plan. Ensure you have pending tasks for today.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <Link to="/" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-8 font-semibold">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back to Workspace
          </Link>
        </motion.div>
        
        <header className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
              <LayoutGrid className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Daily Optimization</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">AI-powered time-blocking for your pending tasks.</p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="mb-4"
            >
              <RefreshCw className="w-12 h-12 text-indigo-500" />
            </motion.div>
            <p className="text-slate-400 font-bold">Neural engine is organizing your day...</p>
          </div>
        ) : error ? (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center">
            <p className="text-amber-700 dark:text-amber-400 font-medium">{error}</p>
            <Link to="/" className="mt-4 inline-block bg-amber-600 text-white px-6 py-2 rounded-xl font-bold">Add Tasks First</Link>
          </div>
        ) : (
          <div className="space-y-10">
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Strategist Summary</h2>
              </div>
              <p className="text-xl text-slate-700 dark:text-slate-200 leading-relaxed font-medium italic">
                "{plan.summary}"
              </p>
            </motion.div>

            <div className="relative pl-8 space-y-4">
              <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800"></div>
              
              {plan.plan.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  <div className="absolute -left-[31px] top-6 w-3 h-3 bg-indigo-600 rounded-full border-4 border-slate-50 dark:border-slate-950 ring-4 ring-indigo-500/10"></div>
                  
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-lg bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">
                          {item.time}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{item.title}</h3>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <Clock className="w-4 h-4 mr-1.5 opacity-50" />
                          {item.duration_minutes} min
                        </div>
                        <span className={`text-[10px] px-3 py-1 rounded-full uppercase font-black tracking-widest ${
                          item.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { RefreshCw } from 'lucide-react';

export default DailyPlan;
