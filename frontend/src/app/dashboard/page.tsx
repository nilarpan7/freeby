'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Code2, Filter, Search, Zap, Trophy, LogOut, Star, BarChart3, History } from 'lucide-react';
import { HandDrawnFilters, Highlight, KarmaBadge, DifficultyBadge, ProgressRing, StatusPill } from '@/components/HandDrawn';
import { useAuth } from '@/lib/auth-context';
import { taskApi } from '@/lib/api';
import type { Task, Difficulty } from '@/lib/types';
import KarmaWorkGraph from './components/KarmaWorkGraph';
import QuestHistory from './components/QuestHistory';

export default function StudentDashboard() {
    const router = useRouter();
    const { user, logout, isLoading } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
    const [domainFilter, setDomainFilter] = useState<string>('all');
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [myTasks, setMyTasks] = useState<any[]>([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [karmaGraphOpen, setKarmaGraphOpen] = useState(false);

    useEffect(() => {
        if (isLoading) return; // Wait for auth to resolve
        if (!user) {
            router.push('/auth?role=student');
        }
        // Don't redirect to setup — let the user stay on dashboard
        // Setup page is only for initial onboarding
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user) {
            loadTasks();
        }
    }, [user]);

    const loadTasks = async () => {
        try {
            setTasksLoading(true);
            const [tasks, claimed] = await Promise.all([
                taskApi.getTasks(),
                taskApi.getMyTasks(),
            ]);
            setAllTasks(tasks);
            setMyTasks(claimed);
        } catch (err) {
            console.error('Error loading tasks:', err);
        } finally {
            setTasksLoading(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center font-black text-2xl">Loading...</div>
    );
    if (!user) return null;

    const REFERRAL_THRESHOLD = 500;

    // Filter tasks
    const openTasks = allTasks.filter((t: any) => t.status === 'open');
    const filteredTasks = openTasks.filter((t: any) => {
        const matchesSearch = !searchQuery || 
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.stack || []).some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesDifficulty = difficultyFilter === 'all' || t.difficulty === difficultyFilter;
        const matchesDomain = domainFilter === 'all' || 
            (t.stack || []).some((s: string) => s.toLowerCase().includes(domainFilter.toLowerCase()));
        return matchesSearch && matchesDifficulty && matchesDomain;
    });

    const handleLogout = () => {
        logout();
        router.push('/');
    };

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
                </div>
                <div className="hidden md:flex items-center gap-6">
                    <button onClick={() => router.push('/starter')} className="flex items-center gap-1.5 font-bold text-sm hover:text-amber-600 transition-colors">
                        <Zap size={16} /> Quests
                    </button>
                    <button onClick={() => router.push('/tasks')} className="flex items-center gap-1.5 font-bold text-sm hover:text-amber-600 transition-colors">
                        <Code2 size={16} /> Tasks
                    </button>
                    <button onClick={() => router.push('/leaderboard')} className="flex items-center gap-1.5 font-bold text-sm hover:text-amber-600 transition-colors">
                        <Trophy size={16} /> Leaderboard
                    </button>
                    <button onClick={() => router.push(`/profile/${user.id}`)} className="flex items-center gap-1.5 font-bold text-sm hover:text-amber-600 transition-colors">
                        <Star size={16} /> Profile
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="cursor-pointer" onClick={() => setKarmaGraphOpen(true)} title="View Karma Work Graph">
                        <KarmaBadge score={user.karma_score} size="sm" />
                    </div>
                    <div
                        className="h-10 w-10 rounded-full border-2 border-black bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-white text-sm cursor-pointer"
                        style={{ filter: "url(#rough-paper)" }}
                        onClick={() => router.push(`/profile/${user.id}`)}
                    >
                        {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-black transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8 py-8">
                {/* ── WELCOME + KARMA OVERVIEW ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Welcome Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 relative p-8"
                    >
                        <div
                            className="absolute inset-0 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] sketch-border-1"
                            style={{ filter: "url(#rough-paper)" }}
                        />
                        <div className="relative z-10">
                            <h1 className="text-3xl md:text-4xl font-black mb-2">
                                Hey, <Highlight>{user.name.split(' ')[0]}</Highlight> 👋
                            </h1>
                            <p className="text-gray-600 font-medium text-lg mb-6">
                                {user.karma_score >= REFERRAL_THRESHOLD
                                    ? "🎉 You've unlocked Referral Requests! Browse your task history to request referrals."
                                    : `${REFERRAL_THRESHOLD - user.karma_score} more Karma to unlock referrals. Keep building!`
                                }
                            </p>

                            <div className="flex flex-wrap gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-black">{user.tasks_completed || 0}</div>
                                    <div className="text-xs font-bold text-gray-500 uppercase">Tasks Done</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-black">{(user as any).endorsements_received || 0}</div>
                                    <div className="text-xs font-bold text-gray-500 uppercase">Endorsements</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-black text-amber-500">{user.domain}</div>
                                    <div className="text-xs font-bold text-gray-500 uppercase">Domain</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Karma Ring */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative p-6 flex flex-col items-center justify-center"
                    >
                        <div
                            className="absolute inset-0 bg-white border-4 border-black shadow-[8px_8px_0px_#ffeb3b] sketch-border-2"
                            style={{ filter: "url(#rough-paper)" }}
                        />
                        <div className="relative z-10 flex flex-col items-center">
                            <ProgressRing value={user.karma_score} max={REFERRAL_THRESHOLD} size={140} label="/ 500" />
                            <p className="text-sm font-bold text-gray-500 mt-3">Referral Threshold</p>
                            {user.karma_score >= REFERRAL_THRESHOLD && (
                                <span className="mt-2 bg-green-100 text-green-800 px-3 py-1 text-xs font-black border border-green-600 rounded-full">
                                    ✅ UNLOCKED
                                </span>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* ── STARTER QUESTS BANNER (low karma) ── */}
                {user.karma_score < 30 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-8"
                    >
                        <div
                            className="relative p-8 bg-gradient-to-r from-green-100 via-emerald-50 to-cyan-100 border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="text-6xl"
                                >
                                    🚀
                                </motion.div>
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-2xl font-black mb-2">
                                        New? Start with <Highlight color="#bbf7d0">Starter Quests</Highlight>
                                    </h2>
                                    <p className="text-gray-700 font-medium mb-1">
                                        You need karma to unlock paid tasks. Complete beginner-friendly coding quests,
                                        submit your GitHub repo, and earn karma through AI code analysis!
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        5 quests available — earn up to 95 karma points
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => router.push('/starter')}
                                    className="bg-green-600 text-white border-4 border-black px-8 py-4 font-black text-lg shadow-[6px_6px_0px_#000] hover:shadow-[10px_10px_0px_#000] transition-all whitespace-nowrap"
                                >
                                    Start Quests →
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── BROWSE TASKS SECTION ── */}
                <div className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative p-8 text-center"
                    >
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-amber-100 to-cyan-100 border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                            style={{ filter: "url(#rough-paper)" }}
                        />
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-4">
                                Ready to earn <Highlight color="#ffeb3b">Karma</Highlight>?
                            </h2>
                            <p className="text-gray-600 font-medium text-lg mb-6">
                                Browse available tasks and start building your reputation!
                            </p>
                            <div className="flex gap-4 justify-center flex-wrap">
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => router.push('/tasks')}
                                    className="bg-black text-white border-4 border-black px-8 py-4 font-black text-lg shadow-[8px_8px_0px_#ffeb3b] hover:shadow-[12px_12px_0px_#ffeb3b] transition-all flex items-center gap-3"
                                >
                                    <Code2 size={24} />
                                    Browse Paid Tasks
                                    <ArrowRight size={24} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => router.push('/starter')}
                                    className="bg-white text-black border-4 border-black px-8 py-4 font-black text-lg shadow-[8px_8px_0px_#bbf7d0] hover:shadow-[12px_12px_0px_#bbf7d0] transition-all flex items-center gap-3"
                                >
                                    🚀 Starter Quests
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── MY ACTIVE TASKS ── */}
                {myTasks.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-black mb-6">My Active Tasks</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {myTasks.map((task, i) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => router.push(`/task/${task.id}`)}
                                    className="relative p-5 cursor-pointer group"
                                >
                                    <div
                                        className="absolute inset-0 bg-amber-50 border-3 border-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] group-hover:shadow-[8px_8px_0px_#ffeb3b] sketch-border-3"
                                        style={{ filter: "url(#rough-paper)" }}
                                    />
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg">{task.title}</h3>
                                            <StatusPill status={task.status} />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">{task.client_name} • {task.client_company}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── QUEST HISTORY ── */}
                <div className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                            <History size={24} />
                            Quest <Highlight color="#bbf7d0">History</Highlight>
                        </h2>
                        <QuestHistory userId={user.id} />
                    </motion.div>
                </div>

                {/* ── TASK FEED ── */}
                <div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <h2 className="text-2xl font-black">
                            Open <Highlight color="#bbf7d0">Tasks</Highlight>
                        </h2>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="pl-9 pr-4 py-2 border-2 border-black bg-white font-medium text-sm outline-none focus:shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-shadow w-48"
                                    style={{ filter: "url(#rough-paper)" }}
                                />
                            </div>

                            {/* Difficulty Filter */}
                            <div className="flex gap-1">
                                {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficultyFilter(d)}
                                        className={`px-3 py-1.5 text-xs font-bold uppercase border-2 border-black transition-all ${difficultyFilter === d ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
                                        style={{ filter: "url(#rough-paper)" }}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Task Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredTasks.length === 0 ? (
                            <div className="col-span-full py-16 text-center">
                                <p className="text-xl font-bold text-gray-400 italic">No tasks match your filters.</p>
                            </div>
                        ) : (
                            filteredTasks.map((task, i) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => router.push(`/task/${task.id}`)}
                                    className="relative p-6 cursor-pointer group"
                                >
                                    <div
                                        className="absolute inset-0 bg-white border-4 border-black transition-all duration-300 shadow-[6px_6px_0px_rgba(0,0,0,1)] group-hover:shadow-[10px_10px_0px_#a5f3fc]"
                                        style={{ filter: "url(#rough-paper)", borderRadius: i % 2 === 0 ? "255px 15px 225px 15px/15px 225px 15px 255px" : "15px 225px 15px 255px/255px 15px 225px 15px" }}
                                    />
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-3">
                                            <DifficultyBadge difficulty={task.difficulty} />
                                            {task.match_score && (
                                                <span className="bg-[#ffeb3b] px-2 py-0.5 font-bold text-xs border-2 border-black rotate-2" style={{ filter: "url(#rough-paper)" }}>
                                                    {task.match_score}% match
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-black mb-2">{task.title}</h3>
                                        <p className="text-gray-600 font-medium text-sm mb-4 line-clamp-2 flex-grow">{task.description}</p>

                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {(task.stack || []).map((s: string) => (
                                                <span key={s} className="text-xs font-bold bg-black text-white px-2 py-0.5" style={{ filter: "url(#rough-paper)" }}>
                                                    {s}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between border-t-2 border-dashed border-black/15 pt-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-sm font-bold text-gray-500">
                                                    <Clock size={14} /> {task.time_estimate_min}m
                                                </div>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {task.client_name}
                                                </span>
                                            </div>
                                            <span className="font-bold text-sm flex items-center gap-1 group-hover:text-amber-600 transition-colors">
                                                Claim <ArrowRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── RECENT KARMA ── */}
                {/* Karma activity section — will show when attestations exist */}
            </div>

            {/* Karma Work Graph Modal */}
            <KarmaWorkGraph
                userId={user.id}
                currentKarma={user.karma_score}
                isOpen={karmaGraphOpen}
                onClose={() => setKarmaGraphOpen(false)}
            />
        </main>
    );
}
