window.initExperiment = function() {
  let darkMode = false;
  
  const sketch = (p) => {
    const GRID_ROWS = 20;
    const GRID_COLS = 30;
    const JUMP_SPEED = 0.02;
    const RETURN_SPEED = 0.04;
    const MAX_JUMP_DISTANCE = 100;
    
    const COLORS = [
      "#1C30C8",  // blue
      "#E10000",  // red
      "#FFC832"   // yellow
    ];
    
    let gridCells = [];
    let activeAnimations = new Set();
    
    p.setup = () => {
      let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.parent('canvas-container');
      p.frameRate(60);
      initializeGrid();
    };
    
    p.draw = () => {
      p.clear();
      
      for (let cell of gridCells) {
        if (cell.isJumping || cell.isReturning) {
          // Update animation progress
          if (cell.isJumping) {
            cell.progress += JUMP_SPEED;
            if (cell.progress >= 1) {
              cell.isJumping = false;
              cell.isReturning = true;
              cell.progress = 0;
            }
          } else if (cell.isReturning) {
            cell.progress += RETURN_SPEED;
            if (cell.progress >= 1) {
              cell.isReturning = false;
              cell.progress = 0;
              activeAnimations.delete(cell);
            }
          }
          
          // Calculate current position
          let startX = cell.isReturning ? cell.jumpX : cell.originalX;
          let startY = cell.isReturning ? cell.jumpY : cell.originalY;
          let endX = cell.isReturning ? cell.originalX : cell.jumpX;
          let endY = cell.isReturning ? cell.originalY : cell.jumpY;
          
          let currentX = p.lerp(startX, endX, cell.progress);
          let currentY = p.lerp(startY, endY, cell.progress);
          
          // Add slight arc
          let arcHeight = -30 * p.sin(cell.progress * p.PI);
          currentY += arcHeight;
          
          // Draw jumping cell
          p.stroke(darkMode ? 255 : 0);
          p.strokeWeight(1);
          p.fill(cell.isJumping ? cell.jumpColor : p.lerpColor(
            p.color(cell.jumpColor), 
            p.color(darkMode ? 0 : 255), 
            cell.progress
          ));
          p.rect(currentX, currentY, cell.w, cell.h);
          
        } else {
          // Draw static cell
          p.stroke(darkMode ? 255 : 0);
          p.strokeWeight(1);
          p.fill(darkMode ? 0 : 255);
          p.rect(cell.originalX, cell.originalY, cell.w, cell.h);
        }
      }
    };
    
    function triggerJump(cell) {
      if (!cell.isJumping && !cell.isReturning && activeAnimations.size < 20) {
        cell.isJumping = true;
        cell.progress = 0;
        
        // Calculate jump target while maintaining some grid alignment
        let gridSnapX = p.width / GRID_COLS;
        let gridSnapY = (p.height - gridCells[0].originalY) / GRID_ROWS;
        
        let angle = p.random(p.TWO_PI);
        let distance = p.random(50, MAX_JUMP_DISTANCE);
        
        cell.jumpX = cell.originalX + Math.round(p.cos(angle) * distance / gridSnapX) * gridSnapX;
        cell.jumpY = cell.originalY + Math.round(p.sin(angle) * distance / gridSnapY) * gridSnapY;
        
        // Keep within bounds
        cell.jumpX = p.constrain(cell.jumpX, 0, p.width - cell.w);
        cell.jumpY = p.constrain(cell.jumpY, cell.originalY, p.height - cell.h);
        
        cell.jumpColor = p.random(COLORS);
        activeAnimations.add(cell);
        
        // Trigger nearby cells in a more orderly pattern
        let col = Math.floor((cell.originalX + cell.w/2) / (p.width / GRID_COLS));
        let row = Math.floor((cell.originalY - gridCells[0].originalY + cell.h/2) / 
                           ((p.height - gridCells[0].originalY) / GRID_ROWS));
        
        // Trigger neighbors with slight delay
        setTimeout(() => {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              
              let newRow = row + dr;
              let newCol = col + dc;
              
              if (newRow >= 0 && newRow < GRID_ROWS && 
                  newCol >= 0 && newCol < GRID_COLS) {
                let neighbor = gridCells[newRow * GRID_COLS + newCol];
                if (p.random() < 0.3) { // 30% chance to trigger neighbor
                  setTimeout(() => triggerJump(neighbor), p.random(100, 300));
                }
              }
            }
          }
        }, 100);
      }
    }
    
    function initializeGrid() {
      gridCells = [];
      activeAnimations.clear();
      
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
            originalX: x,
            originalY: y,
            w, h,
            isJumping: false,
            isReturning: false,
            progress: 0
          });
        }
      }
    }
    
    p.mousePressed = () => {
      if (p.mouseY > gridCells[0].originalY) {
        let closest = null;
        let minDist = Infinity;
        
        for (let cell of gridCells) {
          let d = p.dist(p.mouseX, p.mouseY, 
                        cell.originalX + cell.w/2, 
                        cell.originalY + cell.h/2);
          if (d < minDist) {
            minDist = d;
            closest = cell;
          }
        }
        
        if (closest) {
          triggerJump(closest);
        }
      }
    };
    
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