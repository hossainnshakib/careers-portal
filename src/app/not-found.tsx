import PublicLayout from "./(public)/layout";
import { PublicNotFound } from "@/components/public/public-not-found";

/** Unmatched root URLs have no route-group shell, so provide public chrome here. */
export default function NotFoundPage() {
  return <PublicLayout><PublicNotFound /></PublicLayout>;
}
