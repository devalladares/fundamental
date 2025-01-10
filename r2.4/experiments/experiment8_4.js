window.initExperiment = function() {
  const sketch = (p) => {
    //----------------------------------------------------
    // Configuration
    //----------------------------------------------------
    const CONFIG = {
      grid: {
        ROWS: 15,
        COLS: 20,
        SEGMENTS: 5,
        STIFFNESS: 1.5,
        DAMPING: 0.15,
        FORCE: 0.0018,
        HOVER_RADIUS: 30
      },
      guitar: {
        NOTES: {
          E2: 82.41,
          A2: 110.00,
          D3: 146.83,
          G3: 196.00,
          B3: 246.94,
          E4: 329.63
        },
        OSCILLATORS_COUNT: 3,
        OSC_TYPE: 'triangle',
        ENV: {
          ADSR: [0.005, 0.1, 0.1, 0.5],
          RANGE: [0.3, 0]
        }
      },
      visual: {
        BACKGROUND_COLOR: 255,
        STRING_COLOR: 0,
        STRING_WEIGHT: 1,
        POINT_EFFECT: {
          SIZE_MULTIPLIER: 2,
          COLOR: [255, 255, 255, 100]
        },
        WIN_TEXT: {
          SIZE: 48,
          COLOR: 0,
          MESSAGE_OFFSET: 50
        }
      },
      scoring: {
        MAX_PLUCKS: 100
      }
    };

    //----------------------------------------------------
    // Color Mapping
    //----------------------------------------------------
    const colorMap = {
      "background": CONFIG.visual.BACKGROUND_COLOR,
      "string": CONFIG.visual.STRING_COLOR,
      "pointEffect": CONFIG.visual.POINT_EFFECT.COLOR,
      "winText": CONFIG.visual.WIN_TEXT.COLOR
    };

    //----------------------------------------------------
    // Game State
    //----------------------------------------------------
    let gameState = {
      plucks: 0,
      winner: null,
      pointEffect: {
        active: false,
        x: 0,
        y: 0,
        timer: 0
      }
    };

    let engine;
    let world;
    let horizontalStrings = [];
    let verticalStrings = [];
    let lastMouseX = 0;
    let lastMouseY = 0;
    let lastPluckTime = 0;

    let oscillators = [];
    let pluckEnv;

    //----------------------------------------------------
    // p5 Setup
    //----------------------------------------------------
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(CONFIG.visual.WIN_TEXT.SIZE);
      p.noFill();

      initializeAudio();
      initializePhysics();
      createStringGrid();
    };

    function initializeAudio() {
      p.userStartAudio();
      for (let i = 0; i < CONFIG.guitar.OSCILLATORS_COUNT; i++) {
        let osc = new p5.Oscillator(CONFIG.guitar.OSC_TYPE);
        osc.amp(0);
        osc.start();
        oscillators.push(osc);
      }

      pluckEnv = new p5.Envelope();
      pluckEnv.setADSR(...CONFIG.guitar.ENV.ADSR);
      pluckEnv.setRange(...CONFIG.guitar.ENV.RANGE);
    }

    function initializePhysics() {
      engine = Matter.Engine.create({
        enableSleeping: false
      });
      world = engine.world;
      engine.gravity.y = 0;
    }

    function createString(x1, y1, x2, y2, isHorizontal) {
      const points = [];
      const constraints = [];
      const length = p.dist(x1, y1, x2, y2);
      const segmentLength = length / CONFIG.grid.SEGMENTS;

      for (let i = 0; i <= CONFIG.grid.SEGMENTS; i++) {
        const x = p.lerp(x1, x2, i / CONFIG.grid.SEGMENTS);
        const y = p.lerp(y1, y2, i / CONFIG.grid.SEGMENTS);
        
        const point = Matter.Bodies.circle(x, y, 1, {
          friction: 0,
          frictionAir: CONFIG.grid.DAMPING,
          mass: 0.01,
          restitution: 0.01
        });
        
        points.push(point);
        Matter.World.add(world, point);
      }

      for (let i = 0; i < points.length - 1; i++) {
        const constraint = Matter.Constraint.create({
          bodyA: points[i],
          bodyB: points[i + 1],
          stiffness: CONFIG.grid.STIFFNESS,
          length: segmentLength
        });
        
        constraints.push(constraint);
        Matter.World.add(world, constraint);
      }

      Matter.World.add(world, [
        Matter.Constraint.create({
          pointA: { x: x1, y: y1 },
          bodyB: points[0],
          stiffness: 1,
          length: 0
        }),
        Matter.Constraint.create({
          pointA: { x: x2, y: y2 },
          bodyB: points[points.length - 1],
          stiffness: 1,
          length: 0
        })
      ]);

      return { points, constraints };
    }

    function playGuitarString(y) {
      const currentTime = p.millis();
      if (currentTime - lastPluckTime > 50) {
        const stringIndex = p.floor(p.map(y, 0, p.height, 0, Object.keys(CONFIG.guitar.NOTES).length));
        const notes = Object.values(CONFIG.guitar.NOTES);
        const baseFreq = notes[stringIndex % notes.length];
        
        oscillators[0].freq(baseFreq);
        oscillators[1].freq(baseFreq * 2);
        oscillators[2].freq(baseFreq * 3);
        
        oscillators.forEach(osc => pluckEnv.play(osc));
        lastPluckTime = currentTime;
        gameState.plucks++;
        if (gameState.plucks >= CONFIG.scoring.MAX_PLUCKS) {
          gameState.winner = 'Max Plucks Reached';
        }
        activatePointEffect(p.mouseX, p.mouseY);
      }
    }

    function activatePointEffect(x, y) {
      gameState.pointEffect = {
        active: true,
        x: x,
        y: y,
        timer: CONFIG.scoring.MAX_PLUCKS
      };
    }

    function createStringGrid() {
      const rowSpacing = p.height / CONFIG.grid.ROWS;
      for (let y = 0; y <= CONFIG.grid.ROWS; y++) {
        horizontalStrings.push(
          createString(0, y * rowSpacing, p.width, y * rowSpacing, true)
        );
      }

      const colSpacing = p.width / CONFIG.grid.COLS;
      for (let x = 0; x <= CONFIG.grid.COLS; x++) {
        verticalStrings.push(
          createString(x * colSpacing, 0, x * colSpacing, p.height, false)
        );
      }
    }

    //----------------------------------------------------
    // p5 Draw
    //----------------------------------------------------
    p.draw = () => {
      p.background(colorMap.background);
      if (gameState.winner) {
        drawWinScreen();
        return;
      }

      Matter.Engine.update(engine);
      calculateMouseVelocity();
      drawStrings();
      handlePlucking();
      drawPointEffect();
    };

    function calculateMouseVelocity() {
      gameState.mouseVelX = p.mouseX - lastMouseX;
      gameState.mouseVelY = p.mouseY - lastMouseY;
      gameState.mouseSpeed = p.sqrt(gameState.mouseVelX ** 2 + gameState.mouseVelY ** 2);
      lastMouseX = p.mouseX;
      lastMouseY = p.mouseY;
    }

    function drawStrings() {
      p.stroke(colorMap.string);
      p.strokeWeight(CONFIG.visual.STRING_WEIGHT);
      p.noFill();

      function renderString(string) {
        p.beginShape();
        string.points.forEach(point => {
          p.vertex(point.position.x, point.position.y);
        });
        p.endShape();
      }

      horizontalStrings.forEach(renderString);
      verticalStrings.forEach(renderString);
    }

    function handlePlucking() {
      if (gameState.mouseSpeed > 3) {
        const mx = p.mouseX;
        const my = p.mouseY;

        [...horizontalStrings, ...verticalStrings].forEach(string => {
          let stringPlucked = false;
          
          string.points.forEach(point => {
            const d = p.dist(mx, my, point.position.x, point.position.y);
            if (d < CONFIG.grid.HOVER_RADIUS) {
              const forceMult = p.map(d, 0, CONFIG.grid.HOVER_RADIUS, 1, 0);
              const force = CONFIG.grid.FORCE * forceMult * gameState.mouseSpeed;

              Matter.Body.applyForce(point, point.position, {
                x: gameState.mouseVelX * force * 0.001,
                y: gameState.mouseVelY * force * 0.001
              });

              if (!stringPlucked && gameState.mouseSpeed > 5) {
                playGuitarString(point.position.y);
                stringPlucked = true;
              }
            }
          });
        });
      }
    }

    function drawPointEffect() {
      if (gameState.pointEffect.active) {
        p.push();
        p.noStroke();
        p.fill(...CONFIG.visual.POINT_EFFECT.COLOR);
        p.ellipse(
          gameState.pointEffect.x,
          gameState.pointEffect.y,
          CONFIG.grid.SEGMENTS * CONFIG.visual.POINT_EFFECT.SIZE_MULTIPLIER
        );
        p.pop();
        gameState.pointEffect.timer -= p.deltaTime;
        if (gameState.pointEffect.timer <= 0) {
          gameState.pointEffect.active = false;
        }
      }
    }

    function drawWinScreen() {
      p.push();
      p.textSize(CONFIG.visual.WIN_TEXT.SIZE);
      p.fill(colorMap.winText);
      p.text(
        `${gameState.winner.toUpperCase()}!`,
        p.width / 2,
        p.height / 2
      );
      p.textSize(24);
      p.text(
        'Click to restart',
        p.width / 2,
        p.height / 2 + CONFIG.visual.WIN_TEXT.MESSAGE_OFFSET
      );
      p.pop();
    }

    //----------------------------------------------------
    // Mouse Interaction
    //----------------------------------------------------
    p.mousePressed = () => {
      if (gameState.winner) {
        resetGame();
      }
    };

    function resetGame() {
      Matter.World.clear(world, true);
      horizontalStrings = [];
      verticalStrings = [];
      createStringGrid();
      gameState.plucks = 0;
      gameState.winner = null;
    }

    //----------------------------------------------------
    // Window Resize
    //----------------------------------------------------
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      Matter.World.clear(world, true);
      horizontalStrings = [];
      verticalStrings = [];
      createStringGrid();

      oscillators.forEach(osc => osc.stop());
      oscillators = [];
      initializeAudio();
    };
  };

  return new p5(sketch);
};
