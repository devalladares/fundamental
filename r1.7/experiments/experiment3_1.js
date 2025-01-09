//----------------------------------------------------
// Converted p5.js Instance Mode Code (Fixed)
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
    
    //----------------------------------------------------
    // Color System
    //----------------------------------------------------
    const BASE_COLORS = ["blue", "red", "yellow"];
    
    const colorMap = {
      "blue":               "#1C30C8",
      "red":                "#E10000",
      "yellow":             "#FFC832",
      "blue,red":           "#B103E6",
      "blue,yellow":        "#12B100",
      "red,yellow":         "#FB8805",
      "blue,red,yellow":    "#000000"
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
    
      // 2) Draw the grid with pixel-based color from overlapping blobs
      for (let cell of gridCells) {
        // Collect which base colors are present in this cell
        let colorSet = new Set();
    
        // Center of the cell
        let cx = cell.x + cell.w / 2;
        let cy = cell.y + cell.h / 2;
    
        // Check each blob — if the cell center is inside, add that blob's color
        for (let b of blobs) {
          if (pointInBlob(cx, cy, b)) {
            colorSet.add(b.baseColor);
          }
        }
    
        // Determine final color from colorMap (or white if none)
        let cellColor = getMixedColor(colorSet);
    
        // Fill each cell with the mixed color
        p.fill(cellColor.r, cellColor.g, cellColor.b);
        // Ensure we have a stroke here (black)
        p.stroke(GRID_STROKE_COLOR);
        p.strokeWeight(GRID_STROKE_WEIGHT);
        // Draw the cell
        p.rect(cell.x, cell.y, cell.w, cell.h);
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
      // Also spawn while dragging, for more fun
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
    
        // Randomly pick a base color from our set
        this.baseColor = p.random(BASE_COLORS);
      }
    
      update() {
        // Move the blob
        this.pos.add(this.vel);
    
        // Slight random angle change => more organic drift
        let angleChange = p.random(-0.03, 0.03);
        this.vel.rotate(angleChange);
    
        // Repel from mouse if within MOUSE_REPEL_RADIUS
        let distMouse = p.dist(this.pos.x, this.pos.y, p.mouseX, p.mouseY);
        if (distMouse < MOUSE_REPEL_RADIUS) {
          let force = p.createVector(this.pos.x - p.mouseX, this.pos.y - p.mouseY);
          let strength = p.map(distMouse, 0, MOUSE_REPEL_RADIUS, 0.1, 0);
          force.setMag(strength);
          this.vel.add(force);
        }
    
        // Bounce off canvas edges
        if (this.pos.x < 0 || this.pos.x > p.width) {
          this.vel.x *= -1;
        }
        if (this.pos.y < 0 || this.pos.y > p.height) {
          this.vel.y *= -1;
        }
    
        // Advance noise offset
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
    
      // Determine the angle from the blob center
      let angle = p.atan2(dy, dx);
      if (angle < 0) angle += p.TWO_PI;
    
      // The blob's radius at this angle
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
    // COLOR MIXING USING colorMap
    //----------------------------------------------------
    function getMixedColor(colorSet) {
      if (colorSet.size === 0) {
        return { r: 255, g: 255, b: 255 };
      }
      
      let sortedColors = Array.from(colorSet).sort().join(",");
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
