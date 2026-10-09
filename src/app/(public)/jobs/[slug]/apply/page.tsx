import type { Metadata } from "next";
import JobPage, { generateMetadata as generateJobMetadata } from "../page";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Old poster/bookmark URLs keep working by rendering the same inline job page
 * (form at #apply) instead of redirecting; the route stays out of search indexes.
 */
export async function generateMetadata(
  props: Parameters<typeof generateJobMetadata>[0],
): Promise<Metadata> {
  const metadata = await generateJobMetadata(props);
  return { ...metadata, robots: { index: false, follow: false } };
}

export default JobPage;
