# Brand careers link kit

Base production URL: `https://careers.fixenmedia.com`. Brands link to this separate portal; no account link or group/hierarchy wording is needed.

| Brand | Careers link |
|---|---|
| Fixen Media | https://careers.fixenmedia.com/?brand=fixen-media |
| Builtale | https://careers.fixenmedia.com/?brand=builtale |
| Doshok | https://careers.fixenmedia.com/?brand=doshok |
| Accoraze | https://careers.fixenmedia.com/?brand=accoraze |
| Wiki Bangla | https://careers.fixenmedia.com/?brand=wiki-bangla |
| Ghora Fera | https://careers.fixenmedia.com/?brand=ghora-fera |
| Mactie | https://careers.fixenmedia.com/?brand=mactie |
| Avagata | https://careers.fixenmedia.com/?brand=avagata |

Multiple values are comma-separated (`?brand=doshok,builtale`). Other supported filter names are dept, type, mode, sector, level and q. Within a facet values are OR; facets combine with AND. A single brand preselects its strip toggle; candidates can clear it or browse other brands.

## Website snippets
Replace doshok with the appropriate slug from the table.

### WordPress
Add a Custom Link menu item with the full URL above and label **Careers**, or use a footer Custom HTML block:
```html
<a href="https://careers.fixenmedia.com/?brand=doshok&amp;utm_source=website&amp;utm_medium=footer&amp;utm_campaign=recruitment-v1">Careers</a>
```

### Next.js
An ordinary external anchor is sufficient; no SDK or shared authentication:
```tsx
<a href="https://careers.fixenmedia.com/?brand=doshok&utm_source=website&utm_medium=footer&utm_campaign=recruitment-v1">Careers</a>
```

### Laravel
Blade footer:
```blade
<a href="{{ 'https://careers.fixenmedia.com/?brand=doshok&utm_source=website&utm_medium=footer&utm_campaign=recruitment-v1' }}">Careers</a>
```
Or provide the brand site's `/careers` convenience redirect:
```php
Route::get('/careers', fn () => redirect()->away('https://careers.fixenmedia.com/?brand=doshok&utm_source=website&utm_medium=footer&utm_campaign=recruitment-v1'));
```

### SaaS footer
Use the WordPress HTML anchor in the product/footer settings. The link is public and needs no embedded key, token, account ID or candidate information.

## UTM conventions and poster export
- utm_source: website, poster or social.
- utm_medium: footer/menu for site links, qr for posters, post for social.
- utm_campaign: a stable ASCII label, such as recruitment-v1 (letters/numbers/hyphen/underscore, <=80 characters).
- utm_content: the role slug for role posters. Never put applicant names, email, phone, IDs or secrets in URLs.

UTMs are link conventions only; V1 adds no analytics provider or applicant tracking fields. Canonicals omit campaign parameters. Published role URLs use their immutable slug; do not point new posters to the old apply route.

The required `pnpm links:generate` reads only open, unexpired roles with active visible brands, then writes quoted UTF-8/LF CSV to ignored `exports/job-links.csv`. It includes public title/department/brand slugs and direct job URLs with poster/qr UTMs, and neutralizes spreadsheet formula cells. It does not query applicants or export their profiles. Configure the independent allowed target and public origin first; the plain script refuses a missing allowed pin.

From the project root, an owner can run against the separately configured private file:
```powershell
node --env-file="C:\secure\careers-production.env" --run=links:generate
```
For another campaign use the direct equivalent (same guard):
```powershell
node --env-file="C:\secure\careers-production.env" --conditions=react-server --import tsx src/db/generate-links.ts october-recruitment
```
Generate real links **after** base -> draft shells -> admin content/questions/brands -> publish. Check every destination before printing. A dev export uses the configured dev URL and is not a production poster kit. No QR dependency was added; use these reviewed public links in your existing poster/QR design workflow. Do not commit generated exports or the original reference/poster artwork.
If a spreadsheet does not autodetect Bengali UTF-8 text, import the CSV explicitly as UTF-8 rather than saving it through an ANSI encoding.
