"use client";

import { motion } from "framer-motion";

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 py-8">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={index} className="flex items-center gap-2 sm:gap-4">
            {/* Step Circle */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="relative">
                {/* Glow ring for active step */}
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute -inset-2 rounded-full bg-indigo-500/20"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div
                  className={`
                    relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                    text-sm font-semibold transition-all duration-300 border-2
                    ${
                      isActive
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30"
                        : isCompleted
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-muted)]"
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
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
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </div>
              </div>

              <span
                className={`text-xs font-medium hidden sm:block transition-colors ${
                  isActive
                    ? "text-white"
                    : isCompleted
                    ? "text-emerald-400"
                    : "text-[var(--color-muted)]"
                }`}
              >
                {step.label}
              </span>
            </motion.div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="w-8 sm:w-16 h-[2px] rounded-full overflow-hidden bg-[var(--color-border)]">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: isCompleted ? "100%" : isActive ? "50%" : "0%",
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
