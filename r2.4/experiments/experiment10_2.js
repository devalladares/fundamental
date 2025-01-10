window.initExperiment = function() {
  const sketch = (p) => {
    const Engine = Matter.Engine;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const Body = Matter.Body;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;
    const Query = Matter.Query;
    
    const GRID_ROWS = 10;
    const GRID_COLS = 17;
    
    let boxes = [];
    let engine, world;
    let cellW, cellH;
    let mouseConstraint;
    let canvasMouse;
    let hoveredBody = null;
    
    p.setup = () => {
      let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.parent('canvas-container');
      p.rectMode(p.CENTER);
      
      // Initialize physics engine
      engine = Engine.create({
        gravity: { x: 0, y: 0.9 }
      });
      world = engine.world;
      
      initializeGrid();
      createFloor();
      setupMouseConstraint();
    };
    
    p.draw = () => {
      Engine.update(engine);
      p.clear();
      
      // Update mouse position
      if (canvasMouse) {
        canvasMouse.position.x = p.mouseX;
        canvasMouse.position.y = p.mouseY;
      }
      
      // Check for hovered box
      hoveredBody = null;
      let mousePos = { x: p.mouseX, y: p.mouseY };
      let bodiesUnderMouse = Query.point(boxes, mousePos);
      if (bodiesUnderMouse.length > 0) {
        hoveredBody = bodiesUnderMouse[0];
      }
      
      // Draw all boxes
      p.stroke(0);
      p.strokeWeight(1);
      
      for (let b of boxes) {
        let pos = b.position;
        let angle = b.angle;
        
        // Highlight box being hovered or dragged
        if (b === hoveredBody || mouseConstraint.body === b) {
          p.fill("#1C30C8");
        } else {
          p.fill(255);
        }
        
        p.push();
        p.translate(pos.x, pos.y);
        p.rotate(angle);
        p.rect(0, 0, cellW, cellH);
        p.pop();
      }
    };
    
    function setupMouseConstraint() {
      // Create mouse constraint with correct scaling
      canvasMouse = Mouse.create(p.canvas.elt);
      
      // Set initial mouse position
      canvasMouse.position.x = p.mouseX;
      canvasMouse.position.y = p.mouseY;
      
      // Essential: Set the scaling for the mouse position
      canvasMouse.pixelRatio = 1;
      
      let mouseOptions = {
        mouse: canvasMouse,
        constraint: {
          stiffness: 0.1,
          damping: 0.1,
          render: {
            visible: false
          }
        }
      };
      
      mouseConstraint = MouseConstraint.create(engine, mouseOptions);
      Composite.add(world, mouseConstraint);
    }
    
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
            friction: 0.1,
            restitution: 0.2,
            mass: 10,
            frictionAir: 0.05
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
        { 
          isStatic: true,
          friction: 0.3,
          restitution: 0.1
        }
      );
      Composite.add(world, floor);
    }
    
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      Composite.clear(world, false, true);
      initializeGrid();
      createFloor();
      setupMouseConstraint();
    };
  };
  
  return new p5(sketch);
};