// Klotski Puzzle Solver and Visualizer
class KlotskiPuzzle {
    constructor() {
        // Standard Klotski piece definitions (type, width, height)
        this.PIECES = [
            { id: 0, name: 'Big', w: 2, h: 2 },    // The main 2x2 piece
            { id: 1, name: 'V1', w: 1, h: 2 },     // Vertical 1x2
            { id: 2, name: 'V2', w: 1, h: 2 },     // Vertical 1x2
            { id: 3, name: 'V3', w: 1, h: 2 },     // Vertical 1x2
            { id: 4, name: 'V4', w: 1, h: 2 },     // Vertical 1x2
            { id: 5, name: 'H', w: 2, h: 1 },      // Horizontal 2x1
            { id: 6, name: 'S1', w: 1, h: 1 },     // Small 1x1
            { id: 7, name: 'S2', w: 1, h: 1 },     // Small 1x1
            { id: 8, name: 'S3', w: 1, h: 1 },     // Small 1x1
            { id: 9, name: 'S4', w: 1, h: 1 }      // Small 1x1
        ];

        this.BOARD_WIDTH = 4;
        this.BOARD_HEIGHT = 5;
    }

    // Create initial state
    getInitialState() {
        return [
            { id: 0, x: 1, y: 0 },  // Big piece at top center
            { id: 1, x: 0, y: 0 },  // Vertical left
            { id: 2, x: 3, y: 0 },  // Vertical right
            { id: 3, x: 0, y: 2 },  // Vertical left lower
            { id: 4, x: 3, y: 2 },  // Vertical right lower
            { id: 5, x: 1, y: 2 },  // Horizontal below big piece
            { id: 6, x: 1, y: 3 },  // Small pieces
            { id: 7, x: 2, y: 3 },
            { id: 8, x: 0, y: 4 },
            { id: 9, x: 3, y: 4 }
        ];
    }

    // Convert state to string for hashing
    stateToString(state) {
        return state.map(p => `${p.id}:${p.x},${p.y}`).sort().join('|');
    }

    // Check if a position is valid (no overlaps, within bounds)
    isValidState(state) {
        const grid = Array(this.BOARD_HEIGHT).fill(null).map(() => Array(this.BOARD_WIDTH).fill(-1));

        for (const piece of state) {
            const pieceData = this.PIECES[piece.id];

            // Check bounds
            if (piece.x < 0 || piece.y < 0 ||
                piece.x + pieceData.w > this.BOARD_WIDTH ||
                piece.y + pieceData.h > this.BOARD_HEIGHT) {
                return false;
            }

            // Check overlaps
            for (let dy = 0; dy < pieceData.h; dy++) {
                for (let dx = 0; dx < pieceData.w; dx++) {
                    if (grid[piece.y + dy][piece.x + dx] !== -1) {
                        return false;
                    }
                    grid[piece.y + dy][piece.x + dx] = piece.id;
                }
            }
        }

        return true;
    }

    // Check if state is a solution (big piece at bottom center)
    isSolution(state) {
        const bigPiece = state.find(p => p.id === 0);
        return bigPiece && bigPiece.x === 1 && bigPiece.y === 3;
    }

    // Get all possible next states from current state
    getNextStates(state) {
        const nextStates = [];
        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }   // right
        ];

        for (let i = 0; i < state.length; i++) {
            const piece = state[i];
            const pieceData = this.PIECES[piece.id];

            for (const dir of directions) {
                const newState = state.map(p => ({ ...p }));
                newState[i].x += dir.dx;
                newState[i].y += dir.dy;

                if (this.isValidState(newState)) {
                    nextStates.push(newState);
                }
            }
        }

        return nextStates;
    }

    // Generate all reachable states using BFS
    generateStateGraph() {
        const initialState = this.getInitialState();
        const queue = [{ state: initialState, distance: 0, parent: null }];
        const visited = new Map();
        const stateHash = this.stateToString(initialState);
        visited.set(stateHash, { state: initialState, distance: 0, parent: null });

        const nodes = [];
        const edges = [];
        const solutions = [];

        let nodeId = 0;
        const hashToId = new Map();
        hashToId.set(stateHash, nodeId++);

        while (queue.length > 0) {
            const current = queue.shift();
            const currentHash = this.stateToString(current.state);
            const currentId = hashToId.get(currentHash);

            const nextStates = this.getNextStates(current.state);

            for (const nextState of nextStates) {
                const nextHash = this.stateToString(nextState);

                if (!visited.has(nextHash)) {
                    const nextId = nodeId++;
                    hashToId.set(nextHash, nextId);

                    const nodeData = {
                        state: nextState,
                        distance: current.distance + 1,
                        parent: currentHash
                    };

                    visited.set(nextHash, nodeData);
                    queue.push(nodeData);

                    if (this.isSolution(nextState)) {
                        solutions.push(nextHash);
                    }
                }

                // Add edge
                const toId = hashToId.get(nextHash);
                edges.push({ from: currentId, to: toId });
            }
        }

        // Convert to node array
        for (const [hash, data] of visited.entries()) {
            nodes.push({
                id: hashToId.get(hash),
                hash: hash,
                state: data.state,
                distanceFromStart: data.distance,
                parent: data.parent,
                isSolution: this.isSolution(data.state)
            });
        }

        return { nodes, edges, solutions, initialStateHash: stateHash };
    }
}

