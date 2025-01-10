window.initExperiment = function() {
  let darkMode = false;

  const sketch = (p) => {
    const GRID = {
      LATITUDE_LINES: 8,    
      LONGITUDE_LINES: 16,  
      SEGMENTS: 50,
      RADIUS: 350,         
      ROTATION_SPEED: 0.0008
    };

    let position = {
      x: 0,
      y: 0,
      z: 0
    };

    let rotation = {
      x: -0.3,
      y: 0.2,
      targetX: -0.3,
      targetY: 0.2
    };
    
    let allLines = [];

    p.setup = () => {
      // Create a WEBGL canvas & attach it to #canvas-container
      // so it sits above other content (like your logo).
      let canvas = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
      canvas.parent('canvas-container');

      generateLines();
    };

    function generateLines() {
      allLines = [];
      
      // Latitude lines
      for (let lat = -90; lat <= 90; lat += 180 / GRID.LATITUDE_LINES) {
        allLines.push({
          points: createLatitudeLine(lat),
          type: 'latitude',
          lat: lat,
          depth: p.sin(p.radians(lat)) * GRID.RADIUS
        });
      }

      // Longitude lines
      for (let lon = 0; lon < 360; lon += 360 / GRID.LONGITUDE_LINES) {
        allLines.push({
          points: createLongitudeLine(lon),
          type: 'longitude',
          lon: lon,
          depth: p.cos(p.radians(lon)) * GRID.RADIUS
        });
      }
    }

    function createLatitudeLine(lat) {
      const phi = p.radians(lat);
      const points = [];
      
      for (let i = 0; i <= GRID.SEGMENTS; i++) {
        const theta = p.map(i, 0, GRID.SEGMENTS, 0, p.TWO_PI);
        const x = GRID.RADIUS * p.cos(phi) * p.cos(theta);
        const y = GRID.RADIUS * p.cos(phi) * p.sin(theta);
        const z = GRID.RADIUS * p.sin(phi);
        points.push({x, y, z});
      }
      
      return points;
    }

    function createLongitudeLine(lon) {
      const theta = p.radians(lon);
      const points = [];
      
      for (let i = 0; i <= GRID.SEGMENTS; i++) {
        const phi = p.map(i, 0, GRID.SEGMENTS, -p.HALF_PI, p.HALF_PI);
        const x = GRID.RADIUS * p.cos(phi) * p.cos(theta);
        const y = GRID.RADIUS * p.cos(phi) * p.sin(theta);
        const z = GRID.RADIUS * p.sin(phi);
        points.push({x, y, z});
      }
      
      return points;
    }

    function getPointDepth(point, rotX, rotY) {
      const cosX = p.cos(rotX);
      const sinX = p.sin(rotX);
      const cosY = p.cos(rotY);
      const sinY = p.sin(rotY);

      let y2 = point.y * cosX - point.z * sinX;
      let z2 = point.y * sinX + point.z * cosX;
      let x3 = point.x * cosY + z2 * sinY;
      let z3 = -point.x * sinY + z2 * cosY;

      return z3;
    }

    p.draw = () => {
      // Clear frame to transparent, so underlying page/logo is visible
      p.clear();

      // Use stroke color based on dark mode
      if (darkMode) {
        p.stroke(255);
      } else {
        p.stroke(0);
      }
      p.strokeWeight(1);

      // Update rotation targets based on mouse
      if (p.mouseX !== 0 && p.mouseY !== 0) {
        const dx = p.mouseX - p.width/2;
        const dy = p.mouseY - p.height/2;
        rotation.targetY = dx * GRID.ROTATION_SPEED;
        rotation.targetX = -dy * GRID.ROTATION_SPEED;
      }

      // Smooth the rotation
      rotation.x += (rotation.targetX - rotation.x) * 0.1;
      rotation.y += (rotation.targetY - rotation.y) * 0.1;

      // Sort lines from back to front
      const transformedLines = allLines.map(line => {
        const avgDepth = line.points.reduce(
          (sum, pt) => sum + getPointDepth(pt, rotation.x, rotation.y), 0
        ) / line.points.length;
        return {...line, avgDepth};
      });
      transformedLines.sort((a, b) => ab.avgDepth - a.avgDepth);

      // Draw lines from back to front
      p.push();
      p.rotateX(rotation.x);
      p.rotateY(rotation.y);

      transformedLines.forEach(line => {
        p.beginShape();
        line.points.forEach(pt => {
          p.vertex(pt.x, pt.y, pt.z);
        });
        if (line.type === 'latitude') {
          p.endShape(p.CLOSE);
        } else {
          p.endShape();
        }
      });
      p.pop();
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
  };

  // Create and return the p5 instance
  const p5Instance = new p5(sketch);

  // Expose a dark mode toggle if needed
  p5Instance.setDarkMode = function(mode) {
    darkMode = mode;
  };

  return p5Instance;
};
