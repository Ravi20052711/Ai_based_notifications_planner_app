import { useState } from 'react';
import api from '../services/api';
import { Brain, ChevronLeft, Target, Plus, Clock, Sparkles } from 'lucide-react';
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
        alert('AI returned an unexpected format. Please try again.');
      }
    } catch (err) {
      console.error('Goal breakdown failed', err);
      alert('AI Service is slow or busy. Please check your Ollama status.');
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 sm:p-12 relative overflow-hidden">
      <div className="aurora">
        <div className="aurora-orb w-[600px] h-[600px] bg-emerald-600/10 top-1/4 right-0" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <Link to="/" className="inline-flex items-center text-emerald-400 hover:text-emerald-300 mb-12 transition-colors font-bold group">
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> 
            Back to Dashboard
          </Link>
        </motion.div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center space-x-4 mb-12"
        >
          <div className="p-4 bg-emerald-600 rounded-3xl shadow-2xl shadow-emerald-600/20">
            <Target className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tight">Goal Roadmap</h1>
            <p className="text-gray-500 font-medium">Deconstruct your ambitions into daily steps</p>
          </div>
        </motion.div>

        {!breakdown ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass border-emerald-500/20 rounded-[3rem] p-12 shadow-3xl"
          >
            <form onSubmit={handleGenerate} className="space-y-8">
              <div>
                <label className="block text-xl font-bold text-gray-300 mb-4">What's the big ambition?</label>
                <textarea
                  required
                  placeholder="e.g., Master the fundamentals of Cloud Engineering"
                  className="w-full bg-gray-950/50 border border-white/10 rounded-[2rem] px-8 py-6 text-xl focus:ring-4 focus:ring-emerald-500/20 outline-none h-40 transition-all placeholder-gray-700"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
              <div className="w-64">
                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="w-full bg-gray-950/50 border border-white/10 rounded-2xl px-6 py-4 text-xl font-bold text-emerald-400"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-[2rem] font-black text-2xl transition-all shadow-2xl shadow-emerald-600/30 flex justify-center items-center"
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>Generate Roadmap <Brain className="ml-3 w-8 h-8" /></>
                )}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <div className="space-y-10">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 border border-white/10 p-8 rounded-[2.5rem]"
            >
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-1">Target Goal</h2>
                <h3 className="text-3xl font-black text-white">{breakdown.goal}</h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveAll}
                disabled={saving}
                className="mt-6 md:mt-0 bg-indigo-600 hover:bg-indigo-500 px-10 py-4 rounded-2xl font-black text-lg flex items-center shadow-xl shadow-indigo-600/20 transition-all"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3"></div>
                ) : (
                  <Plus className="w-6 h-6 mr-2" />
                )}
                Commit to Schedule
              </motion.button>
            </motion.div>
            
            <div className="grid grid-cols-1 gap-8">
              {breakdown.tasks.map((task, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass border-white/5 rounded-[2.5rem] p-8 flex flex-col sm:flex-row gap-8 hover:border-emerald-500/30 transition-all relative group"
                >
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-950 rounded-[1.5rem] border border-white/10 flex flex-col items-center justify-center group-hover:bg-emerald-900/20 transition-colors shadow-inner">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Phase</span>
                    <span className="text-4xl font-black text-emerald-500">{task.day}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-3 group-hover:text-emerald-400 transition-colors">{task.title}</h3>
                    <p className="text-gray-400 text-lg leading-relaxed mb-6">{task.description}</p>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center text-sm font-bold text-gray-500">
                        <Clock className="w-4 h-4 mr-2 text-emerald-500/50" />
                        {task.estimated_minutes}m investment
                      </div>
                      <div className="flex items-center text-sm font-bold text-gray-500">
                        <Sparkles className="w-4 h-4 mr-2 text-yellow-500/50" />
                        AI Verified
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

export default GoalBreakdown;
