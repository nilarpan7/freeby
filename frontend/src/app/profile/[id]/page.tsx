'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, GitBranch, Mail, Code2, Zap, Award, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { HandDrawnFilters, Highlight, KarmaBadge, DifficultyBadge } from '@/components/HandDrawn';
import { getUserById, getKarmaEvents, MOCK_TASKS } from '@/lib/mock-data';

export default function ProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    
    const user = getUserById(id as string);
    const karmaEvents = user ? getKarmaEvents(user.id) : [];
    const userTasks = user ? MOCK_TASKS.filter(t => t.claimed_by === user.id || t.senior_id === user.id) : [];

    if (!user) {
        return (
            <main className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-black mb-4">User Not Found</h1>
                    <button onClick={() => router.push('/dashboard')} className="font-bold underline">← Back to Dashboard</button>
                </div>
            </main>
        );
    }

    const REFERRAL_THRESHOLD = 500;
    const karmaProgress = Math.min((user.karma_score / REFERRAL_THRESHOLD) * 100, 100);

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
                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 mb-8 font-bold text-gray-600 hover:text-black transition-colors"
                >
                    <ArrowLeft size={20} /> Back
                </button>

                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative p-8 mb-8"
                >
                    <div
                        className="absolute inset-0 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] sketch-border-1"
                        style={{ filter: "url(#rough-paper)" }}
                    />
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div
                                    className="h-32 w-32 rounded-full border-4 border-black bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-white text-4xl"
                                    style={{ filter: "url(#rough-paper)" }}
                                >
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-black mb-2">{user.name}</h1>
                                <p className="text-xl text-gray-600 font-medium mb-4">
                                    {user.domain} Developer
                                    {user.company && <span className="text-black font-bold"> @ {user.company}</span>}
                                </p>

                                <div className="flex flex-wrap gap-3 mb-6">
                                    {user.skills.map(skill => (
                                        <span key={skill} className="px-3 py-1 text-sm font-bold bg-black text-white border-2 border-black" style={{ filter: "url(#rough-paper)" }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm">
                                    {user.email && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Mail size={16} />
                                            <span className="font-medium">{user.email}</span>
                                        </div>
                                    )}
                                    {user.github_url && (
                                        <a href={user.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-black font-medium">
                                            <GitBranch size={16} />
                                            GitHub <ExternalLink size={12} />
                                        </a>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar size={16} />
                                        <span className="font-medium">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Karma Badge */}
                            {user.role === 'student' && (
                                <div className="flex-shrink-0">
                                    <KarmaBadge score={user.karma_score} size="lg" />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {user.role === 'student' ? (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="relative p-5"
                            >
                                <div
                                    className="absolute inset-0 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                                    style={{ backgroundColor: '#ffeb3b30', filter: "url(#rough-paper)" }}
                                />
                                <div className="relative z-10 text-center">
                                    <div className="flex justify-center mb-2"><Code2 size={20} className="text-gray-600" /></div>
                                    <div className="text-3xl font-black">{user.tasks_completed}</div>
                                    <div className="text-xs font-bold text-gray-600 uppercase">Tasks Done</div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="relative p-5"
                            >
                                <div
                                    className="absolute inset-0 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                                    style={{ backgroundColor: '#a5f3fc30', filter: "url(#rough-paper)" }}
                                />
                                <div className="relative z-10 text-center">
                                    <div className="flex justify-center mb-2"><Award size={20} className="text-gray-600" /></div>
                                    <div className="text-3xl font-black">{user.endorsements_received}</div>
                                    <div className="text-xs font-bold text-gray-600 uppercase">Endorsements</div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="relative p-5"
                            >
                                <div
                                    className="absolute inset-0 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                                    style={{ backgroundColor: '#bbf7d030', filter: "url(#rough-paper)" }}
                                />
                                <div className="relative z-10 text-center">
                                    <div className="flex justify-center mb-2"><TrendingUp size={20} className="text-gray-600" /></div>
                                    <div className="text-3xl font-black">{Math.round(karmaProgress)}%</div>
                                    <div className="text-xs font-bold text-gray-600 uppercase">To Referral</div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="relative p-5"
                            >
                                <div
                                    className="absolute inset-0 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                                    style={{ backgroundColor: '#ddd6fe30', filter: "url(#rough-paper)" }}
                                />
                                <div className="relative z-10 text-center">
                                    <div className="flex justify-center mb-2"><Zap size={20} className="text-gray-600" /></div>
                                    <div className="text-3xl font-black">{user.karma_score}</div>
                                    <div className="text-xs font-bold text-gray-600 uppercase">Total Karma</div>
                                </div>
                            </motion.div>
                        </>
                    ) : (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="relative p-5"
                            >
                                <div
                                    className="absolute inset-0 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                                    style={{ backgroundColor: '#a5f3fc30', filter: "url(#rough-paper)" }}
                                />
                                <div className="relative z-10 text-center">
                                    <div className="flex justify-center mb-2"><Code2 size={20} className="text-gray-600" /></div>
                                    <div className="text-3xl font-black">{user.tasks_posted}</div>
                                    <div className="text-xs font-bold text-gray-600 uppercase">Tasks Posted</div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="relative p-5"
                            >
                                <div
                                    className="absolute inset-0 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                                    style={{ backgroundColor: '#ffeb3b30', filter: "url(#rough-paper)" }}
                                />
                                <div className="relative z-10 text-center">
                                    <div className="flex justify-center mb-2"><Award size={20} className="text-gray-600" /></div>
                                    <div className="text-3xl font-black">{user.mentor_score || 0}</div>
                                    <div className="text-xs font-bold text-gray-600 uppercase">Mentor Score</div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>

                {/* Karma Activity (for students) */}
                {user.role === 'student' && karmaEvents.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative p-8 mb-8"
                    >
                        <div
                            className="absolute inset-0 bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] sketch-border-2"
                            style={{ filter: "url(#rough-paper)" }}
                        />
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black mb-6">Karma <Highlight color="#ddd6fe">Activity</Highlight></h2>
                            <div className="space-y-3">
                                {karmaEvents.slice(0, 10).map((event, i) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.35 + i * 0.03 }}
                                        className="flex items-center justify-between p-4 border-2 border-black bg-white"
                                        style={{ filter: "url(#rough-paper)" }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`text-lg font-black ${event.karma_delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {event.karma_delta > 0 ? '+' : ''}{event.karma_delta}
                                            </span>
                                            <div>
                                                <p className="font-bold text-sm">{event.description}</p>
                                                {event.task_title && <p className="text-xs text-gray-500">{event.task_title}</p>}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium">{new Date(event.created_at).toLocaleDateString()}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tasks (for both roles) */}
                {userTasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative p-8"
                    >
                        <div
                            className="absolute inset-0 bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] sketch-border-1"
                            style={{ filter: "url(#rough-paper)" }}
                        />
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black mb-6">
                                {user.role === 'student' ? 'Completed' : 'Posted'} <Highlight color="#bbf7d0">Tasks</Highlight>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userTasks.slice(0, 6).map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.45 + i * 0.05 }}
                                        onClick={() => router.push(`/task/${task.id}`)}
                                        className="relative p-4 cursor-pointer group"
                                    >
                                        <div
                                            className="absolute inset-0 bg-gray-50 border-2 border-black transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] group-hover:shadow-[5px_5px_0px_#a5f3fc]"
                                            style={{ filter: "url(#rough-paper)" }}
                                        />
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-sm">{task.title}</h3>
                                                <DifficultyBadge difficulty={task.difficulty} />
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {task.stack.slice(0, 3).map(s => (
                                                    <span key={s} className="text-xs font-bold bg-black text-white px-2 py-0.5">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
