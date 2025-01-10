window.initExperiment = function() {
  let darkMode = false;

  const sketch = (p) => {
    const GRID_ROWS = 15;
    const GRID_COLS = 30;
    const WAVE_SPEED = 0.1;
    const WAVE_AMPLITUDE = 80;
    const MAX_WAVE_RADIUS = 500;
    const WAVE_DECAY = 0.96;
    const HOVER_RADIUS = 250;
    const HOVER_STRENGTH = 0.3; // Subtler hover effect

    // Color palette with black/white
    const COLORS = [
      darkMode ? "#FFFFFF" : "#000000",  // black/white based on mode
      "#1C30C8",  // blue
      "#E10000",  // red
      "#FFC832"   // yellow
    ];
    let currentColorIndex = 0;
    let currentContrastColor = COLORS[0];

    let gridCells = [];
    let waveOrigins = [];
    let lastMouseX = 0;
    let lastMouseY = 0;
    
    p.setup = () => {
      let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.parent('canvas-container');
      initializeGrid();
      p.frameRate(60);
    };

    p.draw = () => {
      p.clear();

      const strokeColor = darkMode ? 255 : 0;
      const fillColor = darkMode ? 0 : 255;

      // Add subtle hover ripples
      if (p.mouseY > gridCells[0].y && 
          (p.abs(p.mouseX - lastMouseX) > 3 || p.abs(p.mouseY - lastMouseY) > 3)) {
        waveOrigins.push({
          x: p.mouseX,
          y: p.mouseY,
          time: p.frameCount,
          strength: HOVER_STRENGTH,
          isHover: true
        });
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;
      }

      // Update waves
      for (let i = waveOrigins.length - 1; i >= 0; i--) {
        waveOrigins[i].strength *= WAVE_DECAY;
        if (waveOrigins[i].strength < 0.01) waveOrigins.splice(i, 1);
      }

      // Add click waves (stronger)
      if (p.mouseIsPressed && p.mouseY > gridCells[0].y) {
        waveOrigins.push({
          x: p.mouseX,
          y: p.mouseY,
          time: p.frameCount,
          strength: 1.0,
          isHover: false
        });
      }

      // Draw grid with wave effects
      for (let cell of gridCells) {
        let { x, y, w, h } = cell;
        let centerX = x + w/2;
        let centerY = y + h/2;
        
        let totalOffsetX = 0;
        let totalOffsetY = 0;

        // Calculate wave effects
        for (let wave of waveOrigins) {
          let dx = centerX - wave.x;
          let dy = centerY - wave.y;
          let distSq = dx * dx + dy * dy;
          
          if (distSq < MAX_WAVE_RADIUS * MAX_WAVE_RADIUS) {
            let dist = p.sqrt(distSq);
            let timeDiff = p.frameCount - wave.time;
            let phase = (timeDiff * WAVE_SPEED) - (dist * 0.02);
            
            if (phase > 0) {
              let amplitude = WAVE_AMPLITUDE * wave.strength * 
                            (1 - dist/MAX_WAVE_RADIUS);
              let waveEffect = p.sin(phase) * amplitude;
              
              let angle = p.atan2(dy, dx);
              totalOffsetX += waveEffect * p.cos(angle);
              totalOffsetY += waveEffect * p.sin(angle);
            }
          }
        }

        // Draw contrast background if moving
        if (p.abs(totalOffsetX) > 1 || p.abs(totalOffsetY) > 1) {
          p.stroke(strokeColor);
          p.fill(currentContrastColor);
          p.rect(x, y, w, h);
        }

        // Draw main cell with offset
        p.stroke(strokeColor);
        p.fill(fillColor);
        p.rect(x + totalOffsetX, y + totalOffsetY, w, h);
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

    // Cycle colors on click: black/white -> blue -> red -> yellow -> black/white
    p.mouseClicked = () => {
      if (p.mouseY > gridCells[0].y) {
        currentColorIndex = (currentColorIndex + 1) % COLORS.length;
        // Update the first color based on dark mode
        COLORS[0] = darkMode ? "#FFFFFF" : "#000000";
        currentContrastColor = COLORS[currentColorIndex];
      }
    };
  };

  const p5Instance = new p5(sketch);

  p5Instance.setDarkMode = function(mode) {
    darkMode = mode;
    // Update the black/white color when dark mode changes
    COLORS[0] = mode ? "#FFFFFF" : "#000000";
    currentContrastColor = COLORS[currentColorIndex];
  };

  return p5Instance;
};