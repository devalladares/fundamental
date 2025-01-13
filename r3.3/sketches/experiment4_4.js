window.initExperiment = function() {
  let darkMode = false;

  const sketch = (p) => {
    const GRID_ROWS = 15;
    const GRID_COLS = 25;
    const WAVE_SPEED = 0.12;
    const WAVE_AMPLITUDE = 45;
    const WAVE_LENGTH = 800;
    const WAVE_DECAY = 0.985;
    
    let gridCells = [];
    let waveOrigins = [];
    
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

      for (let i = waveOrigins.length - 1; i >= 0; i--) {
        waveOrigins[i].strength *= WAVE_DECAY;
        if (waveOrigins[i].strength < 0.01) {
          waveOrigins.splice(i, 1);
        }
      }

      if (p.mouseX > 0) {
        const hoverCol = Math.floor(p.mouseX / gridCells[0].w);
        if (hoverCol >= 0 && hoverCol < GRID_COLS) {
          let exists = waveOrigins.some(w => w.col === hoverCol);
          if (!exists) {
            waveOrigins.push({
              col: hoverCol,
              time: p.frameCount,
              strength: 1.0
            });
          }
        }
      }

      for (let cell of gridCells) {
        let { x, y, w, h } = cell;
        let col = Math.floor(x / w);
        
        let totalOffset = 0;

        for (let wave of waveOrigins) {
          let colDist = Math.abs(col - wave.col);
          let timeDiff = p.frameCount - wave.time;
          
          let phase = (timeDiff * WAVE_SPEED) - (colDist * 0.5);
          if (phase > 0) {
            let amplitude = WAVE_AMPLITUDE * wave.strength * 
                          Math.exp(-colDist / WAVE_LENGTH);
            totalOffset += Math.sin(phase) * amplitude;
          }
        }

        if (Math.abs(totalOffset) > 1) {
          p.stroke(strokeColor);
          p.fill(contrastColor);
          p.rect(x, y, w, h);
        }

        p.stroke(strokeColor);
        p.fill(fillColor);
        p.rect(x, y + totalOffset, w, h);  // Apply offset to y instead of x
      }
    };

    function initializeGrid() {
      gridCells = [];
      waveOrigins = [];
      
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