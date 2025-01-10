window.initExperiment = () => {
  let darkMode = false;
  
  const sketch = (p) => {
    const GRID_ROWS = 12;
    const GRID_COLS = 21;
    const PREVIEW_SIZE = 4;
    
    const BASE_COLORS = ["blue", "red", "yellow"];
    const colorMap = {
      "blue": "#1C20C8",
      "red": "#E10000",
      "yellow": "#FFC832",
      "blue,red": "#B103E6",
      "blue,yellow": "#12B100",
      "red,yellow": "#FB8805",
      "blue,red,yellow": "#000000"
    };
    
    const TETROMINOES = {
      I: [[1,1,1,1]],
      O: [[1,1],
          [1,1]],
      T: [[0,1,0],
          [1,1,1]],
      S: [[0,1,1],
          [1,1,0]],
      Z: [[1,1,0],
          [0,1,1]],
      J: [[1,0,0],
          [1,1,1]],
      L: [[0,0,1],
          [1,1,1]]
    };

    let grid = [];
    let cellSize;
    let currentPiece = null;
    let nextPiece = null;
    let gameOver = false;
    let lastDropTime = 0;
    let dropInterval = 300;
    let score = 0;
    let mouseXGrid = 0;
    let lastMouseX = 0;

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      initializeGame();
    };

    function initializeGame() {
      // Calculate cell size based on actual viewport height
      cellSize = Math.floor(p.height / GRID_ROWS);
      grid = Array(GRID_ROWS).fill().map(() => 
        Array(GRID_COLS).fill().map(() => ({
          occupied: false,
          colors: new Set()
        }))
      );
      nextPiece = createNewPiece();
      spawnNewPiece();
      gameOver = false;
      score = 0;
      lastDropTime = p.millis();
    }

    function createNewPiece() {
      const types = Object.keys(TETROMINOES);
      const type = types[Math.floor(p.random(types.length))];
      const color = BASE_COLORS[Math.floor(p.random(BASE_COLORS.length))];
      return {
        shape: TETROMINOES[type],
        color: color,
        x: Math.floor((GRID_COLS - TETROMINOES[type][0].length) / 2),
        y: 0
      };
    }

    function spawnNewPiece() {
      currentPiece = nextPiece;
      nextPiece = createNewPiece();
      if (pieceCollides(currentPiece)) {
        gameOver = true;
      }
    }

    function pieceCollides(piece) {
      const shape = piece.shape;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const gridX = piece.x + x;
            const gridY = piece.y + y;
            if (gridX < 0 || gridX >= GRID_COLS || 
                gridY >= GRID_ROWS ||
                (gridY >= 0 && grid[gridY][gridX].occupied)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function rotatePiece() {
      if (!currentPiece) return;
      const shape = currentPiece.shape;
      const newShape = Array(shape[0].length).fill()
        .map(() => Array(shape.length).fill(0));
      
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          newShape[x][shape.length - 1 - y] = shape[y][x];
        }
      }
      
      const originalShape = currentPiece.shape;
      currentPiece.shape = newShape;
      
      if (pieceCollides(currentPiece)) {
        currentPiece.shape = originalShape;
      }
    }

    function lockPiece() {
      const shape = currentPiece.shape;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const gridY = currentPiece.y + y;
            const gridX = currentPiece.x + x;
            if (gridY >= 0) {
              grid[gridY][gridX].occupied = true;
              grid[gridY][gridX].colors.add(currentPiece.color);
            }
          }
        }
      }
      checkLines();
      spawnNewPiece();
    }

    function checkLines() {
      for (let y = GRID_ROWS - 1; y >= 0; y--) {
        if (grid[y].every(cell => cell.occupied)) {
          grid.splice(y, 1);
          grid.unshift(Array(GRID_COLS).fill().map(() => ({
            occupied: false,
            colors: new Set()
          })));
          score += 100;
          y++; // Recheck the same line
        }
      }
    }

    p.draw = () => {
      p.clear();
      const boardWidth = GRID_COLS * cellSize;
      const offsetX = (p.width - boardWidth) / 2;
      
      p.push();
      p.translate(offsetX, 0); // Remove vertical offset
      
      p.noFill();
      p.stroke(darkMode ? 255 : 0);
      p.rect(0, 0, boardWidth, GRID_ROWS * cellSize);
      
      drawGrid();
      if (currentPiece && !gameOver) {
        drawPiece(currentPiece);
      }
      
      if (gameOver) {
        p.fill(darkMode ? 255 : 0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(40);
        p.text('GAME OVER', boardWidth/2, GRID_ROWS * cellSize/2);
      } else {
        updateGame();
      }
      p.pop();
    };

    function drawGrid() {
      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          const cell = grid[y][x];
          p.stroke(darkMode ? 255 : 0);
          p.strokeWeight(1);
          if (cell.occupied) {
            const color = getMixedColorFromSet(cell.colors);
            p.fill(color.r, color.g, color.b);
          } else {
            p.noFill();
          }
          p.rect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    function drawPiece(piece) {
      const color = getMixedColorFromSet(new Set([piece.color]));
      p.fill(color.r, color.g, color.b);
      p.stroke(darkMode ? 255 : 0);
      const shape = piece.shape;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            p.rect(
              (piece.x + x) * cellSize,
              (piece.y + y) * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }
    }

    function drawNextPiece() {
      if (!nextPiece) return;
      const previewX = (GRID_COLS + 1) * cellSize;
      const previewY = 100;
      
      p.push();
      p.translate(previewX, previewY);
      
      p.noFill();
      p.stroke(darkMode ? 255 : 0);
      p.rect(0, 0, PREVIEW_SIZE * cellSize, PREVIEW_SIZE * cellSize);
      
      const color = getMixedColorFromSet(new Set([nextPiece.color]));
      p.fill(color.r, color.g, color.b);
      
      const shape = nextPiece.shape;
      const offsetX = (PREVIEW_SIZE - shape[0].length) / 2;
      const offsetY = (PREVIEW_SIZE - shape.length) / 2;
      
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            p.rect(
              (offsetX + x) * cellSize,
              (offsetY + y) * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }
      p.pop();
    }

    function updateGame() {
      mouseXGrid = Math.floor((p.mouseX - ((p.width - GRID_COLS * cellSize) / 2)) / cellSize);
      
      if (mouseXGrid !== lastMouseX) {
        const dx = mouseXGrid > lastMouseX ? 1 : -1;
        currentPiece.x += dx;
        if (pieceCollides(currentPiece)) {
          currentPiece.x -= dx;
        }
        lastMouseX = mouseXGrid;
      }
      
      if (p.millis() - lastDropTime > dropInterval) {
        currentPiece.y++;
        if (pieceCollides(currentPiece)) {
          currentPiece.y--;
          lockPiece();
        }
        lastDropTime = p.millis();
      }
    }

    function getMixedColorFromSet(colorSet) {
      if (colorSet.size === 0) {
        return darkMode ? {r: 0, g: 0, b: 0} : {r: 255, g: 255, b: 255};
      }
      const sorted = Array.from(colorSet).sort().join(",");
      const hex = colorMap[sorted] || (darkMode ? "#FFFFFF" : "#000000");
      return hexToRGB(hex);
    }

    function hexToRGB(hex) {
      hex = hex.replace("#", "");
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }

    p.mousePressed = () => {
      if (!gameOver && p.mouseButton === p.LEFT) {
        rotatePiece();
      }
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      cellSize = Math.floor(p.height / (GRID_ROWS + 2));
    };

    p.setDarkMode = (mode) => {
      darkMode = mode;
    };
  };

  const p5Instance = new p5(sketch);
  p5Instance.setDarkMode = (mode) => darkMode = mode;
  return p5Instance;
};