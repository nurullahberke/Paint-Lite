// Global variables

// --- Core Drawing State ---
let currentTool = 'pen';
let penColorObj;
let bgColorObj;
let paths = [];
let tempPaths = [];
let currentDrawingPoints = [];
let isDrawing = false; // Aktif olarak bir çizgi çiziliyor mu?

// --- Brush & Eraser Sizes ---
const MIN_PEN_SIZE = 1;
const MAX_PEN_SIZE = 50;
const DEFAULT_PEN_SIZE = 5;
const MIN_ERASER_SIZE = 5;
const MAX_ERASER_SIZE = 100;
const DEFAULT_ERASER_SIZE = 20;
let currentPenSizeVal = DEFAULT_PEN_SIZE;
let currentEraserSizeVal = DEFAULT_ERASER_SIZE;

// --- Temporary Pen Behavior ---
let lastTempPenActivityTime = 0;
let isFadingTempPaths = false;
let tempPathsFadeStartTime = 0;
const TEMP_PEN_INACTIVITY_THRESHOLD = 1500;
const TEMP_PEN_FADE_DURATION = 1500;

// --- Drawing & Interaction Constants ---
const INTERPOLATION_STEP_SIZE = 1.5;
const LINE_ERASER_PROXIMITY = 15;

// --- UI Elements ---
let toolPanel;
let penModeButton, tempPenModeButton, eraserModeButton, lineEraserModeButton, panModeButton;
let penSizeSlider, eraserSizeSlider;
let penSizeValueDisplay, eraserSizeValueDisplay;
let penSizeControlGroup, eraserSizeControlGroup;
let penColorPicker, bgColorPicker;
let clearButton, saveButton; // 'saveButton' Eylemler'deki, 'saveDrawing' tuvali kaydeder
let sidebarToggleButton;
let themeToggleButton;
let penPresetButtons = {};
let presetContainerDiv;
let allSectionLabels = [];
let allColorPickerTextDivs = [];

// --- UI State ---
let isSidebarVisible = true;
const SIDEBAR_WIDTH = 260;
let activePresetId = null;

// --- History (Undo/Redo) ---
let undoStack = [];
let redoStack = [];
let undoButton, redoButton;

// --- Themes ---
const appleLightTheme = { /* ... (önceki gibi) ... */ name: 'light', canvasBg: [248, 248, 250], sidebarBg: 'rgba(242, 242, 247, 0.85)', sidebarBorder: 'rgba(180, 180, 185, 0.5)', textPrimary: 'rgb(28, 28, 30)', textSecondary: 'rgb(100, 100, 105)', buttonDefaultBg: 'rgba(120, 120, 128, 0.12)', buttonDefaultText: 'rgb(0, 122, 255)', buttonDefaultBorder: 'transparent', buttonDisabledBg: 'rgba(120, 120, 128, 0.08)', buttonDisabledText: 'rgba(60, 60, 67, 0.3)', sidebarToggleBg: 'rgba(120, 120, 128, 0.12)', sidebarToggleText: 'rgb(80,80,85)', themeToggleIcon: '🌙', themeToggleBg: 'rgba(120, 120, 128, 0.12)', themeToggleText: 'rgb(28, 28, 30)', accentColor: 'rgb(0, 122, 255)', accentText: 'white', sectionLabelFontWeight: '600', buttonFontWeight: '500', buttonBorderRadius: '8px', iconButtonSize: '40px',};
const appleDarkTheme = { /* ... (önceki gibi) ... */ name: 'dark', canvasBg: [28, 28, 30], sidebarBg: 'rgba(44, 44, 46, 0.85)', sidebarBorder: 'rgba(70, 70, 72, 0.7)', textPrimary: 'rgb(242, 242, 247)', textSecondary: 'rgb(150, 150, 155)', buttonDefaultBg: 'rgba(120, 120, 128, 0.24)', buttonDefaultText: 'rgb(10, 132, 255)', buttonDefaultBorder: 'transparent', buttonDisabledBg: 'rgba(120, 120, 128, 0.12)', buttonDisabledText: 'rgba(235, 235, 245, 0.3)', sidebarToggleBg: 'rgba(120, 120, 128, 0.24)', sidebarToggleText: 'rgb(180,180,185)', themeToggleIcon: '☀️', themeToggleBg: 'rgba(120, 120, 128, 0.24)', themeToggleText: 'rgb(242, 242, 247)', accentColor: 'rgb(10, 132, 255)', accentText: 'white', sectionLabelFontWeight: '600', buttonFontWeight: '500', buttonBorderRadius: '8px', iconButtonSize: '40px',};
let currentTheme;
let isDarkMode = false;

// --- Pen Presets ---
const penPresets = [
  { name: '1️⃣', color: [0, 0, 0], size: 2, id: 'preset1', toolType: 'pen' },
  { name: '2️⃣', color: [0, 122, 255], size: 8, id: 'preset2', toolType: 'tempPen' },
  { name: '3️⃣', color: [255, 204, 0], size: 15, id: 'preset3', toolType: 'pen' }
];

// --- Zoom and Pan Variables ---
let zoomLevel = 1.0;
let panX = 0;
let panY = 0;
const minZoom = 0.1;
const maxZoom = 10.0;
const zoomIncrement = 0.1;
let zoomControlsDiv;
let zoomInButton, zoomOutButton, resetViewButton;
let isPanning = false; // Aktif olarak pan yapılıyor mu?
let panStartX, panStartY; // Pan başlangıç ekran koordinatları
let initialPanX, initialPanY; // Pan başlangıcındaki canvas panX, panY değerleri

// --- Pointer/Canvas Variables ---
let canvas;
let isPointerCapture = false;


