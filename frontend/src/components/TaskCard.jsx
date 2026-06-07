import { Clock, Calendar, CheckCircle, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TaskCard = ({ task, onComplete, onDelete }) => {
  const priorityConfig = {
    low: {
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      glow: 'shadow-blue-500/10'
    },
    medium: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
      glow: 'shadow-yellow-500/10'
    },
    high: {
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/20',
      glow: 'shadow-red-500/10'
    },
  };

  const config = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <motion.div 
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`glass rounded-3xl p-6 shadow-xl border border-white/5 relative overflow-hidden group ${config.glow}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${config.bg} blur-3xl -mr-16 -mt-16 group-hover:opacity-100 opacity-50 transition-opacity`} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
          {task.title}
        </h3>
        <div className={`flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.color} border ${config.border}`}>
          <AlertCircle className="w-3 h-3 mr-1" />
          {task.priority}
        </div>
      </div>
      
      {task.description && (
        <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed italic relative z-10">
          "{task.description}"
        </p>
      )}
      
      <div className="flex items-center space-x-6 text-gray-500 text-xs font-bold mb-6 relative z-10">
        <div className="flex items-center group/info hover:text-gray-300 transition-colors">
          <Calendar className="w-4 h-4 mr-2 text-indigo-500/50" />
          {task.date}
        </div>
        <div className="flex items-center group/info hover:text-gray-300 transition-colors">
          <Clock className="w-4 h-4 mr-2 text-indigo-500/50" />
          {task.time}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t border-white/5 relative z-10">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(task.id)}
          className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all"
          title="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </motion.button>
        {task.status === 'pending' && (
          <motion.button
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onComplete(task.id)}
            className="p-3 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-2xl transition-all"
            title="Mark Complete"
          >
            <CheckCircle className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;
