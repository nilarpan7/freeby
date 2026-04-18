'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Zap, Calendar, Activity, Award } from 'lucide-react';
import { questApi } from '@/lib/api';
import type { KarmaGraphData, KarmaGraphDay } from '@/lib/types';

interface KarmaWorkGraphProps {
  userId: string;
  currentKarma: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function KarmaWorkGraph({ userId, currentKarma, isOpen, onClose }: KarmaWorkGraphProps) {
  const [graphData, setGraphData] = useState<KarmaGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<KarmaGraphDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && userId) {
      loadGraphData();
    }
  }, [isOpen, userId]);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      const data = await questApi.getKarmaGraph(userId);
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load karma graph:', err);
      // Generate mock data for demo
      setGraphData(generateMockData(currentKarma));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const days = graphData?.daily_data || [];
  const maxKarma = Math.max(...days.map(d => d.cumulative), currentKarma, 1);
  const maxDaily = Math.max(...days.map(d => d.karma_earned), 1);

  // Generate last 30 days for GitHub-style grid
  const last30Days = generateLast30Days(days);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto bg-[#fdfbf7] border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,1)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#fdfbf7] border-b-4 border-black p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 border-3 border-black flex items-center justify-center">
                <Activity size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Karma Work Graph</h2>
                <p className="text-sm text-gray-500 font-medium">Your contribution activity</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 border-2 border-black hover:bg-red-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-8 h-8 border-4 border-black border-t-amber-500 rounded-full"
                />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={<Zap size={20} />}
                    label="Current Karma"
                    value={graphData?.current_karma || currentKarma}
                    color="amber"
                  />
                  <StatCard
                    icon={<TrendingUp size={20} />}
                    label="Total Earned"
                    value={days.reduce((s, d) => s + d.karma_earned, 0)}
                    color="green"
                  />
                  <StatCard
                    icon={<Calendar size={20} />}
                    label="Active Days"
                    value={days.length}
                    color="blue"
                  />
                  <StatCard
                    icon={<Award size={20} />}
                    label="Events"
                    value={graphData?.total_events || 0}
                    color="purple"
                  />
                </div>

                {/* Contribution Grid (GitHub-style) */}
                <div className="bg-white border-4 border-black p-6">
                  <h3 className="font-black text-lg mb-4">Activity Grid</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {last30Days.map((day, i) => {
                      const intensity = day.karma_earned > 0
                        ? Math.min(Math.ceil((day.karma_earned / maxDaily) * 4), 4)
                        : 0;
                      const colors = [
                        'bg-gray-100 border-gray-200',
                        'bg-green-200 border-green-300',
                        'bg-green-400 border-green-500',
                        'bg-green-600 border-green-700',
                        'bg-green-800 border-green-900',
                      ];
                      return (
                        <motion.div
                          key={day.date}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className={`w-7 h-7 border-2 cursor-pointer transition-transform hover:scale-125 ${colors[intensity]}`}
                          title={`${day.date}: +${day.karma_earned} karma`}
                          onMouseEnter={(e) => {
                            setHoveredDay(day);
                            setTooltipPos({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-xs font-bold text-gray-500">
                    <span>Less</span>
                    {['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-800'].map((c, i) => (
                      <div key={i} className={`w-4 h-4 border border-black/20 ${c}`} />
                    ))}
                    <span>More</span>
                  </div>
                </div>

                {/* Karma Line Chart */}
                <div className="bg-white border-4 border-black p-6">
                  <h3 className="font-black text-lg mb-4">Karma Growth</h3>
                  {days.length > 0 ? (
                    <div className="relative h-48">
                      <svg viewBox="0 0 600 180" className="w-full h-full" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                          <line
                            key={ratio}
                            x1="0" y1={170 - ratio * 160}
                            x2="600" y2={170 - ratio * 160}
                            stroke="#e5e7eb" strokeWidth="1"
                          />
                        ))}

                        {/* Area fill */}
                        <defs>
                          <linearGradient id="karmaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        <motion.path
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 1.5, ease: 'easeInOut' }}
                          d={buildAreaPath(days, maxKarma)}
                          fill="url(#karmaGradient)"
                        />

                        {/* Line */}
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.5, ease: 'easeInOut' }}
                          d={buildLinePath(days, maxKarma)}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data points */}
                        {days.map((day, i) => {
                          const x = days.length > 1 ? (i / (days.length - 1)) * 580 + 10 : 300;
                          const y = 170 - (day.cumulative / maxKarma) * 160;
                          return (
                            <motion.circle
                              key={day.date}
                              initial={{ r: 0 }}
                              animate={{ r: 4 }}
                              transition={{ delay: 0.5 + i * 0.1 }}
                              cx={x}
                              cy={y}
                              fill="#f59e0b"
                              stroke="#000"
                              strokeWidth="2"
                            />
                          );
                        })}
                      </svg>

                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs font-bold text-gray-400 pointer-events-none">
                        <span>{maxKarma}</span>
                        <span>{Math.round(maxKarma / 2)}</span>
                        <span>0</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400 font-medium">
                      <p className="text-xl mb-2">📊</p>
                      <p>Complete quests to see your karma grow!</p>
                    </div>
                  )}
                </div>

                {/* Recent Events */}
                <div className="bg-white border-4 border-black p-6">
                  <h3 className="font-black text-lg mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {days.length > 0 ? (
                      [...days].reverse().slice(0, 8).map((day, i) => (
                        <motion.div
                          key={day.date}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between py-2 border-b border-dashed border-gray-200 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="font-medium text-sm">
                              {day.events.map(e => e.title).join(', ') || day.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{day.date}</span>
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 text-xs font-black">
                              +{day.karma_earned}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-gray-400 font-medium text-center py-4">
                        No activity yet. Start a quest to build your karma!
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tooltip */}
          {hoveredDay && (
            <div
              className="fixed z-[200] bg-black text-white px-3 py-2 text-xs font-bold pointer-events-none shadow-lg"
              style={{ left: tooltipPos.x + 10, top: tooltipPos.y - 40 }}
            >
              <div>{hoveredDay.date}</div>
              <div className="text-amber-400">+{hoveredDay.karma_earned} karma</div>
              {hoveredDay.events.map((e, i) => (
                <div key={i} className="text-gray-300">{e.title}</div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Helper Components & Functions ───

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 border-amber-600 text-amber-800',
    green: 'bg-green-50 border-green-600 text-green-800',
    blue: 'bg-blue-50 border-blue-600 text-blue-800',
    purple: 'bg-purple-50 border-purple-600 text-purple-800',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`p-4 border-3 ${colorMap[color]} flex flex-col items-center gap-1`}
    >
      {icon}
      <span className="text-2xl font-black">{value}</span>
      <span className="text-xs font-bold uppercase opacity-70">{label}</span>
    </motion.div>
  );
}

function buildLinePath(days: KarmaGraphDay[], maxKarma: number): string {
  if (days.length === 0) return '';
  const points = days.map((d, i) => {
    const x = days.length > 1 ? (i / (days.length - 1)) * 580 + 10 : 300;
    const y = 170 - (d.cumulative / maxKarma) * 160;
    return `${x},${y}`;
  });
  return `M ${points.join(' L ')}`;
}

function buildAreaPath(days: KarmaGraphDay[], maxKarma: number): string {
  if (days.length === 0) return '';
  const points = days.map((d, i) => {
    const x = days.length > 1 ? (i / (days.length - 1)) * 580 + 10 : 300;
    const y = 170 - (d.cumulative / maxKarma) * 160;
    return `${x},${y}`;
  });
  const firstX = days.length > 1 ? 10 : 300;
  const lastX = days.length > 1 ? 590 : 300;
  return `M ${firstX},170 L ${points.join(' L ')} L ${lastX},170 Z`;
}

function generateLast30Days(actual: KarmaGraphDay[]): KarmaGraphDay[] {
  const dateMap = new Map(actual.map(d => [d.date, d]));
  const result: KarmaGraphDay[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push(dateMap.get(dateStr) || { date: dateStr, karma_earned: 0, events: [], cumulative: 0 });
  }

  // Forward-fill cumulative
  let lastCum = 0;
  for (const day of result) {
    if (day.cumulative > 0) {
      lastCum = day.cumulative;
    } else if (day.karma_earned > 0) {
      lastCum += day.karma_earned;
      day.cumulative = lastCum;
    } else {
      day.cumulative = lastCum;
    }
  }

  return result;
}

function generateMockData(currentKarma: number): KarmaGraphData {
  const days: KarmaGraphDay[] = [];
  let running = 0;
  const now = new Date();
  for (let i = 14; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const earned = Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 5 : 0;
    running += earned;
    if (earned > 0) {
      days.push({
        date: d.toISOString().slice(0, 10),
        karma_earned: earned,
        cumulative: running,
        events: [{ type: 'quest_pass', title: 'Quest Completed', delta: earned }],
      });
    }
  }
  return {
    current_karma: currentKarma,
    daily_data: days,
    recent_submissions: [],
    total_events: days.length,
  };
}
