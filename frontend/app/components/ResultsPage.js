"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============ Section Config: icons, colors per persona section ============
const SECTION_CONFIG = {
  "persona summary": {
    icon: "👤",
    color: "indigo",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-400",
  },
  skills: {
    icon: "⚡",
    color: "emerald",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
  },
  "code analysis": {
    icon: "🔍",
    color: "purple",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
  },
  "project complexity": {
    icon: "🏗️",
    color: "amber",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
  },
  "cv vs github verification": {
    icon: "✅",
    color: "green",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-400",
  },
  "final readiness score": {
    icon: "🏆",
    color: "yellow",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
  },
  "job search queries": {
    icon: "🔎",
    color: "blue",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
  },
};

function getSectionConfig(title) {
  const lower = title.toLowerCase();
  for (const [key, config] of Object.entries(SECTION_CONFIG)) {
    if (lower.includes(key)) return config;
  }
  return {
    icon: "📋",
    color: "zinc",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/20",
    text: "text-zinc-400",
  };
}

export default function ResultsPage({ persona, jobs, onSelectJob, isLoading }) {
  const [expandedPersona, setExpandedPersona] = useState(true);
  const [selectedJobIndex, setSelectedJobIndex] = useState(null);

  const pageVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 },
    },
    exit: { opacity: 0, y: -30, transition: { duration: 0.3 } },
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  // Parse persona sections
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

      {/* ========== Persona Card (Big Container) ========== */}
      <motion.div
        variants={cardVariants}
        className="glass-card p-6 sm:p-8 mb-10 glow-accent"
      >
        {/* Header Row */}
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

        {/* Persona Sections Grid */}
        <AnimatePresence>
          <motion.div
            initial={false}
            animate={{ height: expandedPersona ? "auto" : "220px" }}
            className="overflow-hidden relative"
          >
            {personaSections.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {personaSections.map((section, i) => {
                  const config = getSectionConfig(section.title);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`relative overflow-hidden rounded-xl border ${config.border} bg-zinc-900/50 p-5 transition-all duration-200 hover:bg-zinc-900/80`}
                    >
                      {/* Subtle glow orb */}
                      <div
                        className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${config.bg} blur-2xl pointer-events-none opacity-60`}
                      />

                      {/* Section Header */}
                      <div className="flex items-center gap-2.5 mb-3 relative z-10">
                        <span
                          className={`w-8 h-8 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center text-sm`}
                        >
                          {config.icon}
                        </span>
                        <h4
                          className={`text-sm font-semibold ${config.text} uppercase tracking-wider`}
                        >
                          {section.title}
                        </h4>
                      </div>

                      {/* Section Content */}
                      <div className="relative z-10 text-sm text-zinc-300 leading-relaxed">
                        {section.items.length > 0 ? (
                          <ul className="space-y-1.5">
                            {section.items.map((item, j) => (
                              <li key={j} className="flex items-start gap-2">
                                <span
                                  className={`mt-1.5 w-1.5 h-1.5 rounded-full ${config.bg.replace("/10", "/50")} flex-shrink-0`}
                                />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="whitespace-pre-wrap">
                            {section.content}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {persona}
              </p>
            )}

            {/* Gradient fade when collapsed */}
            {!expandedPersona && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[rgba(24,24,27,0.95)] to-transparent pointer-events-none" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ========== Jobs Section ========== */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <span className="text-lg">💼</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">
            Matched Positions
          </h3>
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
                    animate={{
                      width: `${extractMatchScore(job.analysis)}%`,
                    }}
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

  const sections = [];
  // Match both # HEADER and **HEADER** formats
  const parts = text.split(/(?:^|\n)(?:#{1,2}\s*|(?:\*\*))([A-Z][A-Z\s&\/\-]+?)(?:\*\*|)\s*\n/i);

  // Try splitting by bold markers or # headers
  const lines = text.split("\n");
  let currentSection = null;

  for (const line of lines) {
    // Match: # SECTION NAME, ## SECTION NAME, **SECTION NAME**
    const headerMatch = line.match(
      /^(?:#{1,3}\s*|\*\*\s*)([A-Z][A-Z\s&\/\-:]+?)(?:\s*\*\*|\s*)$/i
    );

    if (headerMatch && headerMatch[1].trim().length > 2) {
      // Save previous section
      if (currentSection && (currentSection.content.trim() || currentSection.items.length > 0)) {
        sections.push({ ...currentSection });
      }
      currentSection = {
        title: headerMatch[1].replace(/[*#]/g, "").trim(),
        content: "",
        items: [],
      };
    } else if (currentSection) {
      const trimmed = line.trim();
      // Detect bullet points
      if (trimmed.match(/^[\*\-•+]\s+/)) {
        currentSection.items.push(
          trimmed.replace(/^[\*\-•+]\s+/, "")
        );
      } else if (trimmed.match(/^\+\s+/)) {
        // Sub-bullet with +
        currentSection.items.push(
          "  → " + trimmed.replace(/^\+\s+/, "")
        );
      } else if (trimmed) {
        // If we already have items, add as item; otherwise append to content
        if (currentSection.items.length > 0) {
          currentSection.items.push(trimmed);
        } else {
          currentSection.content += trimmed + "\n";
        }
      }
    }
  }

  // Push last section
  if (currentSection && (currentSection.content.trim() || currentSection.items.length > 0)) {
    sections.push(currentSection);
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