// ==================================================================
// SETUP FUNCTION
// ==================================================================
function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  pixelDensity(displayDensity());
  colorMode(RGB);
  document.body.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";

  // Pointer olayları (Tablet ve genel işaretçiler için)
  canvas.elt.addEventListener('pointerdown', handlePointerDown);
  canvas.elt.addEventListener('pointermove', handlePointerMove);
  canvas.elt.addEventListener('pointerup', handlePointerUp);
  canvas.elt.addEventListener('pointercancel', handlePointerUp); // Cancel da up gibi davranır
  canvas.elt.style.touchAction = 'none'; // Tarayıcı dokunma jestlerini engelle

  currentTheme = isDarkMode ? appleDarkTheme : appleLightTheme;
  penColorObj = color(0, 0, 0, 255);
  bgColorObj = color(currentTheme.canvasBg[0], currentTheme.canvasBg[1], currentTheme.canvasBg[2], 255);

  // --- Create UI Elements ---
  // Theme Toggle Button
  themeToggleButton = createButton(currentTheme.themeToggleIcon);
  themeToggleButton.size(parseInt(currentTheme.iconButtonSize), parseInt(currentTheme.iconButtonSize));
  themeToggleButton.mousePressed(toggleTheme);
  themeToggleButton.style('position', 'fixed'); themeToggleButton.style('top', '15px');
  themeToggleButton.style('right', '15px'); themeToggleButton.style('font-size', '20px');
  themeToggleButton.style('cursor', 'pointer'); themeToggleButton.style('z-index', '1000');
  themeToggleButton.style('text-align', 'center'); themeToggleButton.style('line-height', currentTheme.iconButtonSize);
  themeToggleButton.style('padding', '0');

  // Sidebar Toggle Button
  sidebarToggleButton = createButton(isSidebarVisible ? "❮" : "❯");
  sidebarToggleButton.size(parseInt(currentTheme.iconButtonSize) - 4, parseInt(currentTheme.iconButtonSize) - 4);
  sidebarToggleButton.position(15, 15); sidebarToggleButton.mousePressed(toggleSidebar);
  sidebarToggleButton.style('z-index', '100'); sidebarToggleButton.style('font-size', '16px');
  sidebarToggleButton.style('line-height', (parseInt(currentTheme.iconButtonSize) - 4) + 'px');

  // Tool Panel
  toolPanel = createDiv(''); toolPanel.position(0, 0); toolPanel.size(SIDEBAR_WIDTH, height);
  toolPanel.style('padding', '20px'); toolPanel.style('padding-top', '60px');
  toolPanel.style('box-sizing', 'border-box'); toolPanel.style('overflow-y', 'auto');
  toolPanel.style('transition', 'transform 0.3s ease-in-out, background-color 0.3s, border-color 0.3s');
  toolPanel.style('z-index', '50');
  if (!isSidebarVisible) { toolPanel.style('transform', `translateX(-${SIDEBAR_WIDTH}px)`); }

  // History Section
  createSectionLabel('Geçmiş', toolPanel);
  let historyDiv = createDiv(''); historyDiv.parent(toolPanel); historyDiv.style('margin-bottom', '15px');
  historyDiv.style('display', 'flex'); historyDiv.style('gap', '8px');
  undoButton = createStyledButton('↩️', historyDiv, undoLastAction, true);
  redoButton = createStyledButton('↪️', historyDiv, redoLastAction, true);

  // Pen Size Slider Section
  createSectionLabel('Kalem Boyutu', toolPanel);
  penSizeControlGroup = createDiv(''); penSizeControlGroup.parent(toolPanel);
  penSizeControlGroup.style('margin-bottom', '15px'); penSizeControlGroup.style('display', 'flex');
  penSizeControlGroup.style('align-items', 'center'); penSizeControlGroup.style('gap', '10px');
  penSizeSlider = createSlider(MIN_PEN_SIZE, MAX_PEN_SIZE, DEFAULT_PEN_SIZE, 1);
  penSizeSlider.parent(penSizeControlGroup); penSizeSlider.style('flex-grow', '1');
  penSizeSlider.input(() => {
    currentPenSizeVal = penSizeSlider.value();
    penSizeValueDisplay.html(`${currentPenSizeVal}px`);
    activePresetId = null; updateActiveButtonStyles();
  });
  penSizeValueDisplay = createSpan(`${DEFAULT_PEN_SIZE}px`);
  penSizeValueDisplay.parent(penSizeControlGroup);
  penSizeValueDisplay.style('min-width', '40px'); penSizeValueDisplay.style('text-align', 'right');

  // Eraser Size Slider Section
  createSectionLabel('Silgi Boyutu', toolPanel);
  eraserSizeControlGroup = createDiv(''); eraserSizeControlGroup.parent(toolPanel);
  eraserSizeControlGroup.style('margin-bottom', '15px'); eraserSizeControlGroup.style('display', 'flex');
  eraserSizeControlGroup.style('align-items', 'center'); eraserSizeControlGroup.style('gap', '10px');
  eraserSizeSlider = createSlider(MIN_ERASER_SIZE, MAX_ERASER_SIZE, DEFAULT_ERASER_SIZE, 1);
  eraserSizeSlider.parent(eraserSizeControlGroup); eraserSizeSlider.style('flex-grow', '1');
  eraserSizeSlider.input(() => {
    currentEraserSizeVal = eraserSizeSlider.value();
    eraserSizeValueDisplay.html(`${currentEraserSizeVal}px`);
    updateActiveButtonStyles();
  });
  eraserSizeValueDisplay = createSpan(`${DEFAULT_ERASER_SIZE}px`);
  eraserSizeValueDisplay.parent(eraserSizeControlGroup);
  eraserSizeValueDisplay.style('min-width', '40px'); eraserSizeValueDisplay.style('text-align', 'right');

  // Tools Section
  createSectionLabel('Araçlar', toolPanel);
  let commonToolsDiv = createDiv(''); commonToolsDiv.parent(toolPanel);
  commonToolsDiv.style('margin-bottom', '15px'); commonToolsDiv.style('display', 'flex');
  commonToolsDiv.style('gap', '8px');
  penModeButton = createStyledButton('✏️', commonToolsDiv, () => { currentTool = 'pen'; updateActiveButtonStyles(); }, true);
  tempPenModeButton = createStyledButton('💨', commonToolsDiv, () => { currentTool = 'tempPen'; lastTempPenActivityTime = millis(); updateActiveButtonStyles(); }, true);
  eraserModeButton = createStyledButton('🧼', commonToolsDiv, () => { currentTool = 'eraser'; updateActiveButtonStyles(); }, true);
  lineEraserModeButton = createStyledButton('✂️', commonToolsDiv, () => { currentTool = 'lineEraser'; updateActiveButtonStyles(); }, true);
  panModeButton = createStyledButton('✋', commonToolsDiv, () => { currentTool = 'pan'; updateActiveButtonStyles(); }, true);
  panModeButton.style('font-size', '22px');

  // Pen Presets Section
  createSectionLabel('Kalem Önayarları', toolPanel);
  presetContainerDiv = createDiv(''); presetContainerDiv.parent(toolPanel);
  presetContainerDiv.style('margin-bottom', '15px'); presetContainerDiv.style('display', 'flex');
  presetContainerDiv.style('flex-direction', 'column'); presetContainerDiv.style('gap', '8px');
  for (let i = 0; i < penPresets.length; i++) {
    const preset = penPresets[i];
    let presetRow = createDiv(''); presetRow.parent(presetContainerDiv);
    presetRow.style('display', 'flex'); presetRow.style('gap', '8px'); presetRow.style('align-items', 'center');
    penPresetButtons[preset.id] = createStyledButton(preset.name, presetRow, () => selectPenPreset(preset.id), true);
    penPresetButtons[preset.id].style('font-size', '20px'); penPresetButtons[preset.id].style('flex-grow', '1');
    let saveButtonForPreset = createStyledButton('💾', presetRow, () => saveToPreset(preset.id), true);
    saveButtonForPreset.style('font-size', '16px'); saveButtonForPreset.style('width', '30px');
    saveButtonForPreset.style('height', '30px'); saveButtonForPreset.style('padding', '0');
    saveButtonForPreset.style('line-height', '30px');
  }
  let presetInfoDiv = createDiv('Önayarı kullanmak için rakama, kaydetmek için 💾 simgesine tıklayın');
  presetInfoDiv.parent(presetContainerDiv); presetInfoDiv.style('font-size', '12px');
  presetInfoDiv.style('color', '#888'); presetInfoDiv.style('margin-top', '5px');
  presetInfoDiv.style('text-align', 'center');

  // Colors Section
  createSectionLabel('Renkler', toolPanel);
  let penColorDiv = createDiv('🖌️ Kalem Rengi: '); penColorDiv.parent(toolPanel);
  penColorDiv.style('margin-top', '10px'); penColorDiv.style('margin-bottom', '8px'); penColorDiv.style('font-size', '14px');
  allColorPickerTextDivs.push(penColorDiv);
  penColorPicker = createColorPicker(penColorObj); penColorPicker.parent(penColorDiv);
  penColorPicker.input(() => { penColorObj = penColorPicker.color(); activePresetId = null; updateActiveButtonStyles(); });
  penColorPicker.elt.style.verticalAlign = 'middle'; penColorPicker.elt.style.marginLeft = '10px';
  penColorPicker.elt.style.height = '28px'; penColorPicker.elt.style.width = '45px';

  let bgColorDiv = createDiv('🖼️ Zemin Rengi: '); bgColorDiv.parent(toolPanel);
  bgColorDiv.style('margin-top', '10px'); bgColorDiv.style('margin-bottom', '15px'); bgColorDiv.style('font-size', '14px');
  allColorPickerTextDivs.push(bgColorDiv);
  bgColorPicker = createColorPicker(bgColorObj); bgColorPicker.parent(bgColorDiv);
  bgColorPicker.input(() => { bgColorObj = bgColorPicker.color(); });
  bgColorPicker.elt.style.verticalAlign = 'middle'; bgColorPicker.elt.style.marginLeft = '10px';
  bgColorPicker.elt.style.height = '28px'; bgColorPicker.elt.style.width = '45px';

  // Actions Section
  createSectionLabel('Eylemler', toolPanel);
  let actionsDiv = createDiv(''); actionsDiv.parent(toolPanel); actionsDiv.style('margin-top', '5px');
  actionsDiv.style('display', 'flex'); actionsDiv.style('gap', '8px');
  clearButton = createStyledButton('🗑️', actionsDiv, () => {
    clearDrawing(); undoStack = []; redoStack = []; updateHistoryButtonStates();
  }, true);
  saveButton = createStyledButton('🖼️', actionsDiv, saveDrawing, true); // Tuvali PNG olarak kaydet
                                                                     // saveCurrentPreset'i çağıran ayrı bir 'Ayarları Kaydet' butonu da eklenebilir.

  // Zoom Controls
  zoomControlsDiv = createDiv(''); zoomControlsDiv.style('position', 'fixed');
  zoomControlsDiv.style('bottom', '20px'); zoomControlsDiv.style('right', '20px');
  zoomControlsDiv.style('display', 'flex'); zoomControlsDiv.style('gap', '8px');
  zoomControlsDiv.style('z-index', '1000');
  zoomInButton = createStyledButton('➕', zoomControlsDiv, zoomIn, true);
  zoomOutButton = createStyledButton('➖', zoomControlsDiv, zoomOut, true);
  resetViewButton = createStyledButton('🎯', zoomControlsDiv, resetView, true);

  // Initialize
  applyTheme();
  updateHistoryButtonStates();
  updateActiveButtonStyles();
}

