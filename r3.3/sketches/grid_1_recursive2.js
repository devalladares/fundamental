//----------------------------------------------------
// "Square-ish" Grid Driven by Both X and Y
// - Desktop: mouseX → columns, mouseY → rows
// - Mobile: mouseY → columns, mouseX → rows
//----------------------------------------------------
window.initExperiment = function() {
  let darkMode = false; // local state for dark mode

  // Simple device check (quick approach)
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  const sketch = (p) => {
    // Adjust these if you want smaller or bigger grids
    const MAX_COLS = 50;
    const MAX_ROWS = 50;

    p.setup = () => {
      const logo = document.getElementById("logo");
      let offset = logo ? logo.clientHeight : 0;
      p.createCanvas(p.windowWidth, p.windowHeight - offset);
    };

    p.draw = () => {
      p.background(darkMode ? 0 : 255);

      // Decide how to interpret X/Y based on device
      let valForCols, valForRows, rangeForCols, rangeForRows;

      if (isMobile()) {
        // Mobile: Y controls columns, X controls rows
        valForCols = p.mouseY;
        rangeForCols = p.height;
        valForRows = p.mouseX;
        rangeForRows = p.width;
      } else {
        // Desktop: X controls columns, Y controls rows
        valForCols = p.mouseX;
        rangeForCols = p.width;
        valForRows = p.mouseY;
        rangeForRows = p.height;
      }

      let numCols = p.map(valForCols, 0, rangeForCols, 1, MAX_COLS);
      let numRows = p.map(valForRows, 0, rangeForRows, 1, MAX_ROWS);

      numCols = p.constrain(numCols, 1, MAX_COLS);
      numRows = p.constrain(numRows, 1, MAX_ROWS);

      numCols = p.floor(numCols);
      numRows = p.floor(numRows);

      // Each cell's size
      let cellW = p.width / numCols;
      let cellH = p.height / numRows;

      // Draw the grid
      p.stroke(darkMode ? 255 : 0);
      p.strokeWeight(1);
      p.noFill();

      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          let x = c * cellW;
          let y = r * cellH;
          p.rect(x, y, cellW, cellH);
        }
      }
    };

    p.windowResized = () => {
      const logo = document.getElementById("logo");
      let offset = logo ? logo.clientHeight : 0;
      p.resizeCanvas(p.windowWidth, p.windowHeight - offset);
    };
  };

  // Create the p5 instance
  const p5Instance = new p5(sketch);

  // Expose a method to toggle darkMode from outside
  p5Instance.setDarkMode = function(mode) {
    darkMode = mode;
  };

  return p5Instance;
};
