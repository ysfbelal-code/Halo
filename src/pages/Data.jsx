import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Brain, TrendingDown, Smile, Clock, Zap, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Simulated weekly blocked content data
const weeklyBlocked = [
  { day: "Mon", blocked: 14 },
  { day: "Tue", blocked: 22 },
  { day: "Wed", blocked: 18 },
  { day: "Thu", blocked: 31 },
  { day: "Fri", blocked: 27 },
  { day: "Sat", blocked: 42 },
  { day: "Sun", blocked: 38 },
];

// Brainrot breakdown by category
const categoryBreakdown = [
  { name: "Skibidi / Toilet", value: 28, color: "#0ea5e9" },
  { name: "Rizz / Gyatt", value: 18, color: "#22c55e" },
  { name: "Sigma / NPC", value: 14, color: "#f59e0b" },
  { name: "Social Engineering", value: 12, color: "#f97316" },
  { name: "Risky Stunts", value: 10, color: "#ef4444" },
  { name: "Mature Content", value: 8, color: "#a855f7" },
  { name: "Other", value: 10, color: "#64748b" },
];

// Attention span improvement trend
const attentionTrend = [
  { week: "W1", score: 42 },
  { week: "W2", score: 48 },
  { week: "W3", score: 55 },
  { week: "W4", score: 61 },
  { week: "W5", score: 68 },
  { week: "W6", score: 74 },
];

const statCards = [
  { label: "Blocked This Week", value: "192", icon: Zap, color: "text-primary", bg: "bg-primary/10" },
  { label: "Blocked All Time", value: "1,847", icon: Brain, color: "text-purple-500", bg: "bg-purple-100" },
  { label: "Brainrot-Free Days", value: "12", icon: Smile, color: "text-green-500", bg: "bg-green-100" },
  { label: "Hours of Healthy Viewing", value: "34h", icon: Clock, color: "text-amber-500", bg: "bg-amber-100" },
];

const sideEffects = [
  { effect: "Shortened attention span", severity: "high" },
  { effect: "Reduced reading comprehension", severity: "high" },
  { effect: "Desensitization to absurd humor", severity: "medium" },
  { effect: "Sleep disruption from overstimulation", severity: "high" },
  { effect: "Difficulty with slow-paced activities", severity: "medium" },
  { effect: "Increased impulsivity", severity: "medium" },
];

const benefits = [
  { benefit: "Longer focus during school activities", icon: BookOpen },
  { benefit: "Better sleep quality", icon: Clock },
  { benefit: "Increased creativity and imaginative play", icon: Smile },
  { benefit: "Improved language development", icon: Brain },
  { benefit: "Greater patience and emotional regulation", icon: TrendingDown },
];

const severityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-accent/30 text-accent-foreground border-accent/40",
};

export default function Data() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-heading font-bold text-3xl text-foreground">Safety Dashboard</h1>
        </div>
        <p className="text-muted-foreground">See what Guardian has blocked and why it matters</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="font-heading font-bold text-3xl text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly blocked bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Videos Blocked This Week</CardTitle>
            <CardDescription>Daily brainrot interceptions by Guardian</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyBlocked} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 13 }}
                  formatter={(v) => [`${v} videos`, "Blocked"]}
                />
                <Bar dataKey="blocked" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Blocked Content by Category</CardTitle>
            <CardDescription>Breakdown of what's been blocked</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 13 }}
                  formatter={(v, n) => [`${v}%`, n]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Attention trend */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Estimated Attention Improvement</CardTitle>
          <CardDescription>Projected focus score improvement as brainrot exposure decreases over 6 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={attentionTrend}>
              <defs>
                <linearGradient id="attentionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 13 }}
                formatter={(v) => [`${v}/100`, "Focus Score"]}
              />
              <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#attentionGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Side effects + Benefits */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Side effects */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Side Effects of Brainrot</CardTitle>
            <CardDescription>Research-backed impacts of excessive brainrot content on children</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sideEffects.map((item) => (
              <div
                key={item.effect}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${severityColors[item.severity]}`}
              >
                <span className="font-medium">{item.effect}</span>
                <span className="text-xs capitalize font-semibold opacity-70">{item.severity}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Benefits of Blocking Brainrot</CardTitle>
            <CardDescription>What your child gains with Guardian active</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {benefits.map((item) => (
              <div
                key={item.benefit}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/40 text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">{item.benefit}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}