// ==================================================================
// DRAW FUNCTION
// ==================================================================
function draw() {
  background(currentTheme.canvasBg[0], currentTheme.canvasBg[1], currentTheme.canvasBg[2]);
  let drawingAreaXOffset = isSidebarVisible ? SIDEBAR_WIDTH : 0;

  // Set cursor
  if (mouseX > drawingAreaXOffset && mouseX < width && mouseY > 0 && mouseY < height) {
    if (currentTool === 'pan') cursor(isPanning ? 'grabbing' : 'grab');
    else if (['pen', 'tempPen', 'eraser', 'lineEraser'].includes(currentTool)) cursor(CROSS);
    else cursor(ARROW);
  } else cursor(ARROW);

  push();
  translate(drawingAreaXOffset, 0); // Sidebar varsa çizim alanını kaydır
  fill(bgColorObj); noStroke(); rect(0, 0, width - drawingAreaXOffset, height); // Tuval arka planı
  translate(panX, panY); scale(zoomLevel); // Zoom ve Pan uygula

  // Temporary Pen Fade Logic
  if (currentTool === 'tempPen' && isDrawing) { // Eğer tempPen ile çiziliyorsa aktivite zamanını güncelle
    lastTempPenActivityTime = millis();
    if (isFadingTempPaths) { isFadingTempPaths = false; tempPaths.forEach(p => p.currentAlpha = alpha(p.color)); }
  }
  if (tempPaths.length > 0 && !isDrawing && !isFadingTempPaths && lastTempPenActivityTime !== 0 && (millis() - lastTempPenActivityTime > TEMP_PEN_INACTIVITY_THRESHOLD)) {
    isFadingTempPaths = true; tempPathsFadeStartTime = millis(); // Solmaya başla
  }
  if (isFadingTempPaths) {
    let fadeProgress = constrain((millis() - tempPathsFadeStartTime) / TEMP_PEN_FADE_DURATION, 0, 1);
    let allEffectivelyFaded = true;
    tempPaths.forEach(p => { p.currentAlpha = lerp(alpha(p.color), 0, fadeProgress); if (p.currentAlpha > 1) allEffectivelyFaded = false; });
    if (allEffectivelyFaded || fadeProgress >= 1) { tempPaths = []; isFadingTempPaths = false; lastTempPenActivityTime = 0; } // Tamamen solduysa temizle
  }

  // Draw Paths
  strokeCap(ROUND); strokeJoin(ROUND);
  paths.forEach(path => drawPathObject(path));
  tempPaths.forEach(path => { if (path.currentAlpha > 0) drawPathObject(path); });

  // Draw Preview of Current Drawing
  if (isDrawing && currentDrawingPoints.length > 0 && currentTool !== 'pan') {
    let previewColor = (currentTool === 'eraser') ? bgColorObj : penColorObj;
    let previewSize = (currentTool === 'eraser') ? currentEraserSizeVal : currentPenSizeVal;
    noFill(); stroke(previewColor); strokeWeight(previewSize);
    beginShape(); currentDrawingPoints.forEach(pt => vertex(pt.x, pt.y)); endShape();
  }
  pop();
}

