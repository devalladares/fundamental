window.initExperiment = function() {
  let darkMode = false;
  
  const sketch = (p) => {
    const GRID_ROWS = 20;
    const GRID_COLS = 30;
    const HOVER_RADIUS = 1200;
    const ROTATION_SPEED = 0.05;
    const MAX_ROTATION = p.PI / 3;
    const ROTATION_FALLOFF = 1.5;
    
    // Color sequence - matching 4.5
    const COLORS = [
      darkMode ? "#FFFFFF" : "#000000",  // black/white based on mode
      "#1C30C8",  // blue
      "#E10000",  // red
      "#FFC832"   // yellow
    ];
    let currentColorIndex = 0;
    let currentContrastColor = COLORS[0];
    
    let gridCells = [];
    let isTransitioning = false;
    let transitionProgress = 0;
    
    p.setup = () => {
      let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.parent('canvas-container');
      p.frameRate(60);
      initializeGrid();
    };
    
    p.draw = () => {
      p.clear();  // Use clear() instead of background()

      // Update transition if active
      if (isTransitioning) {
        transitionProgress += 0.05;
        if (transitionProgress >= 1) {
          isTransitioning = false;
          transitionProgress = 0;
        }
      }
      
      for (let cell of gridCells) {
        let { x, y, w, h, rotation, targetRotation } = cell;
        let centerX = x + w / 2;
        let centerY = y + h / 2;
        
        // Calculate distance and angle from mouse
        let distance = p.dist(p.mouseX, p.mouseY, centerX, centerY);
        let angle = p.atan2(p.mouseY - centerY, p.mouseX - centerX);
        
        // Update rotation based on mouse distance and transition state
        if (distance <= HOVER_RADIUS || isTransitioning) {
          let rotationInfluence = p.map(distance, 0, HOVER_RADIUS, 1, 0);
          rotationInfluence = p.pow(rotationInfluence, ROTATION_FALLOFF);
          
          // Add wave effect during transition
          if (isTransitioning) {
            let distanceFromCenter = p.dist(p.width/2, p.height/2, centerX, centerY);
            let waveOffset = p.map(distanceFromCenter, 0, p.width, 0, p.PI);
            rotationInfluence = p.sin(transitionProgress * p.PI + waveOffset);
          }
          
          cell.targetRotation = angle * rotationInfluence * MAX_ROTATION;
        } else {
          cell.targetRotation = 0;
        }
        
        // Smoothly interpolate rotation
        cell.rotation = p.lerp(cell.rotation, cell.targetRotation, ROTATION_SPEED);
        
        // Draw background color if rotating
        if (Math.abs(cell.rotation) > 0.01) {
          p.push();
          p.translate(centerX, centerY);
          p.noStroke();
          p.fill(currentContrastColor);
          p.rect(-w/2, -h/2, w, h);
          p.pop();
        }
        
        // Draw the rotating square
        p.push();
        p.translate(centerX, centerY);
        p.rotate(cell.rotation);
        p.stroke(darkMode ? 255 : 0);
        p.strokeWeight(1);
        p.fill(darkMode ? 0 : 255);
        p.rect(-w/2, -h/2, w, h);
        p.pop();
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
          gridCells.push({ 
            x, y, w, h,
            rotation: 0,
            targetRotation: 0
          });
        }
      }
    }
    
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      initializeGrid();
    };
    
    p.mouseClicked = () => {
      if (p.mouseY > gridCells[0].y && !isTransitioning) {
        isTransitioning = true;
        transitionProgress = 0;
        currentColorIndex = (currentColorIndex + 1) % COLORS.length;
        COLORS[0] = darkMode ? "#FFFFFF" : "#000000";
        currentContrastColor = COLORS[currentColorIndex];
      }
    };
  };
  
  const p5Instance = new p5(sketch);
  
  p5Instance.setDarkMode = function(mode) {
    darkMode = mode;
    COLORS[0] = mode ? "#FFFFFF" : "#000000";
    currentContrastColor = COLORS[currentColorIndex];
  };
  
  return p5Instance;
};