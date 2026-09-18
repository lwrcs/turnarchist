# Seclunion preview deployment

The public Seclunion preview is served from Turnarchist's `master` branch at:

`/temporary-previews/seclunion-portable-preview/`

Only files under that folder belong to the preview deployment. Do not change Turnarchist application code, root pages, or shared site assets while updating it.

## Publish workflow

1. Build the Seclunion client from `apps/client` with `npm run build`.
2. Copy the build output from `apps/client/dist` into `temporary-previews/seclunion-portable-preview/`.
3. Keep the preview's gated `index.html`; update its referenced hashed JavaScript and CSS names to match the new build.
4. Keep previous hashed files inside `assets/` when publishing. Mobile browsers may hold the gated page in cache and still request its older hashed bundle. Removing those files causes the game shell to load with missing cards/assets.
5. Include refreshed `layout/`, `models/`, and `textures/` from the build output.
6. Verify both the new bundle URL and at least the previously referenced bundle URL return HTTP 200 from the public preview URL before considering the deployment complete.

The preview is a static host. The in-game developer editor uses its browser-local persistence fallback there; project-layout save endpoints are available only in local development.
