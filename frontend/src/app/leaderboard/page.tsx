'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, ArrowLeft, Zap, Award, Target } from 'lucide-react';
import { HandDrawnFilters, Highlight, KarmaBadge, TrendIndicator } from '@/components/HandDrawn';
import { getLeaderboard } from '@/lib/mock-data';

export default function LeaderboardPage() {
    const router = useRouter();
    const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
    
    const leaderboard = getLeaderboard();

    const getMedalColor = (rank: number) => {
        if (rank === 1) return 'from-amber-400 to-yellow-500';
        if (rank === 2) return 'from-gray-300 to-gray-400';
        if (rank === 3) return 'from-orange-400 to-orange-600';
        return 'from-gray-100 to-gray-200';
    };

    const getMedalIcon = (rank: number) => {
        if (rank <= 3) return <Trophy size={24} className={rank === 1 ? 'text-amber-600' : rank === 2 ? 'text-gray-600' : 'text-orange-600'} />;
        return <span className="text-xl font-black text-gray-400">#{rank}</span>;
    };

    return (
        <main className="relative min-h-screen w-full bg-[#fdfbf7] text-[#2d2d2d]">
            <HandDrawnFilters />

            <div
                className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
                {/* Header */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 mb-8 font-bold text-gray-600 hover:text-black transition-colors"
                >
                    <ArrowLeft size={20} /> Back
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <Trophy size={48} className="text-amber-500" />
                        <h1 className="text-4xl md:text-5xl font-black">
                            <Highlight color="#ffeb3b">Karma</Highlight> Leaderboard
                        </h1>
                    </div>
                    <p className="text-xl text-gray-600 font-medium">The top builders in the Kramic.sh community</p>
                </motion.div>

                {/* Time Filter */}
                <div className="flex justify-center gap-2 mb-10">
                    {(['all', 'week', 'month'] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setTimeFilter(filter)}
                            className={`px-6 py-2 text-sm font-bold uppercase border-2 border-black transition-all ${timeFilter === filter ? 'bg-black text-white shadow-[4px_4px_0px_#ffeb3b]' : 'bg-white hover:bg-gray-50'}`}
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'This Month'}
                        </button>
                    ))}
                </div>

                {/* Top 3 Podium */}
                <div className="grid grid-cols-3 gap-4 mb-12 items-end">
                    {/* 2nd Place */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative"
                    >
                        <div
                            className="p-6 bg-gradient-to-br from-gray-300 to-gray-400 border-4 border-black text-center"
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            <div className="mb-3 flex justify-center">
                                <Trophy size={32} className="text-gray-600" />
                            </div>
                            <div className="h-12 w-12 mx-auto rounded-full border-2 border-black bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-black text-white mb-2">
                                {leaderboard[1].user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <h3 className="font-black text-lg mb-1">{leaderboard[1].user.name}</h3>
                            <KarmaBadge score={leaderboard[1].user.karma_score} size="sm" />
                            <div className="mt-2 text-xs font-bold text-gray-700">{leaderboard[1].user.tasks_completed} tasks</div>
                        </div>
                        <div className="h-24 bg-gray-300 border-4 border-t-0 border-black flex items-center justify-center font-black text-3xl">
                            #2
                        </div>
                    </motion.div>

                    {/* 1st Place */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative"
                    >
                        <div
                            className="p-6 bg-gradient-to-br from-amber-400 to-yellow-500 border-4 border-black text-center shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            <div className="mb-3 flex justify-center">
                                <Trophy size={40} className="text-amber-600 animate-bounce" />
                            </div>
                            <div className="h-16 w-16 mx-auto rounded-full border-2 border-black bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-black text-white text-xl mb-2">
                                {leaderboard[0].user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <h3 className="font-black text-xl mb-1">{leaderboard[0].user.name}</h3>
                            <KarmaBadge score={leaderboard[0].user.karma_score} size="md" />
                            <div className="mt-2 text-sm font-bold text-gray-800">{leaderboard[0].user.tasks_completed} tasks</div>
                        </div>
                        <div className="h-32 bg-amber-400 border-4 border-t-0 border-black flex items-center justify-center font-black text-4xl">
                            #1
                        </div>
                    </motion.div>

                    {/* 3rd Place */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative"
                    >
                        <div
                            className="p-6 bg-gradient-to-br from-orange-400 to-orange-600 border-4 border-black text-center"
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            <div className="mb-3 flex justify-center">
                                <Trophy size={28} className="text-orange-600" />
                            </div>
                            <div className="h-12 w-12 mx-auto rounded-full border-2 border-black bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-black text-white mb-2">
                                {leaderboard[2].user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <h3 className="font-black text-lg mb-1">{leaderboard[2].user.name}</h3>
                            <KarmaBadge score={leaderboard[2].user.karma_score} size="sm" />
                            <div className="mt-2 text-xs font-bold text-gray-700">{leaderboard[2].user.tasks_completed} tasks</div>
                        </div>
                        <div className="h-16 bg-orange-400 border-4 border-t-0 border-black flex items-center justify-center font-black text-2xl">
                            #3
                        </div>
                    </motion.div>
                </div>

                {/* Rest of Leaderboard */}
                <div className="space-y-3">
                    {leaderboard.slice(3).map((entry, i) => (
                        <motion.div
                            key={entry.user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                            className="relative p-5 cursor-pointer group"
                            onClick={() => router.push(`/profile/${entry.user.id}`)}
                        >
                            <div
                                className="absolute inset-0 bg-white border-2 border-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] group-hover:shadow-[6px_6px_0px_#a5f3fc]"
                                style={{ filter: "url(#rough-paper)" }}
                            />
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 text-center">
                                        <span className="text-2xl font-black text-gray-400">#{entry.rank}</span>
                                    </div>
                                    <div className="h-12 w-12 rounded-full border-2 border-black bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-black text-white">
                                        {entry.user.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg">{entry.user.name}</h3>
                                        <p className="text-sm text-gray-500 font-medium">{entry.user.domain} • {entry.user.tasks_completed} tasks</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <TrendIndicator trend={entry.trend} />
                                        <span className="text-xs font-bold text-gray-500">{entry.tasks_this_week} this week</span>
                                    </div>
                                    <KarmaBadge score={entry.user.karma_score} size="sm" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Stats Footer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 grid grid-cols-3 gap-6"
                >
                    {[
                        { icon: <Zap size={24} />, label: 'Total Karma Earned', value: leaderboard.reduce((sum, e) => sum + e.user.karma_score, 0).toLocaleString(), color: '#ffeb3b' },
                        { icon: <Target size={24} />, label: 'Tasks Completed', value: leaderboard.reduce((sum, e) => sum + e.user.tasks_completed, 0).toLocaleString(), color: '#a5f3fc' },
                        { icon: <Award size={24} />, label: 'Active Builders', value: leaderboard.length.toString(), color: '#bbf7d0' },
                    ].map((stat, i) => (
                        <div key={stat.label} className="relative p-6 text-center">
                            <div
                                className="absolute inset-0 border-2 border-black"
                                style={{ backgroundColor: stat.color + '40', filter: "url(#rough-paper)" }}
                            />
                            <div className="relative z-10">
                                <div className="flex justify-center mb-2 text-gray-600">{stat.icon}</div>
                                <div className="text-3xl font-black mb-1">{stat.value}</div>
                                <div className="text-xs font-bold text-gray-600 uppercase">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </main>
    );
}
