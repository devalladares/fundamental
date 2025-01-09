window.initExperiment = function() {
    const sketch = (p) => {
      //-------------------------
      // Matter.js Aliases
      //-------------------------
      const Engine = Matter.Engine;
      const World = Matter.World;
      const Bodies = Matter.Bodies;
      const Composite = Matter.Composite;
      const Constraint = Matter.Constraint;
      const Events = Matter.Events;
  
      //-------------------------
      // Configurable Constants
      //-------------------------
      const NUM_ROWS = 8;                // how many horizontal strings
      const NUM_COLS = 12;                // how many vertical strings
      const SEGMENTS_PER_STRING = 12;    // how many “links” each string has
      const STRING_THICKNESS = 4;        // visual thickness of each segment
      const FRICTION_AIR = 0.06;         // helps dampen motion
      const STIFFNESS = 1.0;             // how taut each string is
      const OSC_WAVEFORM = "sine";       // "sine", "triangle", "square", etc.
      // Frequencies for rows and columns
      const ROW_FREQS = [220, 261, 293, 329]; // A3, C4, D4, E4 (example)
      const COL_FREQS = [220, 261, 293, 329]; // same for columns, or pick different
  
      //-------------------------
      // Matter World Setup
      //-------------------------
      let engine;
      let world;
  
      // We'll store row “strings” and column “strings” in separate arrays
      // Each entry = { bodies[], constraints[], osc, env }
      let rowStrings = [];
      let colStrings = [];
  
      // A “mouse sensor” body for hover-based collision
      let mouseBody;
  
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
  
        // Attempt to start audio as soon as possible
        p.userStartAudio().catch((err) => {
          console.warn("Audio init error:", err);
        });
  
        // Initialize Matter.js
        engine = Engine.create();
        world = engine.world;
        // No gravity so strings stay taut
        engine.gravity.y = 0;
  
        // Build row strings
        for (let r = 0; r < NUM_ROWS; r++) {
          rowStrings.push(
            buildStringRow(r, NUM_ROWS, ROW_FREQS[r] || 220) // if array not long enough, default 220
          );
        }
  
        // Build column strings
        for (let c = 0; c < NUM_COLS; c++) {
          colStrings.push(
            buildStringCol(c, NUM_COLS, COL_FREQS[c] || 220)
          );
        }
  
        // Create a small sensor body for collisions (invisible in draw)
        mouseBody = Bodies.circle(p.mouseX, p.mouseY, 5, {
          isSensor: true,
          isStatic: true
        });
        Composite.add(world, mouseBody);
  
        // Listen for collisions
        Events.on(engine, "collisionStart", (event) => {
          let pairs = event.pairs;
          for (let pair of pairs) {
            if (pair.bodyA === mouseBody || pair.bodyB === mouseBody) {
              // Which body is NOT the mouse
              let collidedBody = (pair.bodyA === mouseBody) ? pair.bodyB : pair.bodyA;
              // Check if it belongs to a row string
              for (let rowStr of rowStrings) {
                let idx = rowStr.bodies.indexOf(collidedBody);
                if (idx !== -1) {
                  // Pluck that row's oscillator
                  pluck(rowStr);
                  break;
                }
              }
              // Check if it belongs to a column string
              for (let colStr of colStrings) {
                let idx = colStr.bodies.indexOf(collidedBody);
                if (idx !== -1) {
                  // Pluck that column's oscillator
                  pluck(colStr);
                  break;
                }
              }
            }
          }
        });
      };
  
      p.draw = () => {
        p.background(255);
  
        // Step Matter
        Engine.update(engine);
  
        // Update mouse body position
        Matter.Body.setPosition(mouseBody, { x: p.mouseX, y: p.mouseY });
  
        // Draw each row
        p.stroke(0);
        p.strokeWeight(2);
        for (let rowStr of rowStrings) {
          drawString(rowStr.bodies);
        }
  
        // Draw each column
        for (let colStr of colStrings) {
          drawString(colStr.bodies);
        }
      };
  
      //----------------------------------------------
      // Build a Horizontal String (Row)
      // rowIndex ranges 0..NUM_ROWS-1
      //----------------------------------------------
      function buildStringRow(rowIndex, totalRows, frequency) {
        // The row is pinned at x=0 and x=p.width, at some y
        let y = (rowIndex / (totalRows - 1)) * p.height;
        // In case totalRows=1, we fallback to y= p.height/2 
        // to avoid divide-by-zero.
        if (totalRows === 1) y = p.height / 2; 
  
        // Make sure it truly spans from left to right edges
        const startX = 0;
        const endX = p.width;
        const totalLen = endX - startX;
        const segLen = totalLen / SEGMENTS_PER_STRING;
  
        // Bodies array
        let bodies = [];
        for (let i = 0; i < SEGMENTS_PER_STRING; i++) {
          let xPos = startX + i * segLen + segLen / 2;
          let body = Bodies.rectangle(xPos, y, segLen, STRING_THICKNESS, {
            frictionAir: FRICTION_AIR,
            restitution: 0,
            density: 0.001,
          });
          bodies.push(body);
        }
        Composite.add(world, bodies);
  
        // Constraints
        let constraints = [];
        // Constrain each segment to the next
        for (let i = 0; i < bodies.length - 1; i++) {
          let c = Constraint.create({
            bodyA: bodies[i],
            bodyB: bodies[i + 1],
            length: segLen,
            stiffness: STIFFNESS,
          });
          constraints.push(c);
        }
        // Pin first and last
        let leftPin = Constraint.create({
          bodyA: bodies[0],
          pointB: { x: startX, y: y },
          length: 0,
          stiffness: STIFFNESS,
        });
        let rightPin = Constraint.create({
          bodyA: bodies[bodies.length - 1],
          pointB: { x: endX, y: y },
          length: 0,
          stiffness: STIFFNESS,
        });
        constraints.push(leftPin, rightPin);
        Composite.add(world, constraints);
  
        // Oscillator + Envelope for this row
        let osc = new p5.Oscillator(OSC_WAVEFORM);
        osc.freq(frequency);
        osc.amp(0);
        osc.start();
  
        let env = new p5.Envelope();
        // Quick pluck
        env.setADSR(0.01, 0.05, 0.0, 0.2);
  
        return { bodies, constraints, osc, env };
      }
  
      //----------------------------------------------
      // Build a Vertical String (Column)
      // colIndex ranges 0..NUM_COLS-1
      //----------------------------------------------
      function buildStringCol(colIndex, totalCols, frequency) {
        // The column is pinned at y=0 and y=p.height, at some x
        let x = (colIndex / (totalCols - 1)) * p.width;
        if (totalCols === 1) x = p.width / 2;
  
        const startY = 0;
        const endY = p.height;
        const totalLen = endY - startY;
        const segLen = totalLen / SEGMENTS_PER_STRING;
  
        let bodies = [];
        for (let i = 0; i < SEGMENTS_PER_STRING; i++) {
          let yPos = startY + i * segLen + segLen / 2;
          let body = Bodies.rectangle(x, yPos, STRING_THICKNESS, segLen, {
            frictionAir: FRICTION_AIR,
            restitution: 0,
            density: 0.001,
          });
          bodies.push(body);
        }
        Composite.add(world, bodies);
  
        // Constraints
        let constraints = [];
        for (let i = 0; i < bodies.length - 1; i++) {
          let c = Constraint.create({
            bodyA: bodies[i],
            bodyB: bodies[i + 1],
            length: segLen,
            stiffness: STIFFNESS,
          });
          constraints.push(c);
        }
        // Pin top and bottom
        let topPin = Constraint.create({
          bodyA: bodies[0],
          pointB: { x: x, y: startY },
          length: 0,
          stiffness: STIFFNESS,
        });
        let bottomPin = Constraint.create({
          bodyA: bodies[bodies.length - 1],
          pointB: { x: x, y: endY },
          length: 0,
          stiffness: STIFFNESS,
        });
        constraints.push(topPin, bottomPin);
        Composite.add(world, constraints);
  
        // Osc + Envelope
        let osc = new p5.Oscillator(OSC_WAVEFORM);
        osc.freq(frequency);
        osc.amp(0);
        osc.start();
  
        let env = new p5.Envelope();
        env.setADSR(0.01, 0.05, 0.0, 0.2);
  
        return { bodies, constraints, osc, env };
      }
  
      //----------------------------------------------
      // Draw a string by connecting consecutive bodies
      //----------------------------------------------
      function drawString(bodies) {
        for (let i = 0; i < bodies.length - 1; i++) {
          let bA = bodies[i];
          let bB = bodies[i + 1];
          p.line(bA.position.x, bA.position.y, bB.position.x, bB.position.y);
        }
      }
  
      //----------------------------------------------
      // "Pluck" = trigger this string's envelope quickly
      //----------------------------------------------
      function pluck(stringObj) {
        // Envelope triggers a quick pluck
        stringObj.osc.amp(stringObj.env);
        stringObj.env.play(stringObj.osc);
      }
  
      //----------------------------------------------
      // Resize Handler
      //----------------------------------------------
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        // In a robust approach, we'd rebuild everything or transform positions.
        // This simple example doesn't re-generate the grid on resize.
      };
    };
  
    return new p5(sketch);
  };
  