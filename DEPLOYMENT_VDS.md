# VDS deployment — 2026-09-09

The Django release from public GitHub commit `1022972` is deployed on
`176.96.243.203`. This replaces an older Django installation, not Vendure.

- Website: https://storebox.uz/
- Merchant login: https://app.storebox.uz/login/
- Active release: `/home/ubuntu/storebox-candidate-20260909`
- Services: `storebox.service`, `storebox-bot.service`
- Settings: `DJANGO_SETTINGS_MODULE=storebox.production` in the release `.env`.
- Database and media remain in `/home/ubuntu/storebox/`, linked into the release.
- Nginx configuration: `/etc/nginx/sites-available/storebox`.
- Existing certificate covers storebox.uz, www, app and demo; expires 2026-11-15.

Deployment fixes: the dashboard HTML now references the bundled JS/CSS;
production settings disable debug and local CORS, constrain hosts/CSRF origins,
and use secure cookies. The public default Django secret was replaced on the
server. Existing sessions require login again. No account passwords changed.

## Verification

Django check and all 9 application tests passed. Full test discovery additionally
requires Playwright, which is not installed on the server. Public HTTPS, login,
static JS, authenticated dashboard rendering and auth/me API were checked.
Authenticated checks used the Django test client; real password login, checkout,
payments and Telegram message delivery have not been tested.

Existing data: 18 stores, 140 products, 65 orders. No schema migration was pending.
Other applications' service definitions and Nginx site files were not changed.

## Backup and rollback

Pre-update backup: `/home/ubuntu/storebox-backups/20260909-before-update`.
Contains SQLite snapshot, media, previous environment and service/Nginx files.
Old source and virtualenv remain in `/home/ubuntu/storebox`.

`storebox-backup.timer` runs at 22:00 UTC (03:00 Uzbekistan) daily; it retains
seven completed backups under `/home/ubuntu/storebox-backups/daily`. The script
is `backup_vds.py` in the active release. These are local backups, not protection
against loss of the VDS. External backup storage is not configured.

For a code rollback, restore the two saved systemd service files and the saved
Nginx file (`storebox`) from the pre-update backup, validate with `nginx -t`,
run `systemctl daemon-reload`, restart the two StoreBox services and reload Nginx.
No database restore is needed for this release because the schema is unchanged.
Do not restore the database over newer orders without a separately reviewed
recovery plan. The previous Nginx configuration had HTTP only.

## Remaining deployment work

- Database remains SQLite; PostgreSQL migration has not been performed.
- Configure external backup storage and verify restore there.
- Wildcard tenant TLS and billing hostname are not configured by this deployment.
- Existing unrelated Nginx IP-host conflict warnings remain.
- Repository deployment fixes are local/uncommitted; no GitHub push was made.
- Do not run the old `deploy.sh`: it uses a public default secret and would
  replace the current deployment configuration.
