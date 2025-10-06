# Urban Navigation Graph Interface - Implementation Requirements Document

## Project Overview

A mathematically rigorous urban tourism navigation interface inspired by sliding puzzle state-space visualization. The system models Points of Interest (POIs) as nodes in a graph, with edges representing walkable/transit routes, visualized in 3D using force-directed graph layouts.

---

## 1. Core Mathematical Framework

### 1.1 Graph Theory Foundation

**State Space Graph G = (V, E)**

- **V (Vertices/Nodes)**: Set of all POIs and their metadata

  - Each node n ∈ V represents a POI with attributes: {id, name, type, coordinates, rating, price_level, opening_hours}
  - State space size: |V| = total number of POIs in selected area

- **E (Edges)**: Set of walkable/transit connections
  - Each edge e ∈ E represents a path between two POIs
  - Edge weight w(e): travel time, distance, or composite cost function
  - Adjacency determined by: maximum walking distance threshold (default: 1.5km) OR shared transit line

**Distance Metrics**

- Geodesic distance (haversine formula for lat/lng)
- Graph distance (shortest path length in hops)
- Temporal distance (travel time including walking speed, wait times)
- Cost distance (combination of time, money, effort)

### 1.2 Multi-Dimensional Filtering

**Constraint Space C = {c₁, c₂, ..., cₙ}**

Implement n-dimensional filtering where each criterion defines an axis:

- **1D**: Single criterion (e.g., rating ≥ 4.0)
- **2D**: Two criteria (e.g., price_level × rating)
- **3D**: Three criteria (e.g., price × rating × distance_from_start)
- **4D+**: Hyperspace projected to 3D using dimensionality reduction (PCA or t-SNE)

**Invalid State Detection**

- Temporal impossibility: POI closed during visit window
- Spatial impossibility: exceeds daily walking budget
- Budget constraints: total cost > user budget
- Mutual exclusivity: conflicting reservation times

### 1.3 Path Analysis Algorithms

**Breadth-First Search (BFS)**

- Calculate minimum hop distance from starting node to all reachable nodes
- Identify disconnected components (unreachable POIs)
- Color nodes by distance layer (0, 1, 2, 3, ... hops)

**Dijkstra's Algorithm**

- Find shortest weighted path considering:
  - Walking time
  - Transit wait times
  - Opening/closing hour constraints
  - User preferences (avoid hills, prefer scenic routes)

**All-Pairs Shortest Paths (Floyd-Warshall)**

- Precompute distance matrix D where D[i][j] = shortest path from POI i to POI j
- Enables instant itinerary feasibility checking

**Itinerary Enumeration**

- Generate all valid k-POI tours (traveling salesman variants)
- Filter by constraints (time budget, must-include POIs, POI type diversity)
- Rank by objective function (maximize ratings, minimize walking, balance variety)

### 1.4 Graph Topology Analysis

**Community Detection (Louvain Algorithm)**

- Identify natural neighborhood clusters
- Modularity optimization to find district boundaries
- Reveal "local manifolds" - tightly connected POI groups

**Centrality Measures**

- Betweenness centrality: identify transit hub POIs
- Degree centrality: POIs with most connections
- Closeness centrality: most accessible POIs from average position

**Symmetry Detection**

- Graph isomorphism for identifying repeated patterns
- Mirror neighborhoods (east/west district similarity)

---

## 2. Google Maps API Integration

### 2.1 Required APIs

**Google Places API (New)**

- **Endpoint**: `places.googleapis.com/v1/places:searchNearby`
- **Purpose**: Fetch POIs within radius of center point
- **Request Parameters**:
  ```json
  {
    "includedTypes": ["restaurant", "cafe", "book_store", "museum", "park", "tourist_attraction"],
    "maxResultCount": 20,
    "locationRestriction": {
      "circle": {
        "center": {"latitude": LAT, "longitude": LNG},
        "radius": 2000.0
      }
    },
    "rankPreference": "POPULARITY"
  }
  ```
- **Response Fields**: name, location, rating, priceLevel, types, businessStatus, currentOpeningHours

**Google Routes API (Directions)**

- **Endpoint**: `routes.googleapis.com/directions/v2:computeRoutes`
- **Purpose**: Calculate walking/transit routes between POI pairs
- **Travel Modes**: WALK, TRANSIT, DRIVE
- **Response**: duration, distance, polyline, steps

