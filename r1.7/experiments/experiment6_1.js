//----------------------------------------------------
// Waves: blue -> red -> yellow -> white -> (repeat)
// Triple overlap => black; White wave overwrites => white
// After white, next wave can recolor the cell.
// p5.js Instance Mode
//----------------------------------------------------

window.initExperiment = function() {
  const sketch = (p) => {
    //----------------------------------------------------
    // Top-Level Variables
    //----------------------------------------------------
    const GRID_ROWS = 20;
    const GRID_COLS = 30;
    
    // Wave expansion
    const WAVE_EXPANSION_SPEED = 3; 
    const WAVE_MAX_RADIUS = 1500;   // Remove wave after it expands this far
    
    // The four wave colors in sequence
    const WAVE_COLORS = ["blue", "red", "yellow", "white"];
    
    // Color map for combining base colors
    // If a cell’s colorSet is 'white', we display pure white.
    // If it has all three primary colors => black (#000000).
    const colorMap = {
      "blue":               "#1C30C8",
      "red":                "#E10000",
      "yellow":             "#FFC832",
      "white":              "#FFFFFF",
      "blue,red":           "#B103E6",
      "blue,yellow":        "#12B100",
      "red,yellow":         "#FB8805",
      "blue,red,yellow":    "#000000"  // triple overlap => black
    };
    
    // Grid style
    const GRID_STROKE_COLOR  = 0; // black
    const GRID_STROKE_WEIGHT = 1;
    
    //----------------------------------------------------
    // Internal Globals
    //----------------------------------------------------
    let gridCells = []; // { x, y, w, h, colorSet, currentColor }
    let waves = [];     // { x, y, radius, waveColor }
    
    // Index to pick which wave color we spawn next
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
      
      // 2) Remove waves that exceed max radius
      waves = waves.filter(w => w.radius < WAVE_MAX_RADIUS);
      
      // 3) Apply waves to cells
      for (let w of waves) {
        const { x: waveX, y: waveY, radius, waveColor } = w;
        
        for (let cell of gridCells) {
          // Center of this cell
          const cx = cell.x + cell.w / 2; 
          const cy = cell.y + cell.h / 2;
          const d = p.dist(cx, cy, waveX, waveY);
          
          // If the cell center is inside this wave's radius
          if (d < radius) {
            if (waveColor === "white") {
              // White wave overrides everything
              cell.colorSet.clear();
              cell.colorSet.add("white");
            } else {
              // Otherwise, if the cell is currently white, remove that
              // so the new color can be visible.
              if (cell.colorSet.has("white")) {
                cell.colorSet.delete("white");
              }
              cell.colorSet.add(waveColor);
            }
          }
        }
      }
      
      // 4) Compute the currentColor of each cell
      for (let cell of gridCells) {
        cell.currentColor = getMixedColor(cell.colorSet);
      }
      
      // 5) Draw the grid
      for (let cell of gridCells) {
        p.stroke(GRID_STROKE_COLOR);
        p.strokeWeight(GRID_STROKE_WEIGHT);
        p.fill(cell.currentColor.r, cell.currentColor.g, cell.currentColor.b);
        p.rect(cell.x, cell.y, cell.w, cell.h);
      }
    };
    
    //----------------------------------------------------
    // Mouse Interaction
    //----------------------------------------------------
    p.mousePressed = () => {
      // Cycle wave color among blue->red->yellow->white->blue...
      const colorToSpawn = WAVE_COLORS[waveColorIndex % WAVE_COLORS.length];
      waveColorIndex++;
      
      // Spawn a new wave
      waves.push({
        x: p.mouseX,
        y: p.mouseY,
        radius: 0,
        waveColor: colorToSpawn
      });
    };
    
    //----------------------------------------------------
    // Grid Initialization
    //----------------------------------------------------
    function initializeGrid() {
      gridCells = [];
      const cellW = p.width / GRID_COLS;
      const cellH = p.height / GRID_ROWS;
      
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const x = c * cellW;
          const y = r * cellH;
          
          // Handle leftover space in the last row/col
          const w = (c === GRID_COLS - 1) ? p.width - x : cellW;
          const h = (r === GRID_ROWS - 1) ? p.height - y : cellH;
          
          gridCells.push({
            x, y, w, h,
            colorSet: new Set(),
            currentColor: { r: 255, g: 255, b: 255 } // start white
          });
        }
      }
    }
    
    //----------------------------------------------------
    // COLOR MIXING
    //----------------------------------------------------
    function getMixedColor(colorSet) {
      // If no colors => white
      if (colorSet.size === 0) {
        return { r: 255, g: 255, b: 255 };
      }
      
      // If 'white' is present => pure white
      if (colorSet.has("white")) {
        return { r: 255, g: 255, b: 255 };
      }
      
      // Otherwise, sort the colors to form a key
      const sortedColors = Array.from(colorSet).sort().join(",");
      const hex = colorMap[sortedColors] || "#000000"; 
      
      return hexToRGB(hex);
    }
    
    function hexToRGB(hexStr) {
      if (hexStr[0] === '#') {
        hexStr = hexStr.slice(1);
      }
      const r = parseInt(hexStr.slice(0, 2), 16);
      const g = parseInt(hexStr.slice(2, 4), 16);
      const b = parseInt(hexStr.slice(4, 6), 16);
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
