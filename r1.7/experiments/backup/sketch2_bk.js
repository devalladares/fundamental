let grid = [];
let maxDepth = 20; // Maximum depth of subdivisions
let initialRows = 2; // Default number of rows
let initialCols = 4; // Default number of columns

function setup() {
  const logo = document.getElementById('logo');
  createCanvas(windowWidth, windowHeight - logo.clientHeight);
  initializeGrid();
}

function draw() {
  background(255);
  grid.forEach((cell) => {
    stroke(0);
    strokeWeight(1);
    noFill();
    rect(cell.x, cell.y, cell.w, cell.h);
  });
}

function mousePressed() {
  handleInteraction(mouseX, mouseY);
}

function mouseMoved() {
  handleInteraction(mouseX, mouseY);
}

function handleInteraction(mx, my) {
  for (let i = grid.length - 1; i >= 0; i--) {
    let cell = grid[i];
    if (
      mx > cell.x &&
      mx < cell.x + cell.w &&
      my > cell.y &&
      my < cell.y + cell.h &&
      cell.depth < maxDepth
    ) {
      subdivide(cell, i);
      break;
    }
  }
}

function initializeGrid() {
  grid = [];
  let cellWidth = width / initialCols;
  let cellHeight = height / initialRows;

  for (let r = 0; r < initialRows; r++) {
    for (let c = 0; c < initialCols; c++) {
      let x = c * cellWidth;
      let y = r * cellHeight;

      // Allow rectangles only at the bottom or right edge
      let w = c === initialCols - 1 ? width - x : cellWidth;
      let h = r === initialRows - 1 ? height - y : cellHeight;

      grid.push({
        x: x,
        y: y,
        w: w,
        h: h,
        depth: 0,
      });
    }
  }
}

function subdivide(cell, index) {
  let { x, y, w, h, depth } = cell;
  let newW = w / 2;
  let newH = h / 2;

  grid.splice(index, 1); // Remove the current cell
  grid.push(
    { x: x, y: y, w: newW, h: newH, depth: depth + 1 },
    { x: x + newW, y: y, w: newW, h: newH, depth: depth + 1 },
    { x: x, y: y + newH, w: newW, h: newH, depth: depth + 1 },
    { x: x + newW, y: y + newH, w: newW, h: newH, depth: depth + 1 }
  );
}

function windowResized() {
  const logo = document.getElementById('logo');
  resizeCanvas(windowWidth, windowHeight - logo.clientHeight);
  initializeGrid();
}
