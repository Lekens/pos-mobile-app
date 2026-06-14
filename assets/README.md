# App Assets

Place these files here before building:

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024×1024 | App icon (all platforms) |
| `adaptive-icon.png` | 1024×1024 | Android adaptive icon foreground (transparent bg) |
| `splash.png` | 1284×2778 | Splash screen (dark bg `#020617`) |
| `favicon.png` | 196×196 | Web favicon |

## Design guidelines
- Background: `#020617` (dark navy)
- Primary: `#6366f1` (indigo)
- Use a simple "POS" or cart icon with the indigo colour on dark background
- The adaptive-icon foreground should have a transparent background (Expo handles the shape mask)

## Quick generation with sharp (Node.js)
```bash
npm install -g sharp-cli
# Generate a placeholder 1024x1024 dark icon
sharp --input icon.svg --output icon.png --width 1024 --height 1024
```
