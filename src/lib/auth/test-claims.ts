// Test-only verified-claims fixture for existing positive authorization tests.
export async function verifiedTestClaims(mock: { mock: { results: { value: unknown }[] } }) {
  const last = await mock.mock.results.at(-1)?.value as { data?: { user?: { id?: string } } } | undefined;
  return { data: { claims: { sub: last?.data?.user?.id, aal: "aal2" } }, error: null };
}
