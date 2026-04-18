'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Zap, Clock, Code2, Send, Loader2, Sparkles, Trophy, ArrowRight, ExternalLink } from 'lucide-react';
import { HandDrawnFilters, Highlight, DifficultyBadge, SketchButton } from '@/components/HandDrawn';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// Github icon (lucide doesn't export it in this version)
const GithubIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// ─── STARTER TASKS (Mocked, 0 karma requirement) ───
const STARTER_TASKS = [
  {
    id: 'starter-1',
    title: 'Build a Todo App with React',
    description: 'Create a simple but polished Todo application using React. It should have add, delete, toggle complete, and a filter for active/completed items. Use local state management.',
    stack: ['React', 'CSS', 'JavaScript'],
    difficulty: 'easy' as const,
    time_estimate_min: 45,
    min_karma: 0,
    reward_karma: 15,
    reward_amount: 0,
    micro_tasks: [
      { type: 'SETUP', title: 'Initialize React project with Vite' },
      { type: 'FEATURE', title: 'Implement add/delete/toggle todo items' },
      { type: 'UI', title: 'Style the app with clean, modern CSS' },
      { type: 'FEATURE', title: 'Add filter: All / Active / Completed' },
    ],
    ai_criteria: [
      'Has a working React component structure',
      'State management is properly implemented',
      'UI is clean and responsive',
      'Filter functionality works correctly',
    ],
  },
  {
    id: 'starter-2',
    title: 'REST API with Express.js',
    description: 'Build a RESTful API for a simple note-taking app using Express.js. Implement CRUD endpoints (GET, POST, PUT, DELETE) with in-memory storage. Include proper error handling and status codes.',
    stack: ['Node.js', 'Express', 'REST API'],
    difficulty: 'easy' as const,
    time_estimate_min: 60,
    min_karma: 0,
    reward_karma: 20,
    reward_amount: 0,
    micro_tasks: [
      { type: 'SETUP', title: 'Initialize Node.js project with Express' },
      { type: 'API', title: 'Implement GET /notes and GET /notes/:id' },
      { type: 'API', title: 'Implement POST /notes to create notes' },
      { type: 'API', title: 'Implement PUT /notes/:id and DELETE /notes/:id' },
      { type: 'QUALITY', title: 'Add proper error handling and validation' },
    ],
    ai_criteria: [
      'All 4 CRUD endpoints are implemented',
      'Proper HTTP status codes (200, 201, 404, 400)',
      'Request body validation exists',
      'Code is well-organized with clear route handlers',
    ],
  },
  {
    id: 'starter-3',
    title: 'Portfolio Website with HTML/CSS',
    description: 'Create a personal portfolio website using only HTML and CSS. Include sections for About, Projects, Skills, and Contact. Make it responsive for mobile and desktop.',
    stack: ['HTML', 'CSS', 'Responsive Design'],
    difficulty: 'easy' as const,
    time_estimate_min: 40,
    min_karma: 0,
    reward_karma: 10,
    reward_amount: 0,
    micro_tasks: [
      { type: 'UI', title: 'Create hero section with name and tagline' },
      { type: 'UI', title: 'Build projects grid with cards' },
      { type: 'UI', title: 'Add skills section with visual indicators' },
      { type: 'UI', title: 'Make fully responsive with media queries' },
    ],
    ai_criteria: [
      'Has all 4 sections: About, Projects, Skills, Contact',
      'Uses semantic HTML (header, main, section, footer)',
      'Responsive design with media queries',
      'Clean visual design with consistent styling',
    ],
  },
  {
    id: 'starter-4',
    title: 'Python CLI Weather Tool',
    description: 'Build a command-line tool in Python that fetches weather data from a free API (like Open-Meteo) and displays it in a formatted way. Include city search and a 3-day forecast.',
    stack: ['Python', 'API Integration', 'CLI'],
    difficulty: 'medium' as const,
    time_estimate_min: 90,
    min_karma: 0,
    reward_karma: 25,
    reward_amount: 0,
    micro_tasks: [
      { type: 'SETUP', title: 'Set up Python project with requests library' },
      { type: 'API', title: 'Integrate Open-Meteo or similar free weather API' },
      { type: 'FEATURE', title: 'Implement city search with geocoding' },
      { type: 'UI', title: 'Format terminal output with colors and tables' },
      { type: 'FEATURE', title: 'Add 3-day forecast display' },
    ],
    ai_criteria: [
      'API integration is functional',
      'City search works with proper error handling',
      'Output is well-formatted and readable',
      'Code is modular with functions/classes',
    ],
  },
  {
    id: 'starter-5',
    title: 'Database Schema Design',
    description: 'Design and implement a PostgreSQL schema for a simple e-commerce store. Create tables for products, users, orders, and order_items. Write seed data and at least 5 useful queries.',
    stack: ['PostgreSQL', 'SQL', 'Database Design'],
    difficulty: 'medium' as const,
    time_estimate_min: 60,
    min_karma: 0,
    reward_karma: 25,
    reward_amount: 0,
    micro_tasks: [
      { type: 'SCHEMA', title: 'Design ERD with proper relationships' },
      { type: 'SQL', title: 'Create tables with constraints and indexes' },
      { type: 'DATA', title: 'Write seed data scripts' },
      { type: 'QUERY', title: 'Write 5+ analytical queries (joins, aggregations)' },
    ],
    ai_criteria: [
      'Tables have proper primary and foreign keys',
      'Constraints are correctly defined',
      'Seed data is realistic',
      'Queries demonstrate JOINs, GROUP BY, and aggregation',
    ],
  },
];

