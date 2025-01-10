window.initExperiment = function() {
  let darkMode = false; // Local state for dark mode

  const sketch = (p) => {
    const GRID_ROWS = 10;
    const GRID_COLS = 20;
    const CELL_STROKE = 0.5;
    const BLOCK_COUNT = 4;

    const STEP_OFFSET_X = 0.5;
    const STEP_OFFSET_Y = -0.15;

    let startY = 0;
    let cellW, cellH;
    let blocks = [];
    let hoveredFace = null;

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.noLoop();

      const logo = document.getElementById('logo');
      const logoHeight = logo ? logo.clientHeight : 0;
      const vpHeight = window.innerHeight;

      startY = (logoHeight / vpHeight) * p.height;

      cellW = p.width / GRID_COLS;
      cellH = (p.height - startY) / GRID_ROWS;

      generateBlocks();
    };

    p.draw = () => {
      // Set background color based on dark mode
      p.background(darkMode ? 0 : 255);

      drawBaseGrid();

      for (let i = 0; i < blocks.length; i++) {
        let b = blocks[i];
        b.faces = buildBlockFaces(b);
        drawBlock(b, i);
      }

      if (hoveredFace) {
        let { blockIndex, faceName } = hoveredFace;
        let b = blocks[blockIndex];
        let faceObj = b.faces.find(f => f.faceName === faceName);
        if (faceObj) highlightFace(faceObj.polygon);
      }
    };

    p.mousePressed = () => {
      generateBlocks();
      p.redraw();
    };

    p.mouseMoved = () => {
      hoveredFace = null;
      for (let i = blocks.length - 1; i >= 0; i--) {
        let b = blocks[i];
        if (!b.faces) continue;
        for (let j = 0; j < b.faces.length; j++) {
          let face = b.faces[j];
          if (pointInPolygon(p.mouseX, p.mouseY, face.polygon)) {
            hoveredFace = { blockIndex: i, faceName: face.faceName };
            return;
          }
        }
      }
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);

      const logo = document.getElementById('logo');
      const logoHeight = logo ? logo.clientHeight : 0;
      const vpHeight = window.innerHeight;
      startY = (logoHeight / vpHeight) * p.height / 10;

      cellW = p.width / GRID_COLS;
      cellH = (p.height - startY) / GRID_ROWS;
      p.redraw();
    };

    function generateBlocks() {
      blocks = [];
      for (let i = 0; i < BLOCK_COUNT; i++) {
        let row = p.floor(p.random(0, GRID_ROWS - 2));
        let col = p.floor(p.random(0, GRID_COLS - 2));
        let w = p.floor(p.random(2, 5));
        let h = p.floor(p.random(2, 5));
        let d = p.floor(p.random(2, 8));
        blocks.push({ row, col, w, h, d });
      }
    }

    function drawBaseGrid() {
      p.stroke(darkMode ? 255 : 0);
      p.strokeWeight(CELL_STROKE);
      p.noFill();

      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          let x = c * cellW;
          let y = startY + r * cellH;
          p.rect(x, y, cellW, cellH);
        }
      }
    }

    function buildBlockFaces(b) {
      function getCorner(row, col, level) {
        let x2D = col * cellW + STEP_OFFSET_X * level * cellW;
        let y2D = startY + row * cellH + STEP_OFFSET_Y * level * cellH;
        return { x: x2D, y: y2D };
      }

      let A = getCorner(b.row + b.h, b.col, 0);
      let B = getCorner(b.row + b.h, b.col, b.d);
      let C = getCorner(b.row, b.col, b.d);
      let D = getCorner(b.row, b.col, 0);

      let E = getCorner(b.row + b.h, b.col + b.w, 0);
      let F = getCorner(b.row + b.h, b.col + b.w, b.d);
      let G = getCorner(b.row, b.col + b.w, b.d);
      let H = getCorner(b.row, b.col + b.w, 0);

      let TL = getCorner(b.row, b.col, b.d);
      let TR = getCorner(b.row, b.col + b.w, b.d);
      let BR = getCorner(b.row + b.h, b.col + b.w, b.d);
      let BL = getCorner(b.row + b.h, b.col, b.d);

      return [
        { faceName: "left", polygon: [A, B, C, D] },
        { faceName: "right", polygon: [E, F, G, H] },
        { faceName: "top", polygon: [TL, TR, BR, BL] }
      ];
    }

    function drawBlock(b) {
      drawFace(b.faces.find(f => f.faceName === "left"));
      drawFace(b.faces.find(f => f.faceName === "right"));
      drawFace(b.faces.find(f => f.faceName === "top"));
    }

    function drawFace(faceObj) {
      if (!faceObj) return;
      let pts = faceObj.polygon;
      p.fill(darkMode ? 0 : 255);
      p.stroke(darkMode ? 255 : 0);
      p.beginShape();
      pts.forEach(pt => p.vertex(pt.x, pt.y));
      p.endShape(p.CLOSE);

      drawFaceGrid(pts);
    }

    function drawFaceGrid(facePts) {
      let [A, B, C, D] = facePts;
      const M = 5;
      const N = 5;

      p.stroke(darkMode ? 255 : 0);

      for (let i = 1; i < M; i++) {
        let t = i / M;
        let topX = p.lerp(A.x, B.x, t);
        let topY = p.lerp(A.y, B.y, t);
        let botX = p.lerp(D.x, C.x, t);
        let botY = p.lerp(D.y, C.y, t);
        p.line(topX, topY, botX, botY);
      }

      for (let j = 1; j < N; j++) {
        let t = j / N;
        let leftX = p.lerp(A.x, D.x, t);
        let leftY = p.lerp(A.y, D.y, t);
        let rightX = p.lerp(B.x, C.x, t);
        let rightY = p.lerp(B.y, C.y, t);
        p.line(leftX, leftY, rightX, rightY);
      }
    }

    function highlightFace(polygon) {
      p.noStroke();
      p.fill(darkMode ? 255 : 0, 80);
      p.beginShape();
      polygon.forEach(pt => p.vertex(pt.x, pt.y));
      p.endShape(p.CLOSE);
    }

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
  };

  const p5Instance = new p5(sketch);

  p5Instance.setDarkMode = function(mode) {
    darkMode = mode;
    p5Instance.redraw();
  };

  return p5Instance;
};
