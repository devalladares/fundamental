window.initExperiment = function() {
    let darkMode = false;
  
    const sketch = (p) => {
      const GRID_ROWS = 15;
      const GRID_COLS = 30;
      const HOVER_RADIUS = 300;
      const WIGGLE_STRENGTH = 150;
      const WIGGLE_FREQ = 0.015;
      const GRID_STROKE_WEIGHT = 1;
  
      let gridCells = [];
      
      p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent('canvas-container');
        initializeGrid();
      };
  
      p.draw = () => {
        p.clear();
  
        const strokeColor = darkMode ? 255 : 0;
        const fillColor = darkMode ? 0 : 255;
        const contrastColor = darkMode ? 255 : 0; // Contrast color for underneath
  
        for (let cell of gridCells) {
          let { x, y, w, h } = cell;
          let centerX = x + w / 2;
          let centerY = y + h / 2;
  
          let distance = p.dist(p.mouseX, p.mouseY, centerX, centerY);
          let isHovered = distance <= HOVER_RADIUS;
  
          let drawX = x;
          let drawY = y;
  
          if (isHovered) {
            let n = p.noise(
              x * 0.01,
              y * 0.01,
              p.frameCount * WIGGLE_FREQ
            );
            let offset = p.map(n, 0, 1, -WIGGLE_STRENGTH, WIGGLE_STRENGTH);
            drawX += offset;
            drawY += offset;
  
            // Draw contrasting rectangle underneath
            p.stroke(strokeColor);
            p.strokeWeight(GRID_STROKE_WEIGHT);
            p.fill(contrastColor);
            p.rect(x, y, w, h);
          }
  
          // Draw main rectangle
          p.stroke(strokeColor);
          p.strokeWeight(GRID_STROKE_WEIGHT);
          p.fill(fillColor);
          p.rect(drawX, drawY, w, h);
        }
      };
  
      function initializeGrid() {
        gridCells = [];
        
        const logo = document.getElementById('logo');
        const logoHeight = logo ? logo.clientHeight : 0;
        const viewportHeight = window.innerHeight;
        const startY = (logoHeight / viewportHeight) * p.height;
        
        let cellW = p.width / GRID_COLS;
        let cellH = (p.height - startY) / GRID_ROWS;
  
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            let x = c * cellW;
            let y = startY + (r * cellH);
            let w = (c === GRID_COLS - 1) ? p.width - x : cellW;
            let h = (r === GRID_ROWS - 1) ? p.height - y : cellH;
            gridCells.push({ x, y, w, h });
          }
        }
      }
  
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        initializeGrid();
      };
    };
  
    const p5Instance = new p5(sketch);
  
    p5Instance.setDarkMode = function(mode) {
      darkMode = mode;
    };
  
    return p5Instance;
  };