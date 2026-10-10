import { Suspense } from "react";
import { TrialView } from "@/components/trial/TrialView";
import { PageSpinner } from "@/components/ui/PageSpinner";

export default function TrialPage({ params }: PageProps<"/journey/[id]/trial/[index]">) {
  return (
    <Suspense fallback={<PageSpinner />}>
      <TrialView params={params} />
    </Suspense>
  );
}
