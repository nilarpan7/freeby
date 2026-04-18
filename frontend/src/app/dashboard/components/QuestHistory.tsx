'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown,
  ExternalLink, RefreshCw, Loader2, FileCode, Zap, Bug, Lightbulb
} from 'lucide-react';
import { questApi } from '@/lib/api';
import type { QuestSubmission, CriterionResult, CodeError } from '@/lib/types';

interface QuestHistoryProps {
  userId: string;
}

type TabFilter = 'all' | 'passed' | 'failed' | 'analyzing';

export default function QuestHistory({ userId }: QuestHistoryProps) {
  const [submissions, setSubmissions] = useState<QuestSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) loadHistory();
  }, [userId]);

  // Poll for analyzing submissions
  useEffect(() => {
    const analyzing = submissions.filter(s => s.status === 'analyzing');
    if (analyzing.length === 0) return;

    const interval = setInterval(() => loadHistory(), 5000);
    return () => clearInterval(interval);
  }, [submissions]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await questApi.getHistory(userId);
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async (submissionId: string) => {
    try {
      await questApi.reanalyze(submissionId);
      loadHistory();
    } catch (err) {
      console.error('Re-analysis failed:', err);
    }
  };

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: submissions.length },
    { key: 'passed', label: 'Passed', count: submissions.filter(s => s.status === 'passed').length },
    { key: 'failed', label: 'Failed', count: submissions.filter(s => s.status === 'failed').length },
    { key: 'analyzing', label: 'Pending', count: submissions.filter(s => s.status === 'analyzing' || s.status === 'pending').length },
  ];

  const filtered = submissions.filter(s => {
    if (activeTab === 'all') return true;
    if (activeTab === 'analyzing') return s.status === 'analyzing' || s.status === 'pending';
    return s.status === activeTab;
  });

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 border-2 border-black" style={{ filter: "url(#rough-paper)" }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-black text-white'
                : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.key ? 'bg-amber-400 text-black' : 'bg-gray-300 text-gray-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Submission List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin mr-2" size={20} />
          <span className="font-bold text-gray-500">Loading history...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300">
          <p className="text-gray-400 font-medium">No submissions yet</p>
          <p className="text-gray-300 text-sm mt-1">Complete a quest to see your history here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub, i) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              index={i}
              isExpanded={expandedId === sub.id}
              onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              onReanalyze={() => handleReanalyze(sub.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Submission Card ───

function SubmissionCard({
  submission: sub,
  index,
  isExpanded,
  onToggle,
  onReanalyze,
}: {
  submission: QuestSubmission;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onReanalyze: () => void;
}) {
  const statusConfig: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string; label: string }> = {
    passed: { icon: <CheckCircle2 size={18} />, bg: 'bg-green-50', border: 'border-green-600', text: 'text-green-700', label: 'PASSED' },
    failed: { icon: <XCircle size={18} />, bg: 'bg-red-50', border: 'border-red-600', text: 'text-red-700', label: 'FAILED' },
    analyzing: { icon: <Loader2 size={18} className="animate-spin" />, bg: 'bg-amber-50', border: 'border-amber-600', text: 'text-amber-700', label: 'ANALYZING' },
    pending: { icon: <Clock size={18} />, bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-600', label: 'PENDING' },
    error: { icon: <AlertTriangle size={18} />, bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-600', label: 'ERROR' },
  };

  const config = statusConfig[sub.status] || statusConfig.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border-3 border-black overflow-hidden ${config.bg}`}
      style={{ filter: "url(#rough-paper)" }}
    >
      {/* Header row */}
      <div className="p-4 cursor-pointer hover:bg-black/5 transition-colors" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${config.text}`}>{config.icon}</div>
            <div>
              <h4 className="font-bold text-sm">{sub.quest_id}</h4>
              <p className="text-xs text-gray-500">Attempt #{sub.attempt_number} • {new Date(sub.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sub.status === 'passed' || sub.status === 'failed' ? (
              <>
                {/* Score ring */}
                <div className="relative w-10 h-10">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={sub.status === 'passed' ? '#22c55e' : '#ef4444'}
                      strokeWidth="4"
                      strokeDasharray={`${(sub.score_pct / 100) * 88} 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black">
                    {Math.round(sub.score_pct)}%
                  </span>
                </div>

                {sub.karma_earned > 0 && (
                  <span className="bg-amber-400 text-black px-2 py-0.5 text-xs font-black border-2 border-black">
                    +{sub.karma_earned}
                  </span>
                )}
              </>
            ) : (
              <span className={`px-2 py-0.5 text-xs font-black ${config.border} border-2 ${config.text}`}>
                {config.label}
              </span>
            )}

            <ChevronDown
              size={16}
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t-2 border-black/10 p-4 space-y-4">
              {/* Summary */}
              {sub.analysis_summary && (
                <p className="text-sm text-gray-700 font-medium bg-white p-3 border border-gray-200">
                  {sub.analysis_summary}
                </p>
              )}

              {/* GitHub Link */}
              <a
                href={sub.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:underline"
              >
                <ExternalLink size={14} />
                {sub.github_url}
              </a>

              {/* Criteria Results */}
              {sub.criteria_results && sub.criteria_results.length > 0 && (
                <div className="bg-white border-2 border-black/10 p-4">
                  <h5 className="font-black text-sm mb-3 flex items-center gap-2">
                    <FileCode size={16} /> Criteria Evaluation ({sub.criteria_passed}/{sub.criteria_total})
                  </h5>
                  <div className="space-y-2">
                    {sub.criteria_results.map((cr: CriterionResult, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        {cr.passed ? (
                          <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <span className={cr.passed ? 'text-green-800' : 'text-red-700'}>{cr.criterion}</span>
                          {cr.evidence && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">{cr.evidence}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {sub.error_report && sub.error_report.length > 0 && (
                <div className="bg-white border-2 border-red-200 p-4">
                  <h5 className="font-black text-sm mb-3 flex items-center gap-2 text-red-700">
                    <Bug size={16} /> Issues Found ({sub.error_report.length})
                  </h5>
                  <div className="space-y-2">
                    {sub.error_report.map((err: CodeError, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm border-b border-dashed border-gray-200 pb-2 last:border-0">
                        <span className={`px-1.5 py-0.5 text-xs font-bold uppercase shrink-0 ${
                          err.severity === 'error' ? 'bg-red-100 text-red-700' :
                          err.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {err.severity}
                        </span>
                        <div>
                          <span className="font-mono text-xs text-gray-500">{err.file}{err.line ? `:${err.line}` : ''}</span>
                          <p className="text-gray-700">{err.message}</p>
                          {err.suggestion && (
                            <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                              <Lightbulb size={12} /> {err.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                {(sub.status === 'failed' || sub.status === 'error') && (
                  <button
                    onClick={onReanalyze}
                    className="flex items-center gap-1.5 px-4 py-2 bg-black text-white font-bold text-sm border-2 border-black hover:bg-gray-800 transition-colors"
                  >
                    <RefreshCw size={14} /> Re-analyze
                  </button>
                )}

                {sub.analysis_duration_ms && (
                  <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                    <Clock size={12} /> Analyzed in {(sub.analysis_duration_ms / 1000).toFixed(1)}s
                  </span>
                )}

                {sub.files_analyzed > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                    <FileCode size={12} /> {sub.files_analyzed} files analyzed
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
