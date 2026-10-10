import { Suspense } from "react";
import { LoginView } from "@/components/LoginView";
import { PageSpinner } from "@/components/ui/PageSpinner";

export const metadata = { title: "Sign in — Aetherion" };

export default function LoginPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <LoginView />
    </Suspense>
  );
}
