import { PageHeader } from "@/components/shared/PageHeader";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Projects"
        description="Manage your construction and development projects."
        icon={Briefcase}
        actions={
          <Button>New Project</Button>
        }
      />
      <div className="flex items-center justify-center h-64 border border-dashed rounded-lg text-muted-foreground">
        Projects overview goes here.
      </div>
    </div>
  );
}
