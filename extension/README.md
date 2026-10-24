# Recall extension

The React + TypeScript frontend for the Recall Chrome study workspace.

See the [project README](../README.md) for installation, backend setup, features, planned focus tools and the edit/build/reload workflow.

From this directory:

```powershell
npm ci
npm run dev
npm run build
npm run lint
```

Load `dist` as an unpacked Chrome extension. After source changes, rebuild, reload Recall in `chrome://extensions`, and reopen the panel. Saving a `.tsx` file alone does not update the installed extension.
