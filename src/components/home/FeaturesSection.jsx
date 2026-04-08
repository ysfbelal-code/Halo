import { Shield, Filter, Bell, Eye, Lock, Zap, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Filter,
    title: "Multi-Category Regex Engine",
    description: "Detects brainrot, social engineering, risky stunts, and mature content using 100+ pattern-matching rules built for modern internet threats.",
  },
  {
    icon: Zap,
    title: "Instant Interception",
    description: "Content is scanned and blocked before it ever renders. Your child sees a 'Content Blocked' message, not a video that starts and then cuts out.",
  },
  {
    icon: Lock,
    title: "Custom Word Lists",
    description: "Add your own keywords and assign them to specific categories. You know your child's feed better than anyone.",
  },
  {
    icon: Eye,
    title: "Real-time Scanning",
    description: "Guardian watches the For You page continuously, catching new threats as they emerge across all safety categories.",
  },
  {
    icon: ShieldCheck,
    title: "Tiered Protection Levels",
    description: "Choose from Basic, Moderate, or Maximum protection. Each level adjusts which categories and severity thresholds are enforced.",
  },
  {
    icon: AlertTriangle,
    title: "Expanded Safety Net",
    description: "Beyond brainrot — blocks dating challenges, dangerous stunts, true crime, horror stories, and drama channels.",
  },
  {
    icon: Bell,
    title: "Slip-through Reporting",
    description: "If something sneaks past, report it instantly. We'll add it to the blocklist for everyone.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">
            How Guardian Protects Your Child
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            A comprehensive safety net against brainrot, social engineering, risky stunts, and age-inappropriate content
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
