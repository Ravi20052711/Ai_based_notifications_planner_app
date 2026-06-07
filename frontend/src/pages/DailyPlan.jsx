import { useState, useEffect } from 'react';
import api from '../services/api';
import { Brain, Clock, ChevronLeft, Sparkles, LayoutGrid } from 'lucide-react';
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
        setError(err.response?.data?.detail || 'Failed to generate plan. Ensure you have pending tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 sm:p-12 relative overflow-hidden">
      <div className="aurora">
        <div className="aurora-orb w-[600px] h-[600px] bg-indigo-600/10 top-0 left-1/4" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <Link to="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-12 transition-colors font-bold group">
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> 
            Back to Dashboard
          </Link>
        </motion.div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center space-x-4 mb-12"
        >
          <div className="p-4 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-600/20">
            <LayoutGrid className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tight">AI Planner</h1>
            <p className="text-gray-500 font-medium">Smart optimization of your daily schedule</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 glass rounded-[3rem] border-white/5">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="mb-6"
            >
              <Brain className="w-16 h-16 text-indigo-500" />
            </motion.div>
            <p className="text-gray-400 font-bold animate-pulse">Analyzing tasks and optimizing flow...</p>
          </div>
        ) : error ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass border-red-500/30 rounded-3xl p-8 text-center"
          >
            <p className="text-red-400 font-medium">{error}</p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass border-indigo-500/20 rounded-[2.5rem] p-10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
              <div className="flex items-start space-x-4">
                <Sparkles className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-2">AI Summary</h2>
                  <p className="text-xl text-gray-200 leading-relaxed font-medium italic">
                    "{plan.summary}"
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="space-y-6">
              {plan.plan.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  className="flex items-start space-x-6 group"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center border-white/10 group-hover:border-indigo-500/50 transition-colors">
                      <span className="text-indigo-400 font-black text-xs">{item.time}</span>
                    </div>
                    {idx !== plan.plan.length - 1 && <div className="w-0.5 h-12 bg-white/5 mt-2" />}
                  </div>
                  
                  <div className="flex-1 glass border-white/5 rounded-3xl p-6 group-hover:bg-white/5 transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold text-white">{item.title}</h3>
                      <div className="flex items-center text-gray-500 text-xs font-bold">
                        <Clock className="w-3 h-3 mr-1" />
                        {item.duration_minutes}m
                      </div>
                    </div>
                    <div className="flex items-center">
                       <span className={`text-[10px] px-3 py-1 rounded-full uppercase font-black tracking-widest ${
                         item.priority === 'high' ? 'bg-red-400/10 text-red-400' : 'bg-blue-400/10 text-blue-400'
                       }`}>
                         {item.priority}
                       </span>
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

export default DailyPlan;
