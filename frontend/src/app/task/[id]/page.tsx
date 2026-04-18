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
  AlertTriangle,
  GitBranch,
  Loader2,
  UserPlus,
  RotateCcw,
  XCircle
} from 'lucide-react';

// Github icon doesn't exist in this lucide version — use a custom SVG
const GithubIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);
import { HandDrawnFilters, Highlight, DifficultyBadge, SketchButton, SketchTextarea } from '@/components/HandDrawn';
import { useAuth } from '@/lib/auth-context';
import { taskApi, referralApi } from '@/lib/api';

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
  client_id: string;
  client_name: string;
  client_company: string;
  status: string;
  claimed_by?: string;
  assignee_id?: string;
  submission_link?: string;
  micro_tasks?: any[];
  created_at: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationText, setApplicationText] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [submissionText, setSubmissionText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [referralUserId, setReferralUserId] = useState('');
  const [referringTask, setReferringTask] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

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
      await loadTask();
      setApplicationText('');
      setSuccess('You have claimed this task! Start working on it.');
    } catch (error: any) {
      setError(error.message || 'Failed to apply for task');
    } finally {
      setApplying(false);
    }
  };

  const handleSubmit = async () => {
    if (!githubLink.trim()) {
      setError('Please provide your GitHub repo link');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await taskApi.submitTask(task!.id, {
        github_link: githubLink.trim(),
        submission_text: submissionText.trim(),
      });
      await loadTask();
      setSuccess('Submission received! The client will review your work and the AI will analyze it.');
      setIsRejected(false);
      // Notify client via Telegram
      referralApi.notifyTaskUpdate(task!.id, 'submitted').catch(() => {});
    } catch (error: any) {
      setError(error.message || 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefer = async () => {
    if (!referralUserId.trim() || !task || !user) return;
    try {
      setReferringTask(true);
      setError('');
      await referralApi.referUser({
        referrer_id: user.id,
        referred_user_id: referralUserId.trim(),
        task_id: task.id,
      });
      setSuccess('Referral sent! They will be notified via Telegram.');
      setReferralUserId('');
    } catch (err: any) {
      setError(err.message || 'Referral failed');
    } finally {
      setReferringTask(false);
    }
  };

  const canApply = () => {
    if (!user || !task) return false;
    return (
      user.karma_score >= (task.min_karma || 0) &&
      task.status === 'open' &&
      user.role === 'student'
    );
  };

  const isMyTask = () => {
    return user && task && task.assignee_id === user.id;
  };

  const getKarmaDeficit = () => {
    if (!user || !task) return 0;
    return Math.max(0, (task.min_karma || 0) - user.karma_score);
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
            <div className="text-2xl font-black text-amber-600">K:{user?.karma_score || 0}</div>
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
                    {(task.stack || []).map((tech, idx) => (
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

                {/* Micro Tasks */}
                {task.micro_tasks && task.micro_tasks.length > 0 && (
                  <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-600">
                    <h3 className="font-black mb-3 text-amber-800">Micro-tasks Breakdown</h3>
                    <ol className="space-y-2">
                      {task.micro_tasks.map((mt: any, idx: number) => (
                        <li key={idx} className="flex gap-3 text-sm">
                          <span className="bg-black text-white px-2 py-0.5 text-xs font-bold min-w-[24px] text-center">
                            {idx + 1}
                          </span>
                          <span className="font-medium">
                            <span className="text-amber-700 font-bold">[{mt.type}]</span> {mt.title}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

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

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-100 border-2 border-green-600 text-green-800 font-bold"
                >
                  <CheckCircle2 className="inline mr-2" size={18} />
                  {success}
                </motion.div>
              )}

              {/* Application Section — for OPEN tasks */}
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
                        Explain why you're the right person for this task.
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
                              <Loader2 className="animate-spin" size={16} />
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Send size={16} />
                              Claim Task
                            </>
                          )}
                        </SketchButton>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Submission Section — for CLAIMED tasks */}
              {isMyTask() && task.status === 'claimed' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border-4 border-black p-8"
                  style={{ filter: "url(#rough-paper)" }}
                >
                  <h2 className="text-2xl font-black mb-4">
                    <Highlight color="#bbf7d0">Submit Your Work</Highlight>
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Push your code to GitHub and share the repo link. The AI will analyze your submission
                    and the client will review it via Telegram. The project stays <strong>pending</strong> until approved.
                  </p>

                  <div className="space-y-4">
                    <div className="group relative">
                      <GithubIcon className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors z-10" size={18} />
                      <input
                        type="url"
                        placeholder="https://github.com/yourusername/repo"
                        value={githubLink}
                        onChange={(e) => setGithubLink(e.target.value)}
                        className="w-full bg-white border-2 border-black rounded-xl py-3 pl-12 pr-4 text-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400"
                      />
                    </div>

                    <SketchTextarea
                      placeholder="Describe what you built, any trade-offs, and how to run it..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      rows={4}
                    />

                    {error && (
                      <div className="p-3 bg-red-100 border-2 border-red-600 text-red-800 font-bold text-sm">
                        {error}
                      </div>
                    )}

                    <SketchButton
                      onClick={handleSubmit}
                      disabled={submitting || !githubLink.trim()}
                      className="flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Submit for Review
                        </>
                      )}
                    </SketchButton>
                  </div>
                </motion.div>
              )}

              {/* Pending Review Status */}
              {isMyTask() && task.status === 'in_review' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border-4 border-amber-600 p-8"
                >
                  <h2 className="text-2xl font-black mb-2 text-amber-800">Pending Review</h2>
                  <p className="text-amber-700 font-medium">
                    Your submission is being reviewed by the client and AI.
                    The project remains <strong>pending</strong> until the client approves it via Telegram.
                    Funds will be released after approval.
                  </p>
                  {task.submission_link && (
                    <a
                      href={task.submission_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-amber-800 font-bold hover:underline"
                    >
                      <GithubIcon size={16} /> Your Submission
                    </a>
                  )}
                </motion.div>
              )}

              {/* REJECTED — Allow resubmission */}
              {isMyTask() && (task.status === 'revision_requested' || isRejected) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-4 border-red-500 p-8"
                  style={{ filter: "url(#rough-paper)" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <XCircle size={24} className="text-red-700" />
                    <h2 className="text-2xl font-black text-red-800">Submission Rejected</h2>
                  </div>
                  <p className="text-red-700 font-medium mb-6">
                    Your submission was not accepted. Please review the feedback, make improvements, and resubmit.
                  </p>

                  <div className="space-y-4">
                    <div className="group relative">
                      <GithubIcon className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors z-10" size={18} />
                      <input
                        type="url"
                        placeholder="https://github.com/yourusername/updated-repo"
                        value={githubLink}
                        onChange={(e) => setGithubLink(e.target.value)}
                        className="w-full bg-white border-2 border-black rounded-xl py-3 pl-12 pr-4 text-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400"
                      />
                    </div>

                    <SketchTextarea
                      placeholder="Describe what you changed..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      rows={3}
                    />

                    <SketchButton
                      onClick={handleSubmit}
                      disabled={submitting || !githubLink.trim()}
                      className="flex items-center gap-2"
                    >
                      {submitting ? (
                        <><Loader2 className="animate-spin" size={16} /> Resubmitting...</>
                      ) : (
                        <><RotateCcw size={16} /> Resubmit Work</>
                      )}
                    </SketchButton>
                  </div>
                </motion.div>
              )}

              {/* Approved Status */}
              {isMyTask() && task.status === 'approved' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border-4 border-green-600 p-8"
                >
                  <h2 className="text-2xl font-black mb-2 text-green-800">
                    <CheckCircle2 className="inline mr-2" size={24} />
                    Approved!
                  </h2>
                  <p className="text-green-700 font-medium">
                    Great work! The client approved your submission.
                    You earned <strong>+{task.reward_karma || 10} karma</strong> and
                    Rs.{task.reward_amount || 0} has been released.
                  </p>
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
                      Rs.{task.reward_amount || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Karma Points</span>
                    <span className="text-2xl font-black text-amber-600">
                      +{task.reward_karma || 10}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mt-2 border-t border-gray-200 pt-2">
                    Funds held in escrow until client approves via Telegram.
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
                      user && user.karma_score >= (task.min_karma || 0) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <Zap size={16} />
                      {task.min_karma || 0}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Difficulty</span>
                    <DifficultyBadge difficulty={task.difficulty as any} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Status</span>
                    <span className={`px-2 py-1 border-2 border-black text-xs font-black uppercase ${
                      task.status === 'open' ? 'bg-green-400' : 
                      task.status === 'claimed' ? 'bg-blue-400' :
                      task.status === 'in_review' ? 'bg-amber-400' :
                      task.status === 'approved' ? 'bg-green-400' : 'bg-gray-400'
                    }`}>
                      {task.status === 'in_review' ? 'PENDING REVIEW' : task.status}
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

              {/* Referral Card */}
              {user && task.status === 'open' && user.karma_score >= 30 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-purple-50 border-4 border-purple-600 p-6"
                  style={{ filter: "url(#rough-paper)" }}
                >
                  <h3 className="font-black mb-2 text-purple-800 flex items-center gap-2">
                    <UserPlus size={18} /> Refer Someone
                  </h3>
                  <p className="text-sm text-purple-700 mb-3">
                    Earn 10% bonus karma when they complete this task. Risk: lose 5% if rejected.
                  </p>

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Paste user ID"
                      value={referralUserId}
                      onChange={(e) => setReferralUserId(e.target.value)}
                      className="w-full bg-white border-2 border-black py-2 px-3 text-sm font-medium focus:outline-none"
                    />
                    <button
                      onClick={handleRefer}
                      disabled={referringTask || !referralUserId.trim()}
                      className="w-full py-2 bg-purple-600 text-white font-black text-sm border-2 border-black hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {referringTask ? 'Referring...' : 'Send Referral'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}