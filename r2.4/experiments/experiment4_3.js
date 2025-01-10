window.initExperiment = function() {
  let darkMode = false;

  const sketch = (p) => {
    const GRID_ROWS = 20;
    const GRID_COLS = 30;
    const HOVER_RADIUS = 300;
    const WAVE_SPEED = 0.1;  // Speed of wave propagation
    const WAVE_AMPLITUDE = 100;  // Height of wave
    const WAVE_LENGTH = 500;  // Length of wave spread
    const WAVE_DECAY = 0.95;  // How quickly waves fade out

    let gridCells = [];
    let waveOrigins = [];  // Track where waves start
    
    p.setup = () => {
      let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.parent('canvas-container');
      initializeGrid();
    };

    p.draw = () => {
      p.clear();

      const strokeColor = darkMode ? 255 : 0;
      const fillColor = darkMode ? 0 : 255;
      const contrastColor = darkMode ? 255 : 0;

      // Update wave origins - fade them out over time
      for (let i = waveOrigins.length - 1; i >= 0; i--) {
        waveOrigins[i].strength *= WAVE_DECAY;
        if (waveOrigins[i].strength < 0.01) {
          waveOrigins.splice(i, 1);
        }
      }

      // Add new wave origin at mouse position if hovering
      if (p.mouseY > 0) {
        const hoverRow = Math.floor((p.mouseY - gridCells[0].y) / gridCells[0].h);
        if (hoverRow >= 0 && hoverRow < GRID_ROWS) {
          let exists = waveOrigins.some(w => w.row === hoverRow);
          if (!exists) {
            waveOrigins.push({
              row: hoverRow,
              time: p.frameCount,
              strength: 1.0
            });
          }
        }
      }

      // Draw grid with wave effect
      for (let cell of gridCells) {
        let { x, y, w, h } = cell;
        let row = Math.floor((y - gridCells[0].y) / h);
        
        let totalOffset = 0;

        // Calculate wave effect from all origins
        for (let wave of waveOrigins) {
          let rowDist = Math.abs(row - wave.row);
          let timeDiff = p.frameCount - wave.time;
          
          // Wave propagation
          let phase = (timeDiff * WAVE_SPEED) - (rowDist * 0.5);
          if (phase > 0) {
            let amplitude = WAVE_AMPLITUDE * wave.strength * 
                          Math.exp(-rowDist / WAVE_LENGTH);
            totalOffset += Math.sin(phase) * amplitude;
          }
        }

        // Draw contrast background if moving
        if (Math.abs(totalOffset) > 1) {
          p.stroke(strokeColor);
          p.fill(contrastColor);
          p.rect(x, y, w, h);
        }

        // Draw main cell with offset
        p.stroke(strokeColor);
        p.fill(fillColor);
        p.rect(x + totalOffset, y, w, h);
      }
    };

    function initializeGrid() {
      gridCells = [];
      waveOrigins = [];  // Reset wave origins on resize
      
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