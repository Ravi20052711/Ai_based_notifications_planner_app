import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import api from '../services/api';

const NotificationBell = () => {
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    // Poll for due notifications every 30 seconds
    const interval = setInterval(async () => {
      if (permission === 'granted') {
        try {
          const res = await api.get('/reminders/due-now');
          const dueTasks = res.data;
          
          dueTasks.forEach(task => {
            new Notification(`NotifyAI: ${task.title}`, {
              body: task.description || 'Time to get this done!',
              icon: '/favicon.svg'
            });
          });
        } catch (err) {
          console.error('Failed to poll notifications');
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [permission]);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      new Notification('NotifyAI', { body: 'Notifications enabled! You will receive alerts when tasks are due.' });
      await api.patch('/api/users/me/fcm-token', { fcm_token: 'browser_enabled' });
    }
  };

  return (
    <button
      onClick={requestPermission}
      className={`p-2 rounded-xl transition-all flex items-center space-x-2 ${
        permission === 'granted' 
        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
        : 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20'
      }`}
      title={permission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
    >
      {permission === 'granted' ? (
        <>
          <BellRing className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Live</span>
        </>
      ) : (
        <>
          <Bell className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Enable Alerts</span>
        </>
      )}
    </button>
  );
};

export default NotificationBell;
