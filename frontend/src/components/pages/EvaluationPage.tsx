import { PageHeader } from "@/components/shared/PageHeader";
import { BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EvaluationPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="RAG Evaluation"
        description="Monitor system accuracy, retrieval metrics, and test cases."
        icon={BarChart}
        actions={
          <Button>Run Evaluation</Button>
        }
      />
      <div className="flex items-center justify-center h-64 border border-dashed rounded-lg text-muted-foreground">
        Evaluation metrics go here.
      </div>
    </div>
  );
}
