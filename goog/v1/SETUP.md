# Setup Guide

## Quick Start (3 Steps)

### 1. Get API Key
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable: **Places API (New)** and **Geocoding API**
- Create API key

### 2. Configure
```bash
cp config.template.js config.js
# Edit config.js and add your API key
```

### 3. Run
```bash
open index.html
```

---

## 🔐 Security (Git Push)

**Before pushing to git:**
```bash
./verify-security.sh    # All checks should pass ✅
git status              # config.js should NOT appear
```

**Files to commit:** ✅
- `.gitignore`
- `config.template.js`
- `index.html`
- `claude.md`
- `README.md`
- `SETUP.md`

**Never commit:** ❌
- `config.js` (your API key)

---

## Controls

- **Mouse**: Click-drag (pan), Scroll (zoom), Click node (details)
- **C** - Cycle colors
- **H** - Help
- **I** - Itinerary panel
- **R** - Reset camera
- **Space** - Pause simulation

---

## Troubleshooting

**POIs won't load?**
- Check API key in `config.js`
- App auto-falls back to mock data if API fails

**Low FPS?**
- Increase min rating filter (fewer nodes)
- Pause simulation with Space

---

## Project Structure

```
index.html           - Main app (56KB, single file)
config.js           - Your API key (NOT in git)
config.template.js  - Template for others
claude.md           - Implementation spec
README.md           - Project overview
```

That's it! Keep it simple.
