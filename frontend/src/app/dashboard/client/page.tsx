'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, XCircle, RotateCcw, Clock, Code2, Zap, Star, LogOut, Users, ArrowRight, MessageSquare, ChevronDown } from 'lucide-react';
import { HandDrawnFilters, Highlight, SketchButton, SketchInput, SketchTextarea, TagInput, SketchSelect, DifficultyBadge, StatusPill, KarmaBadge } from '@/components/HandDrawn';
import { useAuth } from '@/lib/auth-context';
import { getTasksByClient, getPendingReviews, MOCK_TASKS } from '@/lib/mock-data';
import type { Task, Difficulty } from '@/lib/types';

export default function ClientDashboard() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'review' | 'my-tasks' | 'post'>('review');
    
    // Post task form state
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskStack, setTaskStack] = useState<string[]>([]);
    const [taskDifficulty, setTaskDifficulty] = useState<Difficulty>('medium');
    const [taskTime, setTaskTime] = useState('120');
    const [showPostSuccess, setShowPostSuccess] = useState(false);

    // Review state
    const [feedbackText, setFeedbackText] = useState('');
    const [expandedReview, setExpandedReview] = useState<string | null>(null);

    useEffect(() => {
        if (!user || user.role !== 'client') {
            router.push('/auth?role=client');
        } else if (!user.profile_completed) {
            router.push('/auth/setup');
        }
    }, [user, router]);

    if (!user) return null;

    const myTasks = getTasksByClient(user.id);
    const pendingReviews = getPendingReviews(user.id);

    const handlePostTask = () => {
        if (!taskTitle.trim() || !taskDesc.trim()) return;
        setShowPostSuccess(true);
        setTaskTitle('');
        setTaskDesc('');
        setTaskStack([]);
        setTaskTime('120');
        setTimeout(() => setShowPostSuccess(false), 3000);
    };

    const handleReview = (taskId: string, action: 'approve' | 'flag' | 'revision') => {
        // In real app, this would call the API
        alert(`Task ${taskId} ${action}d! ${feedbackText ? `Feedback: ${feedbackText}` : ''}`);
        setFeedbackText('');
        setExpandedReview(null);
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const tabs = [
        { id: 'review' as const, label: 'Review Queue', icon: <MessageSquare size={16} />, count: pendingReviews.length },
        { id: 'my-tasks' as const, label: 'My Tasks', icon: <Code2 size={16} />, count: myTasks.length },
        { id: 'post' as const, label: 'Post Task', icon: <Plus size={16} /> },
    ];

    return (
        <main className="relative min-h-screen w-full bg-[#fdfbf7] text-[#2d2d2d] selection:bg-[#ffeb3b]">
            <HandDrawnFilters />

            <div
                className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* ── NAVBAR ── */}
            <nav className="sticky top-0 z-50 flex w-full items-center justify-between px-6 md:px-8 py-4 backdrop-blur-md bg-[#fdfbf7]/80 border-b border-black/5">
                <div className="text-2xl font-black tracking-tight cursor-pointer" onClick={() => router.push('/')}>
                    Kramic<span className="text-amber-500">.sh</span>
                    <span className="ml-2 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 border border-amber-300 rounded-full uppercase">CLIENT</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5" style={{ filter: "url(#rough-paper)" }}>
                        <Star size={14} className="text-amber-500" />
                        <span className="font-bold text-sm">Mentor Score: {user.mentor_score || 0}</span>
                    </div>
                    <div
                        className="h-10 w-10 rounded-full border-2 border-black bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-black text-white text-sm"
                        style={{ filter: "url(#rough-paper)" }}
                    >
                        {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-black transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8 py-8">
                {/* ── WELCOME ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl md:text-4xl font-black mb-2">
                        Welcome, <Highlight color="#a5f3fc">{user.name.split(' ')[0]}</Highlight> 🎯
                    </h1>
                    <p className="text-gray-600 font-medium text-lg">
                        {user.company && <span className="font-bold text-black">{user.company}</span>}
                        {' '}• {pendingReviews.length} submissions waiting for review
                    </p>
                </motion.div>

                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'Tasks Posted', value: myTasks.length, icon: <Code2 size={18} />, color: '#a5f3fc' },
                        { label: 'Pending Reviews', value: pendingReviews.length, icon: <Clock size={18} />, color: '#ffeb3b' },
                        { label: 'Students Mentored', value: user.mentor_score || 0, icon: <Users size={18} />, color: '#bbf7d0' },
                        { label: 'Referrals Made', value: Math.floor((user.mentor_score || 0) / 10), icon: <Zap size={18} />, color: '#ddd6fe' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="relative p-5"
                        >
                            <div
                                className="absolute inset-0 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                                style={{ backgroundColor: stat.color + '30', filter: "url(#rough-paper)" }}
                            />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 text-gray-600">{stat.icon} <span className="text-xs font-bold uppercase">{stat.label}</span></div>
                                <div className="text-3xl font-black">{stat.value}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── TABS ── */}
                <div className="flex gap-2 mb-8 border-b-2 border-black/10 pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-2 border-black transition-all ${activeTab === tab.id ? 'bg-black text-white shadow-[4px_4px_0px_#ffeb3b]' : 'bg-white hover:bg-gray-50'}`}
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            {tab.icon}
                            {tab.label}
                            {'count' in tab && tab.count !== undefined && (
                                <span className={`ml-1 px-2 py-0.5 text-xs font-black ${activeTab === tab.id ? 'bg-amber-400 text-black' : 'bg-gray-200'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── REVIEW QUEUE ── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'review' && (
                        <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {pendingReviews.length === 0 ? (
                                <div className="py-20 text-center">
                                    <p className="text-2xl font-bold text-gray-300 italic">No submissions pending review 🎉</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {pendingReviews.map((task, i) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="relative p-6"
                                        >
                                            <div
                                                className="absolute inset-0 bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] sketch-border-1"
                                                style={{ filter: "url(#rough-paper)" }}
                                            />
                                            <div className="relative z-10">
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-black">{task.title}</h3>
                                                        <p className="text-sm text-gray-500 font-medium mt-1">
                                                            Submitted by <span className="font-bold text-black">{task.submission?.student_name}</span>
                                                            {' '}on {task.submission?.submitted_at ? new Date(task.submission.submitted_at).toLocaleDateString() : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {task.stack.map(s => (
                                                            <span key={s} className="text-xs font-bold bg-black text-white px-2 py-0.5" style={{ filter: "url(#rough-paper)" }}>{s}</span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Submission details */}
                                                {task.submission && (
                                                    <div className="mb-4 p-4 bg-gray-50 border-2 border-dashed border-black/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Code2 size={14} />
                                                            <a href={task.submission.github_link} target="_blank" rel="noopener noreferrer" className="font-bold text-sm underline hover:text-amber-600">
                                                                {task.submission.github_link}
                                                            </a>
                                                        </div>
                                                        <p className="text-sm text-gray-600 font-medium">{task.submission.submission_text}</p>
                                                    </div>
                                                )}

                                                {/* Expand for feedback */}
                                                <button
                                                    onClick={() => setExpandedReview(expandedReview === task.id ? null : task.id)}
                                                    className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-black mb-4"
                                                >
                                                    <ChevronDown size={14} className={`transition-transform ${expandedReview === task.id ? 'rotate-180' : ''}`} />
                                                    {expandedReview === task.id ? 'Hide' : 'Add'} Feedback
                                                </button>

                                                {expandedReview === task.id && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
                                                        <SketchTextarea
                                                            placeholder="Optional feedback for the student..."
                                                            value={feedbackText}
                                                            onChange={e => setFeedbackText(e.target.value)}
                                                            rows={3}
                                                        />
                                                    </motion.div>
                                                )}

                                                {/* Action buttons */}
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleReview(task.id, 'approve')}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white border-2 border-black font-bold shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
                                                        style={{ filter: "url(#rough-paper)" }}
                                                    >
                                                        <CheckCircle2 size={16} /> Approve (+10 Karma)
                                                    </button>
                                                    <button
                                                        onClick={() => handleReview(task.id, 'revision')}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-black border-2 border-black font-bold shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
                                                        style={{ filter: "url(#rough-paper)" }}
                                                    >
                                                        <RotateCcw size={16} /> Request Revision
                                                    </button>
                                                    <button
                                                        onClick={() => handleReview(task.id, 'flag')}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white border-2 border-black font-bold shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
                                                        style={{ filter: "url(#rough-paper)" }}
                                                    >
                                                        <XCircle size={16} /> Flag (-5 Karma)
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── MY TASKS ── */}
                    {activeTab === 'my-tasks' && (
                        <motion.div key="my-tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {myTasks.length === 0 ? (
                                <div className="py-20 text-center">
                                    <p className="text-2xl font-bold text-gray-300 italic">You haven&apos;t posted any tasks yet.</p>
                                    <button onClick={() => setActiveTab('post')} className="mt-4 font-bold underline text-amber-600">Post your first task →</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {myTasks.map((task, i) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => router.push(`/task/${task.id}`)}
                                            className="relative p-6 cursor-pointer group"
                                        >
                                            <div
                                                className="absolute inset-0 bg-white border-3 border-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] group-hover:shadow-[8px_8px_0px_#a5f3fc]"
                                                style={{ filter: "url(#rough-paper)", borderRadius: i % 2 === 0 ? "255px 15px 225px 15px/15px 225px 15px 255px" : "15px 225px 15px 255px/255px 15px 225px 15px" }}
                                            />
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-black text-lg">{task.title}</h3>
                                                    <StatusPill status={task.status} />
                                                </div>
                                                <p className="text-sm text-gray-600 font-medium line-clamp-2 mb-3">{task.description}</p>
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {task.stack.map(s => (
                                                        <span key={s} className="text-xs font-bold bg-black text-white px-2 py-0.5">{s}</span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <DifficultyBadge difficulty={task.difficulty} />
                                                    <span className="text-gray-500 font-medium flex items-center gap-1"><Clock size={14} /> {task.time_estimate_min}m</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── POST TASK ── */}
                    {activeTab === 'post' && (
                        <motion.div key="post" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="max-w-2xl mx-auto relative p-8">
                                <div
                                    className="absolute inset-0 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] sketch-border-1"
                                    style={{ filter: "url(#rough-paper)" }}
                                />
                                <div className="relative z-10 space-y-6">
                                    <h2 className="text-2xl font-black">Post a <Highlight>Micro-Task</Highlight></h2>
                                    <p className="text-gray-600 font-medium">Post a small, real-world task you&apos;d otherwise do yourself. Max 4 hours estimated.</p>

                                    <SketchInput
                                        type="text"
                                        placeholder="Task Title (e.g., Build a regex log parser)"
                                        icon={Code2}
                                        value={taskTitle}
                                        onChange={e => setTaskTitle(e.target.value)}
                                    />

                                    <SketchTextarea
                                        placeholder="Detailed description. What's the deliverable? What edge cases should they handle?"
                                        value={taskDesc}
                                        onChange={e => setTaskDesc(e.target.value)}
                                        rows={6}
                                    />

                                    <TagInput
                                        tags={taskStack}
                                        onChange={setTaskStack}
                                        placeholder="Required stack (e.g., Python, React)..."
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <SketchSelect
                                            options={[
                                                { label: 'Easy', value: 'easy' },
                                                { label: 'Medium', value: 'medium' },
                                                { label: 'Hard', value: 'hard' },
                                            ]}
                                            value={taskDifficulty}
                                            onChange={v => setTaskDifficulty(v as Difficulty)}
                                            placeholder="Difficulty"
                                        />
                                        <SketchInput
                                            type="number"
                                            placeholder="Time estimate (minutes)"
                                            icon={Clock}
                                            value={taskTime}
                                            onChange={e => setTaskTime(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        onClick={handlePostTask}
                                        disabled={!taskTitle.trim() || !taskDesc.trim()}
                                        className="w-full flex items-center justify-center gap-3 bg-black text-white border-4 border-black px-8 py-4 font-black text-lg shadow-[8px_8px_0px_#ffeb3b] hover:shadow-[12px_12px_0px_#ffeb3b] hover:-translate-y-1 transition-all disabled:opacity-40 disabled:shadow-none disabled:translate-y-0"
                                    >
                                        <Plus size={20} /> Post Task
                                    </button>

                                    {showPostSuccess && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-4 bg-green-100 border-2 border-green-600 text-green-800 font-bold text-center"
                                        >
                                            ✅ Task posted successfully! Students have been notified.
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
