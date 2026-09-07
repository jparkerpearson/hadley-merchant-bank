---
name: Git sync history strategy
description: Why unpublished local changes should remain linear on the tracked GitHub branch in this project.
---

Keep unpublished changes as a linear commit sequence directly on top of `origin/main`; avoid resolving Git synchronization by adding a local merge commit.

**Why:** Replit's Git sync invokes a pull with rebase. A local merge that already resolves divergent work can cause the older local commits to be replayed, reintroducing conflict markers into served files and crashing the browser.

**How to apply:** Before using Replit Git sync, confirm the branch is not mid-rebase and is only ahead of `origin/main`, not behind or independently diverged. Preserve a backup ref before rewriting unpublished local history.