**Distance Matrix API**

- **Endpoint**: `maps.googleapis.com/maps/api/distancematrix/json`
- **Purpose**: Batch calculate distances between multiple origin-destination pairs
- **Use Case**: Efficiently build adjacency matrix for graph construction

**Geocoding API**

- **Endpoint**: `maps.googleapis.com/maps/api/geocode/json`
- **Purpose**: Convert city names to lat/lng coordinates for initial search

### 2.2 Data Flow

1. **Initialization**: User inputs city name → Geocoding API → center coordinates
2. **POI Retrieval**: Center coords → Places API (searchNearby) → POI list with metadata
3. **Graph Construction**:
   - For each POI pair (i, j) within distance threshold
   - Distance Matrix API → travel time/distance
   - Create edge if travel_time < max_walking_time (default: 20 min)
4. **On-Demand Routing**: User requests path → Routes API → detailed turn-by-turn directions

### 2.3 API Key Management

- Store API key securely (environment variable or secure config)
- Implement rate limiting (Places API: 1 request/second)
- Cache responses to minimize API calls (store POI data locally for 24h)

---

## 3. 3D Visualization Requirements

### 3.1 Rendering Engine

**Three.js (r128 or compatible)**

- WebGL-based 3D graphics
- Already available in Claude artifacts environment

### 3.2 Force-Directed Graph Layout

**Algorithm**: Fruchterman-Reingold or ForceAtlas2

**Forces**:

- **Repulsion**: All nodes repel each other (prevent overlap)
  - Force ∝ 1/distance²
- **Attraction**: Connected nodes attract along edges
  - Force ∝ distance × edge_weight
- **Gravity**: Weak pull toward center (prevent graph drift)

**Constraints**:

- Fix starting node (hotel) at origin
- Option to fix solution nodes at specific positions (e.g., compass points)

**Optimization**:

- Run simulation for N iterations (default: 1000)
- Adaptive cooling schedule (reduce movement over time)
- Spatial hashing for efficient nearest-neighbor queries

### 3.3 Visual Encoding

**Nodes**:

- **Size**: Proportional to POI importance (rating × popularity)
- **Color Schemes** (toggleable):
  1. **Distance from start**: Purple → Red → Orange → Yellow (BFS layers)
  2. **POI Type**: Restaurant=Red, Cafe=Orange, Museum=Blue, Park=Green, etc.
  3. **Price Level**: Green (cheap) → Yellow → Orange → Red (expensive)
  4. **Neighborhood**: Each community/cluster gets unique color
  5. **Difficulty**: Color by centrality (easy to reach = green, hard = red)
- **Shape**: Different geometries for POI categories (sphere=restaurant, box=museum, cone=landmark)

**Edges**:

- **Thickness**: Inverse of travel time (thicker = faster route)
- **Color**: Inherit from source/target node or show edge betweenness
- **Style**: Dashed for transit, solid for walking

**Special Highlighting**:

- **Solutions** (optimal itineraries): Glowing yellow nodes
- **Shortest Path**: Bright cyan edges with animated flow
- **Current Selection**: Pulsating glow effect
- **Disconnected Islands**: Greyed out, semi-transparent

### 3.4 User Interface Panels

**Left Panel: POI Details**

- Mini-map showing current node location
- POI metadata card: name, type, rating, price, hours, photos
- "Add to Itinerary" button

**Center: 3D Graph Canvas**

- Full WebGL rendering area
- FPS counter (top-left)
- Current configuration text (bottom-left): "Viewing 247 POIs across 4 districts"

**Right Panel: Statistical Histogram**

- X-axis: Distance from start (in minutes: 0-5, 5-10, 10-15, 15-20, 20-30, 30+)
- Y-axis: Number of POIs in each distance bin
- Color-coded bars matching distance color scheme

**Bottom Panel: Itinerary Builder**

- Drag-and-drop POI sequencing
- Automatically calculate total time, distance, cost
- Show feasibility warnings (red text if impossible timing)

---

## 4. Interaction Design

### 4.1 Camera Controls

- **Orbit**: Click-drag to rotate around graph center
- **Pan**: Arrow keys or right-click-drag
- **Zoom**: Mouse wheel (scroll up = zoom in)
- **Reset View**: 'r' key

