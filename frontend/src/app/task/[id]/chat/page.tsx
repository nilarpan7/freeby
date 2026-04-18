'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { HandDrawnFilters } from '@/components/HandDrawn';
import { useAuth } from '@/lib/auth-context';
import { taskApi } from '@/lib/api';
import TaskChat from '../components/TaskChat';

export default function TaskChatPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [task, setTask] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!id) return;
        
        const loadTask = async () => {
            try {
                const data = await taskApi.getTask(id as string);
                setTask(data);
            } catch (err) {
                console.error("Failed to load task:", err);
            } finally {
                setLoading(false);
            }
        };

        loadTask();
    }, [id]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center font-black text-2xl">
                Loading Workspace...
            </div>
        );
    }

    if (!task || !user) {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center">
                <h1 className="text-4xl font-black mb-4">Workspace Not Found</h1>
                <button onClick={() => router.back()} className="font-bold underline hover:text-amber-600 transition-colors">
                    ← Go Back
                </button>
            </div>
        );
    }

    const isClient = user.id === task.client_id || user.id === task.client_telegram_id;
    const isAssignee = user.id === task.assignee_id;

    if (!isClient && !isAssignee) {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center">
                <h1 className="text-4xl font-black mb-4">Access Denied</h1>
                <p className="font-bold mb-4">You are not a participant in this task.</p>
                <button onClick={() => router.back()} className="font-bold underline hover:text-amber-600 transition-colors">
                    ← Go Back
                </button>
            </div>
        );
    }

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

            <nav className="sticky top-0 z-50 flex w-full items-center justify-between px-6 md:px-8 py-4 backdrop-blur-md bg-[#fdfbf7]/80 border-b border-black/5">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 font-bold hover:text-amber-600 transition-colors"
                    >
                        <ArrowLeft size={20} /> Back to Task
                    </button>
                </div>
                <div className="text-xl font-black truncate max-w-sm">
                    {task.title}
                </div>
            </nav>

            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 py-8 h-[calc(100vh-80px)] flex flex-col">
                <div className="flex-1 w-full flex flex-col max-h-full">
                    <TaskChat
                        taskId={task.id}
                        currentUserId={user.id}
                        currentUserRole={user.role}
                        clientName={task.client_name}
                    />
                </div>
            </div>
        </main>
    );
}
