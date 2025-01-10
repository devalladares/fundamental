//----------------------------------------------------
// Grid-Based Pong with Color-Mixing & Mouse Control
// p5.js Instance Mode with Dark/Light Mode Toggle
//----------------------------------------------------
window.initExperiment = function() {
  let darkMode = false; // Local state for dark mode

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
    const MOUSE_REPEL_RADIUS = 150;
    const REPEL_STRENGTH = 0.005;
    
    let boxes = [];
    let engine, world;
    let cellW, cellH;
    let hasInteracted = false;
    let mouseConstraint;
    let canvasMouse;
    let hoveredBody = null;
    
    //----------------------------------------------------
    // p5 Setup
    //----------------------------------------------------
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
      setupMouseConstraint();
      
      // Disable all initial velocities and forces
      for (let b of boxes) {
        Body.setVelocity(b, { x: 0, y: 0 });
        Body.setAngularVelocity(b, 0);
        b.isStatic = true;
      }
      
      // Create Dark Mode Toggle Button
      createDarkModeToggle();
    };
    
    //----------------------------------------------------
    // p5 Draw
    //----------------------------------------------------
    p.draw = () => {
      // Set background based on dark mode
      p.background(darkMode ? 0 : 255);
      
      // Update mouse position for Matter.js
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
      
      // Only update physics if interaction has occurred
      if (hasInteracted) {
        Engine.update(engine);
        if (!mouseConstraint.body) {
          applyMouseRepel();
        }
      }
      
      // Set stroke based on dark mode
      p.stroke(darkMode ? 255 : 0);
      p.strokeWeight(1);
      
      for (let b of boxes) {
        let pos = b.position;
        let angle = b.angle;
        
        // Highlight box being hovered or dragged
        if (b === hoveredBody || mouseConstraint.body === b) {
          p.fill("#1C30C8"); // Highlight color remains the same
        } else {
          p.fill(darkMode ? 0 : 255); // Fill black in dark mode, white in light mode
        }
        
        p.push();
        p.translate(pos.x, pos.y);
        p.rotate(angle);
        p.rect(0, 0, cellW, cellH);
        p.pop();
      }
    };
    
    //----------------------------------------------------
    // Create Dark Mode Toggle Button
    //----------------------------------------------------
    function createDarkModeToggle() {
      // Create a button element
      const button = p.createButton('Toggle Dark Mode');
      button.position(20, 20);
      button.style('padding', '10px 20px');
      button.style('font-size', '16px');
      button.mousePressed(() => {
        toggleDarkMode();
        updateButtonStyle(button);
      });
      
      // Initial button style
      updateButtonStyle(button);
    }
    
    //----------------------------------------------------
    // Update Button Style Based on Dark Mode
    //----------------------------------------------------
    function updateButtonStyle(button) {
      if (darkMode) {
        button.style('background-color', '#333');
        button.style('color', '#fff');
      } else {
        button.style('background-color', '#ddd');
        button.style('color', '#000');
      }
    }
    
    //----------------------------------------------------
    // Toggle Dark Mode Function
    //----------------------------------------------------
    function toggleDarkMode() {
      darkMode = !darkMode;
    }
    
    //----------------------------------------------------
    // External Method to Set Dark Mode
    //----------------------------------------------------
    p.setDarkMode = (mode) => {
      darkMode = mode;
    };
    
    //----------------------------------------------------
    // Setup Mouse Constraint for Matter.js
    //----------------------------------------------------
    function setupMouseConstraint() {
      canvasMouse = Mouse.create(p.canvas.elt);
      
      // Set initial mouse position
      canvasMouse.position.x = p.mouseX;
      canvasMouse.position.y = p.mouseY;
      
      // Essential: Set the correct scaling for the mouse position
      canvasMouse.pixelRatio = 1;
      
      let mouseOptions = {
        mouse: canvasMouse,
        constraint: {
          stiffness: 0.2,
          render: {
            visible: false
          }
        }
      };
      
      mouseConstraint = MouseConstraint.create(engine, mouseOptions);
      Composite.add(world, mouseConstraint);
    }
    
    //----------------------------------------------------
    // Initialize the Grid of Boxes
    //----------------------------------------------------
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
    
    //----------------------------------------------------
    // Create Floor (Static Body)
    //----------------------------------------------------
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
    
    //----------------------------------------------------
    // Apply Mouse Repel Force to Boxes
    //----------------------------------------------------
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
    
    //----------------------------------------------------
    // Handle Mouse Interaction to Activate Physics
    //----------------------------------------------------
    // Modified to handle both mouse move and drag
    p.mouseMoved = p.mousePressed = () => {
      if (!hasInteracted) {
        hasInteracted = true;
        engine.world.gravity.y = 0.2;
        
        for (let b of boxes) {
          b.isStatic = false;
        }
      }
    };
    
    //----------------------------------------------------
    // Handle Window Resize
    //----------------------------------------------------
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      Composite.clear(world, false, true);
      hasInteracted = false;
      initializeGrid();
      createFloor();
      setupMouseConstraint();
      
      for (let b of boxes) {
        Body.setVelocity(b, { x: 0, y: 0 });
        Body.setAngularVelocity(b, 0);
        b.isStatic = true;
      }
    };
  };
  
  // Create and return the new p5 instance
  const p5Instance = new p5(sketch);
  
  return p5Instance;
};