### 4.2 Node Interaction

- **Click**: Select node → show details in left panel
- **Double-Click**: "Teleport" - recompute graph with this node as new center
- **Hover**: Highlight node + show tooltip (name, distance from start)
- **Ctrl+Click**: Add to itinerary

### 4.3 Edge Interaction

- **Hover**: Show travel time/distance tooltip
- **Click**: Highlight full path, show detailed route in sidebar

### 4.4 Keyboard Shortcuts

- **[c]**: Cycle color schemes (distance → type → price → neighborhood → difficulty)
- **[s]**: Toggle solution highlighting (show all optimal itineraries)
- **[p]**: Toggle shortest path display (from start to selected node)
- **[d]**: Toggle disconnected islands visibility
- **[n]**: Jump to next nearest unvisited POI
- **[f]**: Find POI by name (opens search dialog)
- **[i]**: Toggle itinerary panel
- **[h]**: Show help overlay
- **[Space]**: Pause/resume force simulation

### 4.5 Filter Panel

**Constraint Sliders**:

- Max walking distance: 0.5km - 5km
- Price level: $ - $$$$
- Minimum rating: 1★ - 5★
- Opening now: toggle
- POI types: checkboxes (restaurant, cafe, museum, etc.)

**Apply Filters** → Re-run graph construction with new constraints

---

## 5. Data Structures

### 5.1 POI Object

```javascript
{
  id: string,                    // unique identifier
  name: string,                  // POI name
  types: string[],               // ["restaurant", "cafe"]
  location: {lat: number, lng: number},
  rating: number,                // 0.0 - 5.0
  priceLevel: number,            // 0 (free) - 4 ($$$$)
  openingHours: {
    periods: [{open: string, close: string}]  // "09:00", "21:00"
  },
  businessStatus: string,        // "OPERATIONAL"
  userRatingsTotal: number,      // popularity metric
  photos: string[],              // photo URLs
  metadata: {
    distanceFromStart: number,   // in meters
    travelTimeFromStart: number, // in minutes
    bfsDistance: number,         // graph hops
    clusterId: number,           // community/district ID
    centrality: {
      degree: number,
      betweenness: number,
      closeness: number
    }
  }
}
```

### 5.2 Edge Object

```javascript
{
  source: string,         // POI id
  target: string,         // POI id
  distance: number,       // meters
  duration: number,       // seconds
  mode: string,           // "WALK" | "TRANSIT"
  polyline: string,       // encoded route path
  steps: object[]         // turn-by-turn directions
}
```

### 5.3 Graph Object

```javascript
{
  nodes: POI[],
  edges: Edge[],
  adjacencyMatrix: number[][],  // distances
  communities: {
    [clusterId]: POI[]
  },
  startNode: string,      // hotel/origin POI id
  solutionNodes: string[], // optimal itinerary endpoint POIs
  disconnectedComponents: {
    [componentId]: POI[]
  }
}
```

### 5.4 Itinerary Object

```javascript
{
  id: string,
  pois: POI[],           // ordered sequence
  edges: Edge[],         // connecting routes
  totalDistance: number, // meters
  totalTime: number,     // minutes
  totalCost: number,     // estimated in local currency
  score: number,         // fitness score
  constraints: {
    maxTime: number,
    maxDistance: number,
    maxCost: number,
    requiredPOIs: string[],
    requiredTypes: string[]
  },
  feasible: boolean,     // meets all constraints
  warnings: string[]     // e.g., "tight timing between POI 3 and 4"
}
```

---

## 6. Performance Requirements

### 6.1 Responsiveness

- Initial POI load: < 3 seconds
- Graph layout computation: < 5 seconds for 500 nodes
- Render frame rate: ≥ 30 FPS
- Interaction latency: < 100ms (click to selection highlight)

### 6.2 Scalability

- Support 50 - 1000 POIs
- Graph layout: adaptive algorithm switching
  - < 200 nodes: Full force-directed simulation
  - 200-500 nodes: Hierarchical force-directed
  - 500+ nodes: GPU-accelerated or multilevel approximation

### 6.3 Memory Management

- Limit simultaneous API requests: 5 concurrent
- Cache computed paths (LRU cache, max 1000 entries)
- Lazy-load POI photos (only when node selected)

---

