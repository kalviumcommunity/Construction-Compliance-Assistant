import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
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

      <ErrorBoundary
        fallbackTitle="Compliance Assistant Unavailable"
        fallbackMessage="An unexpected client rendering error occurred in the compliance assistant."
      >
        <AssistantProvider>
          <AssistantToolbar />
          <QueryForm />
          <AssistantLoading />
          <ResultsView />
          <AssistantModals />
        </AssistantProvider>
      </ErrorBoundary>
    </div>
  );
}
