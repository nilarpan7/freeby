'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Code2, CheckCircle2, Send, GitBranch, ExternalLink, User } from 'lucide-react';
import { HandDrawnFilters, Highlight, DifficultyBadge, StatusPill, SketchButton, SketchInput, SketchTextarea } from '@/components/HandDrawn';
import { useAuth } from '@/lib/auth-context';
import { getTaskById, getUserById } from '@/lib/mock-data';

export default function TaskDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [githubLink, setGithubLink] = useState('');
    const [submissionText, setSubmissionText] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const task = getTaskById(id as string);
    const senior = task ? getUserById(task.senior_id) : null;

    useEffect(() => {
        if (!user) {
            router.push('/auth');
        }
    }, [user, router]);

    if (!task || !senior) {
        return (
            <main className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-black mb-4">Task Not Found</h1>
                    <button onClick={() => router.push('/dashboard')} className="font-bold underline">← Back to Dashboard</button>
                </div>
            </main>
        );
    }

    const handleClaim = () => {
        alert('Task claimed! You can now start working on it.');
        router.push('/dashboard');
    };

    const handleSubmit = () => {
        if (!githubLink.trim() || !submissionText.trim()) return;
        setShowSuccess(true);
        setTimeout(() => {
            router.push('/dashboard');
        }, 2000);
    };

    const canSubmit = task.claimed_by === user?.id && task.status === 'claimed';
    const canClaim = task.status === 'open' && user?.role === 'student';

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

            <div className="relative z-10 mx-auto max-w-4xl px-6 py-8">
                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 mb-8 font-bold text-gray-600 hover:text-black transition-colors"
                >
                    <ArrowLeft size={20} /> Back
                </button>

                {/* Task Header */}
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
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-black mb-3">{task.title}</h1>
                                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                    <User size={16} />
                                    <span className="font-bold text-black">{senior.name}</span>
                                    <span>•</span>
                                    <span>{senior.company}</span>
                                </div>
                            </div>
                            <StatusPill status={task.status} />
                        </div>

                        <div className="flex flex-wrap gap-4 mb-6">
                            <DifficultyBadge difficulty={task.difficulty} />
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 border-2 border-black font-bold text-sm">
                                <Clock size={16} />
                                {task.time_estimate_min} minutes
                            </div>
                            {task.match_score && (
                                <div className="px-3 py-1 bg-[#ffeb3b] border-2 border-black font-bold text-sm rotate-1">
                                    {task.match_score}% match
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {task.stack.map(s => (
                                <span key={s} className="text-xs font-bold bg-black text-white px-3 py-1" style={{ filter: "url(#rough-paper)" }}>
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Task Description */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative p-8 mb-8"
                >
                    <div
                        className="absolute inset-0 bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] sketch-border-2"
                        style={{ filter: "url(#rough-paper)" }}
                    />
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black mb-4">Task <Highlight color="#bbf7d0">Description</Highlight></h2>
                        <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-line">{task.description}</p>
                    </div>
                </motion.div>

                {/* Submission Section (if claimed by user) */}
                {canSubmit && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative p-8 mb-8"
                    >
                        <div
                            className="absolute inset-0 bg-amber-50 border-4 border-black shadow-[6px_6px_0px_#ffeb3b]"
                            style={{ filter: "url(#rough-paper)" }}
                        />
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-2xl font-black">Submit Your <Highlight color="#a5f3fc">Work</Highlight></h2>

                            <SketchInput
                                type="url"
                                placeholder="GitHub Repository or PR Link"
                                icon={GitBranch}
                                value={githubLink}
                                onChange={e => setGithubLink(e.target.value)}
                            />

                            <SketchTextarea
                                placeholder="Describe your approach, challenges faced, and how you solved them..."
                                value={submissionText}
                                onChange={e => setSubmissionText(e.target.value)}
                                rows={6}
                            />

                            <button
                                onClick={handleSubmit}
                                disabled={!githubLink.trim() || !submissionText.trim()}
                                className="w-full flex items-center justify-center gap-3 bg-black text-white border-4 border-black px-8 py-4 font-black text-lg shadow-[8px_8px_0px_#ffeb3b] hover:shadow-[12px_12px_0px_#ffeb3b] hover:-translate-y-1 transition-all disabled:opacity-40 disabled:shadow-none disabled:translate-y-0"
                            >
                                <Send size={20} /> Submit for Review
                            </button>

                            {showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-green-100 border-2 border-green-600 text-green-800 font-bold text-center"
                                >
                                    ✅ Submission sent! The senior will review your work soon.
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Claim Button (if open) */}
                {canClaim && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center"
                    >
                        <button
                            onClick={handleClaim}
                            className="inline-flex items-center justify-center gap-3 bg-black text-white border-4 border-black px-12 py-5 font-black text-xl shadow-[8px_8px_0px_#ffeb3b] hover:shadow-[12px_12px_0px_#ffeb3b] hover:-translate-y-1 transition-all"
                        >
                            <CheckCircle2 size={24} /> Claim This Task
                        </button>
                    </motion.div>
                )}

                {/* Submission Details (if already submitted) */}
                {task.submission && task.status === 'submitted' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative p-8"
                    >
                        <div
                            className="absolute inset-0 bg-blue-50 border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)]"
                            style={{ filter: "url(#rough-paper)" }}
                        />
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black mb-4">Submission <Highlight color="#ddd6fe">Under Review</Highlight></h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <GitBranch size={18} />
                                    <a href={task.submission.github_link} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-amber-600 flex items-center gap-1">
                                        {task.submission.github_link} <ExternalLink size={14} />
                                    </a>
                                </div>
                                <p className="text-gray-700 font-medium">{task.submission.submission_text}</p>
                                <p className="text-sm text-gray-500">Submitted on {new Date(task.submission.submitted_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
