//----------------------------------------------------
//GRID DIVIDING//
// ----------------------------------------------------


window.initExperiment = function() {
  const sketch = (p) => {
    let grid1 = [];
    let maxDepth1 = 20;
    let initialRows1 = 2;
    let initialCols1 = 4;

    p.setup = () => {
      const logo = document.getElementById("logo");
      p.createCanvas(p.windowWidth, p.windowHeight - logo.clientHeight);
      initializeGrid1();
    };

    p.draw = () => {
      p.background(255);
      grid1.forEach((cell) => {
        p.stroke(0);
        p.strokeWeight(1);
        p.noFill();
        p.rect(cell.x, cell.y, cell.w, cell.h);
      });
    };

    p.mousePressed = () => {
      handleInteraction(p.mouseX, p.mouseY);
    };

    p.mouseMoved = () => {
      handleInteraction(p.mouseX, p.mouseY);
    };

    p.windowResized = () => {
      const logo = document.getElementById("logo");
      p.resizeCanvas(p.windowWidth, p.windowHeight - logo.clientHeight);
      initializeGrid1();
    };

    function handleInteraction(mx, my) {
      for (let i = grid1.length - 1; i >= 0; i--) {
        let cell = grid1[i];
        if (mx > cell.x && mx < cell.x + cell.w &&
            my > cell.y && my < cell.y + cell.h &&
            cell.depth < maxDepth1) {
          subdivide(cell, i);
          break;
        }
      }
    }

    function initializeGrid1() {
      grid1 = [];
      let cellWidth = p.width / initialCols1;
      let cellHeight = p.height / initialRows1;

      for (let r = 0; r < initialRows1; r++) {
        for (let c = 0; c < initialCols1; c++) {
          let x = c * cellWidth;
          let y = r * cellHeight;

          let w = (c === initialCols1 - 1) ? (p.width - x) : cellWidth;
          let h = (r === initialRows1 - 1) ? (p.height - y) : cellHeight;

          grid1.push({
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

      // Remove the existing cell
      grid1.splice(index, 1);

      // Push the four new subdivided cells
      grid1.push(
        { x: x,         y: y,         w: newW, h: newH, depth: depth + 1 },
        { x: x + newW,  y: y,         w: newW, h: newH, depth: depth + 1 },
        { x: x,         y: y + newH,  w: newW, h: newH, depth: depth + 1 },
        { x: x + newW,  y: y + newH,  w: newW, h: newH, depth: depth + 1 }
      );
    }
  };

  // Return the new p5 instance
  return new p5(sketch);
};
