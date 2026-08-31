import { PageHeader } from "@/components/shared/PageHeader";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Settings"
        description="Configure application preferences and defaults."
        icon={Settings}
        actions={
          <Button>Save Changes</Button>
        }
      />
      <div className="flex items-center justify-center h-64 border border-dashed rounded-lg text-muted-foreground">
        Settings panel goes here.
      </div>
    </div>
  );
}
