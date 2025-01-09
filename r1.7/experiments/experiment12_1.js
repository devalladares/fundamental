//----------------------------------------------------
// Integrated Grid-Based Flappy Birds Game in p5.js
//----------------------------------------------------

window.initExperiment = function() {
    const sketch = (p) => {
      //----------------------------------------------------
      // Top-Level Variables
      //----------------------------------------------------
      // Grid Configuration
      const initialCols = 20; // Number of columns in the grid
      const initialRows = 30; // Number of rows in the grid
      const maxDepth = 20;    // Not used in Flappy Birds, kept for reference
      let grid = [];
      let cellWidth;
      let cellHeight;
  
      // Flappy Birds Variables
      let bird;
      let pipes = [];
      let frameCountCustom = 0;
      let score = 0;
      let gameOver = false;
  
      //----------------------------------------------------
      // p5 Setup
      //----------------------------------------------------
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        initializeGrid();
        bird = new Bird();
        pipes.push(new Pipe());
        p.textSize(32);
        p.textAlign(p.CENTER, p.TOP);
      };
  
      //----------------------------------------------------
      // p5 Draw
      //----------------------------------------------------
      p.draw = () => {
        p.background(255); // White background
  
        // Draw Grid
        drawGrid();
  
        if (!gameOver) {
          // Update frame count
          frameCountCustom++;
  
          // Every 90 frames, add a new pipe
          if (frameCountCustom % 90 === 0) {
            pipes.push(new Pipe());
          }
  
          // Update and show pipes
          for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].update();
            pipes[i].show();
  
            // Check for collision
            if (pipes[i].hits(bird)) {
              gameOver = true;
            }
  
            // Check if pipe passed the bird for scoring
            if (!pipes[i].passed && pipes[i].x + pipes[i].w < bird.x) {
              pipes[i].passed = true;
              score++;
            }
  
            // Remove off-screen pipes
            if (pipes[i].offscreen()) {
              pipes.splice(i, 1);
            }
          }
  
          // Update and show bird
          bird.update();
          bird.show();
  
          // Display score
          p.fill(0); // Black text for visibility
          p.text("Score: " + score, p.width / 2, 10);
        } else {
          // Game Over Screen
          p.fill(0);
          p.textSize(64);
          p.text("Game Over", p.width / 2, p.height / 2 - 50);
          p.textSize(32);
          p.text("Score: " + score, p.width / 2, p.height / 2);
          p.text("Press 'R' to Restart", p.width / 2, p.height / 2 + 50);
        }
      };
  
      //----------------------------------------------------
      // Custom Classes and Functions
      //----------------------------------------------------
  
      // Bird Class
      class Bird {
        constructor() {
          this.x = Math.floor(initialCols / 4);
          this.y = Math.floor(initialRows / 2);
          this.size = 1; // Size in grid units
          this.velocity = 0;
          this.gravity = 0.005;
          this.lift = -0.15;
        }
  
        update() {
          this.velocity += this.gravity;
          this.y += this.velocity;
  
          // Prevent bird from going out of bounds
          if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
          }
          if (this.y > initialRows - 1) {
            this.y = initialRows - 1;
            this.velocity = 0;
            gameOver = true;
          }
        }
  
        show() {
          p.fill(255, 215, 0); // Gold color for the bird
          p.noStroke();
          p.rect(
            this.x * cellWidth,
            this.y * cellHeight,
            cellWidth,
            cellHeight
          );
        }
  
        flap() {
          this.velocity += this.lift;
        }
      }
  
      // Pipe Class
      class Pipe {
        constructor() {
          this.spacing = 6; // Gap size in grid units
          this.top = p.floor(p.random(1, initialRows - this.spacing - 1));
          this.bottom = initialRows - (this.top + this.spacing);
          this.x = initialCols;
          this.w = 1; // Width in grid units
          this.speed = 0.05; // Speed in grid units per frame
          this.passed = false;
        }
  
        update() {
          this.x -= this.speed;
        }
  
        show() {
          p.fill(34, 139, 34); // Forest green for pipes
          p.noStroke();
          // Top pipe
          p.rect(
            this.x * cellWidth,
            0,
            this.w * cellWidth,
            this.top * cellHeight
          );
          // Bottom pipe
          p.rect(
            this.x * cellWidth,
            (this.top + this.spacing) * cellHeight,
            this.w * cellWidth,
            this.bottom * cellHeight
          );
        }
  
        offscreen() {
          return this.x < -this.w;
        }
  
        hits(bird) {
          if (
            bird.x === p.floor(this.x) &&
            (bird.y < this.top || bird.y > this.top + this.spacing)
          ) {
            return true;
          }
          return false;
        }
      }
  
      // Initialize Grid Dimensions
      function initializeGrid() {
        grid = [];
        cellWidth = p.width / initialCols;
        cellHeight = p.height / initialRows;
  
        // Initialize grid cells (not subdividing)
        for (let r = 0; r < initialRows; r++) {
          for (let c = 0; c < initialCols; c++) {
            let x = c * cellWidth;
            let y = r * cellHeight;
            grid.push({
              x: x,
              y: y,
              w: cellWidth,
              h: cellHeight,
            });
          }
        }
      }
  
      // Draw Grid Lines
      function drawGrid() {
        p.stroke(0); // Black lines
        p.strokeWeight(1);
        // Draw vertical lines
        for (let c = 0; c <= initialCols; c++) {
          p.line(c * cellWidth, 0, c * cellWidth, p.height);
        }
        // Draw horizontal lines
        for (let r = 0; r <= initialRows; r++) {
          p.line(0, r * cellHeight, p.width, r * cellHeight);
        }
      }
  
      // Handle Window Resize
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        initializeGrid();
      };
  
      // Handle Key Presses
      p.keyPressed = () => {
        if (!gameOver) {
          if (p.key === ' ' || p.key === 'ArrowUp') {
            bird.flap();
          }
        } else {
          if (p.key === 'r' || p.key === 'R') {
            restartGame();
          }
        }
      };
  
      // Restart the Game
      function restartGame() {
        pipes = [];
        bird = new Bird();
        score = 0;
        frameCountCustom = 0;
        gameOver = false;
        pipes.push(new Pipe());
      }
    };
  
    // Return the new p5 instance
    return new p5(sketch);
  };
  