function drawPathObject(pathData) {
  let displayColor = pathData.color;
  let r = red(displayColor), g = green(displayColor), b = blue(displayColor);
  let aVal = (pathData.tool === 'tempPen' && typeof pathData.currentAlpha !== 'undefined') ? pathData.currentAlpha : alpha(displayColor);
  stroke(r, g, b, aVal); strokeWeight(pathData.size); noFill();
  beginShape(); pathData.points.forEach(pt => vertex(pt.x, pt.y)); endShape();
}

// ==================================================================
// EVENT HANDLING (Shared Logic)
// ==================================================================
function isClickOnUIElement(clientX, clientY) {
  // Check Theme Toggle Button
  if (themeToggleButton && clientX >= themeToggleButton.x && clientX <= themeToggleButton.x + themeToggleButton.width && clientY >= themeToggleButton.y && clientY <= themeToggleButton.y + themeToggleButton.height) return true;
  // Check Sidebar Toggle Button
  if (sidebarToggleButton && clientX >= sidebarToggleButton.x && clientX <= sidebarToggleButton.x + sidebarToggleButton.width && clientY >= sidebarToggleButton.y && clientY <= sidebarToggleButton.y + sidebarToggleButton.height) return true;
  // Check Zoom Controls
  let zoomControlsArr = [zoomInButton, zoomOutButton, resetViewButton];
  for (let btn of zoomControlsArr) {
    if (btn && clientX >= btn.x && clientX <= btn.x + btn.width && clientY >= btn.y && clientY <= btn.y + btn.height) return true;
  }
  return false;
}

function initiateDrawingOrPanning(clientX, clientY, worldX, worldY) {
  if (currentTool === 'pan') {
    isPanning = true;
    isDrawing = false; // Pan yaparken çizim olmamalı
    panStartX = clientX; // Ekran koordinatları
    panStartY = clientY; // Ekran koordinatları
    initialPanX = panX;
    initialPanY = panY;
    return;
  }

  isDrawing = true;
  isPanning = false; // Çizim yaparken pan olmamalı
  currentDrawingPoints = [];
  currentDrawingPoints.push({ x: worldX, y: worldY });

  if (currentTool === 'lineEraser') {
    applyLineEraser(worldX, worldY);
    isDrawing = false; // Line eraser tek tıklamalı
    return;
  }

  if (currentTool === 'tempPen') {
    lastTempPenActivityTime = millis();
    if (isFadingTempPaths) { isFadingTempPaths = false; }
    tempPaths.forEach(p => { p.currentAlpha = alpha(p.color); });
  }
}

function processDrawingOrPanning(clientX, clientY, worldX, worldY) {
  if (isPanning) { // Sadece pan aktifse
    let dx = clientX - panStartX;
    let dy = clientY - panStartY;
    panX = initialPanX + dx;
    panY = initialPanY + dy;
    return;
  }

  if (isDrawing) { // Sadece çizim aktifse (pan değil)
    if (currentDrawingPoints.length > 0) {
      let prevPoint = currentDrawingPoints[currentDrawingPoints.length - 1];
      let d = dist(prevPoint.x, prevPoint.y, worldX, worldY);
      if (d > INTERPOLATION_STEP_SIZE / 2) {
        let numSteps = max(1, floor(d / INTERPOLATION_STEP_SIZE));
        for (let i = 1; i <= numSteps; i++) {
          let t = i / numSteps;
          currentDrawingPoints.push({ x: lerp(prevPoint.x, worldX, t), y: lerp(prevPoint.y, worldY, t) });
        }
      } else if (d > 0 && currentDrawingPoints.length === 1) {
        currentDrawingPoints.push({ x: worldX, y: worldY });
      }
    } else {
      currentDrawingPoints.push({ x: worldX, y: worldY });
    }

    if (currentTool === 'tempPen') {
      lastTempPenActivityTime = millis();
      if (isFadingTempPaths) { isFadingTempPaths = false; tempPaths.forEach(p => p.currentAlpha = alpha(p.color)); }
    }
  }
}

function finalizePath(pointsArray) {
  if (pointsArray.length > 1) {
    let pathColor, pathSize, newPathTool = currentTool, targetArrayName;
    if (currentTool === 'eraser') {
      pathColor = color(red(bgColorObj), green(bgColorObj), blue(bgColorObj), 255); // Always opaque eraser
      pathSize = currentEraserSizeVal;
      targetArrayName = 'paths';
    } else if (currentTool === 'pen') {
      pathColor = color(red(penColorObj), green(penColorObj), blue(penColorObj), alpha(penColorObj));
      pathSize = currentPenSizeVal;
      targetArrayName = 'paths';
    } else if (currentTool === 'tempPen') {
      pathColor = color(red(penColorObj), green(penColorObj), blue(penColorObj), alpha(penColorObj));
      pathSize = currentPenSizeVal;
      targetArrayName = 'tempPaths';
    } else {
      return; // Should not happen if tool is valid
    }
    let newPath = { points: [...pointsArray], color: pathColor, size: pathSize, tool: newPathTool };
    if (targetArrayName === 'tempPaths') {
      newPath.currentAlpha = alpha(pathColor); tempPaths.push(newPath); lastTempPenActivityTime = millis();
    } else if (targetArrayName === 'paths') {
      paths.push(newPath);
    }
    undoStack.push({ pathRef: newPath, arrayName: targetArrayName });
    redoStack = [];
    updateHistoryButtonStates();
  }
}

