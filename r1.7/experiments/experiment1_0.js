//----------------------------------------------------
// Simple Grid (No Subdivision)
//----------------------------------------------------
window.initExperiment = function() {
    const sketch = (p) => {
      // We'll store cells in this array
      let grid = [];
  
      // How many rows and columns to begin with
      const initialRows = 2;
      const initialCols = 4;
  
      p.setup = () => {
        // If you have a logo element, you can offset by its height
        const logo = document.getElementById("logo");
        let offset = logo ? logo.clientHeight : 0;
        p.createCanvas(p.windowWidth, p.windowHeight - offset);
  
        initializeGrid();
      };
  
      p.draw = () => {
        p.background(255);
  
        // Draw each cell as a rectangle
        p.stroke(0);
        p.strokeWeight(1);
        p.noFill();
  
        grid.forEach((cell) => {
          p.rect(cell.x, cell.y, cell.w, cell.h);
        });
      };
  
      // Rebuild the grid if window is resized
      p.windowResized = () => {
        const logo = document.getElementById("logo");
        let offset = logo ? logo.clientHeight : 0;
        p.resizeCanvas(p.windowWidth, p.windowHeight - offset);
        initializeGrid();
      };
  
      // Create our initial grid with initialRows × initialCols
      function initializeGrid() {
        grid = [];
        let cellWidth = p.width / initialCols;
        let cellHeight = p.height / initialRows;
  
        for (let r = 0; r < initialRows; r++) {
          for (let c = 0; c < initialCols; c++) {
            let x = c * cellWidth;
            let y = r * cellHeight;
  
            // Ensure the last row/column fills any leftover space
            let w = (c === initialCols - 1) ? (p.width - x) : cellWidth;
            let h = (r === initialRows - 1) ? (p.height - y) : cellHeight;
  
            grid.push({
              x: x,
              y: y,
              w: w,
              h: h
            });
          }
        }
      }
    };
  
    return new p5(sketch);
  };
  