# Skill: Deploy to GitHub

**Repository:** `https://github.com/kokosakyi/mortgage-app.git`
**Branch:** `main`

## Automated deploy workflow (primary use)

When this skill is invoked, execute the following steps in order:

### 1. Inspect current state
```powershell
git status
git diff
git diff --cached
```

If there is nothing to commit (clean working tree), report that and stop.

### 2. Stage all changes
```powershell
git add -A
```

### 3. Generate a commit message
Read the staged diff and write a concise commit message that:
- Summarises the *why* (not just the *what*)
- Uses imperative present tense ("Add", "Fix", "Update", not "Added")
- Is one sentence for small changes; adds bullet points for larger ones

### 4. Commit using PowerShell here-string syntax
```powershell
git commit -m @'
<generated title>

<optional bullet points>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

### 5. Push to GitHub
```powershell
git push origin main
```

### 6. Confirm
Report the commit hash and the GitHub URL so the user can verify.

---

## Authentication

The remote is pre-configured. If a push is rejected due to auth:
- GitHub no longer accepts plain passwords for HTTPS.
- Use a **Personal Access Token (PAT)** as the password when prompted.
- **Create a PAT:** GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → tick `repo` scope → copy the token.
- To avoid re-entering it: `git config --global credential.helper wincred` (stores in Windows Credential Manager after first use).

---

## One-time setup reference (already done for this project)

```powershell
git remote add origin https://github.com/kokosakyi/mortgage-app.git
git branch -M main
git push -u origin main
```

---

## Deploy to Vercel

1. Go to https://vercel.com/new
2. Import `kokosakyi/mortgage-app` from GitHub
3. Vercel auto-detects Next.js — no build configuration needed
4. Click **Deploy**

Vercel auto-deploys on every push to `main` once the project is connected.

No environment variables are required for the localStorage-only flow. To connect a database later, add `DATABASE_URL` in Vercel → Project → Settings → Environment Variables.

---

## What is and isn't committed

**Committed:**
- All source code, tests, config files
- `CLAUDE.md` and `.claude/skills/` — project documentation for future Claude sessions
- `pnpm-lock.yaml` — lockfile for reproducible installs

**Gitignored (never committed):**
- `.claude/settings.local.json` — personal permission grants
- `.claude/memory/` — personal Claude memory store
- `playwright-report/`, `test-results/` — generated test artifacts
- `steps.txt` — personal scratch notes
- `.env`, `.env.local` — secrets
- `node_modules/`, `.next/` — generated/installed
