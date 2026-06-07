import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ListChecks, 
  Target, 
  Shield, 
  LogOut, 
  Brain,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', color: 'text-indigo-400' },
    { icon: ListChecks, label: 'Daily Plan', path: '/planner', color: 'text-blue-400' },
    { icon: Target, label: 'Goals', path: '/goals', color: 'text-emerald-400' },
  ];

  if (user?.is_admin) {
    menuItems.push({ 
      icon: Shield, 
      label: 'Admin Panel', 
      path: '/admin', 
      color: 'text-red-500',
      isSpecial: true 
    });
  }

  return (
    <nav className="glass border-b border-white/5 sticky top-0 z-[100] backdrop-blur-2xl">
      <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            NotifyAI
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-10">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center space-x-2 text-sm font-bold transition-all px-4 py-2 rounded-xl ${
                  isActive 
                  ? 'bg-white/5 text-white shadow-inner' 
                  : item.isSpecial 
                    ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? item.color : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center space-x-6 border-l border-white/10 pl-6">
          <div className="text-right">
             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">Authenticated</p>
             <p className="text-xs font-bold text-gray-300">{user?.username}</p>
          </div>
          <button 
            onClick={logout}
            className="p-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 text-gray-400">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-20 left-0 right-0 glass border-b border-white/10 p-6 space-y-4"
          >
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5"
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="font-bold text-white">{item.label}</span>
              </Link>
            ))}
            <button 
              onClick={logout}
              className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-red-500/10 text-red-400 font-bold"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
