'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Code2, Star, ArrowRight, Lock, LogIn } from 'lucide-react';
import { HandDrawnFilters, Highlight } from '@/components/HandDrawn';
import { useAuth } from '@/lib/auth-context';
import { MOCK_STUDENTS, MOCK_CLIENTS } from '@/lib/mock-data';
import type { UserRole, Domain } from '@/lib/types';

function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { register, login: authLogin, mockLogin } = useAuth();

    const initialRole = (searchParams.get('role') as UserRole) || 'student';
    const [role, setRole] = useState<UserRole>(initialRole);
    const [isLogin, setIsLogin] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [domain, setDomain] = useState<Domain>('Backend');
    const [quickLogin, setQuickLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const domains: { label: string; value: Domain }[] = [
        { label: 'Frontend', value: 'Frontend' },
        { label: 'Backend', value: 'Backend' },
        { label: 'Data', value: 'Data' },
        { label: 'DevOps', value: 'DevOps' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;
        if (!isLogin && !name.trim()) return;

        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                // Login flow
                await authLogin(email.trim(), password.trim());
                router.push('/dashboard');
            } else {
                // Register flow
                await register({
                    email: email.trim(),
                    password: password.trim(),
                    name: name.trim(),
                    role,
                    domain,
                });
                // New users go to profile setup
                router.push('/auth/setup');
            }
        } catch (err: any) {
            setError(err.message || (isLogin ? 'Login failed' : 'Registration failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = (userId: string) => {
        const allUsers = [...MOCK_STUDENTS, ...MOCK_CLIENTS];
        const user = allUsers.find(u => u.id === userId);
        if (user) {
            mockLogin(user);
            router.push(user.role === 'student' ? '/dashboard' : '/dashboard/client');
        }
    };

    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-[#fdfbf7] font-sans text-[#2d2d2d] selection:bg-[#ffeb3b]">
            <HandDrawnFilters />

            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none">
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-amber-400 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ opacity: [0.4, 0.7, 0.4], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-cyan-400 rounded-full blur-[120px]"
                />
            </div>

            <div
                className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Nav */}
            <nav className="relative z-10 flex w-full items-center justify-between px-8 py-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl font-black tracking-tight cursor-pointer"
                    onClick={() => router.push('/')}
                >
                    Kramic<span className="text-amber-500">.sh</span>
                </motion.div>
            </nav>

            <section className="relative z-10 flex min-h-[85vh] items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-lg"
                >
                    {/* Logo/Icon */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 0.8 }}
                            className="w-16 h-16 bg-black border-4 border-black rounded-xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(255,235,59,0.4)] relative"
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            <div className="w-8 h-8 bg-amber-400 rounded-lg rotate-45" style={{ filter: "url(#rough-paper)" }} />
                        </motion.div>
                        <h1 className="text-4xl font-black mb-3 tracking-tight">
                            {isLogin ? 'Welcome Back' : 'Join'} <Highlight color="#ffeb3b">Kramic</Highlight>
                        </h1>
                        <p className="text-gray-600 font-medium">
                            {isLogin ? 'Sign in to continue building your karma.' : 'Your work graph starts here. No resume needed.'}
                        </p>
                    </div>

                    {/* Login / Register Toggle */}
                    <div className="flex gap-4 mb-6">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setIsLogin(false); setError(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 border-4 border-black font-black text-base transition-all ${!isLogin ? 'bg-black text-white shadow-[4px_4px_0px_#ffeb3b]' : 'bg-white hover:bg-gray-50'}`}
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            <User size={18} /> Register
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setIsLogin(true); setError(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 border-4 border-black font-black text-base transition-all ${isLogin ? 'bg-black text-white shadow-[4px_4px_0px_#a5f3fc]' : 'bg-white hover:bg-gray-50'}`}
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            <LogIn size={18} /> Login
                        </motion.button>
                    </div>

                    {/* Role Selector (only for register) */}
                    {!isLogin && (
                        <div className="flex gap-4 mb-6">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setRole('student')}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 border-3 border-black font-bold text-sm transition-all ${role === 'student' ? 'bg-amber-100 shadow-[4px_4px_0px_rgba(0,0,0,0.3)]' : 'bg-white'}`}
                                style={{ filter: "url(#rough-paper)" }}
                            >
                                <Code2 size={16} /> Student
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setRole('client')}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 border-3 border-black font-bold text-sm transition-all ${role === 'client' ? 'bg-cyan-100 shadow-[4px_4px_0px_rgba(0,0,0,0.3)]' : 'bg-white'}`}
                                style={{ filter: "url(#rough-paper)" }}
                            >
                                <Star size={16} /> Client
                            </motion.button>
                        </div>
                    )}

                    {/* Quick Demo Login */}
                    <div className="mb-6">
                        <button
                            onClick={() => setQuickLogin(!quickLogin)}
                            className="text-sm font-bold text-amber-600 underline decoration-wavy hover:text-amber-800 transition-colors"
                        >
                            {quickLogin ? 'Hide' : 'Quick Demo Login'} — use a pre-made account
                        </button>

                        {quickLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4 space-y-2"
                            >
                                {(role === 'student' ? MOCK_STUDENTS : MOCK_CLIENTS).map(user => (
                                    <motion.button
                                        key={user.id}
                                        whileHover={{ x: 4 }}
                                        onClick={() => handleQuickLogin(user.id)}
                                        className="w-full flex items-center justify-between p-3 border-2 border-black bg-white hover:bg-amber-50 font-medium transition-colors text-left"
                                        style={{ filter: "url(#rough-paper)" }}
                                    >
                                        <div>
                                            <span className="font-bold">{user.name}</span>
                                            <span className="text-gray-500 ml-2 text-sm">{user.domain}</span>
                                            {user.role === 'client' && <span className="text-amber-600 ml-2 text-sm font-bold">@ {user.company}</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {user.role === 'student' && (
                                                <span className="bg-amber-400 text-black px-2 py-0.5 text-xs font-black">K:{user.karma_score}</span>
                                            )}
                                            <ArrowRight size={16} />
                                        </div>
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 border-t-2 border-dashed border-black/20" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {isLogin ? 'sign in' : 'create account'}
                        </span>
                        <div className="flex-1 border-t-2 border-dashed border-black/20" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name field — only for register */}
                        {!isLogin && (
                            <div className="group relative">
                                <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors z-10" size={18} />
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-white border-2 border-black rounded-xl py-3 pl-12 pr-4 text-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 relative"
                                    style={{ filter: "url(#rough-paper)" }}
                                />
                            </div>
                        )}

                        <div className="group relative">
                            <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors z-10" size={18} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-white border-2 border-black rounded-xl py-3 pl-12 pr-4 text-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 relative"
                                style={{ filter: "url(#rough-paper)" }}
                            />
                        </div>

                        <div className="group relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors z-10" size={18} />
                            <input
                                type="password"
                                placeholder="Password (min 6 characters)"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-white border-2 border-black rounded-xl py-3 pl-12 pr-4 text-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 relative"
                                style={{ filter: "url(#rough-paper)" }}
                            />
                        </div>

                        {/* Domain selector — only for register */}
                        {!isLogin && (
                            <div className="group relative">
                                <Code2 className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors z-10" size={18} />
                                <select
                                    value={domain}
                                    onChange={e => setDomain(e.target.value as Domain)}
                                    className="w-full bg-white border-2 border-black rounded-xl py-3 pl-12 pr-4 text-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all appearance-none cursor-pointer relative"
                                    style={{ filter: "url(#rough-paper)" }}
                                >
                                    {domains.map(d => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-red-100 border-2 border-red-600 text-red-800 font-bold text-sm rounded-lg"
                            >
                                {error}
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading || !email.trim() || !password.trim() || (!isLogin && !name.trim())}
                            type="submit"
                            className="w-full flex items-center justify-center gap-3 bg-black text-white border-4 border-black px-8 py-4 font-black text-lg shadow-[8px_8px_0px_#ffeb3b] hover:shadow-[12px_12px_0px_#ffeb3b] hover:-translate-y-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-[4px_4px_0px_#ffeb3b] disabled:translate-y-0 relative overflow-hidden"
                        >
                            <span className={`relative z-10 flex items-center justify-center gap-2 ${loading && 'opacity-0'}`}>
                                {isLogin ? (
                                    <>Sign In <LogIn size={20} /></>
                                ) : (
                                    <>{role === 'student' ? 'Start Building Karma' : 'Start Posting Tasks'} <ArrowRight size={20} /></>
                                )}
                            </span>
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </motion.button>
                    </form>

                    <p className="text-center text-xs text-gray-400 font-medium mt-6">
                        No college name field. By design.
                    </p>
                </motion.div>
            </section>
        </main>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center font-black text-2xl">Loading...</div>}>
            <AuthForm />
        </Suspense>
    );
}
