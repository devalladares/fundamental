const dropdown = document.getElementById("experiment");
let currentScript = null;
let currentP5Instance = null; // We'll store the active p5 instance here

const experimentFiles = [
  "experiment1_1.js",
  "experiment1_2.js",
  "experiment1_3.js",
  "experiment2_1.js",
  // "experiment2_2.js",
  "experiment3_1.js",
  // "experiment3_2.js",
  "experiment4_1.js",
  "experiment4_2.js",
  "experiment4_3.js",
  "experiment4_4.js",
  "experiment5_1.js",
  "experiment6_1.js",
  "experiment7_1.js",
  "experiment7_2.js",
  "experiment7_3.js",
  "experiment8_1.js",
  "experiment8_2.js",
  "experiment9_1.js",
  "experiment10_1.js",
  "experiment11_1.js",
];

function populateDropdown() {
  const grouped = {};
  experimentFiles.forEach((file) => {
    const [experiment, variation] = file.replace(".js", "").split("_");
    if (!grouped[experiment]) grouped[experiment] = [];
    grouped[experiment].push(variation);
  });

  Object.keys(grouped).forEach((experiment) => {
    const optGroup = document.createElement("optgroup");
    optGroup.label = `Experiment ${experiment.replace("experiment", "")}`;

    grouped[experiment].forEach((variation) => {
      const option = document.createElement("option");
      option.value = `${experiment}_${variation}`;
      option.textContent = `Experiment ${experiment.replace("experiment", "")}.${variation}`;
      optGroup.appendChild(option);
    });

    dropdown.appendChild(optGroup);
  });
}

function loadExperiment(name) {
  // 1) Remove old <script>
  if (currentScript) {
    document.body.removeChild(currentScript);
    currentScript = null;
  }

  // 2) Remove old p5 canvas instance
  if (currentP5Instance) {
    currentP5Instance.remove(); 
    currentP5Instance = null;
  }

  // 3) (Optional) Clear out any leftover p5 globals
  if (window.noCanvas) {
    noCanvas();
  }
  const p5Functions = ["draw", "setup", "mousePressed", "mouseMoved", "windowResized"];
  p5Functions.forEach((fn) => {
    if (window[fn]) {
      delete window[fn];
    }
  });

  // 4) Remove leftover variables
  const globalVars = [
    "grid",
    "maxDepth",
    "initialRows",
    "initialCols",
    "initializeGrid",
    "subdivide",
    "handleInteraction",
  ];
  globalVars.forEach((v) => {
    if (window[v]) {
      delete window[v];
    }
  });

  // 5) Create & append new script
  currentScript = document.createElement("script");
  currentScript.src = `experiments/${name}.js`;
  currentScript.onload = () => {
    console.log(`${name}.js loaded successfully.`);

    // IMPORTANT: once loaded, call the function the script defines:
    if (typeof window.initExperiment === "function") {
      // This call returns the new p5 instance
      currentP5Instance = window.initExperiment();
    } else {
      console.error(`No initExperiment() found in ${name}.js`);
    }
  };
  currentScript.onerror = () => {
    console.error(`Failed to load script: ${currentScript.src}`);
  };
  document.body.appendChild(currentScript);
}

// Setup the dropdown
populateDropdown();
loadExperiment(dropdown.value);

// When dropdown changes...
dropdown.addEventListener("change", (event) => {
  loadExperiment(event.target.value);
});
