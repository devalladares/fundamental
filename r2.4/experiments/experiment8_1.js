//----------------------------------------------------
// SEQUENCER WITH MOUSE DRAG AND DARK MODE
// CELLS TURN YELLOW WHEN ACTIVE
//----------------------------------------------------

window.initExperiment = function() {
  let darkMode = false; // Local state for dark mode

  const sketch = (p) => {
    //----------------------------------------------------
    // Configuration
    //----------------------------------------------------
    const rows = 8;   // Number of pitches/rows
    const cols = 14;  // Number of steps in time
    let cellWidth, cellHeight;

    // Sequencer speed (beats per minute)
    const bpm = 120;
    // Each column is treated as a 16th note at the given BPM.

    // Grid state: grid[r][c] is true if the cell is active
    let grid = [];

    // Current step (column) the playhead is on
    let currentStep = 0;

    // Frequencies for each row (adjust as needed)
    let freqs = [65, 82, 110, 146, 196, 220, 261, 329]; // Example frequencies

    // One oscillator + envelope (can be expanded per row if desired)
    let osc;
    let env;

    // p5.SoundLoop for timing
    let sequenceLoop;

    // Track the "toggle state" during mouse drag
    // Indicates if we are turning cells ON or OFF when dragging
    let dragToggleState = null; // Will be set to true or false when user first clicks

    //----------------------------------------------------
    // p5 Setup
    //----------------------------------------------------
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();

      // Calculate cell sizes
      cellWidth = p.width / cols;
      cellHeight = p.height / rows;

      // Initialize grid with all cells inactive (false)
      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          grid[r][c] = false;
        }
      }

      // Create oscillator and envelope
      osc = new p5.Oscillator('sine');
      osc.amp(0);
      osc.start();

      env = new p5.Envelope();
      env.setADSR(0.01, 0.1, 0.0, 0.1); // Quick pluck

      // Use p5.SoundLoop to time the sequence
      sequenceLoop = new p5.SoundLoop(onStep, "16n"); // 16th note
      sequenceLoop.bpm = bpm;
      sequenceLoop.start();

      // Attempt to start audio
      p.userStartAudio().catch((err) => {
        console.warn("Audio init error:", err);
      });
    };

    //----------------------------------------------------
    // p5 Draw
    //----------------------------------------------------
    p.draw = () => {
      // Set background based on dark mode
      p.background(darkMode ? 30 : 255); // Dark mode: dark gray; Light mode: white

      // Draw the grid
      p.strokeWeight(1);
      p.stroke(darkMode ? 200 : 0); // Stroke color based on mode

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Determine the fill color
          if (c === currentStep) {
            // This is the current playhead column
            if (grid[r][c]) {
              p.fill(darkMode ? "#FFD700" : "#FFD700"); // Yellow when active
            } else {
              p.fill(darkMode ? 80 : 240); // Unselected in current column
            }
          } else {
            // Not the current column
            if (grid[r][c]) {
              p.fill(darkMode ? "#E10000" : "#1C30C8"); // Selected cells
            } else {
              p.fill(darkMode ? 0 : 255); // Unselected cells
            }
          }

          // Draw the cell
          p.rect(c * cellWidth, r * cellHeight, cellWidth, cellHeight);
        }
      }
    };

    //----------------------------------------------------
    // p5 Mouse Press
    //----------------------------------------------------
    p.mousePressed = () => {
      // Attempt to start audio in user gesture
      p.userStartAudio();

      // Identify which cell was clicked
      let c = p.floor(p.mouseX / cellWidth);
      let r = p.floor(p.mouseY / cellHeight);

      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        // Set the dragToggleState to the opposite of the cell's current state
        // This allows dragging to fill all dragged-over cells with this new state
        dragToggleState = !grid[r][c];
        // Toggle the clicked cell
        grid[r][c] = dragToggleState;
      }
    };

    //----------------------------------------------------
    // p5 Mouse Dragged
    //----------------------------------------------------
    p.mouseDragged = () => {
      // If we haven't set dragToggleState, do nothing
      if (dragToggleState === null) return;

      let c = p.floor(p.mouseX / cellWidth);
      let r = p.floor(p.mouseY / cellHeight);

      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        // Set this cell to the dragToggleState
        grid[r][c] = dragToggleState;
      }
    };

    //----------------------------------------------------
    // p5 Mouse Released
    //----------------------------------------------------
    p.mouseReleased = () => {
      // Reset the dragToggleState
      dragToggleState = null;
    };

    //----------------------------------------------------
    // Sequencer Step (SoundLoop callback)
    //----------------------------------------------------
    function onStep(timeFromNow) {
      // Move the currentStep forward
      currentStep = (currentStep + 1) % cols;

      // For each row, if grid[r][currentStep] is true, play that pitch
      for (let r = 0; r < rows; r++) {
        if (grid[r][currentStep]) {
          playNote(freqs[r], timeFromNow);
        }
      }
    }

    //----------------------------------------------------
    // Play a Note
    //----------------------------------------------------
    function playNote(freq, time) {
      osc.freq(freq, 0.05); // Quick ramp to frequency
      osc.amp(env);          // Use envelope
      env.play(osc, time);
    }

    //----------------------------------------------------
    // Handle Window Resize
    //----------------------------------------------------
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      cellWidth = p.width / cols;
      cellHeight = p.height / rows;
    };
  };

  // Create the p5 instance
  const p5Instance = new p5(sketch);

  // Define a method to set dark mode from external scripts
  p5Instance.setDarkMode = function(mode) {
    darkMode = mode;
    // Optionally, trigger a redraw or other updates if needed
  };

  return p5Instance;
};
