//----------------------------------------------------
// Dynamic "Mostly Square" Grid (Mouse/Tap-Driven Columns)
// - Desktop: controls # of columns via mouseX
// - Mobile: controls # of columns via mouseY
//----------------------------------------------------
window.initExperiment = function() {
  let darkMode = false; // local state for dark mode

  // Simple device check. 
  // Alternatively, you can rely on p5's "touches" array, 
  // but this snippet is a quick hack to differentiate mobile vs desktop.
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  const sketch = (p) => {
    const MAX_COLS = 60;  
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

      // Decide which axis to use
      // - Desktop uses X
      // - Mobile uses Y
      let inputValue;
      let inputRange;

      if (isMobile()) {
        inputValue = p.mouseY; 
        inputRange = p.height; // So we map from 0..height to 2..MAX_COLS
      } else {
        inputValue = p.mouseX;
        inputRange = p.width;  // So we map from 0..width to 2..MAX_COLS
      }

      let numCols = p.map(inputValue, 0, inputRange, 2, MAX_COLS);
      numCols = p.constrain(numCols, 2, MAX_COLS);
      numCols = p.floor(numCols);

      cells = buildGrid(numCols);

      p.stroke(darkMode ? 255 : 0);
      p.strokeWeight(1);
      p.noFill();

      for (let c of cells) {
        p.rect(c.x, c.y, c.w, c.h);
      }
    };

    p.windowResized = () => {
      const logo = document.getElementById("logo");
      let offset = logo ? logo.clientHeight : 0;
      p.resizeCanvas(p.windowWidth, p.windowHeight - offset);
    };

    // Helper to build an array of cells
    function buildGrid(numCols) {
      let result = [];

      let cellSize = p.width / numCols;
      let fullRows = p.floor(p.height / cellSize);
      let leftoverHeight = p.height - (fullRows * cellSize);
      let totalRows = leftoverHeight > 0 ? fullRows + 1 : fullRows;

      for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < numCols; c++) {
          let x = c * cellSize;
          let y = r * cellSize;
          let w = cellSize;
          let h = cellSize;

          // If it's the final leftover row
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

  // Expose a method to toggle darkMode from outside
  p5Instance.setDarkMode = function(mode) {
    darkMode = mode;
  };

  return p5Instance;
};
