import { Suspense } from "react";
import { JourneyView } from "@/components/journey/JourneyView";
import { PageSpinner } from "@/components/ui/PageSpinner";

export default function JourneyPage({ params }: PageProps<"/journey/[id]">) {
  return (
    <Suspense fallback={<PageSpinner />}>
      <JourneyView params={params} />
    </Suspense>
  );
}
