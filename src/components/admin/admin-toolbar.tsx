/**
 * Every admin board in the mockup opens with the same toolbar: an eyebrow, the
 * page heading, a spacer, an application search and a "New job" shortcut.
 * The search is a real GET form so it works without JavaScript.
 */
export function AdminToolbar({
  eyebrow,
  eyebrowHref,
  title,
}: {
  eyebrow: string;
  eyebrowHref?: string;
  title: string;
}) {
  return (
    <div className="admin-toolbar" data-admin-title={title}>
      <div>
        {eyebrowHref ? (
          <a href={eyebrowHref} className="admin-eyebrow admin-link" style={{ textDecoration: "none" }}>
            {eyebrow}
          </a>
        ) : (
          <small className="admin-eyebrow">{eyebrow}</small>
        )}
        <h1>{title}</h1>
      </div>
      <span className="admin-spacer" />
      <form action="/admin/applications" method="get" role="search">
        <input
          className="admin-search"
          type="search"
          name="q"
          aria-label="Search applications"
          placeholder="Search name or email"
        />
        <button type="submit" className="sr-only">
          Search
        </button>
      </form>
      <a href="/admin/jobs/new" className="admin-btn">
        New job
      </a>
    </div>
  );
}
