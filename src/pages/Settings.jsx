import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Youtube, ShieldOff, Shield, ShieldAlert, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import CustomFilters from "../components/settings/CustomFilters";
import { PROTECTION_LEVELS } from "@/lib/interceptor-config";

const PROTECTION_LEVELS_UI = [
  {
    value: "none",
    label: PROTECTION_LEVELS.none.label,
    subtitle: PROTECTION_LEVELS.none.subtitle,
    description: PROTECTION_LEVELS.none.description,
    icon: ShieldOff,
    color: "text-muted-foreground",
    activeBg: "bg-muted border-border",
    activeText: "text-foreground",
    badge: null,
  },
  {
    value: "basic",
    label: PROTECTION_LEVELS.basic.label,
    subtitle: PROTECTION_LEVELS.basic.subtitle,
    description: PROTECTION_LEVELS.basic.description,
    icon: Shield,
    color: "text-primary",
    activeBg: "bg-primary/5 border-primary",
    activeText: "text-primary",
    badge: null,
  },
  {
    value: "moderate",
    label: PROTECTION_LEVELS.moderate.label,
    subtitle: PROTECTION_LEVELS.moderate.subtitle,
    description: PROTECTION_LEVELS.moderate.description,
    icon: Shield,
    color: "text-amber-500",
    activeBg: "bg-amber-500/5 border-amber-500",
    activeText: "text-amber-500",
    badge: "Recommended",
  },
  {
    value: "maximum",
    label: PROTECTION_LEVELS.maximum.label,
    subtitle: PROTECTION_LEVELS.maximum.subtitle,
    description: PROTECTION_LEVELS.maximum.description,
    icon: ShieldAlert,
    color: "text-destructive",
    activeBg: "bg-destructive/5 border-destructive",
    activeText: "text-destructive",
    badge: "Strictest",
  },
];

export default function Settings() {
  const [step, setStep] = useState(1); // 1 = enter URL, 2 = pick protection
  const [filterLevel, setFilterLevel] = useState("basic");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await base44.auth.me();
        setFilterLevel(me.filter_level || "basic");
        const channel = me.youtube_channel || "";
        setYoutubeChannel(channel);
        if (channel) setStep(2);
      } catch (error) {
        console.error("Failed to load user settings:", error);
        toast.error("Could not load your settings. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleChannelSubmit = (e) => {
    e.preventDefault();
    if (!youtubeChannel.trim()) {
      toast.error("Please enter your YouTube channel URL");
      return;
    }
    setStep(2);
  };

  const handleActivate = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        filter_level: filterLevel,
        youtube_channel: youtubeChannel,
      });
      setActivated(true);
      toast.success("Guardian is now active on your channel!");
    } catch (error) {
      console.error("Failed to activate Guardian:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const selectedLevel = PROTECTION_LEVELS_UI.find((l) => l.value === filterLevel);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-heading font-bold text-3xl text-foreground">Set Up Guardian</h1>
        <p className="text-muted-foreground mt-2">Two steps to protect your child's YouTube feed</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-3 mb-10">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            <span className={`text-sm font-medium ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
              {s === 1 ? "YouTube Channel" : "Protection Level"}
            </span>
            {s < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1 */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card rounded-2xl border border-border p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Youtube className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-lg text-foreground">Link your YouTube Channel</h2>
                <p className="text-sm text-muted-foreground">Guardian will monitor this channel's For You feed</p>
              </div>
            </div>
            <form onSubmit={handleChannelSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="channel">YouTube Channel URL</Label>
                <Input
                  id="channel"
                  placeholder="https://youtube.com/@yourchannel"
                  value={youtubeChannel}
                  onChange={(e) => setYoutubeChannel(e.target.value)}
                  className="text-base"
                />
              </div>
              <Button type="submit" className="w-full rounded-xl text-base py-5">
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </motion.div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Channel linked banner */}
            <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3 border border-border">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{youtubeChannel}</p>
                <p className="text-xs text-muted-foreground">Channel linked</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-primary hover:underline flex-shrink-0">Change</button>
            </div>

            {/* Protection level cards */}
            <div className="space-y-3">
              {PROTECTION_LEVELS_UI.map((level) => {
                const Icon = level.icon;
                const isSelected = filterLevel === level.value;
                return (
                  <button
                    key={level.value}
                    onClick={() => { setFilterLevel(level.value); setActivated(false); }}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected ? level.activeBg : "bg-card border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? "bg-background/80" : "bg-muted"
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? level.color : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-heading font-bold text-base ${isSelected ? level.activeText : "text-foreground"}`}>
                            {level.label}
                          </span>
                          {level.badge && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              {level.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{level.subtitle}</p>
                        {isSelected && (
                          <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{level.description}</p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center transition-all ${
                        isSelected ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Activate button */}
            <Button
              onClick={handleActivate}
              disabled={saving}
              className={`w-full rounded-xl text-base py-5 mt-2 transition-all ${
                activated ? "bg-green-600 hover:bg-green-700" : ""
              }`}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : activated ? (
                <CheckCircle2 className="w-5 h-5 mr-2" />
              ) : (
                selectedLevel && <selectedLevel.icon className="w-5 h-5 mr-2" />
              )}
              {activated ? "Guardian Active!" : `Activate ${selectedLevel?.label}`}
            </Button>

            {/* Custom filters (only shown in non-none mode) */}
            {filterLevel !== "none" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-2">
                <CustomFilters />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}