class KlotskiVisualization {
    constructor() {
        this.canvas = document.getElementById('graph-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridCanvas = document.getElementById('grid-canvas');
        this.gridCtx = this.gridCanvas.getContext('2d');

        this.setupCanvas();
        this.setupColorPalette();

        // Initialize puzzle
        console.log('Generating Klotski state graph... This may take a moment.');
        this.puzzle = new KlotskiPuzzle();
        const graphData = this.puzzle.generateStateGraph();

        console.log(`Generated ${graphData.nodes.length} unique states`);
        console.log(`Found ${graphData.solutions.length} solution states`);

        this.nodes = graphData.nodes;
        this.edges = graphData.edges;
        this.solutions = new Set(graphData.solutions);
        this.initialStateHash = graphData.initialStateHash;

        // Calculate distances from solutions
        this.calculateDistancesFromSolutions();

        // Layout the graph
        this.layoutGraph();

        this.setupEventListeners();
        this.setupControls();

        // Camera controls
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            rotation: 0
        };

        // Graph state
        this.currentNode = this.nodes[0];
        this.showSolutions = false;
        this.showShortestPath = false;
        this.colorMode = 0; // 0: distance from start, 1: distance from solution, 2: layer
        this.hoveredNode = null;
        this.shortestPath = [];

        // Piece dragging
        this.draggedPiece = null;
        this.dragStartPos = null;

        this.updateColorModeLabel();
        this.updatePuzzleGrid();
        this.updateInfoPanel();
        this.animate();
    }

    calculateDistancesFromSolutions() {
        // BFS from all solution nodes to calculate distance to nearest solution
        const queue = [];
        const distances = new Map();

        // Initialize with solution nodes
        for (const node of this.nodes) {
            if (node.isSolution) {
                distances.set(node.hash, 0);
                queue.push(node);
            }
        }

        // Build reverse adjacency list
        const reverseEdges = new Map();
        for (const edge of this.edges) {
            const fromNode = this.nodes[edge.from];
            const toNode = this.nodes[edge.to];

            if (!reverseEdges.has(toNode.hash)) {
                reverseEdges.set(toNode.hash, []);
            }
            reverseEdges.get(toNode.hash).push(fromNode.hash);

            if (!reverseEdges.has(fromNode.hash)) {
                reverseEdges.set(fromNode.hash, []);
            }
            reverseEdges.get(fromNode.hash).push(toNode.hash);
        }

        // BFS
        while (queue.length > 0) {
            const current = queue.shift();
            const currentDist = distances.get(current.hash);

            const neighbors = reverseEdges.get(current.hash) || [];
            for (const neighborHash of neighbors) {
                if (!distances.has(neighborHash)) {
                    distances.set(neighborHash, currentDist + 1);
                    const neighborNode = this.nodes.find(n => n.hash === neighborHash);
                    if (neighborNode) queue.push(neighborNode);
                }
            }
        }

        // Store distances in nodes
        for (const node of this.nodes) {
            node.distanceFromSolution = distances.get(node.hash) || Infinity;
        }
    }

