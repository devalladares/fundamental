//----------------------------------------------------
// "Build a City" by Hover & Click in Faux-3D
// (Instance Mode)
//----------------------------------------------------
window.initExperiment = function() {
  const sketch = (p) => {

    //----------------------------------------------------
    // Top-Level Variables
    //----------------------------------------------------
    const GRID_ROWS = 10;
    const GRID_COLS = 15;

    // Each cell has a 2D footprint of (cellW x cellH).
    // We'll figure those out in setup based on canvas size.
    let cellW, cellH;

    // For the “faux 3D” offsets: how much we shift each “level” 
    // in x/y to simulate isometric stacking.
    const STEP_OFFSET_X = 0.4;  // fraction of cellW
    const STEP_OFFSET_Y = -0.4; // fraction of cellH

    // We'll store the "height" of each cell in a 2D array.
    //  height[r][c] = integer # of levels above the base plane.
    let heightMap = [];

    // Track which cell is currently hovered (if any)
    let hoveredCell = { r: -1, c: -1 };

    // stroke widths
    const GRID_STROKE = 0.5;   // base grid lines
    const BLOCK_STROKE = 1;    // block edges

    //----------------------------------------------------
    // p5 Setup
    //----------------------------------------------------
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.noLoop(); // We'll redraw manually on interactions

      initGrid();
    };

    //----------------------------------------------------
    // Initialize the Grid / Height Map
    //----------------------------------------------------
    function initGrid() {
      cellW = p.width / GRID_COLS;
      cellH = p.height / GRID_ROWS;

      // Reset heightMap to 0
      heightMap = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        let rowArr = [];
        for (let c = 0; c < GRID_COLS; c++) {
          rowArr.push(0); // start with zero height
        }
        heightMap.push(rowArr);
      }
    }

    //----------------------------------------------------
    // p5 Draw
    //----------------------------------------------------
    p.draw = () => {
      p.background(255);

      // 1) Draw the flat 2D base grid
      drawBaseGrid();

      // 2) Draw the 3D blocks for each cell
      //    We'll draw from bottom row to top row
      //    so that "far" columns are drawn first
      //    and "near" columns appear on top.
      //    Typically, for an isometric effect, 
      //    we might sort by (r + c). But here,
      //    a simple approach: r from GRID_ROWS-1..0
      for (let r = GRID_ROWS - 1; r >= 0; r--) {
        for (let c = 0; c < GRID_COLS; c++) {
          let h = heightMap[r][c];
          if (h > 0) {
            drawBlock(r, c, h);
          }
        }
      }

      // 3) Highlight the hovered cell in the 2D plane (optional)
      drawHoveredCell();
    };

    //----------------------------------------------------
    // Draw the Base 2D Grid
    //----------------------------------------------------
    function drawBaseGrid() {
      p.stroke(0);
      p.strokeWeight(GRID_STROKE);
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
    // If cell has a height = h,
    // We extrude a shape from (r,c) with that many levels
    //----------------------------------------------------
    function drawBlock(r, c, h) {
      // We'll draw the "faces" of that single cell extruded to height h.
      // Each face is a quadrilateral in screen coords.

      // For convenience, define a helper to transform "3D-like" coords 
      // to 2D screen coords:
      //   row -> y direction
      //   col -> x direction
      //   level -> extruded "z" dimension
      function getCorner(rr, cc, level) {
        let baseX = cc * cellW;
        let baseY = rr * cellH;
        let offsetX = STEP_OFFSET_X * level * cellW;
        let offsetY = STEP_OFFSET_Y * level * cellH;
        return { x: baseX + offsetX, y: baseY + offsetY };
      }

      // We'll get corners for the base (level=0) 
      // and top (level=h).
      // Let's label them in a standard order:
      //   A = bottom-left (level=0)
      //   B = top-left    (level=0)
      // Actually in a 2D grid, row increases downward. 
      // So let's define:
      //   topEdge = r
      //   bottomEdge = r+1
      // since each cell is 1 row tall in 2D terms.
      let A = getCorner(r + 1, c, 0);   // bottom-left, base
      let B = getCorner(r,     c, 0);   // top-left, base
      let C = getCorner(r,     c + 1, 0);   // top-right, base
      let D = getCorner(r + 1, c + 1, 0);   // bottom-right, base

      // Then the "upper" corners at level=h
      let A2 = getCorner(r + 1, c,     h);
      let B2 = getCorner(r,     c,     h);
      let C2 = getCorner(r,     c + 1, h);
      let D2 = getCorner(r + 1, c + 1, h);

      // We'll fill everything white
      p.fill(255);
      p.stroke(0);
      p.strokeWeight(BLOCK_STROKE);

      // 1) Draw the "left" face (A -> B -> B2 -> A2)
      p.beginShape();
      p.vertex(A.x,  A.y);
      p.vertex(B.x,  B.y);
      p.vertex(B2.x, B2.y);
      p.vertex(A2.x, A2.y);
      p.endShape(p.CLOSE);

      // 2) Draw the "back" face (B -> C -> C2 -> B2)
      // (We call it "back" because from this viewpoint,
      //  it's the upward slant. Some might call it top-left.)
      p.beginShape();
      p.vertex(B.x,  B.y);
      p.vertex(C.x,  C.y);
      p.vertex(C2.x, C2.y);
      p.vertex(B2.x, B2.y);
      p.endShape(p.CLOSE);

      // 3) Draw the "top" face (C -> D -> D2 -> C2)
      p.beginShape();
      p.vertex(C.x,  C.y);
      p.vertex(D.x,  D.y);
      p.vertex(D2.x, D2.y);
      p.vertex(C2.x, C2.y);
      p.endShape(p.CLOSE);

      // 4) Draw the "right" face (A -> A2 -> D2 -> D)
      //    This is optional if you want a fully enclosed shape
      //    or if your offset doesn't reveal that side.
      //    But let's do it for completeness.
      p.beginShape();
      p.vertex(A.x,  A.y);
      p.vertex(A2.x, A2.y);
      p.vertex(D2.x, D2.y);
      p.vertex(D.x,  D.y);
      p.endShape(p.CLOSE);
    }

    //----------------------------------------------------
    // Hovered Cell Overlay
    //----------------------------------------------------
    function drawHoveredCell() {
      if (hoveredCell.r < 0 || hoveredCell.c < 0) return;

      p.noStroke();
      // A subtle overlay or no fill? Let's do a subtle grey
      p.fill(0, 0, 0, 50);
      let x = hoveredCell.c * cellW;
      let y = hoveredCell.r * cellH;
      p.rect(x, y, cellW, cellH);
    }

    //----------------------------------------------------
    // Mouse Interactions
    //----------------------------------------------------
    // 1) On mouse move, track which cell is hovered
    p.mouseMoved = () => {
      let c = p.floor(p.mouseX / cellW);
      let r = p.floor(p.mouseY / cellH);

      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        hoveredCell.r = r;
        hoveredCell.c = c;
      } else {
        hoveredCell.r = -1;
        hoveredCell.c = -1;
      }
      p.redraw();
    };

    // 2) On mouse press, if we have a valid hovered cell, increment its height
    p.mousePressed = () => {
      if (hoveredCell.r >= 0 && hoveredCell.c >= 0) {
        heightMap[hoveredCell.r][hoveredCell.c]++;
        p.redraw();
      }
    };

    //----------------------------------------------------
    // Window Resize
    //----------------------------------------------------
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      initGrid(); // rebuild the grid & reset heights to 0
      // If you want to preserve existing heights, you'd need
      // a different approach than re-init. 
      p.redraw();
    };
  };

  // Return new p5 instance
  return new p5(sketch);
};
