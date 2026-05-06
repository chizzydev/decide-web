# Decide Web Dev Troubleshooting

## Most common local dev issue

If `decide-web` says things like:

- `Port 3000 is in use`
- `Unable to acquire lock at .next\dev\lock`
- it stays on `Compiling / ...`
- the browser says `localhost refused to connect`

then suspect a stale Next dev process or lock first.

## Fast recovery steps

### 1. Check whether port `3000` is occupied

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
```

If that returns a PID, use it in the next command.

### 2. Kill the stale process

```powershell
Stop-Process -Id <PID> -Force
```

Example:

```powershell
Stop-Process -Id 32760 -Force
```

### 3. Remove the stale Next lock

```powershell
Remove-Item -LiteralPath C:\Users\HP\decide-web\.next\dev\lock -Force -ErrorAction SilentlyContinue
```

### 4. Start the dev server again

```powershell
cd C:\Users\HP\decide-web
npm run dev
```

## How to tell this is not primarily `.env` or CORS

- If the terminal already shows `Starting...` or `Ready in ...`, your first problem is usually not `.env`.
- If the site itself does not open on `localhost:3000`, that is not primarily a CORS problem.
- CORS usually appears after the page loads and then API requests fail in the browser.

## Current repo-specific note

This repo currently uses:

```json
"dev": "next dev --webpack"
```

That is intentional on this machine because Turbopack was hanging during local development even though production builds were passing.

