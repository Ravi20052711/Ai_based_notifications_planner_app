import { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Clock, Edit, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReminder, setEditingReminder] = useState(null);
  const [newTime, setNewTime] = useState('');
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (!user?.is_admin) {
        throw new Error('You do not have permission to view this page.');
      }
      
      const [usersRes, remindersRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/reminders')
      ]);
      setUsers(usersRes.data);
      setReminders(remindersRes.data);
    } catch (err) {
      console.error('Admin fetch failed', err);
      setError(err.response?.data?.detail || err.message || 'Access Denied');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleTimeUpdate = async (id) => {
    try {
      await api.patch(`/admin/reminders/${id}/time`, { time: newTime });
      setEditingReminder(null);
      fetchData();
    } catch (err) {
      alert('Failed to update reminder time.');
    }
  };

  if (!user?.is_admin && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-900 dark:text-slate-100">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Unauthorized Access</h1>
        <p className="text-slate-500 mt-2">Only administrators can access this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 max-w-[1600px] mx-auto text-slate-900 dark:text-slate-100">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Administrator Panel</h1>
          <p className="text-slate-500 font-medium">Global system overview and user activity monitoring.</p>
        </div>
        <button 
          onClick={fetchData}
          className="p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center text-red-600 dark:text-red-400">
          <p className="font-bold">{error}</p>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-slate-400 font-medium">Retrieving system records...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* User Registry Table */}
          <div className="lg:col-span-5 human-card p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-500" /> 
              User Directory
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase font-black text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-4">Username</th>
                    <th className="pb-4">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="group">
                      <td className="py-4">
                        <p className="font-bold text-sm">{u.username}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                          {u.last_login_at ? new Date(u.last_login_at).toLocaleTimeString() : 'Offline'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Global Reminder Feed */}
          <div className="lg:col-span-7 human-card p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-slate-500" /> 
              Active Notifications Feed
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {reminders.map(r => (
                <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">ID: {r.id}</span>
                      <p className="font-bold text-sm truncate">{r.title}</p>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Scheduled for <span className="text-indigo-600 dark:text-indigo-400 font-bold">{r.date} at {r.time}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {editingReminder === r.id ? (
                      <div className="flex items-center space-x-2">
                        <input 
                          type="time" 
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                          onChange={(e) => setNewTime(e.target.value)}
                        />
                        <button 
                          onClick={() => handleTimeUpdate(r.id)} 
                          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 rounded text-xs font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setEditingReminder(r.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {reminders.length === 0 && (
                <div className="text-center py-10 text-slate-400 italic">No system notifications found.</div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Admin;
