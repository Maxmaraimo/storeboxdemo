# Antigravity on the StoreBox VDS

Open Antigravity with `/home/ubuntu/storebox-candidate-20260909` as the workspace. Never open `/home/ubuntu` or `/` as its workspace.

Antigravity loads permanent workspace rules from `.agents/rules/` and manual workflows from `.agents/workflows/`. The VDS workspace contains `storebox-vds-scope.md` and `/deploy-storebox-vds`.

## Normal work

1. Edit only the persistent StoreBox checkout.
2. Preserve existing changes shown by `git status`.
3. Run focused tests and checks.
4. Commit/push only approved StoreBox changes.
5. Deploy an exact commit into a new immutable release.
6. Preserve `.env`, SQLite, and media.
7. Switch only StoreBox services and StoreBox Nginx paths.
8. Keep the previous release for rollback.

Never run `deploy.sh` on this shared VDS. It installs OS packages, changes firewall rules, removes an Nginx site, and rewrites shared configuration.

## Real isolation

Rules guide Antigravity but are not an OS security boundary. For a hard guarantee, run it as a dedicated Linux user such as `storebox-agent`, with write access only to StoreBox directories and no general sudo access. If privileged deployment is required, allow only a root-owned StoreBox deployment wrapper or narrowly scoped commands for `storebox.service`, `storebox-bot.service`, and `/etc/nginx/sites-enabled/storebox`. Do not add this user to the `docker` group or grant write access to shared `/etc/nginx`, `/etc/systemd/system`, `/home/ubuntu`, or other projects.

## Start prompt

```text
Work only inside this StoreBox workspace. First read every file in
.agents/rules and obey storebox-vds-scope.md. Preserve existing user changes.
Do not inspect or touch another project, service, container, database, Nginx
site, certificate, cron job, or process on this VDS. Implement only the requested
StoreBox task, run focused tests, and show the exact diff and checks. Do not
deploy until I explicitly request deployment.
```

## Deployment prompt

```text
Deploy the approved StoreBox commit using /deploy-storebox-vds. Obey
.agents/rules/storebox-vds-scope.md. Do not run deploy.sh and do not touch other
projects. Create an immutable release, preserve secrets/database/media, review
migrations, back up StoreBox configuration, switch only StoreBox services and
StoreBox Nginx paths, verify all StoreBox domains, and report SHA and rollback.
```

