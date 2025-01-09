window.initExperiment = function() {
    const sketch = (p) => {
      // Number of rows & columns in the grid
      const rows = 20;
      const cols = 40;
  
      // Webcam capture
      let capture;
  
      // Color mapping dictionary
      const colorMapping = {
        "blue":               "#1C30C8",
        "red":                "#E10000",
        "yellow":             "#FFC832",
        "blue,red":           "#B103E6",
        "blue,yellow":        "#12B100",
        "red,yellow":         "#FB8805",
        "blue,red,yellow":    "#000000"
      };
  
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
  
        // Create webcam capture
        capture = p.createCapture(p.VIDEO);
        capture.size(320, 240);
        capture.hide(); // We'll manually draw/access it
  
        // Attempt audio start (not strictly needed here, but no harm)
        p.userStartAudio();
      };
  
      p.draw = () => {
        p.background(255);
        p.stroke(0);
        p.strokeWeight(1);
  
        // Call loadPixels *once*
        capture.loadPixels();
  
        // If the webcam isn't ready, pixels might be empty
        if (capture.pixels.length === 0) return;
  
        // Calculate cell width/height
        const cellW = p.width / cols;
        const cellH = p.height / rows;
  
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            // Coordinates on our canvas
            const x = c * cellW;
            const y = r * cellH;
  
            // Corresponding location in the video frame
            const vidX = p.map(c + 0.5, 0, cols, 0, capture.width - 1);
            const vidY = p.map(r + 0.5, 0, rows, 0, capture.height - 1);
  
            // Index in the pixel array
            const px = p.floor(vidX);
            const py = p.floor(vidY);
  
            const index = (px + py * capture.width) * 4;
            // Safe-check in case px/py is out of range
            if (index < 0 || index + 2 >= capture.pixels.length) {
              // If out of bounds, just fill white
              p.fill("#FFFFFF");
            } else {
              const rVal = capture.pixels[index + 0];
              const gVal = capture.pixels[index + 1];
              const bVal = capture.pixels[index + 2];
  
              // Classify color
              const fillColor = classifyColor(rVal, gVal, bVal);
              p.fill(fillColor);
            }
  
            // Draw cell
            p.rect(x, y, cellW, cellH);
          }
        }
      };
  
      // Classify the webcam pixel color into your categories
      function classifyColor(r, g, b) {
        const threshold = 100;
        let isBlue   = (b > threshold);
        let isRed    = (r > threshold);
        let isYellow = ((r + g) / 2 > threshold);
  
        let activeSet = [];
        if (isBlue)   activeSet.push("blue");
        if (isRed)    activeSet.push("red");
        if (isYellow) activeSet.push("yellow");
  
        let key = activeSet.sort().join(",");
  
        if (!key) return "#FFFFFF"; // fallback if none matched
        return colorMapping[key] || "#FFFFFF"; // fallback if combination isn't in dictionary
      }
  
      // Handle window resize
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };
  
    return new p5(sketch);
  };
  