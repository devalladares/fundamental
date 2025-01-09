//----------------------------------------------------
// Isometric Build-On-Hover
// (p5.js Instance Mode)
//----------------------------------------------------
window.initExperiment = function() {
    const sketch = (p) => {
  
      //----------------------------------------------------
      // Top-Level Variables
      //----------------------------------------------------
  
      // Grid size in row/col terms
      const ROWS = 20;
      const COLS = 25;
  
      // How big each "cell" is in isometric space (for x,y)
      const SCALE = 40;      // the horizontal scale factor
      const Z_SCALE = 50;    // how tall 1 "unit" of height is in screen pixels
  
      // Hover radius in cell-coordinates.
      // e.g. 1.0 => just the cell under the mouse,
      // 2.0 => extends to neighboring cells, etc.
      const HOVER_RADIUS = 2;
  
      // If the user moves the mouse, each cell in that radius
      // increments its height by this amount.
      const BUILD_INCREMENT = 0.1;
  
      // We store a 2D array of "heights":
      // heightMap[r][c] is how tall that cell is in "units."
      let heightMap = [];
  
      // We’ll position the isometric “floor” near the center of the canvas.
      // Adjust as needed.
      let originX, originY;
  
      // For a real isometric look, we use sin(30°)=0.5, cos(30°)≈0.866
      const cos30 = Math.cos(p.radians(10));
      const sin30 = Math.sin(p.radians(10)); // 0.5
  
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.noStroke();
        p.noLoop(); // We'll call redraw() manually on mouse events
  
        // Initialize the height map
        initHeightMap();
  
        // The "origin" is where (r=0, c=0, z=0) will be drawn.
        originX = p.width * 0.5;
        originY = p.height * 0.6;
      };
  
      //----------------------------------------------------
      // Initialize 2D array of heights = 0
      //----------------------------------------------------
      function initHeightMap() {
        heightMap = [];
        for (let r = 0; r < ROWS; r++) {
          let rowArr = [];
          for (let c = 0; c < COLS; c++) {
            rowArr.push(0); // start at zero height
          }
          heightMap.push(rowArr);
        }
      }
  
      //----------------------------------------------------
      // p.draw
      //----------------------------------------------------
      p.draw = () => {
        p.background(255);
  
        // 1) Draw the "floor" lines first (just to show the base plane).
        drawFloorGrid();
  
        // 2) Draw each cell as an isometric block if height>0
        //    We'll sort them so "back" (small r+c) is drawn first,
        //    and "front" (large r+c) is drawn last, ensuring correct overlap.
        //    In standard isometric, we often sort by (row+col).
        let cellList = [];
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            cellList.push({ r, c, h: heightMap[r][c] });
          }
        }
        // Sort by (r + c)
        cellList.sort((a, b) => (a.r + a.c) - (b.r + b.c));
  
        // Draw them in that order
        for (let i = 0; i < cellList.length; i++) {
          let {r, c, h} = cellList[i];
          if (h > 0) {
            drawIsometricBlock(r, c, h);
          }
        }
  
        // 3) Optionally, draw a highlight for the cell(s) under mouse,
        //    but in isometric, that’s trickier to do exactly. 
        //    We’re using a radius in row/col space. So let’s do a
        //    simpler "2D overlay" at the end if you want. (Omitted here
        //    for a purely isometric style.)
      };
  
      //----------------------------------------------------
      // Isometric Helper: transform (r, c, z) => (x, y)
      //----------------------------------------------------
      function isoTransform(r, c, z) {
        // x direction: (c - r)*cos(30°)
        // y direction: (c + r)*sin(30°) - z
        // Then scale them
        let sx = (c - r) * cos30 * SCALE;
        let sy = (c + r) * sin30 * SCALE - z * Z_SCALE;
  
        // Offset by the chosen origin
        sx += originX;
        sy += originY;
        return { x: sx, y: sy };
      }
  
      //----------------------------------------------------
      // Draw the "Floor" Grid
      //----------------------------------------------------
      function drawFloorGrid() {
        p.stroke(0, 70);
        p.strokeWeight(1);
        p.noFill();
  
        // Horizontal lines (r=constant, c goes 0..COLS)
        // We'll treat z=0
        for (let r = 0; r <= ROWS; r++) {
          let start = isoTransform(r, 0, 0);
          let end   = isoTransform(r, COLS, 0);
          p.line(start.x, start.y, end.x, end.y);
        }
  
        // Vertical lines (c=constant, r goes 0..ROWS)
        for (let c = 0; c <= COLS; c++) {
          let start = isoTransform(0, c, 0);
          let end   = isoTransform(ROWS, c, 0);
          p.line(start.x, start.y, end.x, end.y);
        }
      }
  
      //----------------------------------------------------
      // Draw One Isometric Block (white with black edges)
      //----------------------------------------------------
      // We treat the cell (r,c) as a 1x1 "footprint" in row/col,
      // extruded to height h.
      // The corners are:
      //  base:   (r, c, 0) -> (r, c+1, 0) -> (r+1, c+1, 0) -> (r+1, c, 0)
      //  top:    (r, c, h) -> (r, c+1, h) -> (r+1, c+1, h) -> (r+1, c, h)
      //----------------------------------------------------
      function drawIsometricBlock(r, c, h) {
        // Gather base corners in clockwise order
        let A = isoTransform(r,     c,   0);
        let B = isoTransform(r,     c+1, 0);
        let C = isoTransform(r+1,   c+1, 0);
        let D = isoTransform(r+1,   c,   0);
  
        // Gather top corners
        let A2 = isoTransform(r,     c,   h);
        let B2 = isoTransform(r,     c+1, h);
        let C2 = isoTransform(r+1,   c+1, h);
        let D2 = isoTransform(r+1,   c,   h);
  
        p.stroke(0);
        p.strokeWeight(1);
        p.fill(255);
  
        // Typically, for a nice isometric look, we can do faces in this order:
        // LEFT = A->D->D2->A2
        // RIGHT = B->C->C2->B2
        // FRONT/TOP = A2->B2->C2->D2  (the top face)
        // but we also sometimes do front face if we offset differently.
        // Here, "front" is A->B->B2->A2 if the offset is reversed. 
        // We'll just do 3 faces that are normally visible:
  
        // 1) Left Face: A->D->D2->A2
        drawFace([A, D, D2, A2]);
  
        // 2) Right Face: B->C->C2->B2
        drawFace([B, C, C2, B2]);
  
        // 3) Top Face:  A2->B2->C2->D2
        drawFace([A2, B2, C2, D2]);
      }
  
      function drawFace(points) {
        p.beginShape();
        for (let pt of points) {
          p.vertex(pt.x, pt.y);
        }
        p.endShape(p.CLOSE);
      }
  
      //----------------------------------------------------
      // Mouse/Interaction
      //----------------------------------------------------
      // We "build" on hover. Each time the mouse moves, 
      // we find which cells are within HOVER_RADIUS and increment them.
      // Then we redraw.
      //----------------------------------------------------
      p.mouseMoved = () => {
        // Convert mouse to "grid coords" approximately
        // We can do a naive approach: treat the floor as 2D,
        // ignoring height. We'll do an approximate inverse iso.
        // Or simpler: We can pick a rough approach (like in the
        // original 2D code). Let's do a quick approximate solution:
        let mx = p.mouseX - originX;
        let my = p.mouseY - originY;
  
        // Inverse of:
        //   x = (c - r)*cos30 * SCALE
        //   y = (c + r)*sin30 * SCALE
        // We'll ignore height in this approximation.
  
        // Solve system:
        //   c - r = x / (cos30*SCALE)
        //   c + r = y / (sin30*SCALE)
        // => c = ( (c - r) + (c + r) )/2 = ...
        // => r = ...
        let denomX = cos30 * SCALE;
        let denomY = sin30 * SCALE;
  
        let cMinusR = mx / denomX;
        let cPlusR  = my / denomY;
        let cEst = (cMinusR + cPlusR)*0.5;
        let rEst = (cPlusR - cMinusR)*0.5;
  
        // Now, let's raise all cells whose center (rc) is within HOVER_RADIUS
        // of (rEst, cEst).
        for (let rr = 0; rr < ROWS; rr++) {
          for (let cc = 0; cc < COLS; cc++) {
            let dr = (rr + 0.5) - rEst; // center
            let dc = (cc + 0.5) - cEst; // center
            let dist = Math.sqrt(dr*dr + dc*dc);
            if (dist <= HOVER_RADIUS) {
              heightMap[rr][cc] += BUILD_INCREMENT;
            }
          }
        }
  
        // Now redraw
        p.redraw();
      };
  
      //----------------------------------------------------
      // Window Resize
      //----------------------------------------------------
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        originX = p.width * 0.5;
        originY = p.height * 0.6;
        p.redraw();
      };
    };
  
    // Return new p5 instance
    return new p5(sketch);
  };
  