//----------------------------------------------------
// Pixel Painting
//----------------------------------------------------


window.initExperiment = function() {
    // Wrap your code in an instance function:
    const sketch = (p) => {
      let grid = [];
      let rows = 15;
      let cols = 30;
  
      let paintColors = ["red", "yellow", "blue"];
      let colorIndex = 0;
  
      const colorMap = {
        "blue":               "#1C30C8",
        "red":                "#E10000",
        "yellow":             "#FFC832",
        "blue,red":           "#B103E6",  
        "blue,yellow":        "#12B100",
        "red,yellow":         "#FB8805",
        "blue,red,yellow":    "#000000"
      };
  
      p.setup = () => {
        const logo = document.getElementById("logo");
        p.createCanvas(p.windowWidth, p.windowHeight - logo.clientHeight);
        initializeGrid();
      };
  
      p.draw = () => {
        p.background(255);
        grid.forEach((cell) => {
          p.stroke(0);
          p.strokeWeight(1);
          p.fill(cell.color);
          p.rect(cell.x, cell.y, cell.w, cell.h);
        });
      };
  
      p.mousePressed = () => {
        // Cycle paint color
        colorIndex = (colorIndex + 1) % paintColors.length;
      };
  
      p.mouseMoved = () => {
        paintCell(p.mouseX, p.mouseY);
      };
  
      p.windowResized = () => {
        const logo = document.getElementById("logo");
        p.resizeCanvas(p.windowWidth, p.windowHeight - logo.clientHeight);
        initializeGrid();
      };
  
      function paintCell(mx, my) {
        for (let i = 0; i < grid.length; i++) {
          let cell = grid[i];
          if (mx >= cell.x && mx < cell.x + cell.w &&
              my >= cell.y && my < cell.y + cell.h) {
            cell.baseColors.add(paintColors[colorIndex]);
            cell.color = getMixedColor(cell.baseColors);
            break;
          }
        }
      }
  
      function getMixedColor(colorSet) {
        let sortedColors = Array.from(colorSet).sort().join(",");
        return colorMap[sortedColors] || "#FFFFFF";
      }
  
      function initializeGrid() {
        grid = [];
        let cellWidth = p.width / cols;
        let cellHeight = p.height / rows;
  
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            let x = c * cellWidth;
            let y = r * cellHeight;
  
            // Extend last row/col to edge
            let w = (c === cols - 1) ? (p.width - x) : cellWidth;
            let h = (r === rows - 1) ? (p.height - y) : cellHeight;
  
            grid.push({
              x: x,
              y: y,
              w: w,
              h: h,
              baseColors: new Set(),
              color: "#FFFFFF"
            });
          }
        }
      }
    };
  
    // Return the newly created p5 instance
    return new p5(sketch);
  };
  