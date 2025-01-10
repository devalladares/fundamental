//----------------------------------------------------
// Triple-Overlap-Becomes-White (Then Reset) Experiment
// p5.js Instance Mode
//----------------------------------------------------

window.initExperiment = function() {
  const sketch = (p) => {
    //----------------------------------------------------
    // Top-Level Variables
    //----------------------------------------------------
    const GRID_ROWS = 20;
    const GRID_COLS = 30;
    
    // Waves
    const WAVE_EXPANSION_SPEED = 3;
    const WAVE_MAX_RADIUS = 1500; // After this radius, wave disappears
    
    // Base colors + color mixing
    const BASE_COLORS = ["blue", "red", "yellow"];
    // We change triple overlap from black (#000000) to white (#FFFFFF)
    const colorMap = {
      "blue":               "#1C30C8",
      "red":                "#E10000",
      "yellow":             "#FFC832",
      "blue,red":           "#B103E6",
      "blue,yellow":        "#12B100",
      "red,yellow":         "#FB8805",
      "blue,red,yellow":    "#FFFFFF"  // triple overlap => white
    };
    
    // Grid style
    const GRID_STROKE_COLOR  = 0;
    const GRID_STROKE_WEIGHT = 1;
    
    //----------------------------------------------------
    // Internal Globals
    //----------------------------------------------------
    let gridCells = []; // Each cell: { x, y, w, h, colorSet, currentColor }
    let waves = [];     // Each wave: { x, y, radius, baseColor }
    
    // We'll cycle through the three base colors each time we click
    let waveColorIndex = 0;
    
    //----------------------------------------------------
    // p5 Setup
    //----------------------------------------------------
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      initializeGrid();
    };
    
    //----------------------------------------------------
    // p5 Draw
    //----------------------------------------------------
    p.draw = () => {
      p.background(255);
      
      // 1) Update wave radii
      for (let w of waves) {
        w.radius += WAVE_EXPANSION_SPEED;
      }
      
      // 2) Remove any wave that exceeds max radius
      waves = waves.filter((w) => w.radius < WAVE_MAX_RADIUS);
      
      // 3) Apply waves to cells, adding colors to any cell within a wave
      for (let w of waves) {
        for (let cell of gridCells) {
          let cellCenterX = cell.x + cell.w / 2;
          let cellCenterY = cell.y + cell.h / 2;
          let d = p.dist(cellCenterX, cellCenterY, w.x, w.y);
          if (d < w.radius) {
            cell.colorSet.add(w.baseColor);
          }
        }
      }
      
      // 4) Determine each cell's final color and check for triple overlap
      let tripleOverlapHappened = false;
      
      for (let cell of gridCells) {
        // Mix the colors in cell.colorSet
        let sortedColors = Array.from(cell.colorSet).sort().join(",");
        cell.currentColor = getMixedColor(sortedColors);
        
        // If this cell has all three colors => sortedColors == "blue,red,yellow"
        // colorMap has that mapped to #FFFFFF
        // We'll also trigger a reset
        if (sortedColors === "blue,red,yellow") {
          tripleOverlapHappened = true;
        }
      }
      
      // 5) Draw the grid
      for (let cell of gridCells) {
        p.stroke(GRID_STROKE_COLOR);
        p.strokeWeight(GRID_STROKE_WEIGHT);
        p.fill(cell.currentColor.r, cell.currentColor.g, cell.currentColor.b);
        p.rect(cell.x, cell.y, cell.w, cell.h);
      }
      
      // 6) If any cell went white due to triple overlap => reset everything
      // (We do it *after* drawing so the user briefly sees the white flash.)
      if (tripleOverlapHappened) {
        resetSketch();
      }
    };
    
    //----------------------------------------------------
    // Mouse Interaction
    //----------------------------------------------------
    p.mousePressed = () => {
      // Cycle through the base colors: blue -> red -> yellow -> blue -> ...
      let chosenColor = BASE_COLORS[waveColorIndex % BASE_COLORS.length];
      waveColorIndex++;
      
      // Create a new wave
      waves.push({
        x: p.mouseX,
        y: p.mouseY,
        radius: 0,
        baseColor: chosenColor
      });
    };
    
    //----------------------------------------------------
    // Grid Initialization
    //----------------------------------------------------
    function initializeGrid() {
      gridCells = [];
      let cellW = p.width / GRID_COLS;
      let cellH = p.height / GRID_ROWS;
      
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          let x = c * cellW;
          let y = r * cellH;
          // handle leftover space in the last row/col
          let w = (c === GRID_COLS - 1) ? p.width - x : cellW;
          let h = (r === GRID_ROWS - 1) ? p.height - y : cellH;
          
          gridCells.push({
            x,
            y,
            w,
            h,
            colorSet: new Set(),
            currentColor: { r: 255, g: 255, b: 255 } // start white
          });
        }
      }
    }
    
    //----------------------------------------------------
    // Reset Sketch (Clear grid + waves + color cycle)
    //----------------------------------------------------
    function resetSketch() {
      waves = [];
      waveColorIndex = 0;
      initializeGrid();
    }
    
    //----------------------------------------------------
    // COLOR MIXING
    //----------------------------------------------------
    function getMixedColor(sortedColors) {
      // If no colors, default to white
      if (!sortedColors) {
        return { r: 255, g: 255, b: 255 };
      }
      // Convert from hex
      let hex = colorMap[sortedColors] || "#000000";
      return hexToRGB(hex);
    }
    
    function hexToRGB(hexStr) {
      if (hexStr[0] === '#') {
        hexStr = hexStr.slice(1);
      }
      let r = parseInt(hexStr.slice(0, 2), 16);
      let g = parseInt(hexStr.slice(2, 4), 16);
      let b = parseInt(hexStr.slice(4, 6), 16);
      return { r, g, b };
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
