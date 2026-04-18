'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Code2, Github, Briefcase, Camera, Sparkles } from 'lucide-react';
import { 
    HandDrawnFilters, 
    Highlight, 
    SketchInput, 
    SketchSelect, 
    SketchButton, 
    TagInput, 
    SketchTextarea 
} from '@/components/HandDrawn';
import { useAuth } from '@/lib/auth-context';
import type { Domain } from '@/lib/types';

const PRESET_AVATARS = [
    { id: '1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix' },
    { id: '2', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka' },
    { id: '3', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Caleb' },
    { id: '4', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mimi' },
    { id: '5', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Jasper' },
    { id: '6', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Luna' },
];

export default function ProfileSetupPage() {
    const router = useRouter();
    const { user, setupProfile, isLoading } = useAuth();
    
    const [domain, setDomain] = useState<Domain>('Backend');
    const [skills, setSkills] = useState<string[]>([]);
    const [bio, setBio] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
    const [company, setCompany] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth');
        } else if (user?.profile_completed) {
            router.push(user.role === 'student' ? '/dashboard' : '/dashboard/client');
        }
    }, [user, isLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (skills.length === 0) {
            setError('Please add at least one skill!');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await setupProfile({
                domain,
                skills,
                bio,
                github_url: githubUrl,
                avatar_url: avatarUrl,
                company: user?.role === 'client' ? company : undefined,
            });
            router.push(user?.role === 'student' ? '/dashboard' : '/dashboard/client');
        } catch (err: any) {
            setError(err.message || 'Failed to complete profile setup');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading || !user) {
        return <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center font-black text-2xl">Loading...</div>;
    }

    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-[#fdfbf7] font-sans text-[#2d2d2d]">
            <HandDrawnFilters />
            
            {/* Background elements */}
            <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                }}
            />

            <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-4xl font-black mb-4 tracking-tight">
                        Complete Your <Highlight color="#fff176">Profile</Highlight>
                    </h1>
                    <p className="text-gray-600 font-medium">
                        Tell us about your craft. Your <span className="text-amber-600 font-bold underline decoration-wavy">Karma</span> starts here.
                    </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Avatar Selection */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 font-black text-lg">
                            <Camera size={20} className="text-amber-500" />
                            Choose Your Avatar
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                            {PRESET_AVATARS.map((avatar) => (
                                <motion.button
                                    key={avatar.id}
                                    type="button"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setAvatarUrl(avatar.url)}
                                    className={`relative aspect-square rounded-xl border-2 border-black overflow-hidden transition-all ${
                                        avatarUrl === avatar.url 
                                        ? 'ring-4 ring-amber-400 p-1 bg-amber-50' 
                                        : 'bg-white grayscale hover:grayscale-0'
                                    }`}
                                    style={{ filter: "url(#rough-paper)" }}
                                >
                                    <img src={avatar.url} alt="Avatar" className="w-full h-full object-cover" />
                                    {avatarUrl === avatar.url && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-amber-400/20">
                                            <Sparkles className="text-amber-600" size={24} />
                                        </div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Domain */}
                        <div className="space-y-2">
                            <label className="block font-black text-sm uppercase tracking-wider text-gray-500">Domain</label>
                            <SketchSelect
                                icon={Code2}
                                value={domain}
                                onChange={(val) => setDomain(val as Domain)}
                                options={[
                                    { label: 'Frontend', value: 'Frontend' },
                                    { label: 'Backend', value: 'Backend' },
                                    { label: 'Data', value: 'Data' },
                                    { label: 'DevOps', value: 'DevOps' },
                                ]}
                            />
                        </div>

                        {/* GitHub */}
                        <div className="space-y-2">
                            <label className="block font-black text-sm uppercase tracking-wider text-gray-500">GitHub Profile URL</label>
                            <SketchInput
                                icon={Github}
                                type="url"
                                placeholder="https://github.com/yourusername"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Role-specific field */}
                    {user.role === 'client' && (
                        <div className="space-y-2">
                            <label className="block font-black text-sm uppercase tracking-wider text-gray-500">Company / Organization</label>
                            <SketchInput
                                icon={Briefcase}
                                type="text"
                                placeholder="Name of your company"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Skills */}
                    <div className="space-y-2">
                        <label className="block font-black text-sm uppercase tracking-wider text-gray-500">Skills (Press Enter to add)</label>
                        <TagInput
                            tags={skills}
                            onChange={setSkills}
                            placeholder="React, Python, AWS, Figma..."
                        />
                        <p className="text-xs text-gray-400 font-medium italic">Add skills you're actually good at. Karma is unforgiving. ⚔️</p>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="block font-black text-sm uppercase tracking-wider text-gray-500">Short Bio</label>
                        <SketchTextarea
                            placeholder="What are you building? Keep it punchy."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-red-100 border-2 border-red-600 text-red-800 font-bold rounded-xl"
                            style={{ filter: "url(#rough-paper)" }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <SketchButton
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-[#ffeb3b] text-black shadow-[6px_6px_0px_#000] hover:shadow-[10px_10px_0px_#000] h-16 text-xl"
                    >
                        {submitting ? 'Creating Identity...' : 'Finish Profile & Claim Karma'} <ArrowRight className="ml-2" />
                    </SketchButton>
                </form>

                <p className="text-center text-xs text-gray-400 font-medium mt-10">
                    Your identity is your work. Resume fields have been removed. Forever. 🏁
                </p>
            </div>
        </main>
    );
}
