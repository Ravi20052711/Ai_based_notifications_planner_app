import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import NotificationBell from '../components/NotificationBell';
import { Plus, Sparkles, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiText, setAiText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    priority: 'medium',
    repeat_type: 'none'
  });
  const { user } = useAuth();

  const fetchTasks = async () => {
    try {
      const res = await api.get('/reminders/today');
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleComplete = async (id) => {
    try {
      await api.patch(`/reminders/${id}/complete`);
      fetchTasks();
    } catch (err) {
      console.error('Failed to complete task');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reminders/${id}`);
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task');
    }
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reminders/', {
        ...newTask,
        is_ai_generated: false
      });
      setShowModal(false);
      fetchTasks();
      setNewTask({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        priority: 'medium',
        repeat_type: 'none'
      });
    } catch (err) {
      alert('Validation Error: Ensure date and time are valid.');
    }
  };

  const handleAiExtract = async () => {
    if (!aiText) return;
    try {
      const res = await api.post('/ai/reminder', { text: aiText });
      setNewTask({
        ...newTask,
        ...res.data,
        is_ai_generated: true
      });
      setShowModal(true);
      setAiText('');
    } catch (err) {
      alert('AI Parsing Failed: Be more specific (e.g., "Remind me to do X at HH:MM").');
    }
  };

  return (
    <div className="p-10 max-w-[1600px] mx-auto">
      <header className="flex justify-between items-start mb-16">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2">Workspace</h1>
          <div className="flex items-center space-x-2 text-gray-500">
            <Terminal className="w-4 h-4" />
            <span className="text-sm font-mono uppercase">User_Session: {user?.username}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="bg-white text-black font-black px-6 py-3 rounded-xl flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Task</span>
          </motion.button>
        </div>
      </header>

      {/* Modern Command-Bar Style AI Input */}
      <div className="mb-20">
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-2 flex items-center focus-within:border-indigo-500/50 transition-all shadow-2xl">
           <div className="px-6 border-r border-white/5 text-indigo-500">
             <Sparkles className="w-5 h-5" />
           </div>
           <input 
              type="text"
              placeholder="Command AI: 'remind me to fix the bug at 2pm' ..."
              className="flex-1 bg-transparent border-none px-6 py-4 text-xl outline-none placeholder-gray-700"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiExtract()}
           />
           <button 
              onClick={handleAiExtract}
              className="bg-indigo-600/10 text-indigo-400 font-bold px-6 py-3 rounded-xl hover:bg-indigo-600/20 transition-all mr-2 border border-indigo-500/20"
           >
             Parse Command
           </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-3 ml-2 font-black uppercase tracking-[0.2em]">Neural Engine: Qwen-4B Active</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
        {/* Statistics or Status col */}
        <div className="xl:col-span-1 space-y-6">
           <div className="glass rounded-3xl p-8 border-white/5">
              <p className="text-gray-500 text-xs font-black uppercase mb-4 tracking-widest">Active Schedule</p>
              <div className="text-4xl font-black text-white">{tasks.length}</div>
              <p className="text-gray-600 text-sm mt-1 font-medium">Pending for today</p>
           </div>
           <div className="glass rounded-3xl p-8 border-white/5">
              <p className="text-gray-500 text-xs font-black uppercase mb-4 tracking-widest">System Health</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-gray-300 uppercase tracking-tighter">Ollama Live</span>
              </div>
           </div>
        </div>

        {/* Task Grid */}
        <div className="xl:col-span-3">
          {loading ? (
            <div className="text-center py-20 text-gray-500">Interrogating Database...</div>
          ) : tasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <AnimatePresence mode="popLayout">
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TaskCard task={task} onComplete={handleComplete} onDelete={handleDelete} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-20 glass rounded-[2.5rem] border-dashed border-white/5 text-center">
               <p className="text-gray-600 font-medium italic">Empty workspace. The neural engine is awaiting commands.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reusable Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass rounded-[2rem] w-full max-w-lg p-10 border-white/10 relative z-10">
              <h2 className="text-2xl font-black mb-8">Confirm Record</h2>
              <form onSubmit={handleCreateManual} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Identity</label>
                  <input type="text" required className="w-full bg-gray-950 border border-white/10 rounded-xl px-5 py-4 text-white" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Timeline</label>
                    <input type="date" className="w-full bg-gray-950 border border-white/10 rounded-xl px-5 py-4 text-white" value={newTask.date} onChange={(e) => setNewTask({ ...newTask, date: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Precision</label>
                    <input type="time" className="w-full bg-gray-950 border border-white/10 rounded-xl px-5 py-4 text-white" value={newTask.time} onChange={(e) => setNewTask({ ...newTask, time: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6">
                   <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 font-bold px-4">Discard</button>
                   <button type="submit" className="bg-white text-black font-black px-8 py-4 rounded-xl shadow-xl shadow-white/10">Authorize</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
