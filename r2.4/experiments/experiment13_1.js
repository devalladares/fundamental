// We'll have 3 images side-by-side, each in a "column."
// On hover, that column expands while the others shrink.
//
// If you want a more “grid-like” approach (rows & columns), you can generalize 
// to multiple rows and animate row heights similarly.

window.initExperiment = function() {
    const sketch = (p) => {
      // How many columns? We'll fix it to 3 for this demo
      const NUM_COLS = 3;
  
      // Arrays to hold images and dynamic widths
      let imgs = [];
      let colWidths = [];        // current widths for each column
      let targetColWidths = [];  // target widths for each column
      let totalWidth;            // total drawing width (canvas width)
  
      // We’ll store references to image paths
      let imagePaths = ["image1.png", "image2.png", "image3.png"];
  
      // Preload images
      p.preload = () => {
        for (let i = 0; i < NUM_COLS; i++) {
          imgs[i] = p.loadImage(imagePaths[i]);
        }
      };
  
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
  
        // Initially, each column occupies an equal share
        totalWidth = p.width;
        for (let i = 0; i < NUM_COLS; i++) {
          colWidths[i] = totalWidth / NUM_COLS;
          targetColWidths[i] = totalWidth / NUM_COLS;
        }
      };
  
      p.draw = () => {
        p.background(255);
  
        // Animate the column widths toward their target
        for (let i = 0; i < NUM_COLS; i++) {
          colWidths[i] = p.lerp(colWidths[i], targetColWidths[i], 0.1);
        }
  
        // Draw columns and images
        let xCursor = 0; // where we draw the current column
        for (let i = 0; i < NUM_COLS; i++) {
          let w = colWidths[i];
          let h = p.height;
  
          // Draw a thin black rectangle border to keep a "grid" vibe
          p.stroke(0);
          p.strokeWeight(1);
          p.noFill();
          p.rect(xCursor, 0, w, h);
  
          // Draw the image inside that column
          p.imageMode(p.CENTER);
          // We'll fit the image in the column, 
          // but let's keep aspect ratio. We'll scale to column width or height, whichever is smaller
          let aspect = imgs[i].width / imgs[i].height;
          let scaledW = w * 0.9;  // 0.9 => small margin
          let scaledH = scaledW / aspect;
          if (scaledH > p.height * 0.9) {
            // If scaledH is too tall, reduce scaledW to fit
            scaledH = p.height * 0.9;
            scaledW = scaledH * aspect;
          }
          // Center of the column
          let centerX = xCursor + w / 2;
          let centerY = p.height / 2;
  
          p.image(imgs[i], centerX, centerY, scaledW, scaledH);
  
          // Update xCursor for the next column
          xCursor += w;
        }
      };
  
      // Check mouse hover to decide which column to enlarge
      p.mouseMoved = () => {
        // Figure out which column the mouse is currently over
        let xCursor = 0;
        let hoveredIndex = -1;
  
        for (let i = 0; i < NUM_COLS; i++) {
          let w = colWidths[i]; // or targetColWidths[i], but let's check real colWidths
          if (p.mouseX >= xCursor && p.mouseX < xCursor + w) {
            hoveredIndex = i;
            break;
          }
          xCursor += w;
        }
  
        // If we found a hovered column, set its target width bigger
        if (hoveredIndex !== -1) {
          // For example, hovered column gets 60% of total,
          // the other two share 40% (20% each).
          // Tweak these fractions to your preference
          targetColWidths.forEach((_, i) => {
            targetColWidths[i] = totalWidth * 0.2;
          });
          targetColWidths[hoveredIndex] = totalWidth * 0.6;
        } else {
          // If not hovering over any column, reset them all equal
          resetColWidths();
        }
      };
  
      // If mouse leaves the canvas, reset columns
      p.mouseOut = () => {
        resetColWidths();
      };
  
      // Helper to reset columns to equal share
      function resetColWidths() {
        for (let i = 0; i < NUM_COLS; i++) {
          targetColWidths[i] = totalWidth / NUM_COLS;
        }
      }
  
      // Handle window resizing
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        totalWidth = p.width;
        // Force an immediate reset so the new layout is consistent
        resetColWidths();
        // Also forcibly set current colWidths so we don't see weird transitions
        for (let i = 0; i < NUM_COLS; i++) {
          colWidths[i] = targetColWidths[i];
        }
      };
    };
  
    return new p5(sketch);
  };
  