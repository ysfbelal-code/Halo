import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_CONFIG } from "@/lib/interceptor-config";

const CATEGORY_OPTIONS = [
  { value: "brainrot", label: "Brainrot" },
  { value: "social_engineering", label: "Social Engineering" },
  { value: "risky_stunts", label: "Risky Stunts" },
  { value: "mature_reality", label: "Mature Content" },
  { value: "custom", label: "Custom" },
];

export default function CustomFilters() {
  const [newKeyword, setNewKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("brainrot");
  const queryClient = useQueryClient();

  const { data: filters = [], isLoading } = useQuery({
    queryKey: ["customFilters"],
    queryFn: () => base44.entities.CustomFilter.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomFilter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customFilters"] });
      setNewKeyword("");
      toast.success("Filter added");
    },
    onError: () => {
      toast.error("Failed to add filter");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomFilter.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customFilters"] }),
    onError: () => {
      toast.error("Failed to update filter");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomFilter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customFilters"] });
      toast.success("Filter removed");
    },
    onError: () => {
      toast.error("Failed to remove filter");
    },
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    createMutation.mutate({
      keyword: newKeyword.trim(),
      category: selectedCategory,
      is_active: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Custom Filter Terms</CardTitle>
        <CardDescription>Add extra keywords, channel names, or phrases to block from your child's feed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="e.g. skibidi, gyatt, rizz lord..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={createMutation.isPending || !newKeyword.trim()}>
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </form>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No custom terms yet. Add keywords above to block them from the feed.
          </p>
        ) : (
          <div className="space-y-2">
            {filters.map((filter) => {
              const catConfig = CATEGORY_CONFIG[filter.category] || CATEGORY_CONFIG.custom;
              return (
                <div
                  key={filter.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={filter.is_active}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: filter.id, data: { is_active: checked } })
                      }
                    />
                    <span className={`text-sm font-medium ${filter.is_active ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {filter.keyword}
                    </span>
                    <Badge variant="outline" className={`text-xs ${catConfig.bg} ${catConfig.color} border-transparent`}>
                      {catConfig.label}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(filter.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
