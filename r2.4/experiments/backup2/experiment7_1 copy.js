//----------------------------------------------------
// Multi-Block Faux-3D with Filled Faces in p5.js
// (Instance Mode)
//----------------------------------------------------
window.initExperiment = function() {
    const sketch = (p) => {
  
      //----------------------------------------------------
      // Top-Level Variables (Tweak as Desired)
      //----------------------------------------------------
      const GRID_ROWS   = 12;
      const GRID_COLS   = 20;
      const CELL_STROKE = 0.5;   // Thickness for the base grid
      const BLOCK_COUNT = 5;     // How many 3D blocks we create
  
      // These define how each “isometric” step is offset.
      // A bigger offset => more dramatic diagonal.
      const STEP_OFFSET_X = 0.5; // fraction of cellWidth
      const STEP_OFFSET_Y = -0.5; // fraction of cellHeight
  
      // Data for the blocks
      let blocks = [];  // each block has: { row, col, w, h, d, colLeft, colRight, colTop }
  
      // For the grid
      let cellW, cellH;
  
      //----------------------------------------------------
      // p5 Setup
      //----------------------------------------------------
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.noLoop();
  
        // Compute cell size
        cellW = p.width / GRID_COLS;
        cellH = p.height / GRID_ROWS;
  
        // Create an initial set of random blocks
        generateBlocks();
      };
  
      //----------------------------------------------------
      // p5 Draw
      //----------------------------------------------------
      p.draw = () => {
        p.background(255);
  
        // 1) Draw the base 2D grid
        drawBaseGrid();
  
        // 2) Draw all the faux-3D blocks
        for (let b of blocks) {
          drawBlock(b);
        }
      };
  
      //----------------------------------------------------
      // Mouse Interaction
      //----------------------------------------------------
      // Click => create brand-new blocks randomly, then redraw
      p.mousePressed = () => {
        generateBlocks();
        p.redraw();
      };
  
      //----------------------------------------------------
      // Generate Random Blocks
      //----------------------------------------------------
      function generateBlocks() {
        blocks = [];
        for (let i = 0; i < BLOCK_COUNT; i++) {
          let row = p.floor(p.random(0, GRID_ROWS - 2)); // ensure some space
          let col = p.floor(p.random(0, GRID_COLS - 2));
          let w   = p.floor(p.random(2, 6));  // block width in cells
          let h   = p.floor(p.random(2, 6));  // block height (footprint)
          let d   = p.floor(p.random(2, 8));  // how many “levels” tall
  
          // Each face can have a different color
          let colLeft  = p.color(p.random(255), p.random(255), p.random(255));
          let colRight = p.color(p.random(255), p.random(255), p.random(255));
          let colTop   = p.color(p.random(255), p.random(255), p.random(255));
  
          blocks.push({ row, col, w, h, d, colLeft, colRight, colTop });
        }
      }
  
      //----------------------------------------------------
      // Draw the Base 2D Grid
      //----------------------------------------------------
      function drawBaseGrid() {
        p.stroke(0);
        p.strokeWeight(CELL_STROKE);
        p.noFill();
  
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            let x = c * cellW;
            let y = r * cellH;
            p.rect(x, y, cellW, cellH);
          }
        }
      }
  
      //----------------------------------------------------
      // Draw One Faux-3D Block
      //----------------------------------------------------
      // We'll treat (row, col) as the block’s "footprint" on the grid:
      //  - width = w cells horizontally
      //  - height = h cells vertically
      //  - depth = d "levels" tall
      //
      // We'll fill the left face, right face, and top face
      // by drawing polygons in "2D offset" space.
      //----------------------------------------------------
      function drawBlock(b) {
        // We'll define corners in terms of 3D-like coords:
        //   (row, col, level) 
        // but project them onto 2D with getCorner().
  
        // Let's define each face as a polygon:
        // 1) LEFT FACE  = vertical face on the left side
        // 2) RIGHT FACE = vertical face on the right side
        // 3) TOP FACE   = horizontal face on the top
        //
        // Draw order matters if faces overlap. We'll do:
        //  LEFT, RIGHT, then TOP last so it appears “on top.”
  
        // HELPER: get a corner in screen coords
        // corner selection: top-left of block => (b.row, b.col)
        // but we might want (b.row + h, b.col) or something
        function getCorner(row, col, level) {
          // Base 2D position
          let x2D = col * cellW;
          let y2D = row * cellH;
          // Then offset for the “level” (the z dimension)
          //   We shift in X by STEP_OFFSET_X * level * cellW
          //   We shift in Y by STEP_OFFSET_Y * level * cellH
          x2D += (STEP_OFFSET_X * level) * cellW;
          y2D += (STEP_OFFSET_Y * level) * cellH;
          return { x: x2D, y: y2D };
        }
  
        // ================
        // LEFT FACE
        //  - spans from bottom (level=0) to top (level=d) along 
        //    the "left edge" = (row..row+h, col)
        // So the corners in ascending order might be:
        //   bottom-left:    (row + h, col, 0)
        //   bottom-left-up: (row + h, col, d)
        //   top-left-up:    (row,     col, d)
        //   top-left:       (row,     col, 0)
        // ================
        let A = getCorner(b.row + b.h, b.col, 0);
        let B = getCorner(b.row + b.h, b.col, b.d);
        let C = getCorner(b.row,       b.col, b.d);
        let D = getCorner(b.row,       b.col, 0);
  
        p.fill(b.colLeft);
        p.stroke(0);
        p.beginShape();
        p.vertex(A.x, A.y);
        p.vertex(B.x, B.y);
        p.vertex(C.x, C.y);
        p.vertex(D.x, D.y);
        p.endShape(p.CLOSE);
  
        // ================
        // RIGHT FACE
        //  - Also vertical, but on right side 
        //    (row..row+h, col + w)
        // Corners:
        //   bottom-right:    (row + h, col + w, 0)
        //   bottom-right-up: (row + h, col + w, d)
        //   top-right-up:    (row,     col + w, d)
        //   top-right:       (row,     col + w, 0)
        // ================
        let E = getCorner(b.row + b.h, b.col + b.w, 0);
        let F = getCorner(b.row + b.h, b.col + b.w, b.d);
        let G = getCorner(b.row,       b.col + b.w, b.d);
        let H = getCorner(b.row,       b.col + b.w, 0);
  
        p.fill(b.colRight);
        p.beginShape();
        p.vertex(E.x, E.y);
        p.vertex(F.x, F.y);
        p.vertex(G.x, G.y);
        p.vertex(H.x, H.y);
        p.endShape(p.CLOSE);
  
        // ================
        // TOP FACE
        //  - horizontal surface at level = d
        //  - corners:
        //    top-left-up:     (row,     col,     d)
        //    top-right-up:    (row,     col+w,   d)
        //    bottom-right-up: (row + h, col + w, d)
        //    bottom-left-up:  (row + h, col,     d)
        // ================
        let TL = getCorner(b.row,     b.col,     b.d);
        let TR = getCorner(b.row,     b.col + b.w, b.d);
        let BR = getCorner(b.row + b.h, b.col + b.w, b.d);
        let BL = getCorner(b.row + b.h, b.col,     b.d);
  
        p.fill(b.colTop);
        p.beginShape();
        p.vertex(TL.x, TL.y);
        p.vertex(TR.x, TR.y);
        p.vertex(BR.x, BR.y);
        p.vertex(BL.x, BL.y);
        p.endShape(p.CLOSE);
  
        // Optionally: you could also draw edges or outlines
        // p.stroke(0);
        // p.line( A.x, A.y, D.x, D.y ); etc.
      }
  
      //----------------------------------------------------
      // Handle Window Resize
      //----------------------------------------------------
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        cellW = p.width / GRID_COLS;
        cellH = p.height / GRID_ROWS;
        p.redraw();
      };
    };
  
    // Return new p5 instance
    return new p5(sketch);
  };
  