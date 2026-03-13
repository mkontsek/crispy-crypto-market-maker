# Security

## Reporting Vulnerabilities

Please open a GitHub issue or contact the maintainers directly for security concerns.

---

## Historical Credential Leak — Action Required

A security audit identified the following credentials that were committed to this
repository's git history.  They have been removed from the working tree in this
PR, but the values **remain reachable in old commits** until the history is
rewritten.

| File | Leaked value | First introduced |
|------|-------------|-----------------|
| `infra/postgres/Dockerfile` | `POSTGRES_PASSWORD=crispy` | commit `765da70` |
| `apps/web/src/app/login/page.tsx` | `defaultValue="MyDemoPassword123!#"` | commit `1a844b7` |
| `packages/db/prisma.config.ts` / `packages/db/src/index.ts` | fallback `postgresql://postgres:postgres@localhost:5432/postgres` | multiple commits |

### Required steps for the repository owner

1. **Rotate all exposed credentials immediately**, even for non-production
   environments (demo passwords, local DB passwords, etc.).

2. **Rewrite git history** to purge the leaked values from every commit.
   The recommended tool is [`git-filter-repo`](https://github.com/newren/git-filter-repo):

   ```bash
   # Install
   pip install git-filter-repo

   # Create a replacements file
   cat > /tmp/replacements.txt <<'EOF'
   POSTGRES_PASSWORD=crispy==>POSTGRES_PASSWORD=***REMOVED***
   MyDemoPassword123!#==>***REMOVED***
   postgresql://postgres:postgres@localhost:5432/postgres==>postgresql://***:***@localhost:5432/postgres
   EOF

   # Rewrite all branches
   git filter-repo --replace-text /tmp/replacements.txt --force

   # Force-push all rewritten branches (requires admin rights)
   git push --force --all origin
   git push --force --tags origin
   ```

3. **Notify all contributors** to re-clone the repository after the force-push,
   because their local clones still contain the old history.

4. **Invalidate any GitHub forks or cached copies** via the GitHub support
   contact form if the repository is public.

---

## Prevention

- Never commit real credentials — use environment variables and `.env` files.
- `.env*` files are already listed in `.gitignore`.
- Use `.env.example` (committed, no real values) to document required variables.
- Consider adding a pre-commit hook or CI secret-scanning step (e.g.
  [truffleHog](https://github.com/trufflesecurity/trufflehog) or
  [gitleaks](https://github.com/gitleaks/gitleaks)) to catch future leaks.
