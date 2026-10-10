import Link from "next/link";
import { Spinner } from "./Spinner";

export function PageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center text-holo">
      <Spinner className="size-6" />
    </div>
  );
}

export function NotFoundCard({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="card max-w-sm p-8 text-center">
        <p className="eyebrow">Lost in hyperspace</p>
        <p className="mt-3 text-muted">{message}</p>
        <Link href="/" className="btn btn-primary mt-6">
          Return to the holocron
        </Link>
      </div>
    </div>
  );
}
