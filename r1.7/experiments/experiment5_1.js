//----------------------------------------------------
// Customized Minesweeper in p5.js (Instance Mode)
//----------------------------------------------------
window.initExperiment = function() {
    const sketch = (p) => {
  
      //----------------------------------------------------
      // Adjustable Variables (Tweak as Desired)
      //----------------------------------------------------
      const ROWS           = 12;
      const COLS           = 20;
      const MINE_COUNT     = 40;
      const STROKE_WEIGHT  = 0.5;     // thicker grid lines
  
      // Cell size (computed in setup)
      let cellW, cellH;
  
      // Colors for adjacency counts
      // 1 => Blue, 2 => Green, 3 => Red, and so on
      const adjacencyColors = {
        1: "#1C30C8",  // Blue
        2: "#12B100",  // Green
        3: "#E10000",  // Red
        4: "#B103E6",  // Purple
        5: "#FB8805",  // Orange
        6: "#FFC832",  // Yellow
        7: "#666666",  // Gray
        8: "#000000"   // Black (can be dramatic if you want)
      };
  
      //----------------------------------------------------
      // Internal Board Setup
      //----------------------------------------------------
      let board = [];       // 2D array of cells
      let gameOver  = false;
      let firstClick = true;
  
      //----------------------------------------------------
      // p5 Setup
      //----------------------------------------------------
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
  
        // Compute cell size
        cellW = p.width / COLS;
        cellH = p.height / ROWS;
  
        // Initialize board (empty, no mines yet)
        for (let r = 0; r < ROWS; r++) {
          board[r] = [];
          for (let c = 0; c < COLS; c++) {
            board[r][c] = createCell(r, c);
          }
        }
      };
  
      //----------------------------------------------------
      // p5 Draw
      //----------------------------------------------------
      p.draw = () => {
        p.background(220);
  
        // Draw each cell
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            drawCell(board[r][c]);
          }
        }
  
        // If game over, overlay text
        if (gameOver) {
          p.fill(0, 150);
          p.rect(0, 0, p.width, p.height);
          p.fill(255);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(48);
          p.text("Game Over!", p.width / 2, p.height / 2);
        }
      };
  
      //----------------------------------------------------
      // Mouse Interaction
      //----------------------------------------------------
      p.mousePressed = () => {
        if (gameOver) return;
  
        // Identify which cell
        let c = p.floor(p.mouseX / cellW);
        let r = p.floor(p.mouseY / cellH);
        if (!inBounds(r, c)) return;
  
        // On first click, place mines (ensuring (r,c) is safe)
        if (firstClick) {
          placeMines(r, c);
          computeAdjacents();
          firstClick = false;
        }
  
        // Left-click => reveal
        if (p.mouseButton === p.LEFT) {
          revealCell(r, c);
        }
        // Right-click => toggle flag
        else if (p.mouseButton === p.RIGHT) {
          toggleFlag(r, c);
        }
      };
  
      // Prevent default context menu on right-click
      p.mouseReleased = (evt) => {
        if (evt.button === 2) {
          evt.preventDefault();
        }
      };
  
      //----------------------------------------------------
      // Cell Creation & Board Logic
      //----------------------------------------------------
      function createCell(r, c) {
        return {
          r, c,
          x: c * cellW,
          y: r * cellH,
          w: cellW,
          h: cellH,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentCount: 0
        };
      }
  
      // Place mines randomly, skipping the cell (safeR, safeC).
      function placeMines(safeR, safeC) {
        let candidates = [];
        for (let rr = 0; rr < ROWS; rr++) {
          for (let cc = 0; cc < COLS; cc++) {
            if (rr === safeR && cc === safeC) continue;
            candidates.push({ r: rr, c: cc });
          }
        }
        shuffleArray(candidates);
        for (let i = 0; i < MINE_COUNT && i < candidates.length; i++) {
          let { r, c } = candidates[i];
          board[r][c].isMine = true;
        }
      }
  
      // Count adjacent mines for each cell
      function computeAdjacents() {
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (board[r][c].isMine) {
              board[r][c].adjacentCount = -1; // marker
            } else {
              board[r][c].adjacentCount = countAdjacentMines(r, c);
            }
          }
        }
      }
  
      function countAdjacentMines(r, c) {
        let total = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            let nr = r + dr;
            let nc = c + dc;
            if (inBounds(nr, nc) && board[nr][nc].isMine) {
              total++;
            }
          }
        }
        return total;
      }
  
      // Reveal cell; if mine => gameOver
      // If no adjacent mines => flood fill
      function revealCell(r, c) {
        let cell = board[r][c];
        if (cell.isFlagged || cell.isRevealed) return;
  
        cell.isRevealed = true;
        if (cell.isMine) {
          gameOver = true;
          return;
        }
  
        if (cell.adjacentCount === 0) {
          // flood fill
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              let nr = r + dr;
              let nc = c + dc;
              if (inBounds(nr, nc)) {
                revealCell(nr, nc);
              }
            }
          }
        }
      }
  
      function toggleFlag(r, c) {
        let cell = board[r][c];
        if (cell.isRevealed) return;
        cell.isFlagged = !cell.isFlagged;
      }
  
      //----------------------------------------------------
      // Drawing the Board
      //----------------------------------------------------
      function drawCell(cell) {
        // Grid outline
        p.stroke(0);
        p.strokeWeight(STROKE_WEIGHT);
  
        // Cell background
        if (!cell.isRevealed) {
          // Covered cell
          if (cell.isFlagged) {
            // Red flag
            p.fill(255, 0, 0);
            p.rect(cell.x, cell.y, cell.w, cell.h);
  
            // Optional: draw a small triangle if you like
            p.fill(0);
            p.noStroke();
            let cx = cell.x + cell.w / 2;
            let cy = cell.y + cell.h / 2;
            p.triangle(
              cx, cy - cell.h / 4,
              cx - cell.w / 5, cy + cell.h / 6,
              cx + cell.w / 5, cy + cell.h / 6
            );
          } else {
            // Gray cover
            p.fill(180);
            p.rect(cell.x, cell.y, cell.w, cell.h);
          }
        } 
        else {
          // Revealed
          if (cell.isMine) {
            // Black circle for mine
            p.fill(230);
            p.rect(cell.x, cell.y, cell.w, cell.h);
  
            p.fill(0);
            p.noStroke();
            p.ellipse(cell.x + cell.w / 2, cell.y + cell.h / 2, cell.w * 0.3, cell.h * 0.3);
          } else {
            // Safe cell => show adjacency
            p.fill(230);
            p.rect(cell.x, cell.y, cell.w, cell.h);
  
            if (cell.adjacentCount > 0) {
              p.fill(adjacencyColors[cell.adjacentCount] || "#000000");
              p.textAlign(p.CENTER, p.CENTER);
              p.textSize(14);
              p.text(cell.adjacentCount, cell.x + cell.w / 2, cell.y + cell.h / 2);
            }
          }
        }
      }
  
      //----------------------------------------------------
      // Utilities
      //----------------------------------------------------
      function inBounds(r, c) {
        return r >= 0 && r < ROWS && c >= 0 && c < COLS;
      }
  
      // Fisher-Yates shuffle
      function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
          let j = p.floor(p.random(i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      }
  
      //----------------------------------------------------
      // Handle Window Resize
      //----------------------------------------------------
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        cellW = p.width / COLS;
        cellH = p.height / ROWS;
        // Update each cell’s coords
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            let cell = board[r][c];
            cell.x = c * cellW;
            cell.y = r * cellH;
            cell.w = cellW;
            cell.h = cellH;
          }
        }
      };
    };
  
    // Return new p5 instance
    return new p5(sketch);
  };
  