function finalizeDrawingOrPanning() {
  if (isPanning) {
    isPanning = false;
    // Pan sonrası özel bir işlem gerekirse buraya eklenebilir
    return;
  }
  if (isDrawing) { // currentTool !== 'pan' kontrolü initiateDrawingOrPanning içinde yapıldığı için burada gereksiz
    isDrawing = false;
    finalizePath(currentDrawingPoints);
  }
  currentDrawingPoints = []; // Her durumda temizle
}

// ==================================================================
// P5.JS MOUSE EVENTS (Calling shared logic)
// ==================================================================
function mousePressed() {
  if (isClickOnUIElement(mouseX, mouseY)) return;

  let drawingAreaXOffset = isSidebarVisible ? SIDEBAR_WIDTH : 0;
  if (mouseX > drawingAreaXOffset && mouseButton === LEFT) { // Sadece sol tık ve çizim alanında
    let worldCoords = getMouseWorldCoordinates(); // mouseX, mouseY kullanır
    initiateDrawingOrPanning(mouseX, mouseY, worldCoords.x, worldCoords.y);
  }
}

function mouseDragged() {
  let drawingAreaXOffset = isSidebarVisible ? SIDEBAR_WIDTH : 0;
  if (mouseX > drawingAreaXOffset) { // Sadece çizim alanında ise (pan veya draw için)
    let worldCoords = getMouseWorldCoordinates();
    processDrawingOrPanning(mouseX, mouseY, worldCoords.x, worldCoords.y);
  }
}

function mouseReleased() {
  finalizeDrawingOrPanning();
}

// ==================================================================
// POINTER EVENTS (Calling shared logic)
// ==================================================================
function handlePointerDown(e) {
  e.preventDefault();
  if (e.pointerType === 'pen') {
    try { canvas.elt.setPointerCapture(e.pointerId); isPointerCapture = true; }
    catch (err) { console.log("Pointer yakalama başarısız:", err); }
  }

  if (isClickOnUIElement(e.clientX, e.clientY)) return;

  let drawingAreaXOffset = isSidebarVisible ? SIDEBAR_WIDTH : 0;
  if (e.clientX > drawingAreaXOffset) { // Sadece çizim alanında
    let worldCoords = getPointerWorldCoordinates(e.clientX, e.clientY);
    initiateDrawingOrPanning(e.clientX, e.clientY, worldCoords.x, worldCoords.y);
  }
}

function handlePointerMove(e) {
  e.preventDefault();
  let drawingAreaXOffset = isSidebarVisible ? SIDEBAR_WIDTH : 0;
  if (e.clientX > drawingAreaXOffset) { // Sadece çizim alanında
    let worldCoords = getPointerWorldCoordinates(e.clientX, e.clientY);
    processDrawingOrPanning(e.clientX, e.clientY, worldCoords.x, worldCoords.y);
  }
}

function handlePointerUp(e) {
  e.preventDefault();
  if (isPointerCapture) {
    try { canvas.elt.releasePointerCapture(e.pointerId); isPointerCapture = false; }
    catch (err) { console.log("Pointer serbest bırakma başarısız:", err); }
  }
  finalizeDrawingOrPanning();
}

// ==================================================================
// COORDINATE TRANSFORMATION
// ==================================================================
function getPointerWorldCoordinates(clientX, clientY) {
    let drawingAreaXOffset = isSidebarVisible ? SIDEBAR_WIDTH : 0;
    let mouseRelativeToDrawingAreaX = clientX - drawingAreaXOffset;
    return { x: (mouseRelativeToDrawingAreaX - panX) / zoomLevel, y: (clientY - panY) / zoomLevel };
}

function getMouseWorldCoordinates() { // Uses p5.js global mouseX, mouseY
    let drawingAreaXOffset = isSidebarVisible ? SIDEBAR_WIDTH : 0;
    let mouseRelativeToDrawingAreaX = mouseX - drawingAreaXOffset;
    return { x: (mouseRelativeToDrawingAreaX - panX) / zoomLevel, y: (mouseY - panY) / zoomLevel };
}

// ==================================================================
// UI HELPER FUNCTIONS
// ==================================================================
function styleButtonBasic(btn, bg, textColor, border, borderRadius, fontWeight, fontSize = '13px', minW = 'auto', padding = '8px 10px') {
    btn.style('background-color', bg); btn.style('color', textColor); btn.style('border', border);
    btn.style('border-radius', borderRadius); btn.style('font-weight', fontWeight);
    btn.style('font-size', fontSize); btn.style('min-width', minW); btn.style('padding', padding);
    btn.style('cursor', 'pointer'); btn.style('box-shadow', 'none');
}

function toggleSidebar() {
  isSidebarVisible = !isSidebarVisible;
  if (isSidebarVisible) { toolPanel.style('transform', 'translateX(0%)'); sidebarToggleButton.html("❮"); }
  else { toolPanel.style('transform', `translateX(-${SIDEBAR_WIDTH}px)`); sidebarToggleButton.html("❯"); }
  // Sidebar değiştiğinde çizim alanının x ofseti değiştiği için pan/zoom'u yeniden hesaplamak gerekebilir
  // veya kullanıcıya bir uyarı verilebilir. Şimdilik basit tutuyoruz.
}

function createSectionLabel(labelText, parentDiv) {
  let label = createP(labelText); label.parent(parentDiv);
  label.style('font-size', '1.05em'); label.style('margin-top', '25px');
  label.style('margin-bottom', '12px'); label.style('padding-bottom', '0px');
  allSectionLabels.push(label); return label;
}

