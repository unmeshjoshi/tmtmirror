class HoneycombGrid {
    constructor(containerId, config) {
        this.container = document.getElementById(containerId);
        this.config = {
            exactHexagonCount: config.exactHexagonCount || 492,
            hexagonEdgeLength: config.hexagonEdgeLength || 30,
            gridRadius: config.gridRadius || 400,
            gridRange: config.gridRange || 20,
            centerGap: config.centerGap || true,
            colors: config.colors || ["#a9def9", "#e4c1f9", "#f9dc5c"]  // 3 colors for 6 sections
        };

        // Adjust measurements for proper edge sharing
        this.measurements = {
            // Width of hexagon
            hexagonWidth: this.config.hexagonEdgeLength,
            // Height of hexagon (distance between parallel sides)
            hexagonHeight: this.config.hexagonEdgeLength * Math.sqrt(3),
            // Horizontal spacing (for vertical edge sharing in same row)
            horizontalSpacing: this.config.hexagonEdgeLength,
            // Vertical spacing between rows
            verticalSpacing: this.config.hexagonEdgeLength * Math.sqrt(3) / 2,
            // Horizontal offset for alternate rows (for slanted edge sharing)
            rowOffset: this.config.hexagonEdgeLength / 2
        };

        this.hexagons = [];
        this.setupPopup();
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
    colors: ["#a9def9", "#e4c1f9", "#f9dc5c"]  // 3 colors for 6 sections
};

const honeycombGrid = new HoneycombGrid('mirror-grid', honeycombConfig);
honeycombGrid.generateGrid(); 