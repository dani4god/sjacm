# SJACM — St John’s Anglican Church, Makurdi

A complete Next.js / TypeScript / MongoDB starter for the church registry of St John’s Anglican Church, Makurdi, Church of Nigeria (Anglican Communion). Deployment target: Vercel. Version control: GitHub.

## Included features

- All five supplied church photos in a slideshow changing every **3 seconds**, with pause, photo selection and respect for reduced-motion preferences.
- Navbar links for **Church registry**, **Admin login**, and church life.
- Public lookup by registered **Surname Firstname** and a **12-character alphanumeric church code**. Both must match the same record. Letter case and repeated spaces are normalized; names are otherwise matched exactly.
- No candidate signup or authentication requirement.
- A protected admin dashboard with create/edit/search/pagination and logout.
- Conditional baptism, confirmation, marriage, churching and organizational membership sections. A **No** answer is saved and shown as No; its associated detail questions are not displayed or included in the download.
- Separate baptism register **number** and **page** inputs, displayed on separate lines.
- Repeatable sponsor names and officiating priest names.
- All requested organizations; Fathers’ Fellowship is labelled **Fathers’ Fellowship (Men’s Fellowship)**.
- Priest’s comment and name, included in the public lookup and downloadable PDF.
- A cryptographically random code containing both letters and numbers for each new profile, enforced unique by MongoDB. Editing preserves the existing code.
- Admin creation script with bcrypt password hashing, signed HTTP-only sessions, active-admin checks, session revocation, same-origin checks and database-backed lookup/login throttling.
- Activities and announcements with published/draft visibility, editable from the dashboard.
- PDF registry extract with Unicode font, pagination and the stored candidate details. This is a registry download, not a scanned or signed sacramental certificate.
- Privacy/help footer and a registry privacy page. No phone numbers, service times or email addresses have been invented.

You mentioned churching certificates without specifying their questions, so this starter adds an optional churching date and officiating priest section. Mothers’ Union and Fathers’ Fellowship are recorded through organizational membership as specified, rather than separate invented certificate fields.

## 1. Extract and open the project

Extract `SJACM-project.zip`. Open the inner `sjacm` folder in VS Code. It must contain `package.json`, `app`, `components` and `lib` directly.

Install Node.js 22 or 24 LTS and Git if necessary. In the VS Code PowerShell terminal:

```powershell
node --version
git --version
npm.cmd ci
Copy-Item .env.example .env.local
```

Use `npm.cmd` to avoid the PowerShell script-policy error you encountered previously. You do not need to run create-next-app: this ZIP already contains a complete Next.js project.

If learning the initial scaffold separately:

```powershell
npx.cmd create-next-app@latest sjacm --typescript --eslint --app --no-tailwind --no-src-dir --import-alias "@/*" --use-npm
```

Use the supplied files in place of the scaffold’s demo files, keeping the supplied package.json and lockfile together. Then run `npm.cmd ci`.

## 2. MongoDB connection — sharing with BSRverifier

You may use the **same Atlas cluster and exact MongoDB connection string** as BSRverifier. SJACM uses explicitly separate collections:

- `sjacm_admins`
- `sjacm_profiles`
- `sjacm_publications`
- `sjacm_rate_limits`

Therefore its profile records, codes, rate-limit entries and admins do not mix with BSRverifier’s collections, even in the same database. BSRverifier’s admin account will not automatically become a church admin; run SJACM’s creation script once.

Alternatively, use a separate database named `sjacm` in the same cluster. In that case, change the database path in the URI and ensure the database user has read/write access to `sjacm`.

Paste your chosen working URI into `.env.local`:

```dotenv
MONGODB_URI=your-private-working-mongodb-connection-string
```

Keep the real URI private. If configuring Atlas from scratch, create a database user, grant the chosen database read/write access, allow your laptop’s public IP in Network Access, and copy **Connect → Drivers → Node.js**. Reserved characters in the database password must be URL-encoded.

For Vercel, allow the deployment’s outbound connections. Your laptop IP alone will not cover Vercel. Fixed outbound IPs and restricted Atlas access are preferable. If you deliberately choose `0.0.0.0/0` for a basic deployment with variable outbound IPs, understand that it permits connections from any IP; use strong credentials and least privilege.

## 3. Configure secrets and the super admin

Generate a new SJACM session secret. Do not reuse BSRverifier’s secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Complete `.env.local`:

```dotenv
MONGODB_URI=your-working-atlas-uri
SESSION_SECRET=your-new-generated-secret
APP_URL=http://localhost:3000
SUPER_ADMIN_NAME=Church Administrator
SUPER_ADMIN_EMAIL=your-church-admin-email@example.com
SUPER_ADMIN_PASSWORD=your-strong-private-password
```

Use a unique password of 12–128 characters. Save the file, then run:

```powershell
npm.cmd run create-super-admin
```

The script creates SJACM’s admin and required indexes. It refuses to overwrite an existing admin. When successful, remove `SUPER_ADMIN_PASSWORD` from `.env.local`, save, and keep the password in your password manager.

