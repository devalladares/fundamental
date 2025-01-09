window.initExperiment = function() {
    const sketch = (p) => {
      const Engine = Matter.Engine;
      const Bodies = Matter.Bodies;
      const Composite = Matter.Composite;
      const Body = Matter.Body;
      
      const GRID_ROWS = 10;
      const GRID_COLS = 15;
      
      const MOUSE_REPEL_RADIUS = 150;
      const REPEL_STRENGTH = 0.005;
      
      let boxes = [];
      let engine, world;
      let cellW, cellH;
      
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.rectMode(p.CENTER);
        
        engine = Engine.create();
        world = engine.world;
        
        engine.world.gravity.y = 0.2;
        
        initializeGrid();
        createFloor();  // Just create the floor now
      };
      
      p.draw = () => {
        p.background(255);
        Engine.update(engine);
        applyMouseRepel();
        
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
        
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            let x = (c + 0.5) * cellW;
            let y = (r + 0.5) * cellH;
            
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
        
        // Only create the bottom wall (floor)
        let floor = Bodies.rectangle(
          p.width / 2,               // x position (center)
          p.height + thickness / 2,  // y position (just below canvas)
          p.width * 3,              // make it extra wide so boxes don't fall off edges
          thickness,                 // thickness
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
      
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        Composite.clear(world, false, true);
        initializeGrid();
        createFloor();  // Remember to recreate the floor on resize
      };
    };
    
    return new p5(sketch);
};