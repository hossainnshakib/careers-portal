# Docker-free local recovery rehearsal — owner procedure

## Status and authority

**A2 execution is approved**, including sensitive backup and isolated restore once
private custody/protected-storage prerequisites pass. This supersedes the original
documentation-only approval. Exact local encryption/key-creation changes still need
owner approval through the private workflow; no further general A2 approval is needed.
No Docker, PostgreSQL 17 install, new hosted project, dependency,
live mutation, deployment or merge is needed for this preparation. Follow
[the conversion gates](PRODUCTION_CONVERSION_PLAN.md#5-single-ordered-stage-1-checklist--scoped-authorization-status).
This document does not relax A2's managed-service recovery requirement.

Inspection found pg_dump, pg_restore, psql, postgres, initdb and pg_ctl **18.4** on
PATH, a registered 18.4 installation and an already-running postgresql-x64-18
service. No 17 installation was found in PATH, conventional locations or registry.
The source was previously observed as **17.11**. No existing local cluster was
connected to, stopped, reconfigured or used as a restore destination. Do not repeat
these audits unless tools/endpoints change.

PostgreSQL 18 pg_dump supports reading PostgreSQL 17 and its output is intended
for the same/newer server version. A successful 17 → 18 logical rehearsal proves
only the tested forward-version path. It does **not** prove restoration to 17,
physical/WAL compatibility, identical extension behavior or Supabase services.
Use the matching 18 pg_restore for its custom archive. Do not install 17 merely
for this rehearsal or restore an 18-produced archive to the live 17 server.

## 1. Preconditions and private custody

Agent may execute the delegated A2 work after the owner's private confirmations;
owner retains password/key custody and provider-dashboard responsibilities. Before starting:

- Evidence the remote A1 freeze, including cron and existing signed-upload issuers.
  Explain the ten absent sidecars from provider history; do not guess their cause.
  Preserve the original scoped 20-artifact backup without replacing its manifest.
- Confirm proposed 24h RPO, 8h RTO, 14d retention, two independent encrypted copies,
  pre-change 14d retention and a dated maintenance window, or replace the targets.
- Choose an owner-controlled encrypted staging volume outside Git, cloud-sync,
  web roots and application worktrees. Verify volume encryption and restrictive
  ACLs before storing any plaintext dump, manifest, decrypted file or local PGDATA.
  A normal temporary directory/NTFS permissions alone are not encryption.
- Select an encryption recipient and separately recoverable private key, and two
  independent destinations (for example an offline device plus private off-machine
  storage). Two folders/partitions on one disk are not independent copies.
  Do not use the Supabase TLS CA for encryption. Do not put keys or recovery
  passphrases beside archives, in chat, source control, shell history or logs.
- Verify owner access to existing-project Supabase backup/recovery controls and
  configuration. Record unavailable components as gaps, not successful coverage.

No additional system software is required for the database portion. Windows
PowerShell CMS encryption is available; section 4 specifies a bounded-file method.
An existing approved owner encryption tool is also acceptable after a round-trip
test. No tool installation or certificate/key generation is performed by this plan.

### Prompt 18 execution checkpoint and single private owner workflow

- USB J was physically verified as removable USB disk 3, independent of local disks,
  writable with a one-byte create/flush/length check; only that newly created probe
  was removed. exFAT, 57.76 GiB free. G has 145.94 GiB free/NTFS. Do not repeat this
  device audit unless devices change. J stores encrypted files only, not PGDATA.
- A private local desktop workflow has been launched, not merely proposed. It asks
  once for masked password/confirmation, independent off-PC/off-USB password custody,
  writer-freeze attestation and explicit approval for the exact local changes:
  create a fresh private EFS directory on G, allow user EFS-key creation, create a
  user document-encryption certificate, and export password-encrypted AES-256 PFX
  recovery keys to **separate key folders**, not archive directories, on G and J.
  No existing volume/service/database is reconfigured. Owner can decline; no source
  export then occurs. The password is not placed in argv, chat or source files.
- The workflow verifies EFS inheritance on a harmless file, decrypts both encrypted
  PFX copies in memory and tests a harmless CMS payload from both destinations.
  Before exports the prepared packaging runner additionally requires the AES-256
  CMS algorithm OID, unchanged protected storage and adequate capacity. These checks
  are **implemented private procedures, not claimed PASS while awaiting owner input**.
- Private helpers live outside Git in the approved agent temporary area. The source
  helper's read-only audit has actually run. The export, chunk packaging and restore
  helpers remain conditional/unexecuted until the private prerequisites pass. They
  use existing tools/native CMS, not a new dependency or custom cipher. The old 7-Zip
  beta need not handle secrets or binary PowerShell pipes.
- Package layout: CMS-encrypted bounded binary/base64 chunks, encrypted file manifest,
  ciphertext-only SHA-256 index, independent local/USB readback and decryption into
  EFS storage. Both password-encrypted PFX copies are separately tested; password
  custody remains an owner attestation, not a proven password-manager recovery drill.
  Record the final ciphertext-index digest independently in the redacted evidence
  before trusting later restores. Same-PC EFS and certificate checks do not simulate
  total machine-loss recovery or managed Supabase services.

Current owner-window outcome, backup and timing results belong in the latest launch
verification entry. Do not turn a pending private interaction into a successful backup.

### Minimum-setup execution path — no USB requirement

Later A2 execution approval covers sensitive backup and isolated recovery, subject
to the safeguards below; do not request that approval again. B–H remain gated.
Use installed PG18 and existing encryption/storage resources, not Docker, another
PostgreSQL installation or another Supabase project.

- A subsequent inspection found **7-Zip 21.03 beta** outside PATH with 7zAES/AES-256
  codec support. This supersedes the earlier PATH-only absence finding. Capability
  detection is not an encryption/decryption test or endorsement of an old build.
  Use only reviewed, self-created archives; do not open untrusted archives.
- A USB disk is **not required**. Existing independently backed storage or an
  existing private off-machine destination can hold the second encrypted copy.
  D/E/F share one physical disk; C and G are on separate physical disks. Separate
  disks in one machine provide disk-failure redundancy, not protection from machine
  loss/ransomware. Record that distinction; do not silently equate it to off-machine
  or offline protection. H has no established physical backing/independence and
  must not be selected on its drive letter alone.
- The shortest archive route is the owner's existing 7-Zip AES-256 workflow with
  encrypted archive headers and a high-entropy owner-controlled password held in
  existing independent private custody. Have the owner enter it in a **local
  interactive password prompt**, never `-pPASSWORD`, chat, environment variables,
  transcripts or command history. No interactive secret-entry channel is available
  through the agent's current tools; do not invent a password or a custody location.
- For a dump stream, use a reviewed binary process pipe (not PowerShell 5 text
  piping); 7-Zip must receive and close the complete stream, and both producer and
  archiver exit statuses must pass. Password prompting must use a separate local
  interactive channel, not consume the dump stdin. Verify a nonsensitive round trip
  first. No sensitive streaming implementation has been executed or validated here.
- Streaming can avoid plaintext dump files but **cannot protect restored PGDATA by
  itself**. Use an existing owner-controlled encrypted volume/directory with verified
  recoverable encryption keys for local restoration. Previously inspected C–G had
  BitLocker off; H protection is unknown. Do not enable volume encryption, create
  encrypted containers, modify an existing service or claim NTFS ACLs encrypt data
  as an unapproved shortcut. If no protected restore location exists, that is the
  specific local recovery blocker; the owner can privately provision one using
  available Windows facilities after approving the exact local change.

Actual status remains: no verified owner key recovery, selected independent second
destination, protected PGDATA or archive round trip. No sensitive export or restore
has run. Once these pass, follow sections 2–7 without another planning cycle.

## 2. Read-only source export over verified TLS

Use the previously verified **session pooler port 5432** endpoint, not transaction
pooler 6543 for pg_dump/snapshot coordination. Reuse the verified official CA.
libpq does not read the application's DATABASE_SSL_CA automatically: explicitly
set a private libpq service configuration with `sslmode=verify-full` and
`sslrootcert` pointing to that CA. Include host, port, database and the exact
approved pooler username; independently check its tenant is xmtoccukridshadnxrlc.
Supply the password through an owner-restricted passfile, never a command argument
or printed URI. Inspect effective libpq settings privately so URI/service options
cannot override verify-full. Do not downgrade TLS or alter global trust.

All variables below are private operator selections, **not** values to commit.
Use a fresh private shell, no transcript/debug logging, and no app env loading.
Example export shape, to run only after the owner authorizes the export:

```powershell
$env:PGSERVICEFILE = $PrivateServiceFile
$env:PGPASSFILE = $PrivatePassFile
$env:PGOPTIONS = '-c default_transaction_read_only=on'
& pg_dump --dbname='service=careers-source' --no-password --format=custom --quote-all-identifiers --lock-wait-timeout=10s --file="$DatabaseArchive"
if ($LASTEXITCODE -ne 0) { throw 'Source archive incomplete; inspect errors privately.' }
& pg_restore --list "$DatabaseArchive" > "$PrivateTocFile"
if ($LASTEXITCODE -ne 0) { throw 'Archive TOC unreadable.' }
```

Paths must be on encrypted staging. Even TOCs and error output can reveal private
object names; keep them private. pg_dump is read-only but takes ACCESS SHARE locks
and consumes resources: set a bounded lock wait (`--lock-wait-timeout=10s`), agree
the window, and stop on contention rather than killing other connections. Treat
warnings about omitted/inaccessible objects as an incomplete backup until reviewed.
Do not use migrations, seeds, resets, session-replication-role changes or disabling
source triggers. pg_dump's consistent DB snapshot does not include Storage bytes
or external provider configuration.

### Coverage and reconciliation

Prefer a full database logical archive **if permissions allow**, preserving native
pre-data/data/post-data sections. Do not silently fall back to public-only. Capture:

| Component | Private backup and verification requirement |
|---|---|
| Application | All 13 public tables, enums, sequences/values, indexes, foreign keys, CHECK/unique constraints, defaults, functions, trigger definitions, RLS flags/policies, owners, ACLs and default privileges |
| Migration state | Drizzle ledger including six historical applied hashes/timestamps; versioned migration files/journal and approved source SHA. Pending 0007 stays pending, historical 0006 stays unjournaled; do not run migrations during recovery testing |
| Auth | Complete accessible auth schema/data, not only users: identities, sessions, refresh tokens, MFA factors/challenges and Auth migration/version state. Treat every byte as secret. Record all inaccessible objects and externally encrypted fields/key dependencies |
| Security triggers | Function careers_revoke_auth_sessions_on_security_change, its SECURITY DEFINER owner/search_path/ACL, plus careers_password_change_revokes_sessions on auth.users and careers_verified_factor_change_revokes_sessions on auth.mfa_factors. Public-only dumps miss triggers attached to auth tables |
| Storage metadata | All buckets/objects and accessible dependent storage schema, visibility, size/MIME allowlists, policies and metadata; file bytes separately in section 3 |
| Global/config metadata | Role names/attributes/memberships and owners/ACLs, database settings, extension names/versions/schemas, internal schemas/dependencies, publications/subscriptions and scheduled jobs if present. Do not enable jobs in recovery |
| External configuration | Owner-exported Auth signup/redirect/JWT/session/MFA settings and service versions, API/signing/key recovery dependencies, Storage settings, TLS/enforcement, provider recovery method, hosting/env-scope metadata and Turnstile configuration. Secret values stay in independent owner custody, not the report |

pg_dump does not dump global roles or role passwords. Use read-only catalog export
for role/membership metadata or privately review `pg_dumpall --roles-only
--no-role-passwords`; never treat it as permission to recreate provider superusers
locally. Recovery passwords are not recoverable from that export. No source role,
grant or configuration change is permitted to make a dump succeed.

Capture canonical row counts/hashes, constraint validation/index state, trigger
definitions/enabled flags, RLS/ACL/default-privilege state and extension inventory
against the **same snapshot** as the archive: keep a read-only REPEATABLE READ
transaction with pg_export_snapshot() open and pass its ID to `pg_dump --snapshot`.
Session pooling is required. Keep exporter transaction alive until all snapshot
readers finish; use bounded timeouts. If this coordination is unavailable, record
the gap and do not claim snapshot-matching hashes from unrelated reads. The full
archive itself has a consistent DB snapshot even without an external snapshot.

## 3. Storage bytes — separate read-only backup

After evidenced freeze, inventory **every bucket and prefix**, including pending,
reservations, applications, deleting, logos and empty buckets. The previous ten
remaining objects are historical evidence, not a hardcoded expected future list.

Use the existing Supabase SDK/Storage download API with the owner-held service
credential privately. Do not create signed links, upload, move or delete. Paginate
and recurse all listings, and cross-check against snapshot storage.objects. Fetch
each object's original bytes over HTTPS with normal certificate verification;
save under a generated local artifact ID rather than trusting a remote path as a
local filename. Reject redirects to unapproved hosts; never forward credentials.

An encrypted manifest maps each artifact ID to exact bucket name and object key,
original filename if known, byte length, Content-Type, provider metadata and
timestamps, and locally calculated SHA-256. Compare downloaded length/MIME with
metadata and application attachment references. Handle Unicode keys verbatim;
prevent traversal, absolute paths and case-insensitive filesystem collisions.
Hash bytes, not ETags. Preserve sidecars too; a listing is not a byte backup.

Re-list metadata after downloads, compare IDs/keys/timestamps/sizes and bucket
config with the baseline and verify every hash. Any missing/changed/new object,
unfinished upload or DB/file-reference mismatch stops consistency acceptance.
There is no atomic cross-service DB/Storage snapshot: freezing all writers and
waiting for outstanding upload capabilities is necessary. If outstanding issuers
cannot be shown quiescent before retirement, preserve the preliminary backup but
do not call it final A2 evidence or proceed destructively. Return to the owner to
resolve the gate; do not perform B retirement early to bypass it.

## 4. Encryption, integrity and independent copies

Windows PowerShell 5 has Protect-CmsMessage/Unprotect-CmsMessage. It is a text
interface: **never pipe binary pg_dump/tar bytes through a PowerShell text pipe**.
For a no-install method, the private operator uses a valid owner-controlled CMS
document-encryption recipient with a recoverable private key, and this file format:

1. Enumerate closed backup files on encrypted staging; make a private manifest with
   generated IDs, safe relative paths, sizes and SHA-256 of original bytes. Include
   the DB archive, Storage bytes/metadata, configuration exports and evidence.
2. Read each file through .NET FileStream in bounded **8 MiB binary chunks** (loop
   until the chunk is filled or EOF; a short Read is not necessarily EOF). Base64
   encode each chunk and pass that **string** to Protect-CmsMessage `-To $Recipient
   -Content $Base64 -OutFile $ChunkFile`. Check every operation for failure. Record
   ordered chunk IDs, lengths and hashes; include empty-file entries explicitly.
3. Encrypt the index/manifest the same way, splitting it if necessary. Keep a small
   outer index with format version, generated IDs/order and ciphertext hashes only;
   no object paths, identities or credentials. Seal its hash in the separate owner
   receipt so attacker replacement/reordering cannot be accepted merely because
   adjacent hashes also changed. CMS encryption alone does not authenticate sender
   identity. This chunk format is a procedure specification, **not a tested backup
   implementation**; prove its round trip with nonsensitive files first.
4. To recover, verify ciphertext/index hashes against the independently held receipt,
   decrypt each chunk with Unprotect-CmsMessage, decode with FromBase64String and
   write bytes in exact order via FileStream. Verify lengths/full-file SHA-256 before
   opening the DB archive. Never write decoded content to stdout/text redirection.
5. Copy the closed encrypted set and outer index to both independent destinations.
   Read back **all ciphertext bytes from each destination**, compare every hash and
   count, then decrypt/reconstruct and hash-check from each copy independently.
   Test key recovery without depending on the source machine's certificate store;
   keep recovered private-key material private. A checksum-only copy test is not a
   decryption test. Do not destroy the only working key during this test.

No certificate/key is generated here. If no recoverable owner recipient/key exists,
owner must authorize/provision one privately before exports. An existing approved
binary-safe encryption/archive tool can replace the chunk method, but its tested
format/version/key-recovery instructions and authenticated integrity must be in
the private receipt. Avoid inventing cryptography or claiming unexecuted packaging
is verified. Apply owner-confirmed retention, including deletion obligations and
key availability for retained snapshots; maintain at least one offline copy.

## 5. Isolated PostgreSQL 18 rehearsal

This requires separate execution approval and owner-controlled encrypted local
storage, **not a new server installation or modification of the running service**.
Use installed 18 binaries to initdb a **new empty** disposable directory. First
inspect that the chosen directory/port are unused; never reuse existing PGDATA.
Start only that cluster using pg_ctl, a unique non-default free port, listen_addresses
127.0.0.1 and SCRAM-only host authentication. No Windows service registration,
trust auth, firewall exposure, app start or production env file. Encrypt PGDATA,
logs, decrypted artifacts and local Storage reconstruction files. Configure no
replication/subscriptions, cron, outbound hooks or extensions capable of external
effects. Review dumped functions before enabling/executing them.

Use a separate local libpq service and restricted local passfile. Restore commands
run from a **fresh process with no source credentials/API keys**, with host exactly
127.0.0.1, explicit rehearsal port, local db/user, and require local server identity
and a private rehearsal marker to match before any write. Do not use DATABASE_URL,
DIRECT_URL, application clients or existing DEV tools; do not weaken their guards.
Create the disposable rehearsal database from template0, not a populated template.
No restore command in this runbook targets production. Loopback-only local auth is
not a relaxation of source/hosted TLS requirements; use local TLS if required by the
owner's local security policy.

Review the archive TOC and create a private restore selection/dependency map:

- **Portable app rehearsal:** restore public and migration ledger types/schema,
  rows/sequences, indexes, constraints, functions and RLS. Use `pg_restore
  --exit-on-error --single-transaction --no-owner --no-privileges` with the explicit
  local service and reviewed TOC. These flags intentionally omit original ownership/
  grants: verify/reconstruct an approved **local-only** privilege model separately,
  rather than claim exact ACL recovery. Never use `--clean` against an existing DB.
- **Auth representation:** restore accessible auth schema/data only when compatible
  prerequisites exist; otherwise preserve encrypted exports and list exclusions.
  An auth.users/auth.mfa_factors substitute or hand-created role is not GoTrue/MFA
  recovery. Record missing dependencies/errors and refuse a blanket PASS.
- **Security triggers:** verify both auth-table triggers, function body, SECURITY
  DEFINER owner/search_path and ACLs explicitly. A PostgreSQL-only transactional
  trigger test can demonstrate local behavior on dedicated local test rows, but
  cannot prove managed Auth behavior. No live factors/passwords may be changed.
- **Local privileges:** use disposable NOLOGIN roles corresponding to anonymous/
  authenticated access to test denial, with reviewed local grants matching intended
  source effective access. Verify all 13 RLS flags/no policies, PUBLIC/default ACLs
  and actual denied reads as a non-owner/non-BYPASSRLS role; superuser SELECTs do not
  prove RLS. Local roles do not simulate PostgREST JWT authorization.
- **Files:** reconstruct into a local encrypted bucket/key manifest mapping, validate
  original byte size/MIME metadata/SHA-256 and attachment references. This proves
  file recoverability, **not** Storage API, signed URLs or access-policy enforcement.

Check every subprocess exit code. Do not hide restore errors, use empty stand-ins
as successful restoration or disable constraints to force a green report. Verify
row hashes/counts, sequence values, validated constraints/indexes, migration hashes,
slug trigger, security triggers and RLS/privilege outcomes against source evidence.
Pending 0007 must remain absent. Stop only the cluster started for the rehearsal by
its exact private directory; preserve the existing PostgreSQL service. Retain or
remove private rehearsal data only under owner retention approval.

## 6. Supabase boundaries and smallest additional mechanism

Standard PostgreSQL cannot supply Supabase Auth/GoTrue, Storage object service,
PostgREST, API gateway/JWT signing, pooler, Realtime or provider control-plane config.
Managed roles (including provider superusers/authenticator/service roles), internal
auth/storage/realtime/extensions/vault/net/cron schemas **if present**, extension
versions and privileges need component-by-component review. They may be absent,
unavailable or non-portable locally; inventory actual contents, do not assume all
listed schemas exist. Provider-encrypted MFA/Vault fields can depend on service-side
keys not exported by SQL. SQL rows alone cannot demonstrate decryptability, owner
MFA login, revocation or signed-object access. Subscription/jobs/hook restoration
could contact live systems and must stay disabled locally.

**Smallest additional mechanism:** use the **existing project's** provider-managed
recovery facility, if already available, together with the independent encrypted
Storage-byte/config backups. Owner verifies its recovery point/retention and gets
provider documentation/support confirmation of Auth/MFA key, security-trigger and
configuration coverage/exclusions. Do not assume daily backups or PITR exist or
include file bytes; do not activate a paid feature without approval. Request a
provider-supported non-destructive validation route if available. Evidence of
availability/support coverage is not a completed managed-service restore test.

If critical Auth/MFA/config recovery remains unprovable without restoring the
existing project or another full Supabase environment, report **A2 NOT VERIFIED**
and stop destructive conversion. A live restore is not an authorized test. No new
hosted project/Docker is proposed here. Owner must obtain a provider-supported
recovery validation method or separately review a changed recovery requirement;
the agent cannot silently waive the full-service gate. Normal owner MFA checks
after a future release prove current service access, not recovery capability.

## 7. Timing and evidence — do not invent results

Record UTC start/end and monotonic elapsed time separately for export, encryption,
copy readback/decryption, local restore and validation. Measure total recovery from
loss declaration/access to an independent copy and recovered key through verified
database/files readiness, including operator steps. A separately timed local
pg_restore is not the full 8h RTO. RPO requires a verified most-recent consistent
recoverable set and operating backup cadence; one set cannot prove 24h coverage.

Return only redacted counts, component coverage/exclusions, tool/server versions,
copy verification/decryption outcomes, validation PASS/FAIL and measured durations.
Keep private paths, filenames, Auth identities, credentials and archive bodies out
of the repository/report. Current results: tooling inspection **PASS**; packaging,
exports, independent-copy decryption, local restore and elapsed recovery **NOT
VERIFIED / NOT RUN**. No managed-service or RPO/RTO guarantee demonstrated.

## 8. Consolidated minimum owner actions to finish conversion

This replaces the older A1/A2 owner checklist in the launch report; do not repeat
passed source/TLS/tool audits. Only refresh checks whose relevant state changed.

1. **Finish A1 remotely:** attest deployment/DEV-job/cron/writer freeze, access and
   secret-scope inventory, old-deployment protection and the missing-sidecar history.
   Preserve owner recovery access; no A1 credential/session revocation.
2. **Finish A2 privately:** confirm recovery objectives/dated window, encrypted
   staging, recoverable owner encryption key and two independent destinations;
   explicitly authorize sensitive execution, then perform the documented DB/config/
   Storage backup, two-copy decryption and isolated PG18 rehearsal. Provide redacted
   coverage/timing evidence. Establish existing-project provider recovery coverage
   and a supported validation route for critical Auth/MFA/service gaps. A2 cannot
   pass on PG18/file recovery alone; unresolved critical gaps stop conversion.
3. **Authorize and execute B–H only after A2 passes:** name owner executors and bind
   the approved release SHA (36594bf unless separately replaced). Retire old access/
   sessions/connections and DEV copies, verify denials/fresh access, record the issuer
   cutoff and wait >2h1m; perform only eligible original-artifact cleanup and sole
   expected 0007 migration, with their guarded pre/postchecks. No broad cleanup.
4. **Within that authorization, activate production:** verify hosting/log privacy,
   Auth/bucket/Turnstile settings; set Production-only env/CA, build the pinned commit
   for Production, verify normal owner MFA and uncached hosted SQL TLS reads/denials;
   confirm/enable SSL enforcement only as needed, recheck connections, refresh recovery
   baseline and resume only reviewed production cron. No merge is required/approved.
5. **Approve launch separately:** confirm privacy/contact/retention and intended job
   content; authorize protected synthetic apply/review/file/PDF acceptance and exact
   test cleanup. Only after passing and zero residue, give a separate final approval
   for real job publishing/intake. No real applicants before that decision.

## References

- [PostgreSQL 18 pg_dump compatibility and snapshot options](https://www.postgresql.org/docs/18/app-pgdump.html)
- [PostgreSQL 18 pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html)
- [libpq verified TLS](https://www.postgresql.org/docs/18/libpq-ssl.html)
- [Windows PowerShell Protect-CmsMessage](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/protect-cmsmessage?view=powershell-5.1)
- [Supabase backup scope and Storage exclusions](https://supabase.com/docs/guides/platform/backups)
