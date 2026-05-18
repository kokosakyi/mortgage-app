# Skill: Deploy to GitHub (and Vercel)

## One-time GitHub setup (no `gh` CLI)

### 1. Create the repo on GitHub
Go to https://github.com/new and fill in:
- **Repository name:** `mortgage-app` (or your preferred name)
- **Visibility:** Public or Private
- **Do NOT initialise** with README, .gitignore, or licence — the repo already has these

Click **Create repository** and copy the HTTPS URL shown (e.g. `https://github.com/<username>/mortgage-app.git`).

### 2. Add the remote and push
```powershell
git remote add origin https://github.com/<username>/mortgage-app.git
git branch -M main
git push -u origin main
```

If prompted for credentials, use your GitHub username and a **Personal Access Token** (PAT) as the password — GitHub no longer accepts plain passwords for HTTPS pushes.

**Create a PAT:** GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → tick `repo` scope → copy the token.

## Subsequent pushes (normal workflow)

```powershell
git add <files>
git commit -m "your message"
git push
```

## Deploy to Vercel

1. Go to https://vercel.com/new
2. Import the GitHub repository
3. Vercel auto-detects Next.js — no build configuration needed
4. Click **Deploy**

No environment variables are required for the localStorage-only flow. If you connect a database later, add `DATABASE_URL` in Vercel → Project → Settings → Environment Variables.

## Install GitHub CLI (optional, for future convenience)

```powershell
winget install --id GitHub.cli
gh auth login   # follow prompts, choose HTTPS + browser auth
```

Once installed, repo creation becomes:
```powershell
gh repo create mortgage-app --public --source=. --remote=origin --push
```

## What is and isn't committed

**Committed:**
- All source code, tests, config files
- `CLAUDE.md` and `.claude/skills/` — project documentation for future Claude sessions
- `pnpm-lock.yaml` — lockfile for reproducible installs

**Gitignored (not committed):**
- `.claude/settings.local.json` — personal permission grants (PowerShell allow-all)
- `.claude/memory/` — personal Claude memory store
- `playwright-report/`, `test-results/` — generated test artifacts
- `steps.txt` — personal scratch notes
- `.env`, `.env.local` — secrets
- `node_modules/`, `.next/` — generated/installed
