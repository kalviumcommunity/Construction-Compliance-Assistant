import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { api } from "@/lib/api";
import { FileText, ShieldCheck, ClipboardCheck, ArrowRight, Activity, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  // Fetch mock data for the dashboard
  const projects = await api.getProjects();
  const history = await api.getHistory();
  const docs = await api.getDocuments();

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const recentQueries = history.slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Overview"
          description="Welcome back. Here is the compliance status across your active projects."
          icon={Activity}
        />
        <Link href="/assistant">
          <Button className="gap-2 shadow-sm font-semibold">
            <Search className="w-4 h-4" />
            Ask a Compliance Question
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Projects"
          value={activeProjects}
          icon={ShieldCheck}
          trend={{ value: 12, label: "from last month" }}
        />
        <StatCard
          title="Documents Indexed"
          value={docs.length}
          icon={FileText}
        />
        <StatCard
          title="Total Queries"
          value={history.length}
          icon={Search}
          trend={{ value: 8, label: "this week" }}
        />
        <StatCard
          title="Inspections Pending"
          value={2}
          icon={ClipboardCheck}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Compliance Queries</CardTitle>
            <CardDescription>Latest questions verified against project documents and building codes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQueries.map((q) => (
                <div key={q.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-secondary/20 transition-colors hover:bg-secondary/40">
                  <div className="space-y-1 overflow-hidden pr-4">
                    <p className="font-medium text-sm truncate">{q.query}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${q.verdict === 'Compliant' ? 'bg-emerald-500' : q.verdict === 'Non-Compliant' ? 'bg-destructive' : 'bg-amber-500'}`} />
                        {q.verdict}
                      </span>
                      <span>•</span>
                      <span>{new Date(q.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link href={`/assistant?q=${q.id}`}>
                    <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Recently uploaded specifications and codes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {docs.slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.type}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/documents">View All Documents</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
