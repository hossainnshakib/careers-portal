import Link from "next/link";

export default function NotFoundPage() {
  return <main id="main" className="mx-auto max-w-3xl px-5 py-20">
    <p className="text-muted-foreground">404</p><h1 className="mt-4 text-3xl font-bold">This page isn’t available.</h1>
    <p className="mt-5 leading-relaxed text-muted-foreground">The link may be incorrect, or this role may not be available publicly.</p>
    <Link href="/" className="mt-7 inline-block rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground">Browse open roles</Link>
  </main>;
}