function createStyledButton(label, parent, callback, isIconOnly = false) {
  let btn = createButton(label); if (parent) btn.parent(parent);
  btn.mousePressed(callback); btn.style('text-align', 'center');
  btn.style('transition', 'filter 0.1s ease-in-out, background-color 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s');
  if (isIconOnly) {
    btn.style('width', currentTheme.iconButtonSize); btn.style('height', currentTheme.iconButtonSize);
    btn.style('padding', '0'); btn.style('font-size', '18px');
    if (label === '✋') btn.style('font-size', '22px');
    btn.style('line-height', currentTheme.iconButtonSize);
  } else {
    btn.style('padding', '10px 15px'); btn.style('min-width', '80px'); btn.style('font-size', '14px');
  }
  btn.mouseOver(() => { if (!btn.attribute('disabled')) btn.style('filter', 'brightness(90%)'); });
  btn.mouseOut(() => { if (!btn.attribute('disabled')) btn.style('filter', 'brightness(100%)'); });
  return btn;
}

function toggleTheme() {
  isDarkMode = !isDarkMode; currentTheme = isDarkMode ? appleDarkTheme : appleLightTheme;
  let currentBgPickerColor = [red(bgColorPicker.color()), green(bgColorPicker.color()), blue(bgColorPicker.color())];
  let lightThemeBg = appleLightTheme.canvasBg, darkThemeBg = appleDarkTheme.canvasBg;
  let wasDefaultLight = currentBgPickerColor.every((val, index) => val === lightThemeBg[index]);
  let wasDefaultDark = currentBgPickerColor.every((val, index) => val === darkThemeBg[index]);
  if (wasDefaultLight || wasDefaultDark) {
    bgColorObj = color(currentTheme.canvasBg[0], currentTheme.canvasBg[1], currentTheme.canvasBg[2], alpha(bgColorObj));
    bgColorPicker.color(bgColorObj);
  }
  applyTheme();
}

function applyTheme() {
  document.body.style.color = currentTheme.textPrimary;
  themeToggleButton.html(currentTheme.themeToggleIcon);
  styleButtonBasic(themeToggleButton, currentTheme.themeToggleBg, currentTheme.themeToggleText, currentTheme.buttonDefaultBorder, '50%', currentTheme.buttonFontWeight, '20px', currentTheme.iconButtonSize, '0');
  themeToggleButton.style('line-height', currentTheme.iconButtonSize);
  if (toolPanel) {
    toolPanel.style('background-color', currentTheme.sidebarBg);
    toolPanel.style('border-right', `1px solid ${currentTheme.sidebarBorder}`);
    toolPanel.style('box-shadow', isSidebarVisible ? '5px 0 15px rgba(0,0,0,0.07)' : 'none');
  }
  if (sidebarToggleButton) {
     styleButtonBasic(sidebarToggleButton, currentTheme.sidebarToggleBg, currentTheme.sidebarToggleText, currentTheme.buttonDefaultBorder, '50%', currentTheme.buttonFontWeight, '16px', (parseInt(currentTheme.iconButtonSize)-4)+'px', '0');
     sidebarToggleButton.style('line-height', (parseInt(currentTheme.iconButtonSize)-4)+'px');
  }
  allSectionLabels.forEach(label => { label.style('color', currentTheme.textSecondary); label.style('font-weight', currentTheme.sectionLabelFontWeight); });
  allColorPickerTextDivs.forEach(div => { div.style('color', currentTheme.textSecondary); div.style('font-weight', currentTheme.buttonFontWeight); });
  if (penSizeValueDisplay) { penSizeValueDisplay.style('color', currentTheme.textSecondary); penSizeValueDisplay.style('font-weight', currentTheme.buttonFontWeight); }
  if (eraserSizeValueDisplay) { eraserSizeValueDisplay.style('color', currentTheme.textSecondary); eraserSizeValueDisplay.style('font-weight', currentTheme.buttonFontWeight); }
  let presetInfoDiv = presetContainerDiv.elt.querySelector('div:last-child');
  if (presetInfoDiv && presetInfoDiv.innerText.startsWith('Önayarı kullanmak')) { presetInfoDiv.style.color = currentTheme.textSecondary; }

  if (zoomInButton) styleButtonBasic(zoomInButton, currentTheme.buttonDefaultBg, currentTheme.buttonDefaultText, currentTheme.buttonDefaultBorder, currentTheme.buttonBorderRadius, currentTheme.buttonFontWeight, '18px', currentTheme.iconButtonSize, '0');
  if (zoomOutButton) styleButtonBasic(zoomOutButton, currentTheme.buttonDefaultBg, currentTheme.buttonDefaultText, currentTheme.buttonDefaultBorder, currentTheme.buttonBorderRadius, currentTheme.buttonFontWeight, '18px', currentTheme.iconButtonSize, '0');
  if (resetViewButton) styleButtonBasic(resetViewButton, currentTheme.buttonDefaultBg, currentTheme.buttonDefaultText, currentTheme.buttonDefaultBorder, currentTheme.buttonBorderRadius, currentTheme.buttonFontWeight, '18px', currentTheme.iconButtonSize, '0');
  [zoomInButton, zoomOutButton, resetViewButton].forEach(btn => { if (btn) btn.style('line-height', currentTheme.iconButtonSize); });

  updateActiveButtonStyles();
  updateHistoryButtonStates();
}

