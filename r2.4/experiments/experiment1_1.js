// experiments/experiment1_1.js

//----------------------------------------------------
// Dynamic "Mostly Square" Grid (Mouse-Driven Columns)
// The top rows are squares, the final row fills leftover height.
//----------------------------------------------------
window.initExperiment = function() {
  let darkMode = false; // Local state for dark mode

  const sketch = (p) => {
    // The maximum possible columns
    const MAX_COLS = 60;  

    // We'll store cells in an array (each cell might be a square or rect)
    let cells = [];

    p.setup = () => {
      // Optional: account for a "logo" element at the top
      const logo = document.getElementById("logo");
      let offset = logo ? logo.clientHeight : 0;
      p.createCanvas(p.windowWidth, p.windowHeight - offset);
    };

    p.draw = () => {
      // Set background based on dark mode
      p.background(darkMode ? 0 : 255);

      // 1) Determine how many columns to use, based on mouseX
      //    from 2 to MAX_COLS
      let numCols = p.map(p.mouseX, 0, p.width, 2, MAX_COLS);
      
      // 2) Then constrain to ensure it's between 2 and MAX_COLS
      numCols = p.constrain(numCols, 2, MAX_COLS);
      numCols = p.floor(numCols);

      // 3) Rebuild our grid of cells
      cells = buildGrid(numCols);

      // 4) Draw the cells
      p.stroke(darkMode ? 255 : 0); // Change stroke color based on mode
      p.strokeWeight(1);
      p.noFill();

      for (let c of cells) {
        p.rect(c.x, c.y, c.w, c.h);
      }
    };

    // Resize the canvas if window changes
    p.windowResized = () => {
      const logo = document.getElementById("logo");
      let offset = logo ? logo.clientHeight : 0;
      p.resizeCanvas(p.windowWidth, p.windowHeight - offset);
    };

    // Helper: build an array of cells
    // - The top rows are squares of size cellSize x cellSize.
    // - The final row fills whatever leftover height remains, so might be a rectangle.
    function buildGrid(numCols) {
      let result = [];

      // Each cell in full rows is a square of this size:
      let cellSize = p.width / numCols;

      // 1) How many "full" square rows fit?
      let fullRows = p.floor(p.height / cellSize);

      // 2) leftover space at the bottom
      let leftoverHeight = p.height - (fullRows * cellSize);

      // 3) total rows = fullRows + 1 for that leftover row
      //    (only if leftoverHeight > 0, otherwise it's an exact fit)
      let totalRows = leftoverHeight > 0 ? fullRows + 1 : fullRows;

      // Build the grid row by row
      for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < numCols; c++) {
          let x = c * cellSize;
          let y = r * cellSize;
          let w = cellSize;
          let h = cellSize;

          // If we're in the last row (r === fullRows), that row's height
          // is leftoverHeight instead of cellSize.
          if (r === fullRows && leftoverHeight > 0) {
            h = leftoverHeight;
          }

          result.push({ x, y, w, h });
        }
      }

      return result;
    }
  };

  // Create the p5 instance
  const p5Instance = new p5(sketch);

  // Define a method to set dark mode from external scripts
  p5Instance.setDarkMode = function(mode) {
    darkMode = mode;
    // Optionally, you can trigger a redraw or other updates if needed
  };

  return p5Instance;
};
