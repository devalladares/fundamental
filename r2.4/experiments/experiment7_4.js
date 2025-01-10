window.initExperiment = function() {
  let darkMode = false;

  const sketch = (p) => {
    const GRID_ROWS = 10;
    const GRID_COLS = 15;
    const CELL_STROKE = 0.5;
    const BLOCK_COUNT = 4;
    const STEP_OFFSET_X = 0.5;   
    const STEP_OFFSET_Y = -0.5;
    const LOGO_OFFSET = -20; // Adjust this to fine-tune grid position relative to logo

    // ... (previous variable declarations)

    p.setup = () => {
      let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.parent('canvas-container');
      p.noLoop();
      
      updateGridDimensions();
      generateBlocks();
    };

    function updateGridDimensions() {
      // Get logo element and calculate grid start position
      const logo = document.getElementById('logo');
      const logoHeight = logo ? logo.clientHeight : 0;
      const viewportHeight = window.innerHeight;
      
      // Calculate grid start position with offset
      gridStartY = (logoHeight / viewportHeight) * p.height * 0.8 + LOGO_OFFSET;
      
      // Calculate cell sizes for remaining space
      cellW = p.width / GRID_COLS;
      cellH = (p.height - gridStartY) / GRID_ROWS;
    }

    // ... (rest of the previous code remains the same)

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      updateGridDimensions();
      generateBlocks();
      p.redraw();
    };
  };

  // ... (rest of the code)
};