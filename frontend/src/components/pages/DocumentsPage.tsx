import { PageHeader } from "@/components/shared/PageHeader";
import { Files } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Knowledge Base"
        description="Manage building codes, project specifications, and inspection reports."
        icon={Files}
        actions={
          <Button>Upload Document</Button>
        }
      />
      <div className="flex items-center justify-center h-64 border border-dashed rounded-lg text-muted-foreground">
        Document management table goes here.
      </div>
    </div>
  );
}
