class KlotskiVisualization {
    constructor() {
        this.canvas = document.getElementById('graph-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridCanvas = document.getElementById('grid-canvas');
        this.gridCtx = this.gridCanvas.getContext('2d');

        this.setupCanvas();
        this.setupColorPalette();
        this.initializeGraph();
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
        this.currentNode = null;
        this.showSolutions = false;
        this.showShortestPath = false;
        this.hoveredNode = null;

        // Initialize grid
        this.updatePuzzleGrid();
        this.animate();
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
        colors.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', () => this.selectColor(index));
            palette.appendChild(swatch);
        });

        this.colors = colors;
        this.selectedColorIndex = 0;
        this.selectColor(0);
    }

    selectColor(index) {
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.remove('selected');
        });
        document.querySelectorAll('.color-swatch')[index].classList.add('selected');
        this.selectedColorIndex = index;
    }

    initializeGraph() {
        // Generate a complex graph structure representing the Klotski puzzle state space
        this.nodes = [];
        this.edges = [];

        const numNodes = 800; // More nodes for better representation
        const centerX = 400; // Fixed center
        const centerY = 300;

        // Create multiple circular layers with varying radii
        const layers = 8;
        const nodesPerLayer = numNodes / layers;

        for (let layer = 0; layer < layers; layer++) {
            const radius = 50 + layer * 40;
            const nodesInThisLayer = Math.floor(nodesPerLayer * (1 + layer * 0.2));

            for (let i = 0; i < nodesInThisLayer; i++) {
                const angle = (i / nodesInThisLayer) * Math.PI * 2;
                const radiusVariation = radius + (Math.random() - 0.5) * 30;
                const angleVariation = angle + (Math.random() - 0.5) * 0.3;

                const x = centerX + Math.cos(angleVariation) * radiusVariation;
                const y = centerY + Math.sin(angleVariation) * radiusVariation;

                this.nodes.push({
                    id: this.nodes.length,
                    x: x,
                    y: y,
                    distance: layer * 12 + Math.floor(Math.random() * 12), // Distance from start
                    layer: layer,
                    connections: []
                });
            }
        }

        // Generate edges with more structured connections
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const maxConnections = 3 + Math.floor(Math.random() * 4);

            // Connect to nearby nodes
            for (let j = 0; j < this.nodes.length && node.connections.length < maxConnections; j++) {
                if (i === j) continue;

                const otherNode = this.nodes[j];
                const dx = node.x - otherNode.x;
                const dy = node.y - otherNode.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Connect if close enough and not too many connections
                if (distance < 80 && Math.random() > 0.7 && !node.connections.includes(j)) {
                    node.connections.push(j);
                    this.edges.push({ from: i, to: j });
                }
            }
        }

        this.currentNode = this.nodes[0];
    }

    setupEventListeners() {
        // Mouse controls
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
                // Handle hover
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

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }

    handleMouseHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Transform screen coordinates to world coordinates
        const worldX = (x - this.camera.x) / this.camera.zoom;
        const worldY = (y - this.camera.y) / this.camera.zoom;

        // Find closest node for hover effect
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
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Transform screen coordinates to world coordinates
        const worldX = (x - this.camera.x) / this.camera.zoom;
        const worldY = (y - this.camera.y) / this.camera.zoom;

        // Find closest node
        let closestNode = null;
        let closestDistance = Infinity;

        this.nodes.forEach(node => {
            const dx = node.x - worldX;
            const dy = node.y - worldY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance && distance < 20) {
                closestDistance = distance;
                closestNode = node;
            }
        });

        if (closestNode) {
            this.currentNode = closestNode;
            this.updatePuzzleGrid();
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
        });
    }

    cycleColorMode() {
        // Cycle through different color modes
        this.colorMode = (this.colorMode || 0) + 1;
        if (this.colorMode > 2) this.colorMode = 0;
    }

    toggleSolutions() {
        this.showSolutions = !this.showSolutions;
        document.getElementById('showSolutions').checked = this.showSolutions;
    }

    toggleShortestPath() {
        this.showShortestPath = !this.showShortestPath;
        document.getElementById('shortestPath').checked = this.showShortestPath;
    }

    reset() {
        this.camera = { x: 0, y: 0, zoom: 1, rotation: 0 };
        this.currentNode = this.nodes[0];
        this.updatePuzzleGrid();
    }

    getNodeColor(node) {
        const colorIndex = Math.floor((node.distance / 100) * this.colors.length);
        return this.colors[Math.min(colorIndex, this.colors.length - 1)];
    }

    drawGraph() {
        this.ctx.save();

        // Apply camera transformations
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.rotate(this.camera.rotation);

        // Draw edges with varying opacity based on zoom
        const edgeOpacity = Math.min(0.3, 0.1 + this.camera.zoom * 0.1);
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${edgeOpacity})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        this.edges.forEach(edge => {
            const fromNode = this.nodes[edge.from];
            const toNode = this.nodes[edge.to];

            this.ctx.moveTo(fromNode.x, fromNode.y);
            this.ctx.lineTo(toNode.x, toNode.y);
        });

        this.ctx.stroke();

        // Draw nodes with better visibility
        this.nodes.forEach(node => {
            const nodeColor = this.getNodeColor(node);
            let nodeSize = 4 + (this.camera.zoom - 1) * 2;

            // Increase size for hovered node
            if (this.hoveredNode && this.hoveredNode.id === node.id) {
                nodeSize *= 1.5;
            }

            // Draw node with glow effect
            this.ctx.fillStyle = nodeColor;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Add slight glow
            this.ctx.shadowColor = nodeColor;
            this.ctx.shadowBlur = this.hoveredNode && this.hoveredNode.id === node.id ? 12 : 8;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, nodeSize * 0.7, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Add hover highlight
            if (this.hoveredNode && this.hoveredNode.id === node.id) {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, nodeSize + 3, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });

        // Highlight current node with animated effect
        if (this.currentNode) {
            const time = Date.now() * 0.005;
            const pulseSize = 12 + Math.sin(time) * 3;

            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.currentNode.x, this.currentNode.y, pulseSize, 0, Math.PI * 2);
            this.ctx.stroke();

            // Inner circle
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

        // Draw background grid
        const gridSize = 5;
        const cellSize = Math.min(width - 40, height - 40) / gridSize;
        const offsetX = (width - cellSize * gridSize) / 2;
        const offsetY = (height - cellSize * gridSize) / 2;

        // Draw grid background
        ctx.fillStyle = '#111';
        ctx.fillRect(offsetX, offsetY, cellSize * gridSize, cellSize * gridSize);

        // Draw grid lines
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + i * cellSize, offsetY);
            ctx.lineTo(offsetX + i * cellSize, offsetY + gridSize * cellSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY + i * cellSize);
            ctx.lineTo(offsetX + gridSize * cellSize, offsetY + i * cellSize);
            ctx.stroke();
        }

        // Create Klotski puzzle pieces pattern
        const pieces = [
            { x: 1, y: 0, w: 2, h: 2, color: this.colors[0], name: 'Large' }, // Main piece
            { x: 0, y: 0, w: 1, h: 2, color: this.colors[1], name: 'Tall1' },
            { x: 3, y: 0, w: 1, h: 2, color: this.colors[2], name: 'Tall2' },
            { x: 1, y: 2, w: 1, h: 1, color: this.colors[3], name: 'Small1' },
            { x: 2, y: 2, w: 1, h: 1, color: this.colors[4], name: 'Small2' },
            { x: 0, y: 2, w: 1, h: 1, color: this.colors[5], name: 'Small3' },
            { x: 3, y: 2, w: 1, h: 1, color: this.colors[6], name: 'Small4' },
            { x: 1, y: 3, w: 2, h: 1, color: this.colors[7], name: 'Wide' },
            { x: 0, y: 3, w: 1, h: 1, color: this.colors[8], name: 'Small5' },
            { x: 3, y: 3, w: 1, h: 1, color: this.colors[9], name: 'Small6' }
        ];

        // Apply variations based on current node to simulate different puzzle states
        const variation = this.currentNode.id % 50;
        const stateVariation = Math.floor(variation / 10);

        pieces.forEach((piece, index) => {
            let newX = piece.x;
            let newY = piece.y;

            // Apply state-based transformations
            if (stateVariation === 1 && index === 0) { // Move large piece
                newY = Math.min(3, piece.y + 1);
            } else if (stateVariation === 2 && index < 3) { // Shift tall pieces
                newX = (piece.x + 1) % (gridSize - piece.w + 1);
            } else if (stateVariation === 3 && index >= 3 && index < 7) { // Rearrange small pieces
                newX = (piece.x + variation % 3) % (gridSize - piece.w + 1);
                newY = (piece.y + Math.floor(variation / 5) % 2) % (gridSize - piece.h + 1);
            }

            // Ensure pieces stay within bounds
            newX = Math.max(0, Math.min(gridSize - piece.w, newX));
            newY = Math.max(0, Math.min(gridSize - piece.h, newY));

            // Draw piece with gradient and border
            const gradient = ctx.createLinearGradient(
                offsetX + newX * cellSize,
                offsetY + newY * cellSize,
                offsetX + (newX + piece.w) * cellSize,
                offsetY + (newY + piece.h) * cellSize
            );
            gradient.addColorStop(0, piece.color);
            gradient.addColorStop(1, this.adjustBrightness(piece.color, -0.3));

            ctx.fillStyle = gradient;
            ctx.fillRect(
                offsetX + newX * cellSize + 2,
                offsetY + newY * cellSize + 2,
                piece.w * cellSize - 4,
                piece.h * cellSize - 4
            );

            // Draw piece border
            ctx.strokeStyle = this.adjustBrightness(piece.color, 0.3);
            ctx.lineWidth = 2;
            ctx.strokeRect(
                offsetX + newX * cellSize + 2,
                offsetY + newY * cellSize + 2,
                piece.w * cellSize - 4,
                piece.h * cellSize - 4
            );

            // Add piece labels for larger pieces
            if (piece.w > 1 || piece.h > 1) {
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    piece.name,
                    offsetX + (newX + piece.w / 2) * cellSize,
                    offsetY + (newY + piece.h / 2) * cellSize + 4
                );
            }
        });

        // Highlight goal position
        const goalX = 1.5;
        const goalY = 3.5;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
            offsetX + goalX * cellSize,
            offsetY + goalY * cellSize,
            2 * cellSize,
            1 * cellSize
        );
        ctx.setLineDash([]);

        // Add goal label
        ctx.fillStyle = '#ffff00';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            'GOAL',
            offsetX + (goalX + 1) * cellSize,
            offsetY + (goalY + 0.5) * cellSize + 3
        );
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