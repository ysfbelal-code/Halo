import { Shield, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContentBlockedOverlay({ blockedContent, onDismiss }) {
  if (!blockedContent) return null;

  const { categoryConfig, category, severity, pattern, field } = blockedContent;

  const severityLabels = {
    high: "High Risk",
    medium: "Moderate Risk",
    low: "Low Risk",
  };

  const severityColors = {
    high: "border-destructive bg-destructive/5",
    medium: "border-accent bg-accent/5",
    low: "border-muted bg-muted/5",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`mx-4 max-w-md w-full rounded-2xl border-2 ${severityColors[severity]} p-6 shadow-2xl`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryConfig.bg}`}>
                <Shield className={`w-5 h-5 ${categoryConfig.color}`} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground">Content Blocked</h3>
                <p className="text-xs text-muted-foreground">Guardian intercepted this content</p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryConfig.bg} ${categoryConfig.color}`}>
                {categoryConfig.label}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium bg-muted text-muted-foreground`}>
                {severityLabels[severity]}
              </span>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p>This content was blocked because it matched a filtered pattern in {field || "the content metadata"}.</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground/60 font-mono bg-muted/50 rounded-lg px-3 py-2">
              Pattern: /{pattern}/
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="w-full mt-4 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Dismiss
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
