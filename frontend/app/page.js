"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import StepIndicator from "./components/StepIndicator";
import LandingPage from "./components/LandingPage";
import ResultsPage from "./components/ResultsPage";
import InterviewRoom from "./components/InterviewRoom";
import ReportPage from "./components/ReportPage";
import Navbar from "./components/Navbar";

const API_BASE = "http://localhost:8000/api";

export default function Home() {
  // ============ Global State ============
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [persona, setPersona] = useState("");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [interviewTranscript, setInterviewTranscript] = useState([]);
  const [finalReport, setFinalReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState(null);

  // ============ Step 1: Upload CV ============
  const handleUploadCV = useCallback(async (file) => {
    setIsLoading(true);
    setError(null);

    const loadingSteps = [
      "Extracting CV data...",
      "Scanning GitHub repositories...",
      "Generating technical persona...",
      "Searching for matching jobs...",
      "Analyzing job compatibility...",
    ];

    let stepIndex = 0;
    setLoadingMessage(loadingSteps[0]);
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % loadingSteps.length;
      setLoadingMessage(loadingSteps[stepIndex]);
    }, 4000);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/upload-cv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Upload failed");
      }

      const data = await response.json();

      setSessionId(data.session_id);
      setPersona(data.persona);
      setJobs(data.jobs);
      setCurrentStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(interval);
      setIsLoading(false);
      setLoadingMessage("");
    }
  }, []);

  // ============ Step 2: Select Job ============
  const handleSelectJob = useCallback(
    async (jobIndex) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/select-job`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            job_index: jobIndex,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Job selection failed");
        }

        const data = await response.json();
        setSelectedJob(jobs[jobIndex]);
        setCurrentStep(2);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, jobs]
  );

  // ============ Step 3: Interview interactions ============
  const handleStartInterview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/start-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to start interview");
      }

      const data = await response.json();

      setInterviewTranscript([
        {
          role: "interviewer",
          text: data.text,
          audioUrl: `${API_BASE}/audio/${data.audio_id}`,
        },
      ]);

      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const handleSendAudio = useCallback(
    async (audioBlob) => {
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("session_id", sessionId);
        formData.append("audio", audioBlob, "recording.wav");

        const response = await fetch(`${API_BASE}/chat-audio`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Audio processing failed");
        }

        const data = await response.json();

        // Add user message
        setInterviewTranscript((prev) => [
          ...prev,
          { role: "user", text: data.user_text },
        ]);

        // Add AI response
        setInterviewTranscript((prev) => [
          ...prev,
          {
            role: "interviewer",
            text: data.ai_text,
            audioUrl: `${API_BASE}/audio/${data.audio_id}`,
          },
        ]);

        if (data.type === "report") {
          setFinalReport(data.report);
          // Auto navigate to report after a delay
          setTimeout(() => setCurrentStep(3), 3000);
        }

        return data;
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  // ============ Navigation ============
  const goToReport = () => setCurrentStep(3);
  const resetApp = () => {
    setCurrentStep(0);
    setSessionId(null);
    setPersona("");
    setJobs([]);
    setSelectedJob(null);
    setInterviewTranscript([]);
    setFinalReport("");
    setError(null);
  };

  // ============ Step Labels ============
  const steps = [
    { label: "Upload CV", icon: "📄" },
    { label: "Job Matching", icon: "🎯" },
    { label: "Interview", icon: "🎙️" },
    { label: "Report", icon: "📊" },
  ];

  return (
    <main className="min-h-screen dot-grid">
      <Navbar onReset={resetApp} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <StepIndicator steps={steps} currentStep={currentStep} />

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-[var(--color-danger-bg)] border border-red-500/20 text-red-400 text-sm text-center">
            ⚠️ {error}
            <button
              onClick={() => setError(null)}
              className="ml-3 underline hover:text-red-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <LandingPage
              key="landing"
              onUpload={handleUploadCV}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
            />
          )}
          {currentStep === 1 && (
            <ResultsPage
              key="results"
              persona={persona}
              jobs={jobs}
              onSelectJob={handleSelectJob}
              isLoading={isLoading}
            />
          )}
          {currentStep === 2 && (
            <InterviewRoom
              key="interview"
              selectedJob={selectedJob}
              transcript={interviewTranscript}
              onStartInterview={handleStartInterview}
              onSendAudio={handleSendAudio}
              isLoading={isLoading}
              onEndInterview={goToReport}
              finalReport={finalReport}
            />
          )}
          {currentStep === 3 && (
            <ReportPage
              key="report"
              report={finalReport}
              selectedJob={selectedJob}
              onReset={resetApp}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
