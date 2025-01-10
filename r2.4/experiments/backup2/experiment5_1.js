//----------------------------------------------------
// Generative "City" on a Grid in p5.js (Instance Mode)
//----------------------------------------------------

window.initExperiment = function() {
  const sketch = (p) => {

    //----------------------------------------------------
    // Top-Level Variables
    //----------------------------------------------------

    // Grid dimensions
    const ROWS = 30;
    const COLS = 40;
    let gridCells = []; // Holds all our cells

    // Cell random types (feel free to add more)
    const TERRAIN_TYPES = ["building", "park", "water", "empty"];

    // Size of each cell (computed in setup)
    let cellW, cellH;

    // For highlighting the hovered cell
    let hoverIndex = -1; 

    //----------------------------------------------------
    // p5 Setup
    //----------------------------------------------------
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);

      // Initialize our grid
      initializeGrid();
    };

    //----------------------------------------------------
    // p5 Draw
    //----------------------------------------------------
    p.draw = () => {
      p.background(220);

      // Draw all cells
      for (let i = 0; i < gridCells.length; i++) {
        drawCell(gridCells[i], i);
      }

      // If we're hovering over a valid cell, highlight it
      if (hoverIndex !== -1) {
        highlightCell(gridCells[hoverIndex]);
      }
    };

    //----------------------------------------------------
    // Mouse Interaction
    //----------------------------------------------------
    p.mousePressed = () => {
      // On click, transform the cell under the mouse, if any
      let idx = cellIndexAt(p.mouseX, p.mouseY);
      if (idx >= 0) {
        randomizeCell(gridCells[idx]);
      }
    };

    p.mouseMoved = () => {
      // Update hoverIndex
      hoverIndex = cellIndexAt(p.mouseX, p.mouseY);
    };

    //----------------------------------------------------
    // Custom Functions
    //----------------------------------------------------

    /**
     * Build the initial grid with random city/terrain features
     */
    function initializeGrid() {
      gridCells = [];
      cellW = p.width / COLS;
      cellH = p.height / ROWS;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          let x = c * cellW;
          let y = r * cellH;

          // Create one cell
          let cell = {
            x,
            y,
            w: cellW,
            h: cellH,
            // We randomly pick a base type
            type: p.random(TERRAIN_TYPES),
            // For "building," we pick a random "height"
            height: p.floor(p.random(1, 5)), 
            // For a nice color or theme
            color: p.color(p.random(100, 255), p.random(100, 255), p.random(100, 255))
          };

          // Possibly tweak "water" or "park" with no height
          if (cell.type !== "building") {
            cell.height = 0;
          }

          gridCells.push(cell);
        }
      }
    }

    /**
     * Draw a single cell based on its type/height
     */
    function drawCell(cell, index) {
      // If building, we do a "fake 3D" shading
      if (cell.type === "building") {
        // The building color is the base cell color, darkened by height
        let shadeFactor = 30 * cell.height; // the bigger the building, the darker
        let c = p.color(
          p.red(cell.color)   - shadeFactor,
          p.green(cell.color) - shadeFactor,
          p.blue(cell.color)  - shadeFactor
        );
        p.fill(c);
      }
      else if (cell.type === "park") {
        p.fill(80, 180, 80); // greenish
      }
      else if (cell.type === "water") {
        p.fill(70, 120, 255); 
      }
      else {
        // "empty" or unknown => light gray
        p.fill(200);
      }

      p.noStroke();
      p.rect(cell.x, cell.y, cell.w, cell.h);

      // Optional: draw building "height" text if it's tall
      if (cell.type === "building") {
        p.fill(0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text(cell.height.toString(), cell.x + cell.w / 2, cell.y + cell.h / 2);
      }

      // We can also draw grid lines on top
      p.stroke(150);
      p.noFill();
      p.rect(cell.x, cell.y, cell.w, cell.h);
    }

    /**
     * Highlight a cell by drawing a semi-transparent overlay
     */
    function highlightCell(cell) {
      p.noStroke();
      p.fill(255, 255, 0, 80); // yellow highlight
      p.rect(cell.x, cell.y, cell.w, cell.h);
    }

    /**
     * Find which cell index is at (mx, my). Returns -1 if none.
     */
    function cellIndexAt(mx, my) {
      // quick boundary check
      if (mx < 0 || mx > p.width || my < 0 || my > p.height) return -1;

      // Convert (mx,my) to row,col
      let c = p.floor(mx / cellW);
      let r = p.floor(my / cellH);
      let index = r * COLS + c;
      if (index >= 0 && index < gridCells.length) {
        return index;
      } else {
        return -1;
      }
    }

    /**
     * Randomize a cell into a new type (like a building, park, water, etc.)
     * - We can subdivide or do more complex logic for "out of the box" creativity
     */
    function randomizeCell(cell) {
      // 1) random pick a new type
      let newType = p.random(TERRAIN_TYPES);

      // 2) If we pick "building," random new height
      let newHeight = 0;
      if (newType === "building") {
        newHeight = p.floor(p.random(1, 10));
      }

      // 3) Maybe do something "fancy" - e.g. subdivide
      //    (We'll demonstrate a simple "subdivide" effect:
      //     if we pick building, there's a 20% chance we subdivide further
      //     and place "mini-buildings" inside the same cell.)
      if (newType === "building" && p.random() < 0.2) {
        subdivideCell(cell, newHeight);
        return; // We skip the normal assignment
      }

      // Normal assignment
      cell.type = newType;
      cell.height = newHeight;
      cell.color = p.color(p.random(100, 255), p.random(100, 255), p.random(100, 255));
    }

    /**
     * Example "out of the box" idea: Subdivide a cell into smaller "micro-blocks".
     * We'll replace the original cell with e.g. 4 micro-cells that become part
     * of the global grid, effectively "breaking" the original dimension of the grid.
     */
    function subdivideCell(cell, baseHeight) {
      // We'll do a 2x2 subdivision for demonstration
      let halfW = cell.w / 2;
      let halfH = cell.h / 2;

      // We remove the original cell from the array
      // and add four new "child" cells
      let idx = gridCells.indexOf(cell);
      if (idx < 0) return;

      gridCells.splice(idx, 1);

      // Create 4 sub-cells, each building with smaller random heights
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          let x = cell.x + sx * halfW;
          let y = cell.y + sy * halfH;

          let microCell = {
            x, y,
            w: halfW,
            h: halfH,
            type: "building",
            height: p.floor(p.random(1, baseHeight + 1)),
            color: p.color(p.random(100, 255), p.random(100, 255), p.random(100, 255))
          };
          gridCells.push(microCell);
        }
      }
    }

    //----------------------------------------------------
    // Handle Window Resize
    //----------------------------------------------------
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      initializeGrid();
    };
  };

  // Return the new p5 instance
  return new p5(sketch);
};
