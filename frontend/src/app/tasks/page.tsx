'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Code2, Clock, DollarSign, Zap, Filter, Search } from 'lucide-react';
import { HandDrawnFilters, Highlight, DifficultyBadge, SketchButton } from '@/components/HandDrawn';
import { useAuth } from '@/lib/auth-context';
import { taskApi } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  description: string;
  stack: string[];
  difficulty: string;
  time_estimate_min: number;
  min_karma: number;
  reward_amount: number;
  reward_karma: number;
  client_name: string;
  client_company: string;
  status: string;
  created_at: string;
}

export default function TasksPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    } else if (user) {
      loadTasks();
    }
  }, [user, isLoading, router]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskApi.getTasks({ status: 'open' });
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    // Filter by difficulty
    if (filter !== 'all' && task.difficulty.toLowerCase() !== filter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        (task.stack || []).some(s => s.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const canApply = (task: Task) => {
    return user && user.karma_score >= task.min_karma;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-2xl font-black">Loading tasks...</div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#fdfbf7] font-sans text-[#2d2d2d]">
      <HandDrawnFilters />

      {/* Header */}
      <nav className="relative z-10 flex w-full items-center justify-between px-8 py-6 border-b-4 border-black">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            className="p-2 border-2 border-black bg-white hover:bg-amber-100 transition-colors"
          >
            <ArrowLeft size={24} />
          </motion.button>
          <h1 className="text-3xl font-black">
            Available <Highlight color="#ffeb3b">Tasks</Highlight>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-gray-500">Your Karma</div>
            <div className="text-2xl font-black text-amber-600">⚡{user?.karma_score || 0}</div>
          </div>
        </div>
      </nav>

      {/* Filters */}
      <div className="relative z-10 px-8 py-6 border-b-2 border-black/10">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-black rounded-xl py-3 pl-12 pr-4 font-medium focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex gap-2">
            {['all', 'easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setFilter(diff)}
                className={`px-4 py-2 border-2 border-black font-bold uppercase text-sm transition-all ${
                  filter === diff
                    ? 'bg-black text-white'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="relative z-10 px-8 py-8">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-black mb-2">No tasks found</h2>
            <p className="text-gray-600">Check back later for new opportunities!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="bg-white border-4 border-black p-6 cursor-pointer relative"
                style={{ filter: "url(#rough-paper)" }}
                onClick={() => router.push(`/task/${task.id}`)}
              >
                {/* Karma Badge */}
                <div className="absolute top-4 right-4">
                  <div className={`px-3 py-1 border-2 border-black font-black text-sm ${
                    canApply(task) ? 'bg-green-400' : 'bg-red-400'
                  }`}>
                    ⚡{task.min_karma}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-black mb-2 pr-16">{task.title}</h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {task.description}
                </p>

                {/* Stack */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(task.stack || []).slice(0, 3).map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-cyan-100 border-2 border-black text-xs font-bold"
                    >
                      {tech}
                    </span>
                  ))}
                  {(task.stack || []).length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 border-2 border-black text-xs font-bold">
                      +{task.stack.length - 3}
                    </span>
                  )}
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-1 font-bold">
                    <Clock size={16} />
                    {task.time_estimate_min}m
                  </div>
                  <DifficultyBadge difficulty={task.difficulty as any} />
                </div>

                {/* Reward */}
                <div className="border-t-2 border-black/10 pt-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 font-bold">Reward</div>
                    <div className="text-lg font-black text-green-600">
                      ₹{task.reward_amount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold">Karma</div>
                    <div className="text-lg font-black text-amber-600">
                      +{task.reward_karma}
                    </div>
                  </div>
                </div>

                {/* Client */}
                <div className="mt-4 text-xs text-gray-500">
                  Posted by <span className="font-bold">{task.client_name}</span>
                  {task.client_company && ` @ ${task.client_company}`}
                </div>

                {/* Eligibility */}
                {!canApply(task) && (
                  <div className="mt-4 p-2 bg-red-100 border-2 border-red-600 text-red-800 text-xs font-bold text-center">
                    ⚠️ Need {task.min_karma - (user?.karma_score || 0)} more karma
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