## 7. Testing Requirements

### 7.1 Unit Tests

- Graph construction algorithm (adjacency list correctness)
- BFS distance calculation (known graph verification)
- Constraint satisfaction checker (valid/invalid itinerary detection)
- Distance metrics (haversine formula accuracy)

### 7.2 Integration Tests

- Google Maps API mocking (test without API key consumption)
- Force-directed layout convergence (stable final positions)
- Itinerary optimization (known optimal solution verification)

### 7.3 User Acceptance Tests

- Load test city (e.g., "Paris 6th Arrondissement")
- Verify POI count matches expected (~200-300)
- Check graph connectivity (no spurious disconnected islands)
- Validate shortest path (compare against Google Maps)
- Test filter application (correct node removal)

---

## 8. Implementation Phases

### Phase 1: Core Graph Engine (Week 1)

- POI data structures
- Graph construction (nodes, edges, adjacency matrix)
- BFS distance calculation
- Basic 3D visualization (nodes as spheres, edges as lines)

### Phase 2: Google Maps Integration (Week 2)

- API client implementation
- Places API POI fetching
- Distance Matrix edge weight calculation
- Cache layer

### Phase 3: Force-Directed Layout (Week 3)

- Fruchterman-Reingold algorithm
- Camera controls (orbit, pan, zoom)
- Node/edge interaction (click, hover)
- Color scheme implementation

### Phase 4: UI & Analysis (Week 4)

- Filter panel and constraint application
- Itinerary builder UI
- Statistical histogram
- Graph statistics display

---

## 9. Success Metrics

### 9.1 Functional Completeness

- ✓ Successfully loads POIs for any city
- ✓ Graph accurately represents walkable connections
- ✓ Shortest path matches Google Maps within 10% error
- ✓ Force-directed layout converges to stable state
- ✓ All keyboard shortcuts functional

### 9.2 Mathematical Rigor

- ✓ Distance metrics mathematically correct (haversine, graph distance)
- ✓ BFS produces correct layering
- ✓ Community detection identifies meaningful clusters
- ✓ Itinerary optimization finds near-optimal solutions (within 5% of global optimum)

### 9.3 User Experience

- ✓ Intuitive navigation (first-time user can explore without tutorial)
- ✓ Responsive interactions (< 100ms latency)
- ✓ Visually appealing (color schemes, smooth animations)
- ✓ Useful insights (discovers non-obvious itineraries or POI relationships)

---

## 10. Technical Stack Summary

### Required Technologies

- **Frontend**: HTML5, JavaScript (ES6+), Three.js (r128)
- **APIs**: Google Maps Platform (Places, Routes, Distance Matrix, Geocoding)
- **Algorithms**: BFS, Dijkstra, Floyd-Warshall, Louvain, Fruchterman-Reingold, Genetic Algorithm
- **Data Structures**: Adjacency list, adjacency matrix, priority queue, disjoint set (union-find)

### Development Environment

- **Browser**: Modern WebGL-capable browser (Chrome, Firefox, Safari)
- **No server required**: Pure client-side application
- **API Key**: Google Maps API key with enabled services

---

## 11. Deliverables

1. **Single HTML file** containing complete application

   - Embedded CSS and JavaScript
   - Three.js imported from CDN
   - Google Maps API loaded via script tag

2. **Configuration file** (or embedded config object)

   - API key placeholder
   - Default parameters (max walking distance, simulation iterations, etc.)

3. **Documentation**

   - Code comments explaining mathematical algorithms
   - User guide (keyboard shortcuts, interaction patterns)
   - API usage notes (rate limits, caching strategy)

4. **Test suite** (optional, if using external testing framework)
   - Unit tests for core algorithms
   - Integration test scenarios

---

## 12. Configuration Notes

1. **POI Selection**: Should we auto-filter by minimum rating (e.g., ≥ 3.5★) or show all?
2. **Edge Threshold**: What maximum walking distance defines graph connectivity? (Current: 1.5km)
3. **Itinerary Length**: Default k-POI tour size? (Current: 5-7 POIs)
4. **Color Palette**: Specific hex colors for each scheme, or derive from gradient?
5. **Mobile Support**: Touch controls for 3D navigation, or desktop-only?
6. **Offline Mode**: Should we support downloading POI data for offline use?

---

**End of Core Specification**
