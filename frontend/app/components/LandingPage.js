"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage({ onUpload, isLoading, loadingMessage }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -30, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mt-8"
    >
      {/* Hero Section */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Powered by Local AI (Ollama)
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
        >
          Your AI-Powered
          <br />
          <span className="gradient-text">Career Agent</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-[var(--color-muted)] max-w-2xl mx-auto"
        >
          Upload your CV and let AI analyze your technical profile, match you
          with real jobs, and prepare you with a simulated voice interview.
        </motion.p>
      </div>

      {/* Feature Pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-3 mb-12"
      >
        {[
          { icon: "🔍", text: "GitHub Deep Analysis" },
          { icon: "🧠", text: "Technical Persona" },
          { icon: "💼", text: "Real Job Matching" },
          { icon: "🎙️", text: "Voice Interview" },
        ].map((feature, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-zinc-300"
          >
            <span>{feature.icon}</span>
            {feature.text}
          </div>
        ))}
      </motion.div>

      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingState key="loading" message={loadingMessage} />
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div
              className={`drop-zone rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragOver ? "drag-over" : ""
              } ${selectedFile ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf"
                className="hidden"
                id="cv-upload"
              />

              {/* Upload Icon */}
              <motion.div
                className="mx-auto mb-6"
                animate={isDragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              >
                {selectedFile ? (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <svg
                      className="w-8 h-8 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto">
                    <svg
                      className="w-8 h-8 text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                )}
              </motion.div>

              {selectedFile ? (
                <div>
                  <p className="text-emerald-400 font-medium text-lg mb-1">
                    ✓ {selectedFile.name}
                  </p>
                  <p className="text-zinc-500 text-sm">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-zinc-300 font-medium text-lg mb-1">
                    Drop your CV here, or click to browse
                  </p>
                  <p className="text-zinc-500 text-sm">
                    PDF format only • Max 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Upload Button */}
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={handleUpload}
                  className="btn-primary text-lg px-10 py-4"
                  id="analyze-btn"
                >
                  <span className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Analyze CV & Find Jobs
                  </span>
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============ Loading State Component ============
function LoadingState({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-lg mx-auto text-center py-16"
    >
      {/* Animated Brain/Orb */}
      <div className="relative w-32 h-32 mx-auto mb-8">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        {/* Middle ring */}
        <motion.div
          className="absolute inset-3 rounded-full border-2 border-purple-500/40"
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner orb */}
        <motion.div
          className="absolute inset-6 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-3xl">🧠</span>
        </motion.div>
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl" />
      </div>

      {/* Loading message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-lg text-zinc-300 font-medium"
        >
          {message}
        </motion.p>
      </AnimatePresence>

      <p className="text-sm text-zinc-500 mt-3">
        This may take a few minutes — AI is analyzing deeply...
      </p>

      {/* Progress shimmer bar */}
      <div className="mt-8 h-1 bg-zinc-800 rounded-full overflow-hidden max-w-xs mx-auto">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "50%" }}
        />
      </div>
    </motion.div>
  );
}
