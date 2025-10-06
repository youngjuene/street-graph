# Urban Navigation Graph Interface

Interactive 3D graph visualization for exploring urban Points of Interest (POIs) using force-directed layouts and Google Maps data.

## What It Does

- 🗺️ Loads POIs from any city via Google Maps
- 📊 Visualizes as 3D force-directed graph
- 🎨 5 color schemes (distance, type, price, neighborhood, difficulty)
- 🔍 Interactive exploration with filters
- 📍 Build and analyze walking itineraries

## Quick Start

```bash
# 1. Setup API key
cp config.template.js config.js
# Add your Google Maps API key to config.js

# 2. Run
open index.html

# 3. Enter city name and explore!
```

See **SETUP.md** for detailed instructions.

## Features

**Core Functionality:**
- ✅ Graph construction with BFS distance calculation
- ✅ Force-directed layout (Fruchterman-Reingold)
- ✅ Real-time 3D visualization with Three.js
- ✅ POI filtering (distance, rating, price, type)
- ✅ Itinerary builder with distance/time calculation
- ✅ Statistical analysis and histogram

**Interaction:**
- Mouse: pan, zoom, select nodes
- Keyboard: C (colors), H (help), I (itinerary), R (reset), Space (pause)

## Technology

- **Frontend**: HTML5, JavaScript ES6+, Three.js r128
- **APIs**: Google Places API (New), Geocoding API
- **Algorithms**: BFS, Haversine distance, Force-directed layout
- **Deployment**: Single HTML file, no build required

## Implementation Status

**Completed:** 72% of full specification
- ✅ Core graph engine (100%)
- ✅ 3D visualization (100%)
- ✅ Force-directed layout (100%)
- ✅ Basic API integration (70%)
- ⚠️ Advanced features (0% - future work)

See **claude.md** for full specification.

## Files

- `index.html` - Complete application (56KB)
- `config.js` - Your API key (not in git)
- `config.template.js` - Template for setup
- `claude.md` - Technical specification
- `SETUP.md` - Setup instructions

## License

Educational/research project. See `claude.md` for implementation details.
