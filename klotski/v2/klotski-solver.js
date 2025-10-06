// Klotski Puzzle State Space Generator
// Generates all possible states and transitions for the classic Huarong Road puzzle

class KlotskiSolver {
    constructor() {
        // Piece definitions: [width, height, id]
        // Standard Huarong Road configuration
        this.pieces = [
            { w: 2, h: 2, id: 'cao', name: 'Cao Cao' },      // The 2x2 piece
            { w: 1, h: 2, id: 'z1', name: 'Zhang Fei' },     // Vertical pieces
            { w: 1, h: 2, id: 'z2', name: 'Zhao Yun' },
            { w: 1, h: 2, id: 'z3', name: 'Ma Chao' },
            { w: 1, h: 2, id: 'z4', name: 'Huang Zhong' },
            { w: 2, h: 1, id: 'g1', name: 'Guan Yu' },       // Horizontal piece
            { w: 1, h: 1, id: 's1', name: 'Soldier 1' },     // Small pieces
            { w: 1, h: 1, id: 's2', name: 'Soldier 2' },
            { w: 1, h: 1, id: 's3', name: 'Soldier 3' },
            { w: 1, h: 1, id: 's4', name: 'Soldier 4' }
        ];

        this.boardWidth = 4;
        this.boardHeight = 5;

        // Initial state (standard configuration)
        this.initialState = this.createState([
            { piece: 0, x: 1, y: 0 },  // Cao Cao at center top
            { piece: 1, x: 0, y: 0 },  // Zhang Fei left
            { piece: 2, x: 3, y: 0 },  // Zhao Yun right
            { piece: 3, x: 0, y: 2 },  // Ma Chao left
            { piece: 4, x: 3, y: 2 },  // Huang Zhong right
            { piece: 5, x: 1, y: 2 },  // Guan Yu center
            { piece: 6, x: 1, y: 3 },  // Soldiers
            { piece: 7, x: 2, y: 3 },
            { piece: 8, x: 0, y: 4 },
            { piece: 9, x: 3, y: 4 }
        ]);

        this.stateMap = new Map();
        this.stateList = [];
        this.edges = [];
    }

    createState(positions) {
        return positions.map(p => ({ piece: p.piece, x: p.x, y: p.y }));
    }

    stateToString(state) {
        return state.map(p => `${p.piece}:${p.x},${p.y}`).sort().join('|');
    }

    isValidPosition(state, pieceIdx, x, y) {
        const piece = this.pieces[state[pieceIdx].piece];

        // Check bounds
        if (x < 0 || y < 0 || x + piece.w > this.boardWidth || y + piece.h > this.boardHeight) {
            return false;
        }

        // Check collision with other pieces
        for (let i = 0; i < state.length; i++) {
            if (i === pieceIdx) continue;

            const otherPos = state[i];
            const otherPiece = this.pieces[otherPos.piece];

            // Check overlap
            if (!(x >= otherPos.x + otherPiece.w ||
                  x + piece.w <= otherPos.x ||
                  y >= otherPos.y + otherPiece.h ||
                  y + piece.h <= otherPos.y)) {
                return false;
            }
        }

        return true;
    }

    getNextStates(state) {
        const nextStates = [];
        const moves = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // down, up, right, left

        for (let i = 0; i < state.length; i++) {
            const pos = state[i];

            for (const [dx, dy] of moves) {
                const newX = pos.x + dx;
                const newY = pos.y + dy;

                if (this.isValidPosition(state, i, newX, newY)) {
                    const newState = state.map(p => ({ ...p }));
                    newState[i].x = newX;
                    newState[i].y = newY;
                    nextStates.push(newState);
                }
            }
        }

        return nextStates;
    }

    isSolution(state) {
        // Cao Cao (piece 0) should be at position (1, 3) to exit
        const caoCao = state.find(p => p.piece === 0);
        return caoCao && caoCao.x === 1 && caoCao.y === 3;
    }

    generateStateSpace() {
        console.log('Generating Klotski state space...');
        const queue = [this.initialState];
        const visited = new Set();
        visited.add(this.stateToString(this.initialState));

        let stateId = 0;
        this.stateMap.set(this.stateToString(this.initialState), stateId);
        this.stateList.push({
            id: stateId,
            state: this.initialState,
            isSolution: this.isSolution(this.initialState)
        });
        stateId++;

        while (queue.length > 0) {
            const currentState = queue.shift();
            const currentKey = this.stateToString(currentState);
            const currentId = this.stateMap.get(currentKey);

            const nextStates = this.getNextStates(currentState);

            for (const nextState of nextStates) {
                const nextKey = this.stateToString(nextState);

                if (!visited.has(nextKey)) {
                    visited.add(nextKey);
                    this.stateMap.set(nextKey, stateId);
                    this.stateList.push({
                        id: stateId,
                        state: nextState,
                        isSolution: this.isSolution(nextState)
                    });
                    queue.push(nextState);
                    stateId++;
                }

                const nextId = this.stateMap.get(nextKey);
                this.edges.push([currentId, nextId]);
            }

            if (stateId % 1000 === 0) {
                console.log(`Generated ${stateId} states...`);
            }
        }

        console.log(`Complete! Total states: ${this.stateList.length}`);
        return { states: this.stateList, edges: this.edges };
    }

    calculateDistances() {
        // BFS from all solution states
        const distances = new Array(this.stateList.length).fill(Infinity);
        const queue = [];

        // Find all solution states
        for (let i = 0; i < this.stateList.length; i++) {
            if (this.stateList[i].isSolution) {
                distances[i] = 0;
                queue.push(i);
            }
        }

        // Build adjacency list
        const adj = new Array(this.stateList.length).fill(null).map(() => []);
        for (const [from, to] of this.edges) {
            adj[from].push(to);
            adj[to].push(from);
        }

        // BFS
        while (queue.length > 0) {
            const current = queue.shift();

            for (const neighbor of adj[current]) {
                if (distances[neighbor] === Infinity) {
                    distances[neighbor] = distances[current] + 1;
                    queue.push(neighbor);
                }
            }
        }

        return distances;
    }

    findShortestPath(fromId, toId) {
        // BFS to find shortest path
        const queue = [[fromId]];
        const visited = new Set([fromId]);

        // Build adjacency list
        const adj = new Array(this.stateList.length).fill(null).map(() => []);
        for (const [from, to] of this.edges) {
            adj[from].push(to);
            adj[to].push(from);
        }

        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];

            if (current === toId) {
                return path;
            }

            for (const neighbor of adj[current]) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }

        return null;
    }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KlotskiSolver;
}
