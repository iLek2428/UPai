// merge-package-json.js
// Called by the GitHub Actions workflow BEFORE `docker build`, once for the
// root package.json and once for client/package.json. Merges only the
// TU-specific fields into the freshly-cloned upstream file, so dependency
// versions always come from whatever LibreChat ships today -- never from a
// stale snapshot sitting in this repo.
//
// Usage:
//   node merge-package-json.js <fresh-package.json> <tu-fragment.json>
//
// Edit FIELDS_TO_MERGE if you need another top-level field carried over from
// the TU fragment (dependencies/devDependencies are deliberately excluded --
// if TU genuinely needs an extra dependency, add it to the "dependencies"
// object below explicitly and document why in TU-CUSTOMIZATIONS.md, rather
// than letting a whole fragment silently override versions).

const fs = require("fs");

const [, , freshPkgPath, fragmentPath] = process.argv;

if (!freshPkgPath || !fragmentPath) {
  console.error("Usage: node merge-package-json.js <fresh package.json> <tu fragment json>");
  process.exit(1);
}

if (!fs.existsSync(fragmentPath)) {
  console.log(`No fragment at ${fragmentPath} -- skipping merge, leaving ${freshPkgPath} untouched.`);
  process.exit(0);
}

const fresh = JSON.parse(fs.readFileSync(freshPkgPath, "utf8"));
const fragment = JSON.parse(fs.readFileSync(fragmentPath, "utf8"));

// Simple fields taken wholesale from the TU fragment.
const FIELDS_TO_MERGE = ["name", "description", "author", "homepage"];
for (const field of FIELDS_TO_MERGE) {
  if (fragment[field] !== undefined) {
    fresh[field] = fragment[field];
  }
}

// Extra TU-only npm scripts get added WITHOUT clobbering an upstream script
// of the same name (upstream wins on name collision, since that script is
// presumably what actually builds/runs the up-to-date app).
if (fragment.scripts) {
  fresh.scripts = fresh.scripts || {};
  for (const [key, value] of Object.entries(fragment.scripts)) {
    if (!(key in fresh.scripts)) {
      fresh.scripts[key] = value;
    } else {
      console.log(`  (kept upstream script "${key}", did not override with TU fragment)`);
    }
  }
}

// If TU genuinely added a real dependency (rare -- most theming needs none),
// list it explicitly here instead of relying on the fragment's full
// dependencies block, so upstream version bumps are never silently lost.
// Example:
// fresh.dependencies = fresh.dependencies || {};
// fresh.dependencies["some-tu-only-package"] = "^1.2.3";

fs.writeFileSync(freshPkgPath, JSON.stringify(fresh, null, 2) + "\n");
console.log(`Merged TU fields into ${freshPkgPath} (dependencies kept from upstream).`);
