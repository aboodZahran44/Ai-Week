"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function ReportPage({ report, selectedJob, onReset }) {
  const parsed = parseStructuredReport(report);
  const [hoveredCard, setHoveredCard] = useState(null);

  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.4, staggerChildren: 0.08 },
    },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const cardVariants = {
    initial: { opacity: 0, y: 24, scale: 0.97 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mt-8 max-w-6xl mx-auto pb-12"
    >
      {/* ===== Header ===== */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-5"
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
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Interview Complete
        </motion.div>

        <h2 className="text-3xl md:text-4xl font-bold mb-2">
          Your <span className="gradient-text">Evaluation Report</span>
        </h2>
        {selectedJob && (
          <p className="text-zinc-400 text-lg">
            {selectedJob.title} at {selectedJob.company}
          </p>
        )}
      </div>

      {/* ===== TOP ROW: Verdict + Hiring Score ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Final Verdict Card */}
        <motion.div
          variants={cardVariants}
          onMouseEnter={() => setHoveredCard("verdict")}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-6 transition-all duration-300"
          style={{
            borderColor:
              hoveredCard === "verdict"
                ? "rgba(99, 102, 241, 0.4)"
                : undefined,
            boxShadow:
              hoveredCard === "verdict"
                ? "0 0 40px rgba(99, 102, 241, 0.1)"
                : undefined,
          }}
        >
          {/* Glow orb */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-lg">
              🎯
            </div>
            <h3 className="text-base font-semibold text-zinc-200 uppercase tracking-wide">
              Final Verdict
            </h3>
          </div>

          <div className="text-sm text-zinc-300 leading-relaxed">
            {parsed.verdict ? (
              <>
                <VerdictBadge text={parsed.verdict} />
                <p className="mt-3 text-zinc-400">{parsed.verdictDetail}</p>
              </>
            ) : (
              <p className="text-zinc-500 italic">No verdict available</p>
            )}
          </div>
        </motion.div>

        {/* Hiring Probability Score Card */}
        <motion.div
          variants={cardVariants}
          onMouseEnter={() => setHoveredCard("score")}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-6 transition-all duration-300"
          style={{
            borderColor:
              hoveredCard === "score"
                ? "rgba(34, 197, 94, 0.4)"
                : undefined,
            boxShadow:
              hoveredCard === "score"
                ? "0 0 40px rgba(34, 197, 94, 0.1)"
                : undefined,
          }}
        >
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-lg">
              📈
            </div>
            <h3 className="text-base font-semibold text-zinc-200 uppercase tracking-wide">
              Hiring Probability
            </h3>
          </div>

          <div className="flex items-end gap-4">
            <div className="text-5xl font-bold gradient-text leading-none">
              {parsed.hiringScore || "N/A"}
            </div>
            <div className="flex-1 pb-2">
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #6366f1, #22c55e)",
                  }}
                  initial={{ width: "0%" }}
                  animate={{
                    width: parsed.hiringScore || "0%",
                  }}
                  transition={{
                    delay: 0.6,
                    duration: 1.5,
                    ease: "easeOut",
                  }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">
                Based on interview performance
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ===== MIDDLE ROW: Strengths + Weaknesses ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Key Strengths */}
        <motion.div
          variants={cardVariants}
          onMouseEnter={() => setHoveredCard("strengths")}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-6 transition-all duration-300"
          style={{
            borderColor:
              hoveredCard === "strengths"
                ? "rgba(34, 197, 94, 0.4)"
                : undefined,
            boxShadow:
              hoveredCard === "strengths"
                ? "0 0 40px rgba(34, 197, 94, 0.08)"
                : undefined,
          }}
        >
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-green-500/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center text-lg">
              💪
            </div>
            <h3 className="text-base font-semibold text-zinc-200 uppercase tracking-wide">
              Key Strengths
            </h3>
          </div>

          <div className="space-y-3">
            {parsed.strengths.length > 0 ? (
              parsed.strengths.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-3.5 h-3.5 text-green-400"
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
                  </span>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {item}
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 italic">
                No strengths data available
              </p>
            )}
          </div>
        </motion.div>

        {/* Weaknesses */}
        <motion.div
          variants={cardVariants}
          onMouseEnter={() => setHoveredCard("weaknesses")}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-6 transition-all duration-300"
          style={{
            borderColor:
              hoveredCard === "weaknesses"
                ? "rgba(245, 158, 11, 0.4)"
                : undefined,
            boxShadow:
              hoveredCard === "weaknesses"
                ? "0 0 40px rgba(245, 158, 11, 0.08)"
                : undefined,
          }}
        >
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-lg">
              ⚠️
            </div>
            <h3 className="text-base font-semibold text-zinc-200 uppercase tracking-wide">
              Areas for Improvement
            </h3>
          </div>

          <div className="space-y-3">
            {parsed.weaknesses.length > 0 ? (
              parsed.weaknesses.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-3.5 h-3.5 text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 9v2m0 4h.01M12 3l9.5 16.5H2.5L12 3z"
                      />
                    </svg>
                  </span>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {item}
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 italic">
                No weaknesses identified
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ===== BOTTOM ROW: Communication + Roadmap ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Communication & Confidence */}
        <motion.div
          variants={cardVariants}
          onMouseEnter={() => setHoveredCard("communication")}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-6 transition-all duration-300"
          style={{
            borderColor:
              hoveredCard === "communication"
                ? "rgba(168, 85, 247, 0.4)"
                : undefined,
            boxShadow:
              hoveredCard === "communication"
                ? "0 0 40px rgba(168, 85, 247, 0.08)"
                : undefined,
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-lg">
              🗣️
            </div>
            <h3 className="text-base font-semibold text-zinc-200 uppercase tracking-wide">
              Communication & Confidence
            </h3>
          </div>

          <div className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/40">
            {parsed.communication || (
              <span className="text-zinc-500 italic">
                No communication data available
              </span>
            )}
          </div>
        </motion.div>

        {/* Recommended Action Plan */}
        <motion.div
          variants={cardVariants}
          onMouseEnter={() => setHoveredCard("roadmap")}
          onMouseLeave={() => setHoveredCard(null)}
          className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-6 transition-all duration-300"
          style={{
            borderColor:
              hoveredCard === "roadmap"
                ? "rgba(59, 130, 246, 0.4)"
                : undefined,
            boxShadow:
              hoveredCard === "roadmap"
                ? "0 0 40px rgba(59, 130, 246, 0.08)"
                : undefined,
          }}
        >
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-lg">
              🗺️
            </div>
            <h3 className="text-base font-semibold text-zinc-200 uppercase tracking-wide">
              Action Plan & Roadmap
            </h3>
          </div>

          <div className="space-y-3">
            {parsed.roadmap.length > 0 ? (
              parsed.roadmap.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-400">
                    {i + 1}
                  </span>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {item}
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 italic">
                No action plan available
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ===== Actions ===== */}
      <motion.div variants={cardVariants} className="flex justify-center gap-4">
        <button
          onClick={() => {
            const blob = new Blob([report], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `interview-report-${selectedJob?.title || "evaluation"}.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all duration-200 text-sm font-medium"
          id="download-report-btn"
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
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Report
        </button>

        <button
          onClick={onReset}
          className="btn-primary text-sm px-8 py-3"
          id="start-over-btn"
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Start Over
          </span>
        </button>
      </motion.div>
    </motion.div>
  );
}

// ==========================================================
// Verdict Badge Component
// ==========================================================
function VerdictBadge({ text }) {
  const lower = text.toLowerCase();
  let color, bg, border, label;

  if (lower.includes("highly recommended") || lower.includes("highly recommend")) {
    color = "text-emerald-400";
    bg = "bg-emerald-500/10";
    border = "border-emerald-500/30";
    label = "Highly Recommended";
  } else if (lower.includes("not recommended") || lower.includes("not recommend")) {
    color = "text-red-400";
    bg = "bg-red-500/10";
    border = "border-red-500/30";
    label = "Not Recommended";
  } else {
    color = "text-amber-400";
    bg = "bg-amber-500/10";
    border = "border-amber-500/30";
    label = "Recommended with Conditions";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${color} ${bg} border ${border}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bg.replace("/10", "/40")}`}
        />
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${bg.replace("/10", "/60")}`}
        />
      </span>
      {label}
    </span>
  );
}

// ==========================================================
// Structured Report Parser
// ==========================================================
function parseStructuredReport(text) {
  const result = {
    verdict: "",
    verdictDetail: "",
    hiringScore: "",
    strengths: [],
    weaknesses: [],
    communication: "",
    roadmap: [],
  };

  if (!text) return result;

  // Split by ### headers
  const sectionRegex = /###\s*(.*?)(?=\n###|\n*$)/gs;
  const sections = {};
  let match;

  // Manually split sections
  const parts = text.split(/###\s*/);
  for (const part of parts) {
    if (!part.trim()) continue;
    const newlineIdx = part.indexOf("\n");
    if (newlineIdx === -1) continue;
    const title = part.substring(0, newlineIdx).trim();
    const content = part.substring(newlineIdx).trim();
    sections[title] = content;
  }

  // Parse each known section
  for (const [title, content] of Object.entries(sections)) {
    const lower = title.toLowerCase();

    if (lower.includes("verdict") || lower.includes("eligibility")) {
      // Extract the verdict label and detail
      const lines = content
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 0) {
        result.verdict = lines[0];
        result.verdictDetail = lines.slice(1).join(" ");
      }
    } else if (lower.includes("hiring") || lower.includes("probability") || lower.includes("score")) {
      // Extract percentage
      const scoreMatch = content.match(/(\d{1,3}\s*%)/);
      result.hiringScore = scoreMatch ? scoreMatch[1].trim() : content.trim();
    } else if (lower.includes("strength")) {
      result.strengths = extractBulletPoints(content);
    } else if (lower.includes("weakness") || lower.includes("improvement")) {
      result.weaknesses = extractBulletPoints(content);
    } else if (lower.includes("communication") || lower.includes("confidence")) {
      result.communication = content
        .split("\n")
        .map((l) => l.replace(/^[\*\-]\s*/, "").trim())
        .filter(Boolean)
        .join(" ");
    } else if (lower.includes("roadmap") || lower.includes("action plan") || lower.includes("recommended action")) {
      result.roadmap = extractBulletPoints(content);
    }
  }

  return result;
}

function extractBulletPoints(text) {
  return text
    .split("\n")
    .map((line) => line.replace(/^[\*\-•]\s*/, "").trim())
    .filter((line) => line.length > 2);
}