function updateActiveButtonStyles() {
  const theme = currentTheme;
  const allToolButtons = [ penModeButton, tempPenModeButton, eraserModeButton, lineEraserModeButton, panModeButton ];
  const allPresetButtons = Object.values(penPresetButtons);

  // Reset all buttons to default first
  [...allToolButtons, ...allPresetButtons].forEach(btn => {
    if (btn) {
      styleButtonBasic(btn, theme.buttonDefaultBg, theme.buttonDefaultText, theme.buttonDefaultBorder, theme.buttonBorderRadius, theme.buttonFontWeight, btn.style('font-size'), btn.style('min-width'), btn.style('padding'));
      if(btn.elt.style.width === theme.iconButtonSize) btn.style('line-height', theme.iconButtonSize);
    }
  });

  // Apply active style to the current tool
  if (currentTool === 'pen' && penModeButton) Object.assign(penModeButton.elt.style, {backgroundColor: '#4CAF50', color: 'white', border: `1px solid #388E3C`});
  if (currentTool === 'tempPen' && tempPenModeButton) Object.assign(tempPenModeButton.elt.style, {backgroundColor: '#2196F3', color: 'white', border: `1px solid #1976D2`});
  if (currentTool === 'eraser' && eraserModeButton) Object.assign(eraserModeButton.elt.style, {backgroundColor: '#FF9800', color: 'white', border: `1px solid #F57C00`});
  if (currentTool === 'lineEraser' && lineEraserModeButton) Object.assign(lineEraserModeButton.elt.style, {backgroundColor: '#f44336', color: 'white', border: `1px solid #D32F2F`});
  if (currentTool === 'pan' && panModeButton) Object.assign(panModeButton.elt.style, {backgroundColor: '#607D8B', color: 'white', border: `1px solid #455A64`});

  // Apply active style to the current preset (if any)
  const activeBg = theme.accentColor, activeText = theme.accentText, activeBorder = `1px solid ${darkenColor(theme.accentColor, 20)}`;
  allPresetButtons.forEach(btn => {
      const preset = penPresets.find(p => p.name === btn.elt.innerText); // Assuming button text is preset name
      if (preset) {
          if (preset.id === activePresetId) { // Active preset
               Object.assign(btn.elt.style, {backgroundColor: activeBg, color: activeText, border: activeBorder});
          } else { // Inactive preset, but show tool type hint
              if (preset.toolType === 'tempPen') btn.style('border-bottom', '3px solid #2196F3');
              else if (preset.toolType === 'pen') btn.style('border-bottom', '3px solid #4CAF50');
              // else: no special border for other tool types or if no tool type defined
          }
      }
  });

  // Show/hide size sliders and preset container based on current tool
  let showPenOptions = (currentTool === 'pen' || currentTool === 'tempPen');
  let showEraserOptions = currentTool === 'eraser';
  if (penSizeControlGroup) penSizeControlGroup.style('display', showPenOptions ? 'flex' : 'none');
  if (eraserSizeControlGroup) eraserSizeControlGroup.style('display', showEraserOptions ? 'flex' : 'none');
  if (presetContainerDiv) presetContainerDiv.style('display', showPenOptions ? 'flex' : 'none');
}

function darkenColor(hexColor, percent) {
    let c = color(hexColor);
    return `rgb(${int(red(c) * (1 - percent/100))}, ${int(green(c) * (1 - percent/100))}, ${int(blue(c) * (1 - percent/100))})`;
}

// ==================================================================
// PRESET FUNCTIONS
// ==================================================================
function selectPenPreset(presetId) {
  const preset = penPresets.find(p => p.id === presetId);
  if (preset) {
    activePresetId = presetId;
    let currentAlpha = alpha(penColorObj); // Preserve current alpha if not specified in preset
    penColorObj = color(preset.color[0], preset.color[1], preset.color[2], currentAlpha);
    penColorPicker.color(penColorObj);
    currentPenSizeVal = preset.size;
    if (penSizeSlider) penSizeSlider.value(currentPenSizeVal);
    if (penSizeValueDisplay) penSizeValueDisplay.html(`${currentPenSizeVal}px`);
    currentTool = preset.toolType; // Switch tool based on preset
    updateActiveButtonStyles();
  }
}

function saveToPreset(presetId) {
  const preset = penPresets.find(p => p.id === presetId);
  if (preset) {
    preset.color = [red(penColorObj), green(penColorObj), blue(penColorObj)];
    preset.size = currentPenSizeVal;
    preset.toolType = currentTool;
    console.log(`Preset ${presetId} güncellendi:`, preset);
    updateActiveButtonStyles(); // Reflect changes if the active preset was saved
    const presetNumber = preset.id.replace('preset', '');
    window.alert(`Ayarlarınız ${presetNumber} numaralı önayara kaydedildi.`);
  }
}

function saveCurrentPreset() { // Prompts user for which preset to save to
  let presetNumber = window.prompt('Ayarları hangi önayara kaydetmek istiyorsunuz? (1, 2 veya 3)', '1');
  if (presetNumber === null) return;
  presetNumber = parseInt(presetNumber);
  if (isNaN(presetNumber) || presetNumber < 1 || presetNumber > 3) {
    window.alert('Lütfen 1, 2 veya 3 numaralı önayarlardan birini seçin.');
    return;
  }
  saveToPreset('preset' + presetNumber);
}

// ==================================================================
// HISTORY FUNCTIONS (Undo/Redo)
// ==================================================================
function updateHistoryButtonStates() {
  const theme = currentTheme;
  [undoButton, redoButton].forEach((btn, index) => {
    if (btn) {
      let stack = index === 0 ? undoStack : redoStack;
      let fontSize = btn.style('font-size'), minWidth = btn.style('min-width'), padding = btn.style('padding');
      if (stack.length === 0) {
        btn.attribute('disabled', '');
        styleButtonBasic(btn, theme.buttonDisabledBg, theme.buttonDisabledText, theme.buttonDefaultBorder, theme.buttonBorderRadius, theme.buttonFontWeight, fontSize, minWidth, padding);
      } else {
        btn.removeAttribute('disabled');
        styleButtonBasic(btn, theme.buttonDefaultBg, theme.buttonDefaultText, theme.buttonDefaultBorder, theme.buttonBorderRadius, theme.buttonFontWeight, fontSize, minWidth, padding);
      }
      if(btn.elt.style.width === theme.iconButtonSize) btn.style('line-height', theme.iconButtonSize);
    }
  });
}

function undoLastAction() {
  if (undoStack.length > 0) {
    let lastAction = undoStack.pop(); redoStack.push(lastAction);
    let targetArray = (lastAction.arrayName === 'paths') ? paths : tempPaths;
    let index = targetArray.lastIndexOf(lastAction.pathRef);
    if (index > -1) targetArray.splice(index, 1);
    if (lastAction.arrayName === 'tempPaths' && tempPaths.length === 0) {
      isFadingTempPaths = false; lastTempPenActivityTime = 0;
    }
    updateHistoryButtonStates();
  }
}

function redoLastAction() {
  if (redoStack.length > 0) {
    let actionToRedo = redoStack.pop(); undoStack.push(actionToRedo);
    if (actionToRedo.arrayName === 'paths') paths.push(actionToRedo.pathRef);
    else if (actionToRedo.arrayName === 'tempPaths') {
      actionToRedo.pathRef.currentAlpha = alpha(actionToRedo.pathRef.color);
      tempPaths.push(actionToRedo.pathRef);
      if (currentTool === 'tempPen') { lastTempPenActivityTime = millis(); isFadingTempPaths = false; }
    }
    updateHistoryButtonStates();
  }
}

