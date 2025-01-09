//----------------------------------------------------
// Grid-Based Pong with Color-Mixing & Mouse Control
// p5.js Instance Mode
//----------------------------------------------------
window.initExperiment = function() {
    const sketch = (p) => {
      //----------------------------------------------------
      // Top-Level Variables (Tweak as desired)
      //----------------------------------------------------
      const GRID_ROWS = 20;
      const GRID_COLS = 40;
  
      // Paddles
      const PADDLE_HEIGHT_CELLS = 6;
      const PADDLE_SPEED = 1;    // Factor for how quickly paddles move per mouse movement
  
      // Ball
      const BALL_SIZE_FACTOR = 0.8; // fraction of cell width/height
      const BALL_SPEED = 7;
  
      // Color cycling for the ball
      const BALL_COLORS = ["blue", "red", "yellow"];
  
      // The color map you provided
      const colorMap = {
        "blue":               "#1C20C8",
        "red":                "#E10000",
        "yellow":             "#FFC832",
        "blue,red":           "#B103E6",
        "blue,yellow":        "#12B100",
        "red,yellow":         "#FB8805",
        "blue,red,yellow":    "#000000"
      };
  
      //----------------------------------------------------
      // Internal Data Structures
      //----------------------------------------------------
      // Each cell will store a Set of base colors (e.g. {"blue"}, {"red","yellow"}, etc.)
      // We'll compute the displayed color from that set.
      let grid = []; // grid[r][c] => Set of color strings
  
      // We’ll store the cell size
      let cellW, cellH;
  
      // Ball state
      let ballX, ballY;    // Ball position in pixels
      let ballVx, ballVy;  // Ball velocity
      let ballColorIndex = 0; // which color in BALL_COLORS the ball currently has
      let ballColor = "blue"; // start color
  
      // Paddles
      // Each paddle covers exactly 1 column in width (cellW),
      // and PADDLE_HEIGHT_CELLS in height (cellH * PADDLE_HEIGHT_CELLS).
      let leftPaddleY, rightPaddleY;
      const paddleXOffset = 0;  // left edge at x=0, right edge at x=width - cellW
  
      //----------------------------------------------------
      // p5 Setup
      //----------------------------------------------------
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        initializeGrid();
        resetBall();
  
        // Initialize paddle positions to center
        leftPaddleY = (p.height - (PADDLE_HEIGHT_CELLS * cellH)) / 2;
        rightPaddleY = (p.height - (PADDLE_HEIGHT_CELLS * cellH)) / 2;
      };
  
      //----------------------------------------------------
      // p5 Draw
      //----------------------------------------------------
      p.draw = () => {
        // 1) White background
        p.background(255);
  
        // 2) Draw the grid with black 1px strokes
        p.stroke(0);
        p.strokeWeight(1);
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            // Convert colorSet to final color
            let cellColor = getMixedColorFromSet(grid[r][c]);
            p.fill(cellColor.r, cellColor.g, cellColor.b);
  
            let x = c * cellW;
            let y = r * cellH;
            p.rect(x, y, cellW, cellH);
          }
        }
  
        // 3) Move paddles based on mouse movement
        movePaddles();
  
        // 4) Draw paddles (gray fill, black stroke)
        p.stroke(0);
        p.fill(200);
        // Left paddle
        let leftPaddleX = paddleXOffset;
        p.rect(leftPaddleX, leftPaddleY, cellW, PADDLE_HEIGHT_CELLS * cellH);
        // Right paddle
        let rightPaddleX = p.width - paddleXOffset - cellW;
        p.rect(rightPaddleX, rightPaddleY, cellW, PADDLE_HEIGHT_CELLS * cellH);
  
        // 5) Update the ball
        updateBall();
  
        // 6) Draw the ball (square)
        p.fill(0); // black square for the ball (or you could map 'ballColor' to a hex from colorMap)
        let halfSize = (cellW * BALL_SIZE_FACTOR) / 2;
        p.rect(ballX - halfSize, ballY - halfSize, cellW * BALL_SIZE_FACTOR, cellW * BALL_SIZE_FACTOR);
      };
  
      //----------------------------------------------------
      // Initialize the Grid
      //----------------------------------------------------
      function initializeGrid() {
        grid = [];
        cellW = p.width / GRID_COLS;
        cellH = p.height / GRID_ROWS;
  
        for (let r = 0; r < GRID_ROWS; r++) {
          grid[r] = [];
          for (let c = 0; c < GRID_COLS; c++) {
            // Start with an empty Set (no color)
            grid[r][c] = new Set();
          }
        }
      }
  
      //----------------------------------------------------
      // Reset the Ball (center + random velocity)
      // Always ensure we have some vertical velocity
      //----------------------------------------------------
      function resetBall() {
        ballX = p.width / 2;
        ballY = p.height / 2;
  
        // Random horizontal direction
        ballVx = p.random() < 0.5 ? -BALL_SPEED : BALL_SPEED;
  
        // Force at least some non-zero vertical velocity
        do {
          ballVy = p.random(-BALL_SPEED / 2, BALL_SPEED / 2);
        } while (Math.abs(ballVy) < 0.5); 
        // Adjust the threshold (0.5) to taste
  
        // Start with current color
        ballColor = BALL_COLORS[ballColorIndex % BALL_COLORS.length];
      }
  
      //----------------------------------------------------
      // Update the Ball
      //----------------------------------------------------
      function updateBall() {
        // Move
        ballX += ballVx;
        ballY += ballVy;
  
        // Top/Bottom bounce
        if (ballY < 0) {
          ballY = 0;
          ballVy *= -1;
        } else if (ballY > p.height) {
          ballY = p.height;
          ballVy *= -1;
        }
  
        // Left/Right bounce
        let halfSize = (cellW * BALL_SIZE_FACTOR) / 2;
        if (ballX < halfSize) {
          // If the ball touches the left edge, bounce
          ballX = halfSize;
          ballVx *= -1;
          cycleBallColor(); // optional color cycle on wall bounce
        } else if (ballX > p.width - halfSize) {
          // If the ball touches the right edge, bounce
          ballX = p.width - halfSize;
          ballVx *= -1;
          cycleBallColor(); // optional color cycle on wall bounce
        }
  
        // Check paddle collisions
        checkPaddleCollision();
  
        // Flip/Add color in the cell the ball occupies
        colorCellUnderBall();
      }
  
      //----------------------------------------------------
      // Check collisions with left & right paddles
      //----------------------------------------------------
      function checkPaddleCollision() {
        let halfSize = (cellW * BALL_SIZE_FACTOR) / 2;
  
        // Left paddle
        let leftPaddleX = paddleXOffset;
        let leftPaddleTop = leftPaddleY;
        let leftPaddleBottom = leftPaddleY + PADDLE_HEIGHT_CELLS * cellH;
        let leftPaddleRight = leftPaddleX + cellW;
  
        // If the ball is within the paddle's x-range
        if (ballX - halfSize < leftPaddleRight && ballX + halfSize > leftPaddleX) {
          // Check vertical overlap
          if (ballY > leftPaddleTop && ballY < leftPaddleBottom) {
            // bounce
            ballX = leftPaddleRight + halfSize;
            ballVx *= -1;
            cycleBallColor();
          }
        }
  
        // Right paddle
        let rightPaddleX = p.width - paddleXOffset - cellW;
        let rightPaddleTop = rightPaddleY;
        let rightPaddleBottom = rightPaddleY + PADDLE_HEIGHT_CELLS * cellH;
        let rightPaddleLeft = rightPaddleX;
  
        if (ballX + halfSize > rightPaddleLeft && ballX - halfSize < rightPaddleLeft + cellW) {
          // Check vertical overlap
          if (ballY > rightPaddleTop && ballY < rightPaddleBottom) {
            // bounce
            ballX = rightPaddleLeft - halfSize;
            ballVx *= -1;
            cycleBallColor();
          }
        }
      }
  
      //----------------------------------------------------
      // Each time the ball hits a paddle (or wall), we can cycle its color
      //----------------------------------------------------
      function cycleBallColor() {
        ballColorIndex++;
        ballColor = BALL_COLORS[ballColorIndex % BALL_COLORS.length];
      }
  
      //----------------------------------------------------
      // Color the cell under the ball (based on the ball's current color)
      //----------------------------------------------------
      function colorCellUnderBall() {
        let c = p.floor(ballX / cellW);
        let r = p.floor(ballY / cellH);
        if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
          // Add the ball's color to the cell's set
          grid[r][c].add(ballColor);
        }
      }
  
      //----------------------------------------------------
      // Mouse Controls for Paddles
      // Move left paddle in the same direction as mouse,
      // move right paddle in the OPPOSITE direction
      //----------------------------------------------------
      function movePaddles() {
        let deltaY = p.mouseY - p.pmouseY; // how much the mouse moved this frame
  
        // Left paddle moves with mouse
        leftPaddleY += deltaY * PADDLE_SPEED;
        // Right paddle moves the opposite
        rightPaddleY -= deltaY * PADDLE_SPEED;
  
        // Constrain them
        leftPaddleY = p.constrain(leftPaddleY, 0, p.height - PADDLE_HEIGHT_CELLS * cellH);
        rightPaddleY = p.constrain(rightPaddleY, 0, p.height - PADDLE_HEIGHT_CELLS * cellH);
      }
  
      //----------------------------------------------------
      // getMixedColorFromSet - combine the cell's color set
      // using the provided color map
      //----------------------------------------------------
      function getMixedColorFromSet(colorSet) {
        if (colorSet.size === 0) {
          // no color => white
          return { r: 255, g: 255, b: 255 };
        }
        // Sort the colors in alphabetical order to form the key
        let sorted = Array.from(colorSet).sort().join(",");
        let hex = colorMap[sorted] || "#000000";
        return hexToRGB(hex);
      }
  
      //----------------------------------------------------
      // Convert Hex String to RGB Object
      //----------------------------------------------------
      function hexToRGB(hexStr) {
        if (hexStr[0] === '#') {
          hexStr = hexStr.slice(1);
        }
        let r = parseInt(hexStr.slice(0, 2), 16);
        let g = parseInt(hexStr.slice(2, 4), 16);
        let b = parseInt(hexStr.slice(4, 6), 16);
        return { r, g, b };
      }
  
      //----------------------------------------------------
      // Handle Window Resize
      //----------------------------------------------------
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        initializeGrid();
        resetBall();
  
        // Re-center paddles
        leftPaddleY = (p.height - (PADDLE_HEIGHT_CELLS * cellH)) / 2;
        rightPaddleY = (p.height - (PADDLE_HEIGHT_CELLS * cellH)) / 2;
      };
    };
  
    // Return the new p5 instance
    return new p5(sketch);
  };
  