import { PageHeader } from "@/components/shared/PageHeader";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InspectionsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Inspection Reports"
        description="Review AI-assisted jobsite inspections and compliance findings."
        icon={ClipboardCheck}
        actions={
          <Button>Upload Report</Button>
        }
      />
      <div className="flex items-center justify-center h-64 border border-dashed rounded-lg text-muted-foreground">
        Inspection list goes here.
      </div>
    </div>
  );
}
