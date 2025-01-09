window.initExperiment = function() {
    const sketch = (p) => {
      const Engine = Matter.Engine;
      const World = Matter.World;
      const Bodies = Matter.Bodies;
      const Composite = Matter.Composite;
      const Constraint = Matter.Constraint;
      const Events = Matter.Events;
  
      //-------------------------
      // Enhanced Configuration
      //-------------------------
      const NUM_ROWS = 6;                // More strings like a guitar
      const NUM_COLS = 6;                // More vertical strings for grid effect
      const SEGMENTS_PER_STRING = 20;    // More segments for smoother motion
      const STRING_THICKNESS = 2;        // Thinner strings look more realistic
      const FRICTION_AIR = 0.03;         // Less friction for longer vibration
      const STIFFNESS = 0.8;            // Slightly looser for more visible movement
      const OSC_WAVEFORM = "triangle";   // More guitar-like tone
      
      // Guitar-like frequencies (standard tuning)
      const ROW_FREQS = [82.41, 110, 146.83, 196, 246.94, 329.63]; // E2 to E4
      const COL_FREQS = [82.41, 110, 146.83, 196, 246.94, 329.63]; // Same for columns
      
      // Force configuration for plucking
      const PLUCK_FORCE = 0.05;         // How hard the string gets "pulled"
      const PLUCK_RADIUS = 10;          // How close to trigger a pluck
  
      let engine;
      let world;
      let rowStrings = [];
      let colStrings = [];
      let mouseBody;
      let lastPluckTime = 0;            // Prevent too-frequent plucks
  
      p.setup = () => {
        // Make canvas more square-ish
        const size = Math.min(p.windowWidth, p.windowHeight);
        p.createCanvas(size, size);
  
        p.userStartAudio().catch(console.warn);
  
        engine = Engine.create();
        world = engine.world;
        engine.gravity.y = 0;
  
        // Build strings
        for (let r = 0; r < NUM_ROWS; r++) {
          rowStrings.push(buildStringRow(r, NUM_ROWS, ROW_FREQS[r] || 220));
        }
        for (let c = 0; c < NUM_COLS; c++) {
          colStrings.push(buildStringCol(c, NUM_COLS, COL_FREQS[c] || 220));
        }
  
        mouseBody = Bodies.circle(p.mouseX, p.mouseY, PLUCK_RADIUS, {
          isSensor: true,
          isStatic: true
        });
        Composite.add(world, mouseBody);
  
        Events.on(engine, "collisionStart", handleCollision);
      };
  
      function handleCollision(event) {
        const currentTime = p.millis();
        // Prevent plucks that are too close together (50ms minimum)
        if (currentTime - lastPluckTime < 50) return;
  
        event.pairs.forEach(pair => {
          const stringBody = pair.bodyA === mouseBody ? pair.bodyB : pair.bodyA;
          if (!stringBody) return;
  
          // Apply force for visual effect
          const forceDir = {
            x: (p.mouseX - stringBody.position.x) * PLUCK_FORCE,
            y: (p.mouseY - stringBody.position.y) * PLUCK_FORCE
          };
          Matter.Body.applyForce(stringBody, stringBody.position, forceDir);
  
          // Find and pluck the corresponding string
          [...rowStrings, ...colStrings].forEach(str => {
            if (str.bodies.includes(stringBody)) {
              pluck(str);
              lastPluckTime = currentTime;
            }
          });
        });
      }
  
      p.draw = () => {
        p.background(255);  // Lighter background
        
        Engine.update(engine);
        Matter.Body.setPosition(mouseBody, { x: p.mouseX, y: p.mouseY });
  
        // Draw hover indicator
        p.noFill();
        p.stroke(200, 100, 100, 100);
        p.circle(p.mouseX, p.mouseY, PLUCK_RADIUS * 2);
  
        // Draw strings with gradient effect
        rowStrings.forEach(str => drawString(str.bodies, true));
        colStrings.forEach(str => drawString(str.bodies, false));
      };
  
      function buildStringRow(rowIndex, totalRows, frequency) {
        const y = (rowIndex + 1) * p.height / (totalRows + 1);
        const startX = p.width * 0.1;  // Inset 10% from edges
        const endX = p.width * 0.9;
        const totalLen = endX - startX;
        const segLen = totalLen / SEGMENTS_PER_STRING;
  
        let bodies = [];
        for (let i = 0; i < SEGMENTS_PER_STRING; i++) {
          let xPos = startX + i * segLen + segLen / 2;
          let body = Bodies.rectangle(xPos, y, segLen, STRING_THICKNESS, {
            frictionAir: FRICTION_AIR,
            restitution: 0.5,  // Add some bounce
            density: 0.001,
          });
          bodies.push(body);
        }
        Composite.add(world, bodies);
  
        let constraints = [];
        for (let i = 0; i < bodies.length - 1; i++) {
          constraints.push(Constraint.create({
            bodyA: bodies[i],
            bodyB: bodies[i + 1],
            length: segLen,
            stiffness: STIFFNESS,
            damping: 0.1
          }));
        }
        
        constraints.push(
          Constraint.create({
            bodyA: bodies[0],
            pointB: { x: startX, y },
            length: 0,
            stiffness: 1
          }),
          Constraint.create({
            bodyA: bodies[bodies.length - 1],
            pointB: { x: endX, y },
            length: 0,
            stiffness: 1
          })
        );
        
        Composite.add(world, constraints);
  
        let osc = new p5.Oscillator(OSC_WAVEFORM);
        osc.freq(frequency);
        osc.amp(0);
        osc.start();
  
        let env = new p5.Envelope();
        env.setADSR(0.001, 0.1, 0.1, 0.5);  // More guitar-like envelope
        
        return { bodies, constraints, osc, env };
      }
  
      function buildStringCol(colIndex, totalCols, frequency) {
        const x = (colIndex + 1) * p.width / (totalCols + 1);
        const startY = p.height * 0.1;
        const endY = p.height * 0.9;
        const totalLen = endY - startY;
        const segLen = totalLen / SEGMENTS_PER_STRING;
  
        let bodies = [];
        for (let i = 0; i < SEGMENTS_PER_STRING; i++) {
          let yPos = startY + i * segLen + segLen / 2;
          let body = Bodies.rectangle(x, yPos, STRING_THICKNESS, segLen, {
            frictionAir: FRICTION_AIR,
            restitution: 0.5,
            density: 0.001,
          });
          bodies.push(body);
        }
        Composite.add(world, bodies);
  
        let constraints = [];
        for (let i = 0; i < bodies.length - 1; i++) {
          constraints.push(Constraint.create({
            bodyA: bodies[i],
            bodyB: bodies[i + 1],
            length: segLen,
            stiffness: STIFFNESS,
            damping: 0.1
          }));
        }
        
        constraints.push(
          Constraint.create({
            bodyA: bodies[0],
            pointB: { x, y: startY },
            length: 0,
            stiffness: 1
          }),
          Constraint.create({
            bodyA: bodies[bodies.length - 1],
            pointB: { x, y: endY },
            length: 0,
            stiffness: 1
          })
        );
        
        Composite.add(world, constraints);
  
        let osc = new p5.Oscillator(OSC_WAVEFORM);
        osc.freq(frequency);
        osc.amp(0);
        osc.start();
  
        let env = new p5.Envelope();
        env.setADSR(0.001, 0.1, 0.1, 0.5);
        
        return { bodies, constraints, osc, env };
      }
  
      function drawString(bodies, isRow) {
        p.beginShape();
        p.noFill();
        const alpha = p.map(p.dist(p.mouseX, p.mouseY, bodies[0].position.x, bodies[0].position.y),
                           0, 50, 255, 100);
        p.stroke(0, alpha);
        p.strokeWeight(isRow ? 2 : 1);  // Horizontal strings slightly thicker
        
        bodies.forEach(body => {
          p.vertex(body.position.x, body.position.y);
        });
        p.endShape();
      }
  
      function pluck(stringObj) {
        stringObj
        .osc.amp(stringObj.env);
        stringObj.env.play(stringObj.osc);
      }
  
      p.windowResized = () => {
        const size = Math.min(p.windowWidth, p.windowHeight);
        p.resizeCanvas(size, size);
      };
    };
  
    return new p5(sketch);
};