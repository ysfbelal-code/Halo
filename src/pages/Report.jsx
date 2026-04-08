import { Flag } from "lucide-react";
import ReportForm from "../components/report/ReportForm";
import ReportList from "../components/report/ReportList";

export default function Report() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Flag className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-heading font-bold text-3xl text-foreground">Report Brainrot</h1>
        </div>
        <p className="text-muted-foreground">Something snuck past Guardian? Report it and we'll add it to the kill list.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ReportForm />
        <ReportList />
      </div>
    </div>
  );
}