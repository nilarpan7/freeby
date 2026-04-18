'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  Code2, 
  CheckCircle2, 
  Send, 
  ExternalLink, 
  User, 
  Zap,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { HandDrawnFilters, Highlight, DifficultyBadge, SketchButton, SketchTextarea } from '@/components/HandDrawn';
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
  figma_url?: string;
  design_files?: string[];
  client_id: string;
  client_name: string;
  client_company: string;
  status: string;
  claimed_by?: string;
  created_at: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationText, setApplicationText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    } else if (user && params.id) {
      loadTask();
    }
  }, [user, isLoading, params.id, router]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const data = await taskApi.getTask(params.id as string);
      setTask(data);
    } catch (error) {
      console.error('Error loading task:', error);
      setError('Task not found');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!applicationText.trim()) {
      setError('Please explain why you\'re a good fit for this task');
      return;
    }

    try {
      setApplying(true);
      setError('');
      await taskApi.applyForTask(task!.id, applicationText);
      
      // Refresh task data
      await loadTask();
      setApplicationText('');
      alert('Application submitted successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to apply for task');
    } finally {
      setApplying(false);
    }
  };

  const canApply = () => {
    if (!user || !task) return false;
    return (
      user.karma_score >= task.min_karma &&
      task.status === 'open' &&
      user.role === 'student'
    );
  };

  const getKarmaDeficit = () => {
    if (!user || !task) return 0;
    return Math.max(0, task.min_karma - user.karma_score);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-2xl font-black">Loading task...</div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-black mb-2">Task Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <SketchButton onClick={() => router.push('/tasks')}>
            Back to Tasks
          </SketchButton>
        </div>
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
            onClick={() => router.push('/tasks')}
            className="p-2 border-2 border-black bg-white hover:bg-amber-100 transition-colors"
          >
            <ArrowLeft size={24} />
          </motion.button>
          <h1 className="text-2xl font-black">
            Task <Highlight color="#ffeb3b">Details</Highlight>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-gray-500">Your Karma</div>
            <div className="text-2xl font-black text-amber-600">⚡{user?.karma_score || 0}</div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-8">
        {task && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Task Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-4 border-black p-8"
                style={{ filter: "url(#rough-paper)" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-black pr-4">{task.title}</h1>
                  <DifficultyBadge difficulty={task.difficulty as any} />
                </div>

                <div className="flex flex-wrap gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-1 font-bold">
                    <Clock size={16} />
                    {task.time_estimate_min} minutes
                  </div>
                  <div className="flex items-center gap-1 font-bold">
                    <User size={16} />
                    {task.client_name}
                    {task.client_company && ` @ ${task.client_company}`}
                  </div>
                  <div className="flex items-center gap-1 font-bold text-gray-500">
                    Posted {new Date(task.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Stack */}
                <div className="mb-6">
                  <h3 className="font-black mb-2">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.stack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-cyan-100 border-2 border-black text-sm font-bold"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-black mb-2">Description</h3>
                  <div className="prose prose-sm max-w-none">
                    {task.description.split('\n').map((line, idx) => (
                      <p key={idx} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>

                {/* Design Files */}
                {task.figma_url && (
                  <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-600">
                    <h3 className="font-black mb-2 text-blue-800">Design Files</h3>
                    <a
                      href={task.figma_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 font-bold hover:underline"
                    >
                      <ExternalLink size={16} />
                      View Figma Design
                    </a>
                  </div>
                )}
              </motion.div>

              {/* Application Section */}
              {user?.role === 'student' && task.status === 'open' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border-4 border-black p-8"
                  style={{ filter: "url(#rough-paper)" }}
                >
                  <h2 className="text-2xl font-black mb-4">Apply for this Task</h2>
                  
                  {!canApply() ? (
                    <div className="p-4 bg-red-100 border-2 border-red-600 text-red-800">
                      <div className="flex items-center gap-2 font-bold mb-2">
                        <AlertTriangle size={20} />
                        Cannot Apply
                      </div>
                      {getKarmaDeficit() > 0 ? (
                        <p>
                          You need <strong>{getKarmaDeficit()} more karma</strong> to apply for this task.
                          Current: {user?.karma_score}, Required: {task.min_karma}
                        </p>
                      ) : (
                        <p>This task is no longer available for applications.</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-4">
                        Explain why you're the right person for this task. Mention your relevant experience and approach.
                      </p>
                      
                      <SketchTextarea
                        placeholder="I'm interested in this task because..."
                        value={applicationText}
                        onChange={(e) => setApplicationText(e.target.value)}
                        rows={4}
                      />
                      
                      {error && (
                        <div className="mt-4 p-3 bg-red-100 border-2 border-red-600 text-red-800 font-bold text-sm">
                          {error}
                        </div>
                      )}
                      
                      <div className="mt-6 flex gap-4">
                        <SketchButton
                          onClick={handleApply}
                          disabled={applying || !applicationText.trim()}
                          className="flex items-center gap-2"
                        >
                          {applying ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Send size={16} />
                              Submit Application
                            </>
                          )}
                        </SketchButton>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Rewards */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border-4 border-black p-6"
                style={{ filter: "url(#rough-paper)" }}
              >
                <h3 className="font-black mb-4">Rewards</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Payment</span>
                    <span className="text-2xl font-black text-green-600">
                      ₹{task.reward_amount}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Karma Points</span>
                    <span className="text-2xl font-black text-amber-600">
                      +{task.reward_karma}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Requirements */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border-4 border-black p-6"
                style={{ filter: "url(#rough-paper)" }}
              >
                <h3 className="font-black mb-4">Requirements</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Min Karma</span>
                    <div className={`flex items-center gap-1 font-black ${
                      user && user.karma_score >= task.min_karma ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <Zap size={16} />
                      {task.min_karma}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Difficulty</span>
                    <DifficultyBadge difficulty={task.difficulty as any} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Status</span>
                    <span className={`px-2 py-1 border-2 border-black text-xs font-black uppercase ${
                      task.status === 'open' ? 'bg-green-400' : 'bg-gray-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Client Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border-4 border-black p-6"
                style={{ filter: "url(#rough-paper)" }}
              >
                <h3 className="font-black mb-4">Client</h3>
                
                <div className="space-y-2">
                  <div className="font-bold">{task.client_name}</div>
                  {task.client_company && (
                    <div className="text-gray-600">{task.client_company}</div>
                  )}
                  <div className="text-sm text-gray-500">
                    Posted {new Date(task.created_at).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}