import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { AssistantProvider } from '@/components/assistant/AssistantContext';
import { AssistantToolbar } from '@/components/assistant/AssistantToolbar';
import { QueryForm } from '@/components/assistant/QueryForm';
import { AssistantLoading } from '@/components/assistant/AssistantLoading';
import { ResultsView } from '@/components/assistant/ResultsView';
import { AssistantModals } from '@/components/assistant/AssistantModals';
import { Wrench } from 'lucide-react';

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Assistant"
        description="Instant jobsite compliance verification & code guidance."
        icon={Wrench}
      />

      <AssistantProvider>
        <AssistantToolbar />
        <QueryForm />
        <AssistantLoading />
        <ResultsView />
        <AssistantModals />
      </AssistantProvider>
    </div>
  );
}