Start the website:

```powershell
npm.cmd run dev
```

Open http://localhost:3000 and http://localhost:3000/login. Sign in with the church admin email and password.

## 4. Create a registry profile

1. Select **Church registry** on the dashboard.
2. Enter surname and first name. The public lookup name is shown beneath these fields in **Surname Firstname** order.
3. Select Yes/No for baptism. Yes reveals date of baptism, birth date, register number and page, parents or former religion, sponsors, residence and priest. Add sponsors with **Add another sponsor**.
4. Select Yes/No for confirmation. Yes reveals its date, location and officiant.
5. Select Yes/No for organizational membership. Yes requires at least one selected organization.
6. Select Yes/No for marriage in the church. Yes reveals spouse, wedding date and officiating priests. Add more priests as needed.
7. Select Yes/No for churching. Yes reveals its date and priest.
8. Enter the priest’s comment and name. The comment is visible to anyone with the candidate’s name and church code.
9. Select **Save & generate church code**.
10. Copy the displayed registered name and code, and give them privately to the candidate.

Code generation uses a 32-character alphabet that avoids confusing characters. Every code is exactly 12 characters with letters and digits. A unique index prevents duplicates, and collisions are retried. The public form accepts lower-case input and converts it to uppercase.

All dates in registry records must be real and not in the future. Birth date must be on or before baptism date. Names/text fields have length limits. Sponsors and priest names are independently stored.

The admin can search by exact registered name or exact church code. **View / edit** opens the full profile. Saving edits preserves the code. Changing a status to No removes its old nested details from MongoDB as well as the public result; the hidden details are not merely concealed in the browser.

Use **Logout** when done. It also revokes that admin account’s other existing sessions.

## 5. Verify and download

On the homepage, select **Church registry** in the navbar or **Verify a church record** in the hero.

Enter the registered surname followed by first name and the corresponding 12-character code. A name mismatch or incorrect code yields the same no-match message. The service does not list candidate names publicly.

For a matching record, the result includes all the saved candidate details and Yes/No statuses. Select **Download registry PDF**. The extract includes a private church code and priest’s comment, so share it deliberately.

The download is a record extract from the church-maintained database. The app does not independently query handwritten registers, scan original certificates, or add a fabricated signature or stamp. Membership entries currently confirm organization membership; they do not create a separately signed Mothers’ Union/Fathers’ Fellowship certificate.

## 6. Activities and announcements

In the admin dashboard, select **Activities & announcements**.

- Choose **Announcement** or **Activity**.
- Enter a title and details.
- Optionally enter event date and location. Event dates may be in the future.
- Check **Publish on the homepage** to show it publicly, or leave unchecked to save a draft.
- Use **Edit / change visibility** to update or unpublish an item.

The homepage loads published items from MongoDB on each request, showing up to the latest 100. Refresh the homepage after saving to see the update. The dashboard pages publications 20 at a time. There is no automatic event expiry or scheduled publishing in this version.

## 7. Your supplied photos

All five supplied images are included, without modifying the originals:

| Original screenshot | Project asset                       |
| ------------------- | ----------------------------------- |
| 100631              | `public/church/church-exterior.png` |
| 100802              | `public/church/church-interior.png` |
| 100839              | `public/church/fellowship.png`      |
| 100909              | `public/church/sanctuary.png`       |
| 100942              | `public/church/community.png`       |

`lib/slides.ts` controls the order, captions and alt text. `components/Slideshow.tsx` controls the 3000-millisecond interval. It starts with the church exterior, then the interior, fellowship, sanctuary and community photos.

For later replacements, use a new asset name or intentionally replace one of these local project assets. Update `lib/slides.ts` accordingly, then push to GitHub. The homepage crops photos responsively to fill the slideshow region while retaining the original files.

## 8. Check locally

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

The optional database integration suite uses a temporary local MongoDB, not your Atlas account:

```powershell
npm.cmd run test:integration
```

Run it after `npm.cmd run build`. It uses local port 3101 and may download a MongoDB binary on first use. It sets its own test connection and test credentials and cleans up afterwards. Do not point it at a real church database. It verifies admin creation, login, protected APIs, exact lookup, uniqueness, edits removing inactive sections, publications, logout and throttling.

Before storing real church data, also test on your own computer/phone:

- Hero photos rotate every 3 seconds; Pause and individual photo buttons work.
- The navbar opens the registry dialog.
- Each No selection hides that section’s details; Yes reveals the required fields.
- Sponsor and priest rows can be added and removed.
- Wrong names/codes fail; correct name and code reveal only that profile.
- The downloaded PDF opens and contains the corresponding record.
- Published announcements appear; drafts and unpublished announcements do not.
- Logout prevents dashboard/API access.

## 9. GitHub

Create an empty private repository named `sjacm` at https://github.com/new, leaving README/.gitignore/license unchecked.

From the SJACM project terminal:

```powershell
git init
git config user.name "Daniel Okeke"
git config user.email "YOUR_GITHUB_EMAIL"
git add .
git status
```

