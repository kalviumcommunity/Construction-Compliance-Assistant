import { PageHeader } from "@/components/shared/PageHeader";
import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Query History"
        description="View past compliance checks and verified results."
        icon={History}
      />
      <div className="flex items-center justify-center h-64 border border-dashed rounded-lg text-muted-foreground">
        Query history goes here.
      </div>
    </div>
  );
}
