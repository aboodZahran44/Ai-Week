"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResultsPage({ persona, jobs, onSelectJob, isLoading }) {
  const [expandedPersona, setExpandedPersona] = useState(false);
  const [selectedJobIndex, setSelectedJobIndex] = useState(null);

  const pageVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
    exit: { opacity: 0, y: -30, transition: { duration: 0.3 } },
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  // Parse persona sections for a nicer display
  const personaSections = parsePersonaSections(persona);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mt-8"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2"
        >
          Your <span className="gradient-text">Technical Profile</span>
        </motion.h2>
        <p className="text-zinc-400">
          AI-generated analysis based on your CV and GitHub repositories
        </p>
      </div>

      {/* Persona Card */}
      <motion.div
        variants={cardVariants}
        className="glass-card p-6 sm:p-8 mb-10 glow-accent"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-lg">🧠</span>
            </div>
            <h3 className="text-xl font-semibold text-white">
              Technical Persona
            </h3>
          </div>
          <button
            onClick={() => setExpandedPersona(!expandedPersona)}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            {expandedPersona ? "Collapse" : "Expand"}
            <motion.svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{ rotate: expandedPersona ? 180 : 0 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </motion.svg>
          </button>
        </div>

        <AnimatePresence>
          <motion.div
            initial={false}
            animate={{ height: expandedPersona ? "auto" : "200px" }}
            className="overflow-hidden relative"
          >
            {/* Persona content as formatted sections */}
            {personaSections.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {personaSections.map((section, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800"
                  >
                    <h4 className="text-sm font-semibold text-indigo-400 mb-2 uppercase tracking-wider">
                      {section.title}
                    </h4>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {persona}
              </p>
            )}

            {/* Gradient fade for collapsed */}
            {!expandedPersona && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#18181b] to-transparent" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Jobs Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <span className="text-lg">💼</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Matched Positions</h3>
          <p className="text-sm text-zinc-400">
            Select a job to start your virtual interview
          </p>
        </div>
      </div>

      {/* Job Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`glass-card glass-card-hover p-6 cursor-pointer transition-all duration-300 ${
              selectedJobIndex === index
                ? "border-indigo-500/50 glow-accent"
                : ""
            }`}
            onClick={() => setSelectedJobIndex(index)}
          >
            {/* Company badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                {job.company?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  {job.company}
                </p>
              </div>
            </div>

            {/* Job title */}
            <h4 className="text-lg font-semibold text-white mb-3 leading-tight">
              {job.title}
            </h4>

            {/* Analysis preview */}
            <p className="text-sm text-zinc-400 line-clamp-4 mb-4 leading-relaxed">
              {job.analysis?.substring(0, 200)}...
            </p>

            {/* Match indicator */}
            {extractMatchScore(job.analysis) && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${extractMatchScore(job.analysis)}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                  />
                </div>
                <span className="text-xs font-semibold text-emerald-400">
                  {extractMatchScore(job.analysis)}%
                </span>
              </div>
            )}

            {/* Apply link */}
            {job.link && job.link !== "#" && (
              <a
                href={job.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                View listing
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}

            {/* Selected indicator */}
            {selectedJobIndex === index && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 flex items-center gap-2 text-indigo-400 text-sm font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Selected
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Start Interview Button */}
      <AnimatePresence>
        {selectedJobIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-10 text-center"
          >
            <button
              onClick={() => onSelectJob(selectedJobIndex)}
              disabled={isLoading}
              className="btn-primary text-lg px-10 py-4"
              id="start-interview-btn"
            >
              {isLoading ? (
                <span className="flex items-center gap-3">
                  <svg
                    className="animate-spin w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Preparing Interview...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <span>🎙️</span>
                  Start Virtual Interview for {jobs[selectedJobIndex]?.title}
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============ Helper Functions ============

function parsePersonaSections(text) {
  if (!text) return [];

  const sectionRegex = /# ([A-Z\s&\/]+)\n([\s\S]*?)(?=\n# |$)/gi;
  const sections = [];
  let match;

  while ((match = sectionRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    if (content) {
      sections.push({ title, content });
    }
  }

  return sections;
}

function extractMatchScore(analysis) {
  if (!analysis) return null;
  const match = analysis.match(/(\d{1,3})\s*[/%]/);
  if (match) {
    const score = parseInt(match[1]);
    return score > 0 && score <= 100 ? score : null;
  }
  return null;
}
