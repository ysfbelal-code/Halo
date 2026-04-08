import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle2, Eye, XCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-accent/20 text-accent-foreground border-accent/30" },
  reviewing: { label: "Reviewing", icon: Eye, className: "bg-primary/10 text-primary border-primary/20" },
  resolved: { label: "Resolved", icon: CheckCircle2, className: "bg-secondary text-secondary-foreground border-secondary" },
  dismissed: { label: "Dismissed", icon: XCircle, className: "bg-muted text-muted-foreground border-border" },
};

const categoryLabels = {
  inappropriate_content: "Inappropriate",
  violent_content: "Violent",
  misleading: "Misleading",
  spam: "Spam",
  social_engineering: "Social Engineering",
  risky_stunts: "Risky Stunts",
  mature_reality: "Mature Content",
  other: "Other",
};

export default function ReportList() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => base44.entities.Report.list("-created_date"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Your Reports</CardTitle>
        <CardDescription>Track the status of your submitted reports</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No reports submitted yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const status = statusConfig[report.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <div
                  key={report.id}
                  className="p-4 rounded-xl border border-border hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{report.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="outline" className={status.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[report.category] || report.category}
                        </Badge>
                        {report.created_date && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(report.created_date), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    {report.video_url && (
                      <a
                        href={report.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