Confirm `.env.local` is not staged. Then:

```powershell
git commit -m "Build SJACM church registry"
git branch -M main
git remote add origin https://github.com/dani4god/sjacm.git
git push -u origin main
```

Use your actual repository URL if different. If `main` does not exist, ensure the first commit succeeded and run `git branch -M main`. If origin already exists, inspect `git remote -v` and correct it with `git remote set-url origin ...`.

## 10. Vercel deployment

At https://vercel.com, sign in with GitHub, select **Add New → Project**, import `sjacm`, and choose **Next.js**. The root directory must contain package.json. Keep the framework’s default build/output settings.

Add only these server-side environment variables for Production:

| Name             | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| `MONGODB_URI`    | Your chosen working Atlas URI                                |
| `SESSION_SECRET` | Your SJACM session secret                                    |
| `APP_URL`        | The exact production origin, e.g. `https://sjacm.vercel.app` |

Do not put super admin email/password into Vercel. The account created locally against that same MongoDB database is already stored there.

**Avoid the previous “request origin not allowed” problem:** APP_URL must match the actual address visitors open, including `https://`, without `/login` or another path. If Vercel assigns a different domain, update APP_URL to that origin and redeploy. Use the stable production domain on your phone, not a deployment-specific preview link. When adding a custom domain, intentionally choose one canonical domain and redirect alternate domains to it, then update APP_URL and redeploy.

Keep local APP_URL as `http://localhost:3000`. Configure Preview deployments separately with their matching origin, separate credentials/secrets and preferably a test database. Production APP_URL does not automatically allow preview domains.

After deploy, test homepage, login, profile save/edit, registry lookup, PDF download, publishing and logout from the production domain. Atlas needs to permit Vercel’s outbound connections.

For updates:

```powershell
git add .
git commit -m "Describe the changes"
git push
```

## 11. Project file map

| File/folder                                           | Responsibility                                             |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| `app/page.tsx`                                        | Homepage and published announcements                       |
| `components/Slideshow.tsx`, `lib/slides.ts`           | Photo rotation and captions                                |
| `components/RegistryButton.tsx`, `RegistryLookup.tsx` | Public dialog and lookup/download                          |
| `components/Dashboard.tsx`, `ProfileForm.tsx`         | Admin records and conditional fields                       |
| `components/PublicationsAdmin.tsx`                    | Activity/announcement editor                               |
| `components/useAdminList.ts`                          | Protected paged-list loading with request cancellation     |
| `lib/models.ts`                                       | Explicit SJACM MongoDB collections                         |
| `lib/validation.ts`                                   | Validates all input and removes inactive sections          |
| `lib/registry.ts`                                     | Secure code creation and public field allowlist            |
| `lib/record-lines.ts`, `lib/pdf.ts`                   | Shared record formatting and PDF download                  |
| `lib/auth.ts`, `lib/http.ts`, `lib/db.ts`             | Sessions, origin checks, throttling and MongoDB connection |
| `app/api/admin/*`                                     | Protected profile/publication endpoints                    |
| `app/api/registry/route.ts`                           | Public name-and-code lookup                                |
| `scripts/create-super-admin.ts`                       | One-time admin creation and indexes                        |
| `public/church`                                       | Your five church photos                                    |
| `public/fonts`                                        | Embedded PDF font and its license                          |
| `tests`                                               | Validation and temporary-database integration tests        |

## 12. Privacy and operational limits

A church code is an access secret. Anyone with a candidate’s matching full name and code can see that profile, including birth date, family/sponsor details and the priest’s comment. Enter only comments intended for this disclosure and distribute codes privately. The app requires no account for lookup, as requested.

Use synthetic profiles while setting up. Before live church use, agree on who may enter records, how members receive their codes and how corrections are approved. There is no public signup, CSV bulk import, scanned-certificate upload, password-reset page or code-rotation interface in this version. It tracks creator/updater IDs and timestamps, not a full historical audit trail. Operational backups, MFA, recovery and auditing should be established for production use.

The downloadable PDF is not digitally signed. To check a copy, use its name and code against the live registry; a PDF by itself can be edited after download.

## Validation completed

Production build, ESLint and TypeScript passed. Ten unit tests passed, including conditional fields, calendar validation, code generation, name normalization, public data selection and PDF pagination. The database integration suite passed 31 HTTP checks plus persisted-state assertions against temporary MongoDB. Sample PDFs were rendered and inspected and their expected fields were extracted successfully. Production dependency audit reported zero known vulnerabilities at the time of checking.

Browser-based visual/slideshow checks could not run because the browser download failed. You should complete the phone/desktop checks above after starting locally. Your actual Atlas connection, production domain and Vercel account have not been configured here, and the project has not been deployed.

Official setup references: https://nextjs.org/docs/app/getting-started/installation · https://www.mongodb.com/docs/atlas/connect-to-database-deployment/ · https://vercel.com/docs/environment-variables/managing-environment-variables
