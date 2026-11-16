# Spin the Wheels

React + TypeScript implementation of the three-letter MVP.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:5173/` directly for a plain-browser preview; English is
the default when `cr_lang` is absent. You can also specify it explicitly with
`http://localhost:5173/?cr_lang=english`. Curious Reader container launches
must include `cr_lang`.

The app loads the level data from `content/lang/english/levels.json` through a
local XHR-compatible route. The production build copies that source file to
`dist/lang/english/levels.json` for standalone relative-path loading.

Place word images at `assets/images/<word>.png` and pronunciations at
`lang/english/audios/<word>.mp3` in the standalone package. Until those assets
are supplied, the game displays the specified non-blocking media fallbacks.

## Validate

```powershell
npm test
npm run build
```
