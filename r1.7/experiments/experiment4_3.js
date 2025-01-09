//----------------------------------------------------
// Chaotic Grid on Hover Experiment in p5.js
//----------------------------------------------------

window.initExperiment = function() {
    const sketch = (p) => {
      //----------------------------------------------------
      // Top-Level Variables
      //----------------------------------------------------
      // Grid Configuration
      const GRID_ROWS          = 20;
      const GRID_COLS          = 30;
      
      // Wiggle Configuration
      const WIGGLE_STRENGTH    = 15;       // Maximum wiggle offset in pixels
      const WIGGLE_FREQ        = 0.025;    // Frequency of noise-based wiggle
      
      // Grid Line Styling
      const GRID_STROKE_COLOR  = 0;       // Black color for grid lines
      const GRID_STROKE_WEIGHT = 1;       // Thickness of grid lines
      
      // Hover Configuration
      const HOVER_RADIUS       = 500;      // Radius in pixels to trigger wiggle
      
      // Array to store grid cells
      let gridCells = [];
      
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
        
        // Draw the grid
        for (let cell of gridCells) {
          let { x, y, w, h } = cell;
          
          // Calculate the center of the cell
          let centerX = x + w / 2;
          let centerY = y + h / 2;
          
          // Calculate distance from mouse to cell center
          let distance = p.dist(p.mouseX, p.mouseY, centerX, centerY);
          
          // Determine if the mouse is within the hover radius
          let isHovered = distance <= HOVER_RADIUS;
          
          // Temporary variables for drawing
          let drawX = x;
          let drawY = y;
          
          if (isHovered) {
            // Calculate noise-based offset for a wiggly effect
            let n = p.noise(
              x * 0.01, 
              y * 0.01, 
              p.frameCount * WIGGLE_FREQ
            );
            let offset = p.map(n, 0, 1, -WIGGLE_STRENGTH, WIGGLE_STRENGTH);
            
            drawX += offset;
            drawY += offset;
          }
          
          // Draw cell with stroke
          p.stroke(GRID_STROKE_COLOR);
          p.strokeWeight(GRID_STROKE_WEIGHT);
          p.fill(255);
          p.rect(drawX, drawY, w, h);
        }
      };
      
      //----------------------------------------------------
      // Grid Setup
      //----------------------------------------------------
      function initializeGrid() {
        gridCells = [];
        
        let cellW = p.width / GRID_COLS;
        let cellH = p.height / GRID_ROWS;
        
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            let x = c * cellW;
            let y = r * cellH;
            // Handle last row/col fractional space
            let w = (c === GRID_COLS - 1) ? p.width - x : cellW;
            let h = (r === GRID_ROWS - 1) ? p.height - y : cellH;
            gridCells.push({ x, y, w, h });
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
  