'use client';

import React, { useRef, useState, KeyboardEvent } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Difficulty } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── SVG FILTERS ───────────────────────────────────────────────────────
export function HandDrawnFilters() {
    return (
        <svg className="fixed h-0 w-0 pointer-events-none">
            <defs>
                <filter id="rough-paper">
                    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                </filter>
                <filter id="pencil-texture">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" />
                    <feColorMatrix type="saturate" values="0" />
                    <feComposite operator="in" in2="SourceGraphic" />
                </filter>
            </defs>
        </svg>
    );
}

// ─── HIGHLIGHT ─────────────────────────────────────────────────────────
export function Highlight({ children, color = "#ffeb3b" }: { children: React.ReactNode, color?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10%" });

    return (
        <span ref={ref} className="relative inline-block px-1">
            <motion.span
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
                style={{ backgroundColor: color }}
                className="absolute bottom-1 left-0 -z-10 h-[80%] w-full origin-left -rotate-1 rounded-sm opacity-60"
            />
            {children}
        </span>
    );
}

// ─── SKETCH BUTTON ─────────────────────────────────────────────────────
export function SketchButton({ children, className, onClick, type = "button", disabled = false }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
}) {
    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled}
            whileHover={disabled ? {} : "hover"}
            whileTap={disabled ? {} : "tap"}
            className={cn(
                "group relative px-8 py-4 font-bold text-black flex items-center justify-center transition-opacity",
                disabled && "opacity-40 cursor-not-allowed",
                className
            )}
        >
            <div className="absolute inset-0 h-full w-full">
                <svg className="h-full w-full overflow-visible">
                    <motion.rect
                        x="2" y="2" width="98%" height="96%" rx="4"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ filter: "url(#rough-paper)" }}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                    />
                </svg>
            </div>
            <motion.div
                className="absolute inset-2 -z-10 bg-black opacity-0"
                variants={{
                    hover: { opacity: 0.1, scale: 1.05, transition: { duration: 0.2 } }
                }}
                style={{ filter: "url(#rough-paper)" }}
            />
            <span className="relative flex items-center gap-2">{children}</span>
        </motion.button>
    );
}

// ─── SKETCH INPUT ──────────────────────────────────────────────────────
export function SketchInput({ type, placeholder, icon: Icon, value, onChange, name }: {
    type: string;
    placeholder: string;
    icon: any;
    value?: string;
    onChange?: (e: any) => void;
    name?: string;
}) {
    return (
        <div className="relative group w-full">
            <div
                className="absolute inset-0 rounded-xl border-2 border-black bg-white shadow-sm pointer-events-none transition-all duration-300 group-focus-within:shadow-[4px_4px_0px_rgba(0,0,0,1)] group-focus-within:-translate-y-0.5 group-focus-within:-translate-x-0.5"
                style={{ filter: "url(#rough-paper)" }}
            />
            <div className="relative z-10 flex items-center px-4 py-4 gap-3">
                <Icon size={20} className="text-black/50 group-focus-within:text-black transition-colors duration-300" />
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full bg-transparent outline-none font-medium text-black placeholder:text-black/40"
                />
            </div>
        </div>
    );
}

// ─── SKETCH TEXTAREA ───────────────────────────────────────────────────
export function SketchTextarea({ placeholder, value, onChange, rows = 4 }: {
    placeholder: string;
    value?: string;
    onChange?: (e: any) => void;
    rows?: number;
}) {
    return (
        <div className="relative group w-full">
            <div
                className="absolute inset-0 rounded-xl border-2 border-black bg-white shadow-sm pointer-events-none transition-all duration-300 group-focus-within:shadow-[4px_4px_0px_rgba(0,0,0,1)] group-focus-within:-translate-y-0.5 group-focus-within:-translate-x-0.5"
                style={{ filter: "url(#rough-paper)" }}
            />
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                className="relative z-10 w-full bg-transparent outline-none font-medium text-black placeholder:text-black/40 px-4 py-4 resize-none"
            />
        </div>
    );
}

// ─── SKETCH CARD ───────────────────────────────────────────────────────
export function SketchCard({ title, icon: Icon, delay, description }: {
    title: string;
    icon: React.ReactNode;
    delay: number;
    description?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, rotate: Math.random() * 2 - 1 }}
            className="relative flex flex-col gap-4 p-8"
        >
            <div
                className="absolute inset-0 rounded-xl border-2 border-black bg-white shadow-sm"
                style={{ filter: "url(#rough-paper)" }}
            />
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-black bg-[#f0f0f0]">
                {Icon}
            </div>
            <h3 className="relative z-10 text-xl font-bold">{title}</h3>
            <p className="relative z-10 text-gray-600 leading-relaxed">
                {description || "Authentic, rough edges that communicate a human touch in a digital world."}
            </p>
        </motion.div>
    )
}

