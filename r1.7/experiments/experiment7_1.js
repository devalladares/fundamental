//----------------------------------------------------
// Multi-Block Faux-3D with White Blocks, 
// Internal Grid Lines, and Mouse Hover Highlight
// (Instance Mode)
//----------------------------------------------------
window.initExperiment = function() {
    const sketch = (p) => {
  
      //----------------------------------------------------
      // Top-Level Variables (Tweak as Desired)
      //----------------------------------------------------
      const GRID_ROWS   = 10;
      const GRID_COLS   = 15;
      const CELL_STROKE = 0.5;    // Thickness for the base 2D grid lines
      const BLOCK_COUNT = 4;      // How many 3D blocks we create
  
      // Each “level” is offset in X,Y by these factors (fraction of cell size)
      const STEP_OFFSET_X = 0.5;   
      const STEP_OFFSET_Y = -0.5;
  
      // Data for the blocks
      let blocks = [];  // { row, col, w, h, d, faces: [ { polygon: [...], faceName: 'left'|'right'|'top' }, ... ] }
  
      // For the grid
      let cellW, cellH;
  
      // Keep track of which face (if any) the mouse is hovering over
      let hoveredFace = null;  // { blockIndex, faceName }
  
      //----------------------------------------------------
      // p5 Setup
      //----------------------------------------------------
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.noLoop();  // We'll call p.redraw() when needed
  
        cellW = p.width / GRID_COLS;
        cellH = p.height / GRID_ROWS;
  
        // Create initial random blocks
        generateBlocks();
      };
  
      //----------------------------------------------------
      // p5 Draw
      //----------------------------------------------------
      p.draw = () => {
        p.background(255);
  
        // 1) Draw the base 2D grid
        drawBaseGrid();
  
        // 2) Draw all faux-3D blocks
        //    (And build up data about faces so we can do hover checks)
        for (let i = 0; i < blocks.length; i++) {
          let b = blocks[i];
          // Build the face polygons
          b.faces = buildBlockFaces(b);
          // Draw the block (white faces with internal grid lines)
          drawBlock(b, i);
        }
  
        // 3) If hovering over a particular face, highlight it
        if (hoveredFace) {
          let { blockIndex, faceName } = hoveredFace;
          let b = blocks[blockIndex];
          // Find the face’s polygon so we can draw a highlight
          let faceObj = b.faces.find(f => f.faceName === faceName);
          if (faceObj) {
            highlightFace(faceObj.polygon);
          }
        }
      };
  
      //----------------------------------------------------
      // Mouse Interaction
      //----------------------------------------------------
      // Click => randomize blocks
      p.mousePressed = () => {
        generateBlocks();
        p.redraw();
      };
  
      // Hover => check which face (if any) is under the mouse
      p.mouseMoved = () => {
        hoveredFace = null;  // reset
  
        // We'll check from front to back, so top faces get priority
        // or you can check them all, then pick whichever is "on top."
        // For simplicity, we’ll just check each block’s faces in draw order.
        // If you want a more accurate layering approach, you’d sort blocks/faces.
        for (let i = blocks.length - 1; i >= 0; i--) {
          let b = blocks[i];
          if (!b.faces) continue;
  
          for (let j = 0; j < b.faces.length; j++) {
            let face = b.faces[j];
            if (pointInPolygon(p.mouseX, p.mouseY, face.polygon)) {
              hoveredFace = { blockIndex: i, faceName: face.faceName };
              // Stop as soon as we find one face containing the mouse
              return;
            }
          }
        }
      };
  
      //----------------------------------------------------
      // Generate Random Blocks
      //----------------------------------------------------
      function generateBlocks() {
        blocks = [];
        for (let i = 0; i < BLOCK_COUNT; i++) {
          let row = p.floor(p.random(0, GRID_ROWS - 2));
          let col = p.floor(p.random(0, GRID_COLS - 2));
          let w   = p.floor(p.random(2, 5)); // footprint width in cells
          let h   = p.floor(p.random(2, 5)); // footprint height in cells
          let d   = p.floor(p.random(2, 8)); // how many levels tall
  
          blocks.push({ row, col, w, h, d });
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
      // Build the Polygons for Each Face of a Block
      //----------------------------------------------------
      function buildBlockFaces(b) {
        // We'll define 3 faces: left, right, top.
        // Each face is a polygon in screen coords:
        // e.g., face.polygon = [ {x1,y1}, {x2,y2}, {x3,y3}, {x4,y4} ]
        // The corners must be in order (clockwise or counterclockwise).
  
        // Get corners (row, col, level) => {x, y} in screen coords
        function getCorner(row, col, level) {
          let x2D = col * cellW + STEP_OFFSET_X * level * cellW;
          let y2D = row * cellH + STEP_OFFSET_Y * level * cellH;
          return { x: x2D, y: y2D };
        }
  
        // LEFT FACE
        //   bottom-left:    (row+h, col,   0)
        //   bottom-left-up: (row+h, col,   d)
        //   top-left-up:    (row,   col,   d)
        //   top-left:       (row,   col,   0)
        let A = getCorner(b.row + b.h, b.col, 0);
        let B = getCorner(b.row + b.h, b.col, b.d);
        let C = getCorner(b.row,       b.col, b.d);
        let D = getCorner(b.row,       b.col, 0);
  
        // RIGHT FACE
        //   bottom-right:    (row+h, col+w,   0)
        //   bottom-right-up: (row+h, col+w,   d)
        //   top-right-up:    (row,   col+w,   d)
        //   top-right:       (row,   col+w,   0)
        let E = getCorner(b.row + b.h, b.col + b.w, 0);
        let F = getCorner(b.row + b.h, b.col + b.w, b.d);
        let G = getCorner(b.row,       b.col + b.w, b.d);
        let H = getCorner(b.row,       b.col + b.w, 0);
  
        // TOP FACE
        //   top-left-up:     (row,     col,     d)
        //   top-right-up:    (row,     col+w,   d)
        //   bottom-right-up: (row+h,   col+w,   d)
        //   bottom-left-up:  (row+h,   col,     d)
        let TL = getCorner(b.row,     b.col,     b.d);
        let TR = getCorner(b.row,     b.col + b.w, b.d);
        let BR = getCorner(b.row + b.h, b.col + b.w, b.d);
        let BL = getCorner(b.row + b.h, b.col,     b.d);
  
        return [
          {
            faceName: "left",
            polygon: [A, B, C, D] // 4 corners
          },
          {
            faceName: "right",
            polygon: [E, F, G, H]
          },
          {
            faceName: "top",
            polygon: [TL, TR, BR, BL]
          }
        ];
      }
  
      //----------------------------------------------------
      // Draw One Block with White Faces & Grid Lines
      //----------------------------------------------------
      function drawBlock(b, blockIndex) {
        if (!b.faces) return; // If not built yet
  
        // Draw faces in an order (left, right, top) 
        // so the top is drawn last.
        drawFace(b.faces.find(f => f.faceName === "left"));
        drawFace(b.faces.find(f => f.faceName === "right"));
        drawFace(b.faces.find(f => f.faceName === "top"));
      }
  
      function drawFace(faceObj) {
        if (!faceObj) return;
        let pts = faceObj.polygon;
  
        // Fill solid white
        p.fill(255);
        p.stroke(0);
        p.beginShape();
        pts.forEach(pt => {
          p.vertex(pt.x, pt.y);
        });
        p.endShape(p.CLOSE);
  
        // Now draw internal diagonal lines to make it look like a grid
        drawFaceGrid(pts);
      }
  
      //----------------------------------------------------
      // Draw a "Grid" inside a Quadrilateral
      //----------------------------------------------------
      // We treat the face as a parallelogram or trapezoid (4 corners).
      // We'll subdivide in "rows" & "cols" based on the block footprint. 
      // For "left" face, subdiv is h × d, 
      // for "right" face, subdiv is h × d or w × d,
      // for "top" face, subdiv is w × h,
      // etc. But here, we'll do a generic approach: 
      //   We'll guess how many subdivisions in each direction, 
      //   then interpolate lines.
      //----------------------------------------------------
      function drawFaceGrid(facePts) {
        // We'll assume the face is a 4-sided convex shape:
        //   A---B
        //   D---C
        // (A-B is top edge, D-C is bottom edge)
        // We'll do M subdivisions horizontally, N subdivisions vertically,
        // then draw lines within it. We can guess M=5, N=5 or so for a pattern.
  
        // Let's label corners: [A, B, C, D]
        // We'll pick them in order so the shape is ABCD.
        // (facePts might be in a different order, but let's assume 
        //  we stored them in a consistent polygon order.)
        let [A, B, C, D] = facePts;
  
        // For clarity, we’ll do a small number of subdivisions:
        const M = 5; // horizontal subdivisions
        const N = 5; // vertical subdivisions
  
        p.stroke(0);
        // Horizontal lines: from top edge (A->B) to bottom edge (D->C)
        for (let i = 1; i < M; i++) {
          let t = i / M;
          // top interpolation: AB(t)
          let topX = p.lerp(A.x, B.x, t);
          let topY = p.lerp(A.y, B.y, t);
          // bottom interpolation: DC(t)
          let botX = p.lerp(D.x, C.x, t);
          let botY = p.lerp(D.y, C.y, t);
  
          p.line(topX, topY, botX, botY);
        }
  
        // Vertical lines: from left edge (A->D) to right edge (B->C)
        for (let j = 1; j < N; j++) {
          let t = j / N;
          // left interpolation: AD(t)
          let leftX = p.lerp(A.x, D.x, t);
          let leftY = p.lerp(A.y, D.y, t);
          // right interpolation: BC(t)
          let rightX = p.lerp(B.x, C.x, t);
          let rightY = p.lerp(B.y, C.y, t);
  
          p.line(leftX, leftY, rightX, rightY);
        }
      }
  
      //----------------------------------------------------
      // Highlight a Face Under Mouse
      //----------------------------------------------------
      function highlightFace(polygon) {
        p.noStroke();
        p.fill(255, 255, 0, 80); // yellowish overlay
        p.beginShape();
        polygon.forEach(pt => p.vertex(pt.x, pt.y));
        p.endShape(p.CLOSE);
      }
  
      //----------------------------------------------------
      // Point-in-Polygon Test (for convex or simple polygons)
      //----------------------------------------------------
      // We'll do a winding or ray-casting approach:
      // returns true if (px,py) is inside polygon (array of {x,y})
      //----------------------------------------------------
      function pointInPolygon(px, py, poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          let xi = poly[i].x, yi = poly[i].y;
          let xj = poly[j].x, yj = poly[j].y;
          let intersect = ((yi > py) !== (yj > py)) &&
            (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
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
      