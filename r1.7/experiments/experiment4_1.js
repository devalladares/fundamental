//----------------------------------------------------
// "Wiggly Grid" Experiment in p5.js Instance Mode
//----------------------------------------------------

window.initExperiment = function() {
  const sketch = (p) => {
    //----------------------------------------------------
    // Top-Level Variables (Tweak as desired)
    //----------------------------------------------------
    const GRID_ROWS          = 40;
    const GRID_COLS          = 60;
    const INITIAL_BLOB_COUNT = 15;
    
    const MIN_BLOB_RADIUS    = 50;
    const MAX_BLOB_RADIUS    = 100;
    
    const MIN_BLOB_SPEED     = 0.5;
    const MAX_BLOB_SPEED     = 2;
    
    const MOUSE_REPEL_RADIUS = 120;
    
    // How “blobby” the shape is (noise range)
    const NOISE_RADIUS_RANGE = 20;
    // Noise angle multiplier (bigger => more lumps)
    const NOISE_ANGLE_MULT   = 0.5;
    // Speed at which blob’s noise evolves
    const NOISE_TIME_SPEED   = 0.01;
    
    // Grid lines
    const GRID_STROKE_COLOR  = 0;     // 0 = black in grayscale
    const GRID_STROKE_WEIGHT = 0.5;
    
    // Extra Wiggly Grid Variables
    const GRID_WIGGLE_STRENGTH = 15;   // Max offset for wiggle
    const GRID_WIGGLE_FREQ     = 0.01; // Noise frequency
    
    //----------------------------------------------------
    // Color System
    //----------------------------------------------------
    const BASE_COLORS = ["blue", "red", "yellow"];
    
    // Mapped color combos
    const colorMap = {
      "blue":               "#fff",
      "red":                "#fff",
      "yellow":             "#fff",
      "blue,red":           "#fff",
      "blue,yellow":        "#fff",
      "red,yellow":         "#fff",
      "blue,red,yellow":    "#fff"
    };
    
    //----------------------------------------------------
    // Internal Globals
    //----------------------------------------------------
    let gridCells = [];
    let blobs = [];
    
    //----------------------------------------------------
    // p5 Setup
    //----------------------------------------------------
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      initializeGrid();
      
      // Spawn some blobs
      for (let i = 0; i < INITIAL_BLOB_COUNT; i++) {
        blobs.push(new Blob(p.random(p.width), p.random(p.height)));
      }
    };
    
    //----------------------------------------------------
    // p5 Draw
    //----------------------------------------------------
    p.draw = () => {
      p.background(255);
    
      // 1) Update each blob's position
      for (let b of blobs) {
        b.update();
      }
    
      // 2) Draw the (wiggly) grid with pixel-based color
      for (let cell of gridCells) {
        // Collect which base colors are present in this cell
        let colorSet = new Set();
    
        // Center of the cell (for blob detection)
        let cx = cell.x + cell.w / 2;
        let cy = cell.y + cell.h / 2;
    
        // See if any blob covers this cell center
        for (let b of blobs) {
          if (pointInBlob(cx, cy, b)) {
            colorSet.add(b.baseColor);
          }
        }
    
        // Determine final color from colorMap
        let cellColor = getMixedColor(colorSet);
        
        // -- Wiggle the grid cell position! --
        let noiseVal = p.noise(
          cell.x * GRID_WIGGLE_FREQ, 
          cell.y * GRID_WIGGLE_FREQ, 
          p.frameCount * GRID_WIGGLE_FREQ
        );
        let offsetX = p.map(noiseVal, 0, 1, -GRID_WIGGLE_STRENGTH, GRID_WIGGLE_STRENGTH);
        let offsetY = p.map(noiseVal, 0, 1, -GRID_WIGGLE_STRENGTH, GRID_WIGGLE_STRENGTH);
        
        // Fill + stroke each cell
        p.fill(cellColor.r, cellColor.g, cellColor.b);
        p.stroke(GRID_STROKE_COLOR);
        p.strokeWeight(GRID_STROKE_WEIGHT);
        
        // Draw wiggly rectangle
        p.rect(cell.x + offsetX, cell.y + offsetY, cell.w, cell.h);
      }
    };
    
    //----------------------------------------------------
    // Mouse Interaction
    //----------------------------------------------------
    p.mousePressed = () => {
      // Spawn a new blob at mouse position
      blobs.push(new Blob(p.mouseX, p.mouseY));
    };
    
    p.mouseDragged = () => {
      // Also spawn while dragging
      blobs.push(new Blob(p.mouseX, p.mouseY));
    };
    
    //----------------------------------------------------
    // Grid Functions
    //----------------------------------------------------
    function initializeGrid() {
      gridCells = [];
      let cellW = p.width / GRID_COLS;
      let cellH = p.height / GRID_ROWS;
    
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          let x = c * cellW;
          let y = r * cellH;
          // Last row/col might have leftover fractional space
          let w = (c === GRID_COLS - 1) ? p.width - x : cellW;
          let h = (r === GRID_ROWS - 1) ? p.height - y : cellH;
    
          gridCells.push({ x, y, w, h });
        }
      }
    }
    
    //----------------------------------------------------
    // Blob Class
    //----------------------------------------------------
    class Blob {
      constructor(x, y) {
        // Position & velocity
        this.pos = p.createVector(x, y);
        let speed = p.random(MIN_BLOB_SPEED, MAX_BLOB_SPEED);
        this.vel = p5.Vector.random2D().mult(speed);
    
        // Random base radius
        this.baseRadius = p.random(MIN_BLOB_RADIUS, MAX_BLOB_RADIUS);
    
        // Noise offset
        this.noiseOffset = p.random(10000);
    
        // Choose one of the base colors
        this.baseColor = p.random(BASE_COLORS);
      }
    
      update() {
        // Move blob
        this.pos.add(this.vel);
    
        // Small random angle => organic drift
        let angleChange = p.random(-0.03, 0.03);
        this.vel.rotate(angleChange);
    
        // Repel from mouse (if close enough)
        let distMouse = p.dist(this.pos.x, this.pos.y, p.mouseX, p.mouseY);
        if (distMouse < MOUSE_REPEL_RADIUS) {
          let force = p.createVector(this.pos.x - p.mouseX, this.pos.y - p.mouseY);
          let strength = p.map(distMouse, 0, MOUSE_REPEL_RADIUS, 0.1, 0);
          force.setMag(strength);
          this.vel.add(force);
        }
    
        // Bounce off edges
        if (this.pos.x < 0 || this.pos.x > p.width) {
          this.vel.x *= -1;
        }
        if (this.pos.y < 0 || this.pos.y > p.height) {
          this.vel.y *= -1;
        }
    
        // Advance noise offset (for shape lumps)
        this.noiseOffset += NOISE_TIME_SPEED;
      }
    }
    
    //----------------------------------------------------
    // POINT-IN-BLOB CHECK
    //----------------------------------------------------
    function pointInBlob(px, py, blob) {
      let dx = px - blob.pos.x;
      let dy = py - blob.pos.y;
      let distCenter = p.sqrt(dx * dx + dy * dy);
    
      // Angle from blob center
      let angle = p.atan2(dy, dx);
      if (angle < 0) angle += p.TWO_PI;
    
      let radiusAtAngle = getRadiusAtAngle(angle, blob);
      return distCenter <= radiusAtAngle;
    }
    
    function getRadiusAtAngle(angle, blob) {
      let noiseVal = p.noise(
        blob.noiseOffset + angle * NOISE_ANGLE_MULT,
        p.frameCount * NOISE_TIME_SPEED
      );
      let offset = p.map(noiseVal, 0, 1, -NOISE_RADIUS_RANGE, NOISE_RADIUS_RANGE);
      return blob.baseRadius + offset;
    }
    
    //----------------------------------------------------
    // COLOR MIXING (via colorMap)
    //----------------------------------------------------
    function getMixedColor(colorSet) {
      // White if no blobs
      if (colorSet.size === 0) {
        return { r: 255, g: 255, b: 255 };
      }
      // Sort & join color keys
      let sortedColors = Array.from(colorSet).sort().join(",");
      // Map to final hex
      let hex = colorMap[sortedColors] || "#000000";
      return hexToRGB(hex);
    }
    
    function hexToRGB(hexStr) {
      if (hexStr[0] === '#') {
        hexStr = hexStr.slice(1);
      }
      let r = parseInt(hexStr.slice(0, 2), 16);
      let g = parseInt(hexStr.slice(2, 4), 16);
      let b = parseInt(hexStr.slice(4, 6), 16);
      return { r, g, b };
    }
    
    //----------------------------------------------------
    // Handle Window Resize
    //----------------------------------------------------
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      initializeGrid();
    };
  };
  
  // Return the new p5 instance
  return new p5(sketch);
};