// ─── DRAWN ARROW ───────────────────────────────────────────────────────
export function DrawnArrow() {
    return (
        <svg width="100" height="100" viewBox="0 0 100 100" className="absolute -right-20 -top-8 hidden md:block rotate-[24deg]">
            <motion.path
                d="M10,50 Q50,10 90,50 M60,50 L90,50 L80,20"
                fill="none"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
                style={{ filter: "url(#rough-paper)" }}
            />
            <motion.text
                x="15" y="80"
                fontFamily="monospace"
                fontSize="12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                Join us!
            </motion.text>
        </svg>
    );
}

// ─── KARMA BADGE ───────────────────────────────────────────────────────
export function KarmaBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'text-lg px-3 py-1',
        md: 'text-2xl px-4 py-2',
        lg: 'text-4xl px-6 py-3',
    };

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
                "inline-flex items-center gap-2 font-black border-2 border-black bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-[4px_4px_0px_rgba(0,0,0,1)]",
                sizeClasses[size]
            )}
            style={{ filter: "url(#rough-paper)" }}
        >
            <span className="text-sm font-bold opacity-80">⚡</span>
            <span>{score}</span>
            <span className={cn("font-bold opacity-70", size === 'sm' ? 'text-xs' : 'text-sm')}>KARMA</span>
        </motion.div>
    );
}

// ─── DIFFICULTY BADGE ──────────────────────────────────────────────────
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
    const config = {
        easy: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-600', label: 'Easy' },
        medium: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-600', label: 'Medium' },
        hard: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-600', label: 'Hard' },
    };
    const c = config[difficulty];

    return (
        <span className={cn("px-3 py-1 text-xs font-black uppercase tracking-wider border-2 rotate-1", c.bg, c.text, c.border)}
              style={{ filter: "url(#rough-paper)" }}>
            {c.label}
        </span>
    );
}

// ─── STATUS PILL ───────────────────────────────────────────────────────
export function StatusPill({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; dot: string }> = {
        open: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
        claimed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
        submitted: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
        approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        flagged: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
        revision: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    };
    const c = config[status] || config.open;

    return (
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize", c.bg, c.text)}>
            <span className={cn("w-2 h-2 rounded-full animate-pulse", c.dot)} />
            {status}
        </span>
    );
}

// ─── TAG INPUT ─────────────────────────────────────────────────────────
export function TagInput({ tags, onChange, placeholder = "Add skill..." }: {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}) {
    const [input, setInput] = useState('');

    const addTag = () => {
        const trimmed = input.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInput('');
    };

    const removeTag = (tag: string) => {
        onChange(tags.filter(t => t !== tag));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
        if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <div className="relative group w-full">
            <div
                className="absolute inset-0 rounded-xl border-2 border-black bg-white shadow-sm pointer-events-none transition-all duration-300 group-focus-within:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                style={{ filter: "url(#rough-paper)" }}
            />
            <div className="relative z-10 flex flex-wrap items-center gap-2 px-4 py-3">
                {tags.map(tag => (
                    <span key={tag} className="tag-chip">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-600 transition-colors">
                            <X size={12} />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[100px] bg-transparent outline-none font-medium text-black placeholder:text-black/40 py-1"
                />
            </div>
        </div>
    );
}

// ─── PROGRESS RING ─────────────────────────────────────────────────────
export function ProgressRing({ value, max, size = 120, label }: {
    value: number;
    max: number;
    size?: number;
    label?: string;
}) {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / max, 1);
    const offset = circumference - (progress * circumference);

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Background ring */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="#e5e7eb" strokeWidth="8"
                />
                {/* Progress ring */}
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke="url(#karmaGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                    <linearGradient id="karmaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black">{value}</span>
                {label && <span className="text-xs font-bold text-gray-500 uppercase">{label}</span>}
            </div>
        </div>
    );
}

// ─── TREND INDICATOR ───────────────────────────────────────────────────
export function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'stable' }) {
    if (trend === 'up') return <TrendingUp size={16} className="text-green-600" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-red-600" />;
    return <Minus size={16} className="text-gray-400" />;
}

// ─── SKETCH SELECT ─────────────────────────────────────────────────────
export function SketchSelect({ options, value, onChange, icon: Icon, placeholder }: {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    icon?: any;
    placeholder?: string;
}) {
    return (
        <div className="relative group w-full">
            <div
                className="absolute inset-0 rounded-xl border-2 border-black bg-white shadow-sm pointer-events-none transition-all duration-300 group-focus-within:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                style={{ filter: "url(#rough-paper)" }}
            />
            <div className="relative z-10 flex items-center px-4 py-4 gap-3">
                {Icon && <Icon size={20} className="text-black/50" />}
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-transparent outline-none font-medium text-black appearance-none cursor-pointer"
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
