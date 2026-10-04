import { BrandAccent } from "@/components/brand-accent";
import { BrandLogo } from "@/components/brand-logo";
import { listActiveBrands } from "@/db/queries/brands";
import { isServerEnvConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Home() {
  const configured = isServerEnvConfigured();
  // Deliberately no fake data fallback: these cards prove the database connection.
  const brands = configured ? await listActiveBrands() : [];
  return (
    <main id="main" className="mx-auto max-w-6xl px-6 py-14">
      <p className="mb-3 text-sm font-medium tracking-wide text-muted-foreground">OUR BRANDS</p>
      <h1 className="text-4xl font-semibold tracking-tight">Good work starts here.</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Explore the brands you could build your next chapter with.
      </p>
      {!configured ? (
        <p role="status" className="mt-8 rounded-lg border border-border bg-card p-5">
          The portal is being configured. Please check back soon.
        </p>
      ) : brands.length === 0 ? (
        <p className="mt-8">No brands to display yet.</p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <li key={brand.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <BrandAccent color={brand.accentColor} />
              <div className="p-5">
                <BrandLogo name={brand.name} src={brand.logoUrl} />
                <h2 className="mt-4 font-semibold">{brand.name}</h2>
                {brand.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{brand.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
