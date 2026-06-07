import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ListChecks, 
  Target, 
  Shield, 
  LogOut, 
  Brain,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', color: 'text-indigo-400' },
    { icon: ListChecks, label: 'Daily Plan', path: '/planner', color: 'text-blue-400' },
    { icon: Target, label: 'Goals', path: '/goals', color: 'text-emerald-400' },
  ];

  if (user?.is_admin) {
    menuItems.push({ icon: Shield, label: 'Admin', path: '/admin', color: 'text-red-400' });
  }

  return (
    <div className="w-64 min-h-screen glass border-r border-white/5 flex flex-col sticky top-0">
      <div className="p-8 mb-10">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            NotifyAI
          </span>
        </div>
        <p className="text-[10px] uppercase font-black tracking-widest text-gray-600 ml-1">Enterprise v2.0</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 5 }}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                  isActive 
                  ? 'bg-white/10 text-white shadow-xl shadow-black/20 border border-white/10' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="glass bg-white/5 rounded-3xl p-4 border border-white/5 mb-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{user?.username}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-bold text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
