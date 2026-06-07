import { useState } from 'react';
import api from '../services/api';
import { Brain, ChevronLeft, Target, Plus, Clock, Sparkles, Flag, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const GoalBreakdown = () => {
  const [goal, setGoal] = useState('');
  const [days, setDays] = useState(7);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/ai/goals?days=${days}`, { text: goal });
      if (res.data && res.data.tasks) {
        setBreakdown(res.data);
      } else {
        alert('AI model returned an invalid structure. Please re-phrase your goal.');
      }
    } catch (err) {
      console.error('Goal breakdown failed', err);
      alert('AI Service is currently busy or misconfigured. Ensure Ollama is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const task of breakdown.tasks) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + (task.day - 1));
        
        await api.post('/reminders/', {
          title: task.title,
          description: task.description,
          date: targetDate.toISOString().split('T')[0],
          time: '09:00',
          priority: 'medium',
          repeat_type: 'none',
          category: 'goal-task'
        });
      }
      navigate('/');
    } catch (err) {
      console.error('Failed to save tasks');
      alert('Error saving the roadmap to your workspace.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <Link to="/" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-8 font-semibold">
            <ChevronLeft className="w-5 h-5 mr-1" /> Back to Workspace
          </Link>
        </motion.div>
        
        <header className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Ambition Mapping</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Turn large objectives into a concrete daily execution plan.</p>
        </header>

        {!breakdown ? (
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm"
          >
            <form onSubmit={handleGenerate} className="space-y-8">
              <div>
                <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 mb-4">Define your objective</label>
                <textarea
                  required
                  placeholder="e.g., Build a complete e-commerce website using Next.js"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-5 text-lg focus:ring-4 focus:ring-indigo-500/10 outline-none h-40 transition-all placeholder-slate-400"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-8">
                <div className="w-48">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-lg font-bold"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xl transition-all shadow-xl shadow-indigo-600/20 flex justify-center items-center"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Analyze & Build Path <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <div className="space-y-10 pb-20">
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm"
            >
              <div className="mb-6 md:mb-0">
                <h2 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Target Achievement</h2>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{breakdown.goal}</h3>
              </div>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-black text-sm flex items-center shadow-lg transition-all"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Save to My Schedule
              </button>
            </motion.div>
            
            <div className="relative pl-12 space-y-12">
              <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-indigo-100 dark:bg-slate-800"></div>
              
              {breakdown.tasks.map((task, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  <div className="absolute -left-[45px] top-2 w-11 h-11 bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-950 rounded-2xl shadow-sm flex items-center justify-center z-10">
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{task.day}</span>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:border-indigo-500/30 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">{task.description}</p>
                      </div>
                      
                      <div className="flex-shrink-0 flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 self-start">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{task.estimated_minutes} min effort</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <div className="flex justify-center pt-8">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-6 py-3 rounded-full flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Goal Completion</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalBreakdown;
