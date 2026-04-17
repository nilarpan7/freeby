'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { HandDrawnFilters, Highlight, SketchButton } from '@/components/HandDrawn';
import '@xterm/xterm/css/xterm.css';

export default function Arena() {
    const { id } = useParams();
    const router = useRouter();
    const terminalRef = useRef<HTMLDivElement>(null);
    const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 mins
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            theme: { background: '#1e1e1e', cursor: '#ffeb3b', foreground: '#f0f0f0' },
            fontFamily: 'monospace',
            fontSize: 14,
            cursorBlink: true,
        });
        
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        term.write('\x1b[33mConnecting to Karmic.sh Hypervisor...\x1b[0m\r\n');

        const ws = new WebSocket(`ws://localhost:8000/ws/arena/${id}`);

        ws.onopen = () => {
            term.write('\x1b[32mWebSocket Connected.\x1b[0m\r\n');
        };

        ws.onmessage = (event) => {
            term.write(event.data);
            if (event.data.includes("Pod Destroyed")) {
                setCompleted(true);
            }
        };

        term.onData(data => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });

        // Resize observer to keep terminal fit
        const observer = new ResizeObserver(() => fitAddon.fit());
        observer.observe(terminalRef.current);

        return () => {
            ws.close();
            term.dispose();
            observer.disconnect();
        };
    }, [id]);

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <main className="relative min-h-screen w-full bg-[#fdfbf7] p-8 text-[#2d2d2d]">
            <HandDrawnFilters />
            
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] opacity-20 pointer-events-none" />

            <nav className="relative z-10 flex w-full items-center justify-between py-2 mb-8">
                <div className="font-bold underline decoration-wavy cursor-pointer" onClick={() => router.push('/dashboard')}>
                    ← Back to Sandbox
                </div>
                <div className="text-2xl font-black px-4 py-2 border-2 border-black bg-[#ffeb3b] rotate-2 shadow-[4px_4px_0px_rgba(0,0,0,1)]" style={{ filter: "url(#rough-paper)" }}>
                    {formatTime(timeLeft)}
                </div>
            </nav>

            <div className="relative z-10 max-w-6xl mx-auto h-[75vh] flex gap-8">
                {/* Left Panel: Instructions */}
                <div className="w-1/3 flex flex-col gap-6">
                    <div className="p-6 bg-white border-4 border-black relative" style={{ filter: "url(#rough-paper)", borderRadius: "255px 15px 225px 15px/15px 225px 15px 255px" }}>
                        <h2 className="text-3xl font-black mb-4">Task <Highlight color="#bbf7d0">Brief</Highlight></h2>
                        <ul className="space-y-4 font-medium text-gray-700">
                            <li><strong>Requirement:</strong> Write a script to extract the top 3 items based on column B in an Excel file.</li>
                            <li><strong>Stack:</strong> Python, pandas</li>
                            <li><strong>Environment:</strong> python:3.9-slim (ephemeral pod)</li>
                        </ul>
                    </div>

                    {completed && (
                         <div className="p-6 bg-[#ffeb3b] border-4 border-black relative animate-pulse" style={{ filter: "url(#rough-paper)", borderRadius: "15px 255px 15px 225px/225px 15px 255px 15px" }}>
                            <h2 className="text-2xl font-black mb-2">PoW Minted! 🎉</h2>
                            <p className="font-medium">Your work has been containerized and hashed.</p>
                            <SketchButton className="w-full mt-4 bg-white" onClick={() => router.push('/dashboard')}>Return to Board</SketchButton>
                        </div>
                    )}
                </div>

                {/* Right Panel: Terminal */}
                <div className="w-2/3 relative group">
                    <div
                        className="absolute inset-0 bg-black border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,0.2)] pointer-events-none"
                        style={{ filter: "url(#rough-paper)", borderRadius: "15px" }}
                    />
                    <div className="relative z-10 w-full h-full p-4 rounded-xl overflow-hidden bg-[#1e1e1e]">
                        <div ref={terminalRef} className="w-full h-full" />
                    </div>
                </div>
            </div>
        </main>
    );
}
