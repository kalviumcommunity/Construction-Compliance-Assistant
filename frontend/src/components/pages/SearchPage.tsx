import { PageHeader } from "@/components/shared/PageHeader";
import { Search } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Search Explorer"
        description="Debug and evaluate RAG retrieval accuracy across chunks."
        icon={Search}
      />
      <div className="flex items-center justify-center h-64 border border-dashed rounded-lg text-muted-foreground">
        Advanced search tools go here.
      </div>
    </div>
  );
}
