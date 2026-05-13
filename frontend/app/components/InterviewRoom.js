"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function InterviewRoom({
  selectedJob,
  transcript,
  onStartInterview,
  onSendAudio,
  isLoading,
  onEndInterview,
  finalReport,
}) {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const transcriptEndRef = useRef(null);
  const audioRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Auto-play latest AI audio
  useEffect(() => {
    if (transcript.length > 0) {
      const lastMsg = transcript[transcript.length - 1];
      if (lastMsg.role === "interviewer" && lastMsg.audioUrl) {
        playAudio(lastMsg.audioUrl);
      }
    }
  }, [transcript]);

  const playAudio = (url) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentAudioUrl(url);
    setAudioPlaying(true);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setAudioPlaying(false);
    audio.onerror = () => setAudioPlaying(false);
    audio.play().catch(() => setAudioPlaying(false));
  };

  // Start interview
  const handleStartInterview = async () => {
    const result = await onStartInterview();
    if (result) {
      setInterviewStarted(true);
    }
  };

  // WAV encoder helper: converts raw PCM Float32 samples to a WAV Blob
  const encodeWAV = useCallback((samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // WAV header
    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([buffer], { type: "audio/wav" });
  }, []);

  // Recording controls using Web Audio API for native WAV output
  const audioContextRef = useRef(null);
  const audioStreamRef = useRef(null);
  const processorRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      audioStreamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      audioChunksRef.current = [];

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(channelData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);

    // Disconnect and close audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      const sampleRate = audioContextRef.current.sampleRate;
      await audioContextRef.current.close();
      audioContextRef.current = null;

      // Merge all recorded chunks into a single Float32Array
      const chunks = audioChunksRef.current;
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      audioChunksRef.current = [];

      // Encode to WAV and send
      const wavBlob = encodeWAV(merged, sampleRate);
      await onSendAudio(wavBlob);
    }

    // Stop microphone stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  }, [encodeWAV, onSendAudio]);

  const pageVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
      {/* Interview Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-4"
        >
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          Virtual Interview Room
        </motion.div>

        <h2 className="text-3xl font-bold mb-2">
          Interview for{" "}
          <span className="gradient-text">{selectedJob?.title}</span>
        </h2>
        <p className="text-zinc-400">
          at {selectedJob?.company} • 3 questions session
        </p>
      </div>

      {!interviewStarted ? (
        /* Pre-interview screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto glass-card p-10 text-center glow-accent"
        >
          {/* AI Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl">🤖</span>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-white mb-3">
            Ready to Begin?
          </h3>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
            The AI interviewer will greet you and ask 3 targeted technical
            questions based on your profile. Use your microphone to respond.
          </p>

          <div className="flex flex-col gap-3 text-left text-sm text-zinc-400 mb-8 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">1.</span>
              AI asks a question (auto-plays audio)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">2.</span>
              Press the mic button to record your answer
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">3.</span>
              Press stop, and the AI will process your response
            </div>
          </div>

          <button
            onClick={handleStartInterview}
            disabled={isLoading}
            className="btn-primary text-lg px-8 py-4 w-full"
            id="begin-interview-btn"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
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
                Connecting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🎙️ Start Interview
              </span>
            )}
          </button>
        </motion.div>
      ) : (
        /* Active Interview */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Transcript Area */}
          <div className="lg:col-span-2">
            <div className="glass-card h-[500px] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium text-zinc-300">
                    Live Interview
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  {transcript.filter((m) => m.role === "user").length} / 3
                  answered
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {transcript.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10, x: msg.role === "user" ? 10 : -10 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                          msg.role === "user"
                            ? "bg-indigo-500/20 border border-indigo-500/30 text-zinc-200"
                            : "bg-zinc-800/50 border border-zinc-700 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {msg.role === "user" ? (
                              <span className="text-indigo-400">You</span>
                            ) : (
                              <span className="text-purple-400">
                                AI Interviewer
                              </span>
                            )}
                          </span>
                          {msg.audioUrl && (
                            <button
                              onClick={() => playAudio(msg.audioUrl)}
                              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              🔊
                            </button>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span
                            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500">
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            {/* Audio Waveform Visualizer */}
            <div className="glass-card p-6 text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {/* AI Avatar with pulse during playback */}
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ${
                    audioPlaying ? "glow-accent-strong" : ""
                  }`}
                >
                  <span className="text-3xl">
                    {audioPlaying ? "🗣️" : "🤖"}
                  </span>
                </div>
                {audioPlaying && (
                  <div className="absolute -inset-2 rounded-full border-2 border-indigo-500/30 animate-pulse-ring" />
                )}
              </div>

              {/* Audio wave bars */}
              {(audioPlaying || isRecording) && (
                <div className="flex items-center justify-center gap-1 h-10 mb-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`wave-bar ${
                        isRecording ? "!bg-red-500" : ""
                      }`}
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        animationPlayState:
                          audioPlaying || isRecording ? "running" : "paused",
                      }}
                    />
                  ))}
                </div>
              )}

              <p className="text-xs text-zinc-500 mt-2">
                {audioPlaying
                  ? "AI is speaking..."
                  : isRecording
                  ? "Recording your answer..."
                  : "Waiting for your response"}
              </p>
            </div>

            {/* Record Button */}
            <div className="glass-card p-6 text-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || audioPlaying}
                className={`
                  w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all duration-300
                  ${
                    isRecording
                      ? "bg-red-500 shadow-lg shadow-red-500/40 recording-pulse"
                      : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
                  }
                  ${isLoading || audioPlaying ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
                id="record-btn"
              >
                {isRecording ? (
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                )}
              </motion.button>

              <p className="text-sm text-zinc-400 mt-4 font-medium">
                {isRecording ? "Tap to stop recording" : "Tap to record answer"}
              </p>
            </div>

            {/* End Interview Button */}
            {finalReport && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={onEndInterview}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium hover:bg-emerald-500/20 transition-all"
                  id="view-report-btn"
                >
                  📊 View Final Report
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