    layoutGraph() {
        console.log('Computing graph layout...');

        // Use force-directed layout with distance-based initial positioning
        const width = 800;
        const height = 600;

        // Initialize positions based on distance from start (circular layers)
        const maxDistance = Math.max(...this.nodes.map(n => n.distanceFromStart));

        for (const node of this.nodes) {
            const layer = node.distanceFromStart;
            const nodesInLayer = this.nodes.filter(n => n.distanceFromStart === layer).length;
            const indexInLayer = this.nodes.filter(n =>
                n.distanceFromStart === layer && n.id <= node.id
            ).length;

            const radius = 100 + (layer / maxDistance) * 350;
            const angle = (indexInLayer / Math.max(nodesInLayer, 1)) * Math.PI * 2;

            node.x = width / 2 + Math.cos(angle) * radius;
            node.y = height / 2 + Math.sin(angle) * radius;
            node.vx = 0;
            node.vy = 0;
        }

        // Run force-directed algorithm
        this.applyForceDirectedLayout(100);

        console.log('Layout complete');
    }

    applyForceDirectedLayout(iterations) {
        const repulsionStrength = 5000;
        const attractionStrength = 0.01;
        const damping = 0.8;

        for (let iter = 0; iter < iterations; iter++) {
            // Reset forces
            for (const node of this.nodes) {
                node.fx = 0;
                node.fy = 0;
            }

            // Repulsion between all nodes
            for (let i = 0; i < this.nodes.length; i++) {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const n1 = this.nodes[i];
                    const n2 = this.nodes[j];
                    const dx = n2.x - n1.x;
                    const dy = n2.y - n1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
                    const force = repulsionStrength / (dist * dist);

                    n1.fx -= (dx / dist) * force;
                    n1.fy -= (dy / dist) * force;
                    n2.fx += (dx / dist) * force;
                    n2.fy += (dy / dist) * force;
                }
            }

            // Attraction along edges
            for (const edge of this.edges) {
                const n1 = this.nodes[edge.from];
                const n2 = this.nodes[edge.to];
                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const force = dist * attractionStrength;

                n1.fx += dx * force;
                n1.fy += dy * force;
                n2.fx -= dx * force;
                n2.fy -= dy * force;
            }

            // Apply forces
            for (const node of this.nodes) {
                node.vx = (node.vx + node.fx) * damping;
                node.vy = (node.vy + node.fy) * damping;
                node.x += node.vx;
                node.y += node.vy;
            }
        }
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.gridCanvas.width = this.gridCanvas.offsetWidth * window.devicePixelRatio;
        this.gridCanvas.height = this.gridCanvas.offsetHeight * window.devicePixelRatio;
        this.gridCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    setupColorPalette() {
        const colors = [
            '#FF5722', '#4CAF50', '#E91E63', '#2196F3',
            '#FF9800', '#9C27B0', '#795548', '#607D8B',
            '#8BC34A', '#00BCD4', '#FFC107', '#F44336',
            '#3F51B5', '#CDDC39', '#009688', '#FFEB3B'
        ];

        const palette = document.getElementById('colorPalette');
        palette.innerHTML = '';

        colors.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', () => this.selectColor(index));
            palette.appendChild(swatch);
        });

        this.pieceColors = colors;
        this.selectedColorIndex = 0;
        this.selectColor(0);
    }

    selectColor(index) {
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.remove('selected');
        });
        document.querySelectorAll('.color-swatch')[index].classList.add('selected');
        this.selectedColorIndex = index;
        this.updatePuzzleGrid();
    }

    setupEventListeners() {
        // Mouse controls for graph
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - lastX;
                const deltaY = e.clientY - lastY;
                this.camera.x += deltaX;
                this.camera.y += deltaY;
                lastX = e.clientX;
                lastY = e.clientY;
            } else {
                this.handleMouseHover(e);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.camera.zoom *= zoomFactor;
            this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom));
        });

        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });

        // Grid canvas interactions for piece dragging
        this.gridCanvas.addEventListener('mousedown', (e) => this.handleGridMouseDown(e));
        this.gridCanvas.addEventListener('mousemove', (e) => this.handleGridMouseMove(e));
        this.gridCanvas.addEventListener('mouseup', () => this.handleGridMouseUp());

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }

    handleMouseHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const worldX = (x - this.camera.x) / this.camera.zoom;
        const worldY = (y - this.camera.y) / this.camera.zoom;

        let closestNode = null;
        let closestDistance = Infinity;

        this.nodes.forEach(node => {
            const dx = node.x - worldX;
            const dy = node.y - worldY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance && distance < 15) {
                closestDistance = distance;
                closestNode = node;
            }
        });

        this.hoveredNode = closestNode;
        this.canvas.style.cursor = closestNode ? 'pointer' : 'grab';
    }

    handleCanvasClick(e) {
        if (this.hoveredNode) {
            this.currentNode = this.hoveredNode;
            this.updatePuzzleGrid();
            this.updateShortestPath();
            this.updateInfoPanel();
        }
    }

    handleGridMouseDown(e) {
        const rect = this.gridCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const piece = this.findPieceAtPosition(x, y);
        if (piece) {
            this.draggedPiece = piece;
            this.dragStartPos = { x: e.clientX, y: e.clientY };
        }
    }

    handleGridMouseMove(e) {
        if (!this.draggedPiece || !this.dragStartPos) return;

        const deltaX = e.clientX - this.dragStartPos.x;
        const deltaY = e.clientY - this.dragStartPos.y;

        // Determine move direction based on larger delta
        let moveDir = null;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
            moveDir = deltaX > 0 ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 };
        } else if (Math.abs(deltaY) > 30) {
            moveDir = deltaY > 0 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 };
        }

        if (moveDir) {
            this.tryMovePiece(this.draggedPiece.id, moveDir);
            this.dragStartPos = { x: e.clientX, y: e.clientY };
        }
    }

    handleGridMouseUp() {
        this.draggedPiece = null;
        this.dragStartPos = null;
    }

    findPieceAtPosition(x, y) {
        const width = this.gridCanvas.offsetWidth;
        const height = this.gridCanvas.offsetHeight;
        const gridSize = 4;
        const cellSize = Math.min(width - 40, height - 40) / gridSize;
        const offsetX = (width - cellSize * gridSize) / 2;
        const offsetY = (height - cellSize * gridSize) / 2;

        const gridX = Math.floor((x - offsetX) / cellSize);
        const gridY = Math.floor((y - offsetY) / cellSize);

        for (const piece of this.currentNode.state) {
            const pieceData = this.puzzle.PIECES[piece.id];
            if (gridX >= piece.x && gridX < piece.x + pieceData.w &&
                gridY >= piece.y && gridY < piece.y + pieceData.h) {
                return piece;
            }
        }
        return null;
    }

    tryMovePiece(pieceId, direction) {
        const newState = this.currentNode.state.map(p => ({ ...p }));
        const piece = newState.find(p => p.id === pieceId);

        if (piece) {
            piece.x += direction.dx;
            piece.y += direction.dy;

            if (this.puzzle.isValidState(newState)) {
                const newHash = this.puzzle.stateToString(newState);
                const newNode = this.nodes.find(n => n.hash === newHash);

                if (newNode) {
                    this.currentNode = newNode;
                    this.updatePuzzleGrid();
                    this.updateShortestPath();
                    this.updateInfoPanel();
                }
            }
        }
    }

    handleKeyPress(e) {
        switch(e.key.toLowerCase()) {
            case 'a':
                this.camera.rotation -= 0.1;
                break;
            case 'd':
                this.camera.rotation += 0.1;
                break;
            case 'arrowup':
                this.camera.y += 20;
                break;
            case 'arrowdown':
                this.camera.y -= 20;
                break;
            case 'arrowleft':
                this.camera.x += 20;
                break;
            case 'arrowright':
                this.camera.x -= 20;
                break;
            case 'c':
                this.cycleColorMode();
                break;
            case 's':
                this.toggleSolutions();
                break;
            case 'p':
                this.toggleShortestPath();
                break;
            case 'r':
                this.reset();
                break;
        }
    }

    setupControls() {
        document.getElementById('showSolutions').addEventListener('change', (e) => {
            this.showSolutions = e.target.checked;
        });

        document.getElementById('shortestPath').addEventListener('change', (e) => {
            this.showShortestPath = e.target.checked;
            if (this.showShortestPath) {
                this.updateShortestPath();
            }
        });
    }

    cycleColorMode() {
        this.colorMode = (this.colorMode + 1) % 3;
        this.updateColorModeLabel();
    }

    updateColorModeLabel() {
        const modes = ['Distance from Start', 'Distance from Solution', 'Layer Structure'];
        const label = document.getElementById('colorModeLabel');
        if (label) {
            label.textContent = modes[this.colorMode];
        }

        // Update legend labels based on color mode
        const legendLabels = document.getElementById('legendLabels');
        if (legendLabels && this.colorMode === 1) {
            legendLabels.innerHTML = '<span>Close</span><span>Medium</span><span>Far</span>';
        } else if (legendLabels) {
            legendLabels.innerHTML = '<span>Far</span><span>Medium</span><span>Close</span>';
        }
    }

    updateInfoPanel() {
        const totalStatesEl = document.getElementById('totalStates');
        if (totalStatesEl) {
            totalStatesEl.textContent = this.nodes.length.toLocaleString();
        }

        const currentDistanceEl = document.getElementById('currentDistance');
        if (currentDistanceEl && this.currentNode) {
            currentDistanceEl.textContent = this.currentNode.distanceFromStart;
        }

        const solutionDistanceEl = document.getElementById('solutionDistance');
        if (solutionDistanceEl && this.currentNode) {
            const dist = this.currentNode.distanceFromSolution;
            solutionDistanceEl.textContent = dist === Infinity ? '∞' : dist;
        }
    }

    toggleSolutions() {
        this.showSolutions = !this.showSolutions;
        document.getElementById('showSolutions').checked = this.showSolutions;
    }

    toggleShortestPath() {
        this.showShortestPath = !this.showShortestPath;
        document.getElementById('shortestPath').checked = this.showShortestPath;
        if (this.showShortestPath) {
            this.updateShortestPath();
        }
    }

    updateShortestPath() {
        if (!this.showShortestPath) {
            this.shortestPath = [];
            return;
        }

        // Find shortest path to nearest solution using BFS
        const queue = [{ node: this.currentNode, path: [this.currentNode] }];
        const visited = new Set([this.currentNode.hash]);

        // Build adjacency list
        const adjList = new Map();
        for (const edge of this.edges) {
            const fromNode = this.nodes[edge.from];
            const toNode = this.nodes[edge.to];

            if (!adjList.has(fromNode.hash)) adjList.set(fromNode.hash, []);
            if (!adjList.has(toNode.hash)) adjList.set(toNode.hash, []);

            adjList.get(fromNode.hash).push(toNode);
            adjList.get(toNode.hash).push(fromNode);
        }

        while (queue.length > 0) {
            const { node, path } = queue.shift();

            if (node.isSolution) {
                this.shortestPath = path;
                return;
            }

            const neighbors = adjList.get(node.hash) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.hash)) {
                    visited.add(neighbor.hash);
                    queue.push({ node: neighbor, path: [...path, neighbor] });
                }
            }
        }

        this.shortestPath = [];
    }

    reset() {
        this.camera = { x: 0, y: 0, zoom: 1, rotation: 0 };
        this.currentNode = this.nodes[0];
        this.updatePuzzleGrid();
        this.updateShortestPath();
        this.updateInfoPanel();
    }

    getNodeColor(node) {
        let value = 0;
        let maxValue = 1;

        switch (this.colorMode) {
            case 0: // Distance from start
                value = node.distanceFromStart;
                maxValue = Math.max(...this.nodes.map(n => n.distanceFromStart));
                break;
            case 1: // Distance from solution
                value = node.distanceFromSolution;
                maxValue = Math.max(...this.nodes.map(n =>
                    n.distanceFromSolution === Infinity ? 0 : n.distanceFromSolution
                ));
                if (node.distanceFromSolution === Infinity) value = maxValue;
                break;
            case 2: // Layer
                value = node.distanceFromStart;
                maxValue = Math.max(...this.nodes.map(n => n.distanceFromStart));
                break;
        }

        // Map to color gradient (blue -> green -> yellow -> red)
        const ratio = maxValue > 0 ? value / maxValue : 0;

        if (this.colorMode === 1) {
            // Invert for distance from solution (closer = warmer colors)
            return this.getGradientColor(1 - ratio);
        } else {
            return this.getGradientColor(ratio);
        }
    }

    getGradientColor(ratio) {
        // Blue (0) -> Cyan -> Green -> Yellow -> Red (1)
        const r = Math.floor(Math.min(255, ratio * 2 * 255));
        const g = Math.floor(ratio < 0.5 ? 255 : (1 - ratio) * 2 * 255);
        const b = Math.floor(ratio < 0.5 ? (0.5 - ratio) * 2 * 255 : 0);

        return `rgb(${r}, ${g}, ${b})`;
    }

    drawGraph() {
        this.ctx.save();

        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.rotate(this.camera.rotation);

        // Draw edges
        const edgeOpacity = Math.min(0.15, 0.05 + this.camera.zoom * 0.05);
        this.ctx.strokeStyle = `rgba(100, 100, 100, ${edgeOpacity})`;
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();

        this.edges.forEach(edge => {
            const fromNode = this.nodes[edge.from];
            const toNode = this.nodes[edge.to];

            this.ctx.moveTo(fromNode.x, fromNode.y);
            this.ctx.lineTo(toNode.x, toNode.y);
        });

        this.ctx.stroke();

        // Draw shortest path if enabled
        if (this.showShortestPath && this.shortestPath.length > 1) {
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();

            this.ctx.moveTo(this.shortestPath[0].x, this.shortestPath[0].y);
            for (let i = 1; i < this.shortestPath.length; i++) {
                this.ctx.lineTo(this.shortestPath[i].x, this.shortestPath[i].y);
            }

            this.ctx.stroke();
        }

        // Draw nodes
        this.nodes.forEach(node => {
            const nodeColor = this.getNodeColor(node);
            let nodeSize = 2.5 + Math.max(0, (this.camera.zoom - 1) * 1.5);

            if (this.hoveredNode && this.hoveredNode.id === node.id) {
                nodeSize *= 1.5;
            }

            // Draw node
            this.ctx.fillStyle = nodeColor;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Highlight solutions
            if (this.showSolutions && node.isSolution) {
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.lineWidth = 2;
                this.ctx.shadowColor = '#ffff00';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, nodeSize + 5, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }

            if (this.hoveredNode && this.hoveredNode.id === node.id) {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, nodeSize + 3, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });

        // Highlight current node
        if (this.currentNode) {
            const time = Date.now() * 0.005;
            const pulseSize = 10 + Math.sin(time) * 2;

            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = '#fff';
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(this.currentNode.x, this.currentNode.y, pulseSize, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(this.currentNode.x, this.currentNode.y, pulseSize * 0.6, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    updatePuzzleGrid() {
        if (!this.currentNode) return;

        const ctx = this.gridCtx;
        const width = this.gridCanvas.offsetWidth;
        const height = this.gridCanvas.offsetHeight;

        ctx.clearRect(0, 0, width, height);

        const gridWidth = 4;
        const gridHeight = 5;
        const cellSize = Math.min((width - 40) / gridWidth, (height - 40) / gridHeight);
        const offsetX = (width - cellSize * gridWidth) / 2;
        const offsetY = (height - cellSize * gridHeight) / 2;

        // Draw grid background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(offsetX, offsetY, cellSize * gridWidth, cellSize * gridHeight);

        // Draw grid lines
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridWidth; i++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + i * cellSize, offsetY);
            ctx.lineTo(offsetX + i * cellSize, offsetY + gridHeight * cellSize);
            ctx.stroke();
        }
        for (let i = 0; i <= gridHeight; i++) {
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY + i * cellSize);
            ctx.lineTo(offsetX + gridWidth * cellSize, offsetY + i * cellSize);
            ctx.stroke();
        }

        // Draw pieces
        for (const piece of this.currentNode.state) {
            const pieceData = this.puzzle.PIECES[piece.id];
            const color = this.pieceColors[piece.id % this.pieceColors.length];

            const gradient = ctx.createLinearGradient(
                offsetX + piece.x * cellSize,
                offsetY + piece.y * cellSize,
                offsetX + (piece.x + pieceData.w) * cellSize,
                offsetY + (piece.y + pieceData.h) * cellSize
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, this.adjustBrightness(color, -0.3));

            ctx.fillStyle = gradient;
            ctx.fillRect(
                offsetX + piece.x * cellSize + 2,
                offsetY + piece.y * cellSize + 2,
                pieceData.w * cellSize - 4,
                pieceData.h * cellSize - 4
            );

            ctx.strokeStyle = this.adjustBrightness(color, 0.3);
            ctx.lineWidth = 2;
            ctx.strokeRect(
                offsetX + piece.x * cellSize + 2,
                offsetY + piece.y * cellSize + 2,
                pieceData.w * cellSize - 4,
                pieceData.h * cellSize - 4
            );

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = `${Math.floor(cellSize * 0.3)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                pieceData.name,
                offsetX + (piece.x + pieceData.w / 2) * cellSize,
                offsetY + (piece.y + pieceData.h / 2) * cellSize
            );
        }

        // Highlight goal
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
            offsetX + 1 * cellSize,
            offsetY + 3 * cellSize,
            2 * cellSize,
            2 * cellSize
        );
        ctx.setLineDash([]);

        ctx.fillStyle = '#00ff00';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GOAL', offsetX + 2 * cellSize, offsetY + 4.8 * cellSize);
    }

    adjustBrightness(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    animate() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);

        this.drawGraph();

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the visualization when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new KlotskiVisualization();
});
