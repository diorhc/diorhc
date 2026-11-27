import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useToasts } from "@/lib/store";

export function ToastViewport() {
  const toasts = useToasts();

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="pointer-events-none fixed bottom-20 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2 lg:bottom-6"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="rounded-full border border-[var(--accent-border)] bg-[var(--bg-elevated)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] shadow-[var(--shadow-md)] sm:text-sm"
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
