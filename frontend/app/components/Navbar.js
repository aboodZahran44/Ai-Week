"use client";

import { motion } from "framer-motion";

export default function Navbar({ onReset }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border)]"
      style={{
        background: "rgba(9, 9, 11, 0.8)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={onReset}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              AI
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Career Agent
            </span>
          </button>

          {/* Status Badge */}
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Ollama Connected
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
