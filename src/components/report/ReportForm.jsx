import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "inappropriate_content", label: "Classic Brainrot (skibidi, rizz, fanum tax...)" },
  { value: "violent_content", label: "Violent / Disturbing Brainrot" },
  { value: "misleading", label: "Fake Educational Brainrot" },
  { value: "spam", label: "Brainrot Spam / Repetitive Content" },
  { value: "social_engineering", label: "Social Engineering / Dating Content" },
  { value: "risky_stunts", label: "High-Risk Physical Stunts" },
  { value: "mature_reality", label: "Mature-Themed Reality Content" },
  { value: "other", label: "Other" },
];

export default function ReportForm() {
  const [form, setForm] = useState({ title: "", description: "", video_url: "", category: "" });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Report.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setForm({ title: "", description: "", video_url: "", category: "" });
      toast.success("Report submitted successfully");
    },
    onError: (error) => {
      console.error("Report submission failed:", error);
      toast.error("Failed to submit report. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    const payload = {
      ...form,
      video_url: form.video_url || undefined,
      status: "pending",
    };
    mutation.mutate(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Report Content</CardTitle>
        <CardDescription>Spotted something that slipped through? Report it and we'll add it to the blocklist.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">Video URL (optional)</Label>
            <Input
              id="video_url"
              placeholder="https://youtube.com/watch?v=..."
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please describe what happened in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-[120px]"
            />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full rounded-xl">
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Report
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
