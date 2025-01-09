window.initExperiment = function() {
    const sketch = (p) => {
      const Engine = Matter.Engine;
      const Bodies = Matter.Bodies;
      const Composite = Matter.Composite;
      const Body = Matter.Body;
      
      const GRID_ROWS = 10;
      const GRID_COLS = 17;
      const MOUSE_REPEL_RADIUS = 150;
      const REPEL_STRENGTH = 0.005;
      
      let boxes = [];
      let engine, world;
      let cellW, cellH;
      let hasInteracted = false;  // Track if mouse has moved yet
      
      p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent('canvas-container');
        p.rectMode(p.CENTER);
        
        engine = Engine.create();
        world = engine.world;
        
        // Set gravity to 0 initially
        engine.world.gravity.y = 0;
        
        initializeGrid();
        createFloor();
        
        // Disable all initial velocities and forces
        for (let b of boxes) {
          Body.setVelocity(b, { x: 0, y: 0 });
          Body.setAngularVelocity(b, 0);
          // Make boxes static initially
          b.isStatic = true;
        }
      };
      
      p.draw = () => {
        p.clear();
        
        // Only update physics if interaction has occurred
        if (hasInteracted) {
          Engine.update(engine);
          applyMouseRepel();
        }
        
        p.stroke(0);
        p.strokeWeight(1);
        p.fill(255);
        
        for (let b of boxes) {
          let pos = b.position;
          let angle = b.angle;
          
          p.push();
          p.translate(pos.x, pos.y);
          p.rotate(angle);
          p.rect(0, 0, cellW, cellH);
          p.pop();
        }
      };
      
      function initializeGrid() {
        boxes = [];
        
        cellW = p.width / GRID_COLS;
        cellH = p.height / GRID_ROWS;
        
        const startY = p.height * 0.28;
        
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            let x = (c + 0.5) * cellW;
            let y = startY + (r * cellH);
            
            let box = Bodies.rectangle(x, y, cellW, cellH, {
              friction: 0.05,
              restitution: 0.3,
              mass: 1,
              frictionAir: 0.02
            });
            
            Composite.add(world, box);
            boxes.push(box);
          }
        }
      }
      
      function createFloor() {
        let thickness = 50;
        let floor = Bodies.rectangle(
          p.width / 2,
          p.height + thickness / 2,
          p.width * 3,
          thickness,
          { isStatic: true }
        );
        Composite.add(world, floor);
      }
      
      function applyMouseRepel() {
        let mx = p.mouseX;
        let my = p.mouseY;
        
        for (let b of boxes) {
          let bx = b.position.x;
          let by = b.position.y;
          let dx = bx - mx;
          let dy = by - my;
          let distSq = dx * dx + dy * dy;
          
          let radSq = MOUSE_REPEL_RADIUS * MOUSE_REPEL_RADIUS;
          if (distSq < radSq) {
            let distVal = p.sqrt(distSq);
            if (distVal > 0.0001) {
              let forceMag = p.map(distSq, 0, radSq, REPEL_STRENGTH, 0);
              let fx = (dx / distVal) * forceMag;
              let fy = (dy / distVal) * forceMag;
              Body.applyForce(b, { x: bx, y: by }, { x: fx, y: fy });
            }
          }
        }
      }
      
      // Add mousemoved event to trigger the animation
      p.mouseMoved = () => {
        if (!hasInteracted) {
          hasInteracted = true;
          
          // Enable physics
          engine.world.gravity.y = 0.2;
          
          // Make all boxes dynamic again
          for (let b of boxes) {
            b.isStatic = false;
          }
        }
      };
      
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        Composite.clear(world, false, true);
        hasInteracted = false;  // Reset interaction state
        initializeGrid();
        createFloor();
        
        // Reset boxes to static on resize
        for (let b of boxes) {
          Body.setVelocity(b, { x: 0, y: 0 });
          Body.setAngularVelocity(b, 0);
          b.isStatic = true;
        }
      };
    };
    
    return new p5(sketch);
};