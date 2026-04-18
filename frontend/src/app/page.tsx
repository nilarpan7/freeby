'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Zap, Shield, Users, GitBranch, Award, Rocket, CheckCircle2, Code2, BarChart3, Star } from 'lucide-react';
import { HandDrawnFilters, Highlight, SketchButton, DrawnArrow, SketchCard } from '@/components/HandDrawn';

export default function LandingPage() {
    const router = useRouter();
    const { scrollYProgress } = useScroll();
    const yDoodle = useTransform(scrollYProgress, [0, 1], [0, -100]);

    const steps = [
        { num: '01', title: 'Complete Tasks', desc: 'Browse micro-tasks posted by clients at top companies. Claim, build, submit.', icon: <Code2 size={28} />, color: '#a5f3fc' },
        { num: '02', title: 'Earn Karma', desc: 'Every approved task earns +10 Karma. Get peer endorsements. Build your reputation graph.', icon: <Zap size={28} />, color: '#ffeb3b' },
        { num: '03', title: 'Unlock Referrals', desc: 'Hit 500 Karma and request direct internal referrals from clients who vouched for your work.', icon: <Rocket size={28} />, color: '#bbf7d0' },
    ];

    const stats = [
        { value: '2,400+', label: 'Tasks Completed' },
        { value: '500+', label: 'Active Students' },
        { value: '85', label: 'Clients' },
        { value: '47', label: 'Referrals Made' },
    ];

    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-[#fdfbf7] font-sans text-[#2d2d2d] selection:bg-[#ffeb3b]">
            <HandDrawnFilters />

            {/* Grid background */}
            <div
                className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    filter: 'url(#rough-paper)'
                }}
            />

            {/* ── NAVBAR ── */}
            <nav className="fixed top-0 z-50 flex w-full items-center justify-between px-8 py-5 backdrop-blur-md bg-[#fdfbf7]/80 border-b border-black/5">
                <div className="text-2xl font-black tracking-tight">
                    Kramic<span className="text-amber-500">.sh</span>
                </div>
                <div className="hidden gap-8 md:flex font-medium">
                    {['How It Works', 'For Clients', 'Leaderboard'].map(item => (
                        <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="relative group p-2 text-sm">
                            {item}
                            <span className="absolute -bottom-1 left-2 h-0.5 w-0 bg-black transition-all group-hover:w-[calc(100%-16px)] rounded-full" />
                        </a>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <SketchButton className="text-sm border-2 border-black" onClick={() => router.push('/auth')}>
                        Launch App <ArrowRight size={16} />
                    </SketchButton>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative mb-6 inline-block"
                >
                    <span className="rounded-full border border-black bg-white px-4 py-2 text-sm font-bold uppercase tracking-widest shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                        ⚡ Work-Verification Protocol
                    </span>
                </motion.div>

                <div className="relative max-w-5xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="mb-8 text-5xl font-black leading-[1.1] tracking-tight md:text-8xl"
                    >
                        The Resume is <Highlight color="#fca5a5">Dead.</Highlight><br />
                        Your <Highlight color="#a5f3fc">Work Graph</Highlight> is<br />
                        Your Identity.
                    </motion.h1>
                    <DrawnArrow />
                </div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="max-w-2xl text-xl text-gray-600 font-medium leading-relaxed"
                >
                    Complete real micro-tasks from top-tier engineers. Build verifiable karma.
                    Bypass ATS filters. Get referred directly to full-time roles.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-10 flex flex-col sm:flex-row gap-4"
                >
                    <button
                        onClick={() => router.push('/auth?role=student')}
                        className="flex items-center justify-center gap-3 bg-black text-white border-4 border-black px-8 py-4 font-bold shadow-[8px_8px_0px_#ffeb3b] hover:shadow-[12px_12px_0px_#ffeb3b] hover:-translate-y-1 transition-all sketch-border-1"
                    >
                        <Code2 size={20} />
                        I&apos;m a Student
                    </button>
                    <button
                        onClick={() => router.push('/auth?role=client')}
                        className="flex items-center justify-center gap-3 bg-white border-4 border-black px-8 py-4 font-bold shadow-[8px_8px_0px_#a5f3fc] hover:shadow-[12px_12px_0px_#a5f3fc] hover:-translate-y-1 transition-all sketch-border-2"
                    >
                        <Star size={20} />
                        I&apos;m a Client
                    </button>
                </motion.div>

                {/* Floating doodles */}
                <motion.div style={{ y: yDoodle }} className="absolute left-[8%] top-[25%] opacity-15 hidden lg:block">
                    <GitBranch size={64} className="-rotate-12" />
                </motion.div>
                <motion.div style={{ y: yDoodle }} className="absolute right-[8%] bottom-[25%] opacity-15 hidden lg:block">
                    <Award size={64} className="rotate-12" />
                </motion.div>
            </section>

            {/* ── STATS BAR ── */}
            <section className="relative z-10 border-y-4 border-black bg-black text-white py-8">
                <div className="mx-auto max-w-6xl flex flex-wrap justify-around gap-8 px-6">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <div className="text-3xl md:text-4xl font-black text-amber-400">{stat.value}</div>
                            <div className="text-sm font-medium text-gray-400 mt-1">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section id="how-it-works" className="relative z-10 px-6 py-28 bg-[#fffdf5]">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl md:text-5xl font-black">How <Highlight>Kramic.sh</Highlight> Works</h2>
                        <p className="mt-4 text-xl text-gray-600 font-medium">Three steps. No resume. No college filter.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15, duration: 0.5 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -8, rotate: Math.random() * 2 - 1 }}
                                className="relative p-8"
                            >
                                <div
                                    className="absolute inset-0 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                                    style={{ filter: "url(#rough-paper)", borderRadius: i % 2 === 0 ? "255px 15px 225px 15px/15px 225px 15px 255px" : "15px 225px 15px 255px/255px 15px 225px 15px" }}
                                />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span
                                            className="inline-flex h-12 w-12 items-center justify-center border-2 border-black font-black text-lg"
                                            style={{ backgroundColor: step.color, filter: "url(#rough-paper)" }}
                                        >
                                            {step.num}
                                        </span>
                                        {step.icon}
                                    </div>
                                    <h3 className="text-2xl font-black mb-3">{step.title}</h3>
                                    <p className="text-gray-600 font-medium leading-relaxed">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOR STUDENTS vs FOR CLIENTS ── */}
            <section id="for-clients" className="mx-auto max-w-5xl px-6 py-28">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black">Two Sides. <Highlight color="#fed7aa">One Graph.</Highlight></h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Students */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="p-8 border-4 border-black bg-white sketch-border-1"
                        style={{ filter: "url(#rough-paper)" }}
                    >
                        <h3 className="text-2xl font-black mb-4">For Students</h3>
                        <p className="mb-6 text-gray-600 font-medium leading-relaxed">
                            No pedigree required. Build a college-blind profile. Let your code speak.
                        </p>
                        <div className="space-y-4">
                            {[
                                "College-Blind Profiles",
                                "AI-Matched Micro-Tasks",
                                "Karma Score + Task Badges",
                                "Direct Referral Unlock at 500⚡"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="text-green-600 w-5 h-5 flex-shrink-0" />
                                    <span className="font-bold">{item}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Clients */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="p-8 border-4 border-black bg-black text-white sketch-border-2"
                        style={{ filter: "url(#rough-paper)" }}
                    >
                        <h3 className="text-2xl font-black mb-4 text-amber-400">For Clients</h3>
                        <p className="mb-6 text-gray-400 font-medium leading-relaxed">
                            Post real tasks. Review student work. Earn referral bonuses when they get hired.
                        </p>
                        <div className="space-y-4">
                            {[
                                "Post Micro-Tasks in Minutes",
                                "Pass / Flag Review Dashboard",
                                "Earn Referral Bonuses (₹10K–₹50K)",
                                "Build Your Client Score"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-[#f0f0f0]">
                                    <Zap className="text-amber-400 w-5 h-5 flex-shrink-0" />
                                    <span className="font-bold">{item}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── KARMA SYSTEM SHOWCASE ── */}
            <section className="relative z-10 px-6 py-24 bg-[#fffdf5] border-y border-black/5">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">The <Highlight color="#ddd6fe">Karma</Highlight> System</h2>
                    <p className="text-xl text-gray-600 font-medium mb-16">Non-transferable, reputation-weighted, time-decaying. Your real signal.</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {[
                            { event: 'Task Approved', karma: '+10', color: '#bbf7d0' },
                            { event: 'Task Flagged', karma: '-5', color: '#fca5a5' },
                            { event: 'Sprint Complete', karma: '+20', color: '#a5f3fc' },
                            { event: 'Peer Upvote', karma: '+2–5', color: '#ddd6fe' },
                            { event: 'Production Deploy', karma: '+50', color: '#ffeb3b' },
                            { event: 'Code Review', karma: '+3', color: '#fed7aa' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.event}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.05, rotate: Math.random() * 4 - 2 }}
                                className="p-4 border-2 border-black bg-white"
                                style={{ backgroundColor: item.color, filter: "url(#rough-paper)" }}
                            >
                                <div className="text-2xl font-black">{item.karma}</div>
                                <div className="text-sm font-bold mt-1">{item.event}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="relative z-10 px-6 py-24 mb-12">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="mx-auto max-w-3xl text-center p-12 border-4 border-black bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[12px_12px_0px_#000]"
                    style={{ filter: "url(#rough-paper)" }}
                >
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-black">Ready to Build Your Karma?</h2>
                    <p className="text-xl mb-10 font-bold text-black/70">Join the reputation layer for the developer workforce.</p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => router.push('/auth?role=student')}
                            className="flex items-center justify-center gap-3 bg-white text-black border-2 border-black px-10 py-5 font-black text-lg shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                        >
                            Start as Student <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => router.push('/auth?role=client')}
                            className="flex items-center justify-center gap-3 bg-black text-white border-2 border-black px-10 py-5 font-black text-lg shadow-[4px_4px_0px_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_0px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all"
                        >
                            Join as Client <Star size={20} />
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t-2 border-dashed border-black/20 py-8 text-center">
                <p className="text-sm font-bold opacity-40">The Resume is Dead. Long Live Karma.</p>
                <p className="text-xs font-medium opacity-30 mt-2">Built with conviction. Designed with a 2B Pencil.</p>
            </footer>
        </main>
    );
}