// Simulated AI analysis messages
const AI_ANALYSIS_STEPS = [
  'Cloning repository...',
  'Scanning project structure...',
  'Analyzing code quality...',
  'Checking implementation completeness...',
  'Evaluating coding patterns...',
  'Verifying requirements...',
  'Calculating karma score...',
];

type StarterTask = typeof STARTER_TASKS[0];
type TaskState = 'open' | 'claimed' | 'submitting' | 'analyzing' | 'completed';

export default function StarterTasksPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});
  const [githubLinks, setGithubLinks] = useState<Record<string, string>>({});
  const [analysisStep, setAnalysisStep] = useState<Record<string, number>>({});
  const [analysisResults, setAnalysisResults] = useState<Record<string, { passed: boolean[]; karma: number }>>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [totalKarmaEarned, setTotalKarmaEarned] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth?role=student');
    }
  }, [user, isLoading, router]);

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kramic_starter_states');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTaskStates(parsed.states || {});
      setAnalysisResults(parsed.results || {});
      setTotalKarmaEarned(parsed.totalKarma || 0);
    }
  }, []);

  // Save state to localStorage
  const saveState = (states: Record<string, TaskState>, results: Record<string, any>, totalKarma: number) => {
    localStorage.setItem('kramic_starter_states', JSON.stringify({
      states,
      results,
      totalKarma,
    }));
  };

  const handleClaim = (taskId: string) => {
    const newStates = { ...taskStates, [taskId]: 'claimed' as TaskState };
    setTaskStates(newStates);
    setExpandedTask(taskId);
    saveState(newStates, analysisResults, totalKarmaEarned);
  };

  const handleSubmit = async (taskId: string) => {
    const link = githubLinks[taskId];
    if (!link?.trim()) return;

    // Start analysis
    setTaskStates(prev => ({ ...prev, [taskId]: 'analyzing' }));

    // Simulate AI analysis step by step
    for (let i = 0; i < AI_ANALYSIS_STEPS.length; i++) {
      setAnalysisStep(prev => ({ ...prev, [taskId]: i }));
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    }

    // Generate results
    const task = STARTER_TASKS.find(t => t.id === taskId)!;
    const passed = task.ai_criteria.map(() => Math.random() > 0.15); // ~85% pass rate per criterion
    const passCount = passed.filter(Boolean).length;
    const karmaEarned = Math.round(task.reward_karma * (passCount / passed.length));

    const newResults = {
      ...analysisResults,
      [taskId]: { passed, karma: karmaEarned },
    };
    const newTotalKarma = totalKarmaEarned + karmaEarned;
    const newStates = { ...taskStates, [taskId]: 'completed' as TaskState };

    setAnalysisResults(newResults);
    setTotalKarmaEarned(newTotalKarma);
    setTaskStates(newStates);
    saveState(newStates, newResults, newTotalKarma);

    // Update karma in Supabase if user exists
    if (user?.id) {
      try {
        const currentKarma = user.karma_score || 0;
        await supabase.from('profiles').update({
          karma_score: currentKarma + karmaEarned,
        }).eq('id', user.id);
      } catch (e) {
        console.error('Failed to update karma in Supabase:', e);
      }
    }
  };

  const getTaskState = (taskId: string): TaskState => taskStates[taskId] || 'open';

  if (isLoading) return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center font-black text-2xl">Loading...</div>
  );
  if (!user) return null;

  const completedCount = Object.values(taskStates).filter(s => s === 'completed').length;

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
          <div>
            <h1 className="text-3xl font-black">
              Starter <Highlight color="#bbf7d0">Quests</Highlight>
            </h1>
            <p className="text-sm text-gray-500 font-medium">Build karma to unlock real tasks</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-sm font-bold text-gray-500">Completed</div>
            <div className="text-2xl font-black">{completedCount}/{STARTER_TASKS.length}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-gray-500">Karma Earned</div>
            <div className="text-2xl font-black text-amber-600">+{totalKarmaEarned}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-gray-500">Your Karma</div>
            <div className="text-2xl font-black text-green-600">{(user.karma_score || 0) + totalKarmaEarned}</div>
          </div>
        </div>
      </nav>

      {/* Intro Banner */}
      <div className="relative z-10 px-8 py-6 border-b-2 border-black/10 bg-gradient-to-r from-amber-50 to-cyan-50">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-5xl"
          >
            🚀
          </motion.div>
          <div>
            <h2 className="text-xl font-black mb-1">New here? Start building your karma!</h2>
            <p className="text-gray-600 font-medium">
              Complete these beginner-friendly tasks to earn karma points. Submit your GitHub repo link 
              and our AI will analyze your code. Once you have enough karma, you can take on paid client tasks!
            </p>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="relative z-10 max-w-5xl mx-auto px-8 py-8 space-y-6">
        {STARTER_TASKS.map((task, idx) => {
          const state = getTaskState(task.id);
          const result = analysisResults[task.id];
          const isExpanded = expandedTask === task.id;

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-white border-4 border-black relative overflow-hidden transition-all ${
                state === 'completed' ? 'border-green-600 bg-green-50' : ''
              }`}
              style={{ filter: "url(#rough-paper)" }}
            >
              {/* Completed Stamp */}
              {state === 'completed' && (
                <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-1 font-black text-sm uppercase rotate-3 shadow-lg">
                  Completed
                </div>
              )}

              {/* Task Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center border-3 border-black font-black text-lg ${
                    state === 'completed' ? 'bg-green-400' : 
                    state === 'claimed' || state === 'analyzing' ? 'bg-amber-400' : 'bg-gray-100'
                  }`}>
                    {state === 'completed' ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black mb-1">{task.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{task.description.slice(0, 120)}...</p>
                    
                    <div className="flex flex-wrap gap-3 items-center">
                      {task.stack.map((tech, i) => (
                        <span key={i} className="px-2 py-0.5 bg-cyan-100 border-2 border-black text-xs font-bold">{tech}</span>
                      ))}
                      <span className="flex items-center gap-1 text-sm font-bold text-gray-500">
                        <Clock size={14} /> {task.time_estimate_min}m
                      </span>
                      <DifficultyBadge difficulty={task.difficulty} />
                      <span className="flex items-center gap-1 text-sm font-black text-amber-600">
                        <Zap size={14} /> +{task.reward_karma} karma
                      </span>
                    </div>
                  </div>
                  <ArrowRight className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} size={20} />
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t-2 border-black/10 pt-6">
                      {/* Description */}
                      <p className="text-gray-700 mb-6">{task.description}</p>

                      {/* Micro Tasks */}
                      <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-600">
                        <h4 className="font-black mb-3 text-amber-800">Checklist</h4>
                        <ul className="space-y-2">
                          {task.micro_tasks.map((mt, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm">
                              <span className="bg-black text-white px-2 py-0.5 text-xs font-bold">{mt.type}</span>
                              <span className="font-medium">{mt.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* State: Open */}
                      {state === 'open' && (
                        <SketchButton onClick={() => handleClaim(task.id)} className="flex items-center gap-2">
                          <Sparkles size={16} /> Start This Quest
                        </SketchButton>
                      )}

                      {/* State: Claimed — Show submission form */}
                      {state === 'claimed' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 border-2 border-blue-600 mb-4">
                            <p className="text-blue-800 font-medium text-sm">
                              Push your solution to a GitHub repository, then paste the link below. 
                              Our AI will analyze your code against the requirements.
                            </p>
                          </div>

                          <div className="group relative">
                            <GithubIcon className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors z-10" size={18} />
                            <input
                              type="url"
                              placeholder="https://github.com/yourusername/repo"
                              value={githubLinks[task.id] || ''}
                              onChange={(e) => setGithubLinks(prev => ({ ...prev, [task.id]: e.target.value }))}
                              className="w-full bg-white border-2 border-black rounded-xl py-3 pl-12 pr-4 text-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400"
                            />
                          </div>

                          <SketchButton
                            onClick={() => handleSubmit(task.id)}
                            disabled={!githubLinks[task.id]?.trim()}
                            className="flex items-center gap-2"
                          >
                            <Send size={16} /> Submit for AI Analysis
                          </SketchButton>
                        </div>
                      )}

                      {/* State: Analyzing — Show progress */}
                      {state === 'analyzing' && (
                        <div className="space-y-4 p-6 bg-gray-900 text-green-400 font-mono text-sm rounded-lg">
                          <div className="flex items-center gap-2 text-white font-bold">
                            <Loader2 className="animate-spin" size={16} />
                            AI Analysis in Progress...
                          </div>
                          <div className="space-y-1">
                            {AI_ANALYSIS_STEPS.map((step, i) => {
                              const currentStep = analysisStep[task.id] || 0;
                              if (i > currentStep) return null;
                              return (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center gap-2"
                                >
                                  {i < currentStep ? (
                                    <CheckCircle2 size={14} className="text-green-400" />
                                  ) : (
                                    <Loader2 size={14} className="animate-spin text-amber-400" />
                                  )}
                                  <span className={i === currentStep ? 'text-amber-400' : 'text-green-400'}>
                                    {step}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* State: Completed — Show results */}
                      {state === 'completed' && result && (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-100 border-2 border-green-600">
                            <div className="flex items-center gap-2 mb-3">
                              <Trophy size={20} className="text-green-800" />
                              <h4 className="font-black text-green-800">AI Analysis Complete</h4>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              {task.ai_criteria.map((criteria, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  {result.passed[i] ? (
                                    <CheckCircle2 size={16} className="text-green-600" />
                                  ) : (
                                    <span className="text-red-600 font-bold text-base">✗</span>
                                  )}
                                  <span className={result.passed[i] ? 'text-green-800' : 'text-red-700 line-through'}>
                                    {criteria}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-3 pt-3 border-t border-green-300">
                              <span className="text-green-800 font-bold">Karma Earned:</span>
                              <span className="bg-amber-400 text-black px-3 py-1 font-black border-2 border-black">
                                +{result.karma} karma
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* After completing tasks — CTA */}
        {completedCount >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-8 bg-gradient-to-r from-amber-100 to-cyan-100 border-4 border-black text-center"
          >
            <h2 className="text-2xl font-black mb-2">
              You've earned <Highlight color="#ffeb3b">{totalKarmaEarned} karma</Highlight>!
            </h2>
            <p className="text-gray-700 font-medium mb-6">
              You now have enough karma to start taking on paid client tasks.
            </p>
            <SketchButton onClick={() => router.push('/tasks')} className="inline-flex items-center gap-2">
              <ArrowRight size={16} /> Browse Paid Tasks
            </SketchButton>
          </motion.div>
        )}
      </div>
    </main>
  );
}
