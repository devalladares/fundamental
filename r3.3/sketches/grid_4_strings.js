window.initExperiment = function() {
  const sketch = (p) => {
    const Engine = Matter.Engine;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Constraint = Matter.Constraint;

    // Configuration
    const GRID = {
      ROWS: 15,
      COLS: 20,
      SEGMENTS: 60,    // Increased for smoother curves
      STIFFNESS: 1,  // Reduced for more fluid movement
      DAMPING: 0.05,   // Reduced for longer-lasting waves
      FORCE: 0.0055,   // Force applied on hover
      HOVER_RADIUS: 30 // Distance at which strings respond
    };

    let engine;
    let world;
    let horizontalStrings = [];
    let verticalStrings = [];
    let lastMouseX = 0;
    let lastMouseY = 0;

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      
      // Setup physics
      engine = Engine.create({
        enableSleeping: false // Keep strings active
      });
      world = engine.world;
      engine.gravity.y = 0;

      createStringGrid();
    };

    function createStringGrid() {
      // Create horizontal strings
      const rowSpacing = p.height / GRID.ROWS;
      for (let y = 0; y <= GRID.ROWS; y++) {
        horizontalStrings.push(
          createString(
            0, y * rowSpacing,
            p.width, y * rowSpacing,
            true
          )
        );
      }

      // Create vertical strings
      const colSpacing = p.width / GRID.COLS;
      for (let x = 0; x <= GRID.COLS; x++) {
        verticalStrings.push(
          createString(
            x * colSpacing, 0,
            x * colSpacing, p.height,
            false
          )
        );
      }
    }

    function createString(x1, y1, x2, y2, isHorizontal) {
      const points = [];
      const constraints = [];
      const length = p.dist(x1, y1, x2, y2);
      const segmentLength = length / GRID.SEGMENTS;

      // Create points with slight random offset for more natural movement
      for (let i = 0; i <= GRID.SEGMENTS; i++) {
        const x = p.lerp(x1, x2, i / GRID.SEGMENTS);
        const y = p.lerp(y1, y2, i / GRID.SEGMENTS);
        
        const point = Bodies.circle(x, y, 1, {
          friction: 0,
          frictionAir: GRID.DAMPING,
          mass: 0.1,
          restitution: 0.1 // Add some bounce
        });
        
        points.push(point);
        World.add(world, point);
      }

      // Connect points with constraints
      for (let i = 0; i < points.length - 1; i++) {
        const constraint = Constraint.create({
          bodyA: points[i],
          bodyB: points[i + 1],
          stiffness: GRID.STIFFNESS,
          length: segmentLength
        });
        
        constraints.push(constraint);
        World.add(world, constraint);
      }

      // Pin the endpoints with slightly looser constraints
      World.add(world, [
        Constraint.create({
          pointA: { x: x1, y: y1 },
          bodyB: points[0],
          stiffness: 0.95,
          length: 0
        }),
        Constraint.create({
          pointA: { x: x2, y: y2 },
          bodyB: points[points.length - 1],
          stiffness: 0.95,
          length: 0
        })
      ]);

      return { points, constraints };
    }

    p.draw = () => {
      p.background(255);
      Engine.update(engine);

      // Calculate mouse velocity for dynamic force
      const mouseVelX = p.mouseX - lastMouseX;
      const mouseVelY = p.mouseY - lastMouseY;
      const mouseSpeed = p.sqrt(mouseVelX * mouseVelX + mouseVelY * mouseVelY);
      lastMouseX = p.mouseX;
      lastMouseY = p.mouseY;

      // Draw all strings
      p.stroke(0);
      p.strokeWeight(1);
      p.noFill()

      function drawString(string) {
        p.beginShape();
        string.points.forEach(point => {
          p.vertex(point.position.x, point.position.y);
        });
        p.endShape();
      }

      // Handle hover interaction
      const mx = p.mouseX;
      const my = p.mouseY;

      // Apply forces based on mouse movement
      [...horizontalStrings, ...verticalStrings].forEach(string => {
        string.points.forEach(point => {
          const d = p.dist(mx, my, point.position.x, point.position.y);
          if (d < GRID.HOVER_RADIUS) {
            // Calculate force based on mouse speed and distance
            const forceMult = p.map(d, 0, GRID.HOVER_RADIUS, 1, 0);
            const speedMult = p.map(mouseSpeed, 0, 50, 0.5, 1.5);
            const force = GRID.FORCE * forceMult * speedMult;

            // Apply force perpendicular to string direction
            const angle = p.atan2(my - point.position.y, mx - point.position.x);
            Matter.Body.applyForce(point, point.position, {
              x: force * p.cos(angle),
              y: force * p.sin(angle)
            });
          }
        });
      });

      // Draw strings after applying forces
      horizontalStrings.forEach(drawString);
      verticalStrings.forEach(drawString);
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      World.clear(world, true);
      horizontalStrings = [];
      verticalStrings = [];
      createStringGrid();
    };
  };

  return new p5(sketch);
};