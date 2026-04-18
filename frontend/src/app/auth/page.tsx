'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Code2, Star, ArrowRight, Lock } from 'lucide-react';
import { HandDrawnFilters, Highlight } from '@/components/HandDrawn';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/api';
import { MOCK_STUDENTS, MOCK_CLIENTS } from '@/lib/mock-data';
import type { UserRole, Domain } from '@/lib/types';
import { initializeGoogleAuth } from '@/lib/google-auth';

function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { register, login: authLogin, googleLogin, mockLogin } = useAuth();

    const initialRole = (searchParams.get('role') as UserRole) || 'student';
    const [role, setRole] = useState<UserRole>(initialRole);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [domain, setDomain] = useState<Domain>('Backend');
    const [skills, setSkills] = useState<string[]>([]);
    const [quickLogin, setQuickLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [googleReady, setGoogleReady] = React.useState(false);

    React.useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        
        // Skip Google auth if no real client ID is configured
        if (!clientId || clientId === 'your-google-client-id.apps.googleusercontent.com') {
            console.warn('Google OAuth: No valid client ID configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local');
            return;
        }

        const cleanup = initializeGoogleAuth(clientId, async (response) => {
            setLoading(true);
            setError('');
            try {
                await googleLogin(response.credential, { role });
                // The googleLogin function already sets the user state
                // Just redirect based on the response
                router.push('/auth/setup'); // New users always go to setup first
            } catch (err: any) {
                console.error('Google login error:', err);
                setError(err.message || 'Google login failed');
            } finally {
                setLoading(false);
            }
        });

        setGoogleReady(true);
        return cleanup;
    }, [role, googleLogin, router]);

    const domains: { label: string; value: Domain }[] = [
        { label: 'Frontend', value: 'Frontend' },
        { label: 'Backend', value: 'Backend' },
        { label: 'Data', value: 'Data' },
        { label: 'DevOps', value: 'DevOps' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password.trim()) return;

        setLoading(true);
        setError('');

        try {
            await register({
                email: email.trim(),
                password: password.trim(),
                name: name.trim(),
                role,
                domain,
                skills,
                company: role === 'client' ? 'Demo Corp' : undefined,
            });
            
            // Check if user needs profile setup
            const userData = await authApi.getMe();
            if (!userData.profile_completed) {
                router.push('/auth/setup');
            } else {
                router.push(userData.role === 'student' ? '/dashboard' : '/dashboard/client');
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = (userId: string) => {
        const allUsers = [...MOCK_STUDENTS, ...MOCK_CLIENTS];
        const user = allUsers.find(u => u.id === userId);
        if (user) {
            // Use AuthContext's mockLogin explicitly so it updates state
            mockLogin(user);
            router.push(user.role === 'student' ? '/dashboard' : '/dashboard/client');
        }
    };

    const handleGoogleLogin = () => {
        if (!googleReady) {
            setError('Google Sign-In not configured. Use the form above or Quick Demo Login instead.');
            return;
        }
        if (window.google) {
            window.google.accounts.id.prompt();
        } else {
            setError('Google Sign-In not ready. Please try again.');
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
                            Welcome to <Highlight color="#ffeb3b">Kramic</Highlight>
                        </h1>
                        <p className="text-gray-600 font-medium">Your work graph starts here. No resume needed.</p>
                    </div>

                    {/* Role Selector */}
                    <div className="flex gap-4 mb-8">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setRole('student')}
                            className={`flex-1 flex items-center justify-center gap-2 p-4 border-4 border-black font-black text-lg transition-all sketch-border-1 ${role === 'student' ? 'bg-black text-white shadow-[6px_6px_0px_#ffeb3b]' : 'bg-white hover:shadow-[4px_4px_0px_rgba(0,0,0,0.2)]'}`}
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            <Code2 size={20} /> Student
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setRole('client')}
                            className={`flex-1 flex items-center justify-center gap-2 p-4 border-4 border-black font-black text-lg transition-all sketch-border-2 ${role === 'client' ? 'bg-black text-white shadow-[6px_6px_0px_#a5f3fc]' : 'bg-white hover:shadow-[4px_4px_0px_rgba(0,0,0,0.2)]'}`}
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            <Star size={20} /> Client
                        </motion.button>
                    </div>

                    {/* Quick Login */}
                    <div className="mb-8">
                        <button
                            onClick={() => setQuickLogin(!quickLogin)}
                            className="text-sm font-bold text-amber-600 underline decoration-wavy hover:text-amber-800 transition-colors"
                        >
                            {quickLogin ? 'Hide' : '⚡ Quick Demo Login'} — use a pre-made account
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
                                                <span className="bg-amber-400 text-black px-2 py-0.5 text-xs font-black">⚡{user.karma_score}</span>
                                            )}
                                            <ArrowRight size={16} />
                                        </div>
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex-1 border-t-2 border-dashed border-black/20" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">or create new</span>
                        <div className="flex-1 border-t-2 border-dashed border-black/20" />
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
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

                        <div className="group relative">
                            <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors z-10" size={18} />
                            <input
                                type="email"
                                placeholder={role === 'client' ? 'Work Email' : 'Email Address'}
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
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-white border-2 border-black rounded-xl py-3 pl-12 pr-4 text-black font-medium focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 relative"
                                style={{ filter: "url(#rough-paper)" }}
                            />
                        </div>

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
                            disabled={loading || !name.trim() || !email.trim() || !password.trim()}
                            type="submit"
                            className="w-full flex items-center justify-center gap-3 bg-black text-white border-4 border-black px-8 py-4 font-black text-lg shadow-[8px_8px_0px_#ffeb3b] hover:shadow-[12px_12px_0px_#ffeb3b] hover:-translate-y-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-[4px_4px_0px_#ffeb3b] disabled:translate-y-0 relative overflow-hidden"
                        >
                            <span className={`relative z-10 flex items-center justify-center gap-2 ${loading && 'opacity-0'}`}>
                                {role === 'student' ? 'Start Building Karma' : 'Start Posting Tasks'} <ArrowRight size={20} />
                            </span>
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </motion.button>
                    </form>

                    {/* Social Login */}
                    <div className="mt-8 flex items-center gap-4">
                        <div className="h-px bg-black/20 flex-1" />
                        <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Or continue with</span>
                        <div className="h-px bg-black/20 flex-1" />
                    </div>

                    <div className="mt-6">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white border-2 border-black hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black font-bold transition-all"
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                                <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                                <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                                <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </motion.button>
                    </div>

                    <p className="text-center text-xs text-gray-400 font-medium mt-6">
                        No college name field. By design. 🎯
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
