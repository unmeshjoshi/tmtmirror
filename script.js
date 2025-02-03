class HoneycombGrid {
    constructor(containerId, config) {
        this.container = document.getElementById(containerId);
        this.config = {
            exactHexagonCount: config.exactHexagonCount || 492,
            hexagonEdgeLength: config.hexagonEdgeLength || 30,
            gridRadius: config.gridRadius || 400,
            gridRange: config.gridRange || 20,
            centerGap: config.centerGap || true,
            colors: config.colors || this.colorThemes.metallicBlues
        };

        this.colorThemes = {
            starkTech: ["#0FF0FC", "#FF2281", "#7D83FF"],
            classicSuperman: ["#0033AD", "#EE1D24", "#FFD700"],
            manOfSteel: ["#003C7D", "#B81D22", "#96A8C8"],
            kryptonianTech: ["#00A9E0", "#DA1F3D", "#C4D6F2"],
            metallicBlues: ["#B8C6DB", "#89A3C2", "#5B7BA6"],
            infinityStones: ["#3CDFFF", "#B19CD9", "#FF4B4B"],
            ironMan: ["#FF4B4B", "#FFD700", "#FF8C00"],
            quantumRealm: ["#00F2FE", "#FF00E4", "#4DEEEA"]
        };

        this.measurements = {
            hexagonWidth: this.config.hexagonEdgeLength,
            hexagonHeight: this.config.hexagonEdgeLength * Math.sqrt(3),
            horizontalSpacing: this.config.hexagonEdgeLength,
            verticalSpacing: this.config.hexagonEdgeLength * Math.sqrt(3) / 2,
            rowOffset: this.config.hexagonEdgeLength / 2
        };

        this.hexagons = [];
        this.setupPopup();
        this.setupThemeSelector();
    }

    setupThemeSelector() {
        const selector = document.createElement('div');
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <label for="theme-select">Color Theme:</label>
            <select id="theme-select">
                <option value="classicSuperman" selected>Classic Superman</option>
                <option value="starkTech">Stark Tech</option>
                <option value="manOfSteel">Man of Steel</option>
                <option value="kryptonianTech">Kryptonian Tech</option>
                <option value="metallicBlues">Metallic Blues</option>
                <option value="infinityStones">Infinity Stones</option>
                <option value="ironMan">Iron Man</option>
                <option value="quantumRealm">Quantum Realm</option>
            </select>
        `;

        document.body.appendChild(selector);

        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.config.colors = this.colorThemes[e.target.value];
            this.regenerateGrid();
        });
    }

    regenerateGrid() {
        // Clear existing grid
        this.container.innerHTML = '';
        // Regenerate with new colors
        this.generateGrid();
    }

    setupPopup() {
        // Create popup element
        this.popup = document.createElement('div');
        this.popup.className = 'hexagon-popup';
        this.popup.style.display = 'none';
        document.body.appendChild(this.popup);
    }

    getSectionColor(x, y) {
        // Calculate angle from center (in radians)
        const angle = Math.atan2(y, x);
        // Convert to degrees and normalize to 0-360
        const degrees = (angle * 180 / Math.PI + 360) % 360;
        
        // Divide into 6 sections of 60 degrees each
        // Return the same color for opposite sections
        if (degrees >= 330 || degrees < 30) return this.config.colors[0];      // Section 1
        if (degrees >= 30 && degrees < 90) return this.config.colors[1];       // Section 2
        if (degrees >= 90 && degrees < 150) return this.config.colors[2];      // Section 3
        if (degrees >= 150 && degrees < 210) return this.config.colors[0];     // Section 4 (opposite to 1)
        if (degrees >= 210 && degrees < 270) return this.config.colors[1];     // Section 5 (opposite to 2)
        return this.config.colors[2];                                          // Section 6 (opposite to 3)
    }

    getHexagonMetadata(number, x, y) {
        const angle = Math.atan2(y, x);
        const degrees = (angle * 180 / Math.PI + 360) % 360;
        
        return {
            number: number,
            position: `Row: ${Math.round(y/30)}, Column: ${Math.round(x/30)}`,
            status: Math.random() > 0.5 ? 'Active' : 'Inactive',
            direction: `${degrees.toFixed(1)}°`,
            distance: `${Math.sqrt(x*x + y*y).toFixed(1)} units`
        };
    }

    calculateHexagonPosition(column, row) {
        // Horizontal position: base position plus offset for alternate rows
        const x = this.measurements.horizontalSpacing * column + 
                 (row % 2 ? this.measurements.rowOffset : 0);
        
        // Vertical position
        const y = this.measurements.verticalSpacing * row;
        
        return {
            x,
            y,
            column,
            row
        };
    }

    getDistanceFromCenter(x, y) {
        return Math.sqrt(x * x + y * y);
    }

    isCenterHexagon(x, y) {
        const centerThreshold = this.config.hexagonEdgeLength / 2;
        return Math.abs(x) < centerThreshold && Math.abs(y) < centerThreshold;
    }

    showPopup(metadata, event) {
        this.popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-header">Hexagon #${metadata.number}</div>
                <div class="popup-body">
                    <p>Position: ${metadata.position}</p>
                    <p>Status: ${metadata.status}</p>
                    <p>Direction: ${metadata.direction}</p>
                    <p>Distance: ${metadata.distance}</p>
                </div>
            </div>
        `;
        
        const rect = event.target.getBoundingClientRect();
        this.popup.style.display = 'block';
        this.popup.style.left = `${rect.right + 10}px`;
        this.popup.style.top = `${rect.top}px`;
    }

    hidePopup() {
        this.popup.style.display = 'none';
    }

    createHexagonElement(x, y, number) {
        const hexagon = document.createElement('div');
        hexagon.className = 'hexagon';
        hexagon.style.transform = `translate(${x + this.config.gridRadius}px, ${y + this.config.gridRadius}px)`;
        
        // Set color based on section
        hexagon.style.backgroundColor = this.getSectionColor(x, y);
        
        // Add number display
        const numberDisplay = document.createElement('span');
        numberDisplay.className = 'hexagon-number';
        numberDisplay.textContent = number;
        hexagon.appendChild(numberDisplay);

        // Store metadata
        const metadata = this.getHexagonMetadata(number, x, y);
        
        // Add event listeners for popup
        hexagon.addEventListener('mouseenter', (e) => this.showPopup(metadata, e));
        hexagon.addEventListener('mouseleave', () => this.hidePopup());

        return hexagon;
    }

    generateGrid() {
        let allPositions = [];
        
        // Collect all valid positions
        for (let row = -this.config.gridRange; row <= this.config.gridRange; row++) {
            for (let column = -this.config.gridRange; column <= this.config.gridRange; column++) {
                const position = this.calculateHexagonPosition(column, row);
                const distance = this.getDistanceFromCenter(position.x, position.y);

                if (distance < this.config.gridRadius) {
                    if (!(this.config.centerGap && this.isCenterHexagon(position.x, position.y))) {
                        allPositions.push({
                            ...position,
                            distance
                        });
                    }
                }
            }
        }

        // First sort by distance to maintain circular shape
        allPositions.sort((a, b) => a.distance - b.distance);
        
        // Take only the required number of positions
        const selectedPositions = allPositions.slice(0, this.config.exactHexagonCount);

        // Then sort selected positions by row and column for numbering
        selectedPositions.sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            return a.column - b.column;
        });

        console.log(`Generated ${selectedPositions.length} hexagons`);

        // Create hexagons with sequential numbers
        selectedPositions.forEach((position, index) => {
            const hexagon = this.createHexagonElement(position.x, position.y, index + 1);
            this.container.appendChild(hexagon);
        });
    }
}

// Usage
const honeycombConfig = {
    exactHexagonCount: 492,
    hexagonEdgeLength: 30,
    gridRadius: 400,
    gridRange: 20,
    centerGap: true,
    colors: ["#B8C6DB", "#89A3C2", "#5B7BA6"]  // metallic blue colors.
};

const honeycombGrid = new HoneycombGrid('mirror-grid', honeycombConfig);
honeycombGrid.generateGrid(); 