# TU-Theme Customizations — How UPai-TU Is Built

## Why this exists

Merging LibreChat's upstream repo directly into the old `\UPai` fork caused
repeated conflicts that eventually broke the app. This pipeline replaces
that entirely: **no more `git merge` from upstream, and no hand-maintained
Dockerfile either.** Every build clones LibreChat fresh (source AND its own
tested Dockerfile), then layers Thammasat's theme files on top automatically.

## How it works, end to end

```
danny-avila/LibreChat (main, always latest — source + its own Dockerfile)
        │  git clone --depth 1   (GitHub Actions step)
        ▼
  fresh clone in ./build
        │  merge-package-json.js  (root + client package.json:
        │                          TU name/description/scripts only,
        │                          dependencies always stay upstream)
        │  copy tu-overlay/*      (theme files overlaid last, always win)
        ▼
  docker build  -- context: ./build --
        (uses LibreChat's OWN Dockerfile, unmodified, exactly as shipped)
        ▼
  ghcr.io/ilek2428/upai-tu:latest   (pushed automatically)
```

Nothing in this pipeline maintains a second copy of LibreChat's Dockerfile.
That was tried and rejected earlier in this project — a hand-written
Dockerfile inevitably drifts out of sync with real build requirements
(Node version, `npm ci` vs `npm install`, workspace packages under
`api/`, `packages/data-provider`, `packages/data-schemas`, `packages/api`,
etc.). Using the real one, freshly cloned every time, means it is always
correct by construction.

## What lives in tu-overlay/ (packed from the tested `\LibreChat` folder)

| Path | Notes |
|---|---|
| `client/index.html` | |
| `client/privacy-policy.html` | |
| `client/public/assets/apple-touch-icon-180x180.png` | |
| `client/public/assets/favicon-16x16.png` | |
| `client/public/assets/favicon-32x32.png` | |
| `client/public/assets/icon-192x192.png` | |
| `client/public/assets/logo.svg` | |
| `client/public/assets/maskable-icon.png` | |
| `client/public/privacy-policy.html` | |
| `client/public/tos.html` | |
| `client/src/components/Auth/AuthLayout.tsx` | |
| `client/src/components/Auth/Login.tsx` | |
| `client/src/style.css` | |
| `client/src/utils/upaiEffects.ts` | |
| `client/tailwind.config.cjs` | |
| `client/tos.html` | |
| `package.tu-fragment.json` | NOT a full package.json — merged via `merge-package-json.js`. Only `name`/`description`/extra scripts taken; dependencies always come from fresh upstream. |
| `client/package.tu-fragment.json` | Same treatment, for the client workspace package.json. |

**Explicitly out of scope (confirmed by Lek):**
- `librechat.yaml` — not needed here; the server calls its own config directly.

**Still worth double-checking before relying on this fully:**
- If there's any auto-refill credit cron script or similar still in active
  use in production, it lives outside this repo/pipeline entirely right now.
  Confirm separately whether it needs to ship inside this image or runs as
  an independent service.

## One-time setup checklist

- [ ] Run `pack-tu-overlay.ps1` (source: `\LibreChat`, the tested working
      copy) to populate `tu-overlay/` in the `\UPai` repo.
- [ ] Confirm `Skipped: 0` in the script output. Investigate any skipped
      path before proceeding (usually a rename or moved file).
- [ ] `git add tu-overlay TU-CUSTOMIZATIONS.md .github && git commit && git push origin TU-theme`
- [ ] On GitHub: `iLek2428/UPai` → **Settings → Actions → General →
      Workflow permissions → Read and write permissions** → Save.
      (Without this, the workflow can't push to ghcr.io.)
- [ ] Go to the **Actions** tab → "Build and Push UPai-TU" →
      **Run workflow** (manual trigger) to confirm the first build succeeds
      before trusting the daily schedule.
- [ ] If it fails, check the step logs — most likely spot is the
      `client/package.json` merge or a path typo in `tu-overlay/`.
- [ ] Once a build succeeds, confirm the image at
      `github.com/iLek2428/UPai/pkgs/container/upai-tu`.
- [ ] On the production server: `docker pull ghcr.io/ilek2428/upai-tu:latest`
      then `docker compose down && docker compose up -d` to roll it out.
      (This step is still manual for now — ask if you want an auto-pull/
      watchtower setup added so the server updates itself too.)

## Day-to-day workflow going forward

**Changing an existing theme/config file:**
1. Edit it directly under `tu-overlay/` in the `\UPai` repo.
2. `git add tu-overlay && git commit -m "..." && git push origin TU-theme`
3. GitHub Actions builds and pushes automatically. Nothing else to run.

**Adding a brand-new themed file:**
1. Add it under `tu-overlay/` at the same relative path LibreChat uses.
2. Add a row to the table above for documentation.
3. Push, same as above.

**You should no longer need to:**
- Maintain a custom Dockerfile anywhere in this repo.
- `git merge`/`rebase` from `danny-avila/LibreChat` into this branch.
- Manually `docker login` / `docker build` / `docker push`.