// ==================================================================
// ACTION FUNCTIONS (Clear, Save, Line Eraser)
// ==================================================================
function clearDrawing() {
  paths = []; tempPaths = [];
  isFadingTempPaths = false; lastTempPenActivityTime = 0;
  // Undo/Redo stack'i de temizlemek iyi bir pratik olabilir, clearButton'da zaten yapılıyor.
}

function applyLineEraser(worldX, worldY) {
  let erasedSomething = false;
  for (let i = paths.length - 1; i >= 0; i--) {
    if (paths[i].points.some(pt => dist(worldX, worldY, pt.x, pt.y) < paths[i].size / 2 + LINE_ERASER_PROXIMITY)) {
      paths.splice(i, 1); erasedSomething = true;
    }
  }
  for (let i = tempPaths.length - 1; i >= 0; i--) {
    if (tempPaths[i].points.some(pt => dist(worldX, worldY, pt.x, pt.y) < tempPaths[i].size / 2 + LINE_ERASER_PROXIMITY)) {
      tempPaths.splice(i, 1); erasedSomething = true;
    }
  }
  if (tempPaths.length === 0) { isFadingTempPaths = false; lastTempPenActivityTime = 0; }
  if (erasedSomething) { // Line eraser geri alınamaz bir işlem olduğu için geçmişi temizle
    undoStack = []; redoStack = []; updateHistoryButtonStates();
  }
}

function saveDrawing() { // Saves the canvas as a PNG
  let drawingAreaXOffset = isSidebarVisible ? SIDEBAR_WIDTH : 0;
  let viewWidth = width - drawingAreaXOffset, viewHeight = height;
  if (viewWidth <= 0 || viewHeight <= 0) { console.error("Geçersiz çizim alanı boyutu!"); return; }

  let drawingBuffer = createGraphics(viewWidth, viewHeight);
  drawingBuffer.pixelDensity(displayDensity()); drawingBuffer.colorMode(RGB);
  drawingBuffer.background(bgColorObj);
  drawingBuffer.translate(panX, panY); drawingBuffer.scale(zoomLevel);
  drawingBuffer.strokeCap(ROUND); drawingBuffer.strokeJoin(ROUND);

  paths.forEach(path => drawPathObjectOnBuffer(path, drawingBuffer));
  tempPaths.forEach(path => {
    if (path.tool === 'tempPen' && typeof path.currentAlpha !== 'undefined' && path.currentAlpha > 0) {
       drawPathObjectOnBuffer(path, drawingBuffer);
    }
  });
  save(drawingBuffer, 'myDrawing-' + nf(year(),4,0) + nf(month(),2,0) + nf(day(),2,0) + '-' + nf(hour(),2,0) + nf(minute(),2,0) + nf(second(),2,0) + '.png');
  drawingBuffer.remove(); // Belleği serbest bırak
}

function drawPathObjectOnBuffer(pathData, buffer) {
  let displayColor = pathData.color;
  let r = red(displayColor), g = green(displayColor), b = blue(displayColor);
  let aVal = (pathData.tool === 'tempPen' && typeof pathData.currentAlpha !== 'undefined') ? pathData.currentAlpha : alpha(displayColor);
  if (aVal <= 0 && pathData.tool === 'tempPen') return; // Don't draw fully transparent temp paths
  buffer.stroke(r, g, b, aVal); buffer.strokeWeight(pathData.size); buffer.noFill();
  buffer.beginShape(); pathData.points.forEach(pt => buffer.vertex(pt.x, pt.y)); buffer.endShape();
}

// ==================================================================
// ZOOM AND PAN FUNCTIONS
// ==================================================================
function zoomIn() {
  let drawingAreaXOffset = isSidebarVisible ? SIDEBAR_WIDTH : 0;
  let viewCenterX = (width - drawingAreaXOffset) / 2, viewCenterY = height / 2;
  let newZoomLevel = min(maxZoom, zoomLevel * (1 + zoomIncrement));
  if (newZoomLevel === zoomLevel) return;
  panX = viewCenterX - ((viewCenterX - panX) / zoomLevel * newZoomLevel);
  panY = viewCenterY - ((viewCenterY - panY) / zoomLevel * newZoomLevel);
  zoomLevel = newZoomLevel;
}

function zoomOut() {
  let drawingAreaXOffset = isSidebarVisible ? SIDEBAR_WIDTH : 0;
  let viewCenterX = (width - drawingAreaXOffset) / 2, viewCenterY = height / 2;
  let newZoomLevel = max(minZoom, zoomLevel / (1 + zoomIncrement));
  if (newZoomLevel === zoomLevel) return;
  panX = viewCenterX - ((viewCenterX - panX) / zoomLevel * newZoomLevel);
  panY = viewCenterY - ((viewCenterY - panY) / zoomLevel * newZoomLevel);
  zoomLevel = newZoomLevel;
}

function resetView() { zoomLevel = 1.0; panX = 0; panY = 0; }

// ==================================================================
// P5.JS SYSTEM FUNCTIONS (keyPressed, windowResized)
// ==================================================================
function keyPressed() {
  // Check if an input element is focused, if so, don't trigger shortcuts
  // (Bu, daha sonra eklenecek metin girişi gibi özellikler için önemlidir)
  // if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
  //   return;
  // }

  if (keyIsDown(CONTROL) || keyIsDown(COMMAND)) { // CMD for Mac, CTRL for Win/Linux
    if (key === 'z' || key === 'Z') {
      if (keyIsDown(SHIFT)) { redoLastAction(); } else { undoLastAction(); }
      return false; // Tarayıcının varsayılan Ctrl+Z davranışını engelle
    } else if (key === 'y' || key === 'Y') { // Ctrl+Y (genellikle redo)
      redoLastAction();
      return false;
    }
    // Gelecekte buraya Ctrl+S ile saveDrawing çağrısı eklenebilir.
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (toolPanel) toolPanel.size(SIDEBAR_WIDTH, height);
  if (!isSidebarVisible && toolPanel) toolPanel.style('transform', `translateX(-${SIDEBAR_WIDTH}px)`);
  if (themeToggleButton) { themeToggleButton.style('top', '15px'); themeToggleButton.style('right', '15px'); }
  if (sidebarToggleButton) sidebarToggleButton.position(15,15);
  if (zoomControlsDiv) { zoomControlsDiv.style('bottom', '20px'); zoomControlsDiv.style('right', '20px'); }
  applyTheme(); // Temayı yeniden uygula, bazı elementlerin pozisyonu değişmiş olabilir.
}