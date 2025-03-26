document.addEventListener('DOMContentLoaded', function() {
  // Initialize Dexie.js database with proper schema
  const db = new Dexie('musebrushDB');

  // Define database schema (version 1)
  db.version(1).stores({
    canvases: '++id, name, timestamp, thumbnail, canvasData, dimensions'
  });

  // Update schema to include history data (version 2)
  db.version(2).stores({
    canvases: '++id, name, timestamp, thumbnail, canvasData, dimensions, historyData'
  }).upgrade(tx => {
    // Upgrade function to migrate existing data
    return tx.canvases.toCollection().modify(canvas => {
      // Add history data field if it doesn't exist
      if (!canvas.historyData) {
        // Create a minimal history with just the current state
        const historyData = JSON.stringify({
          states: [canvas.canvasData],
          currentIndex: 0
        });
        canvas.historyData = encryptData(historyData);
      }
    });
  });

  // For debugging - print database contents on startup
  db.canvases.toArray().then(canvases => {
    console.log('Database contents on startup:', canvases);
  }).catch(err => {
    console.error('Error reading database on startup:', err);
  });

  // Configure Coloris color picker
  Coloris({
    themeMode: 'auto',  // Automatically switch between light and dark themes
    alpha: true,        // Enable alpha channel
    format: 'hex',      // Default output format
    swatches: [         // Custom color swatches
      '#264653',
      '#2a9d8f',
      '#e9c46a',
      '#f4a261',
      '#e76f51',
      '#d62828',
      '#D4AF37',
      '#996515',
      '#F5D76E',
      'rgba(255, 255, 255, 1)',
      'rgba(0, 0, 0, 1)'
    ]
  });

  // Encryption helpers using CryptoJS
  const encryptionKey = 'musebrush-secret-key'; // Simple encryption key

  function encryptData(data) {
    return CryptoJS.AES.encrypt(data, encryptionKey).toString();
  }

  function decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Bootstrap Modals
  const galleryModal = new bootstrap.Modal(document.getElementById('galleryModal'));
  const newCanvasModal = new bootstrap.Modal(document.getElementById('newCanvasModal'));

  // Combined Gallery Button Click Handler
  document.getElementById('gallery-button').addEventListener('click', function() {
    // Create a preview for the save modal
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 0.8
    });

    // Set preview image
    const previewImg = document.getElementById('canvasPreview');
    previewImg.src = dataURL;

    // Set appropriate classes to maintain aspect ratio
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const aspectRatio = canvasWidth / canvasHeight;

    // Update preview container to show actual canvas shape
    const previewContainer = document.querySelector('.canvas-preview');
    previewContainer.style.display = 'flex';

    // Generate default name with date
    const now = new Date();
    const defaultName = `Canvas ${now.toLocaleDateString()}`;
    document.getElementById('canvasName').value = defaultName;

    // Show gallery modal with save form visible
    loadGallery();
    galleryModal.show();
  });

  // Confirm Save to Gallery Button
  document.getElementById('confirmSaveToGallery').addEventListener('click', function() {
    const name = document.getElementById('canvasName').value || 'Untitled Canvas';
    const timestamp = new Date().getTime();

    // Create a thumbnail with proper dimensions
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 0.8
    });

    // Get canvas dimensions for later use
    const canvasDimensions = {
      width: canvas.getWidth(),
      height: canvas.getHeight()
    };

    // Get canvas JSON data
    const canvasData = JSON.stringify(canvas.toJSON(['id']));

    // Also save history state with the canvas
    const historyData = JSON.stringify({
      states: canvasHistory,
      currentIndex: currentHistoryIndex
    });

    // Save to database
    db.canvases.add({
      name: name,
      timestamp: timestamp,
      thumbnail: dataURL,
      canvasData: encryptData(canvasData),
      dimensions: canvasDimensions, // Store dimensions for better display
      historyData: encryptData(historyData) // Save encrypted history data
    }).then(id => {
      console.log(`Canvas saved with ID: ${id}`);

      // Clear the form and hide the preview
      document.getElementById('canvasName').value = '';
      document.querySelector('.canvas-preview').style.display = 'none';

      // Reload gallery to show the new item
      loadGallery();

      // Show success pulse animation
      const gallerybutton = document.getElementById('gallery-button');
      gallerybutton.classList.add('pulsing');
      setTimeout(() => {
        gallerybutton.classList.remove('pulsing');
      }, 2000);

    }).catch(err => {
      console.error('Error saving canvas:', err);
      alert('Error saving canvas');
    });
  });

  // Load Gallery Items
  function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    const emptyState = document.getElementById('galleryEmptyState');

    // Clear gallery
    galleryGrid.innerHTML = '';

    // Get all canvases from database, sorted by timestamp (newest first)
    db.canvases.orderBy('timestamp').reverse().toArray().then(canvases => {
      if (canvases.length === 0) {
        // Show empty state
        emptyState.style.display = 'flex';
        galleryGrid.style.display = 'none';
        return;
      }

      // Hide empty state and show grid
      emptyState.style.display = 'none';
      galleryGrid.style.display = 'grid';

      // Add canvas items to gallery
      canvases.forEach(item => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.setAttribute('data-id', item.id);

        // Format date
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        // Prepare dimensions info if available
        let dimensionsInfo = '';
        if (item.dimensions) {
          dimensionsInfo = `<div class="gallery-item-dimensions">${item.dimensions.width} × ${item.dimensions.height}</div>`;
        }

        galleryItem.innerHTML = `
          <img src="${item.thumbnail}" alt="${item.name}">
          <div class="gallery-item-info">
            <div class="gallery-item-title">${item.name}</div>
            <div class="gallery-item-date">${formattedDate}</div>
            ${dimensionsInfo}
          </div>
          <div class="gallery-item-actions">
            <button class="gallery-action-button load-canvas" title="Load Canvas">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="gallery-action-button download-canvas" title="Download">
              <i class="bi bi-download"></i>
            </button>
            <button class="gallery-action-button delete delete-canvas" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        `;

        galleryGrid.appendChild(galleryItem);

        // Gallery item click handlers
        const loadbutton = galleryItem.querySelector('.load-canvas');
        const downloadbutton = galleryItem.querySelector('.download-canvas');
        const deletebutton = galleryItem.querySelector('.delete-canvas');

        // Load canvas click handler
        loadbutton.addEventListener('click', function(e) {
          e.stopPropagation();
          const id = parseInt(galleryItem.getAttribute('data-id'));
          loadCanvasFromGallery(id);
        });

        // Download canvas click handler
        downloadbutton.addEventListener('click', function(e) {
          e.stopPropagation();
          const link = document.createElement('a');
          link.download = `${item.name}.png`;
          link.href = item.thumbnail;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });

        // Delete canvas click handler
        deletebutton.addEventListener('click', function(e) {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete this canvas?')) {
            const id = parseInt(galleryItem.getAttribute('data-id'));
            db.canvases.delete(id).then(() => {
              galleryItem.remove();
              if (galleryGrid.children.length === 0) {
                emptyState.style.display = 'flex';
                galleryGrid.style.display = 'none';
              }
            });
          }
        });

        // Click on gallery item to load canvas
        galleryItem.addEventListener('click', function() {
          const id = parseInt(this.getAttribute('data-id'));
          loadCanvasFromGallery(id);
        });
      });
    }).catch(err => {
      console.error('Error loading gallery:', err);
    });
  }

  // Load canvas from gallery
  function loadCanvasFromGallery(id) {
    db.canvases.get(id).then(item => {
      if (!item) {
        console.error('Canvas not found:', id);
        return;
      }

      try {
        // Decrypt canvas data
        const decryptedData = decryptData(item.canvasData);
        const jsonData = JSON.parse(decryptedData);

        // Clear the canvas first
        canvas.clear();

        // Set canvas dimensions if available
        if (item.dimensions) {
          // Disable auto-resizing to preserve the custom dimensions
          autoResizeEnabled = false;

          // Explicitly set the dimensions to the saved dimensions
          canvas.setWidth(item.dimensions.width);
          canvas.setHeight(item.dimensions.height);

          // Update the CSS of the canvas container to ensure it displays correctly
          const canvasContainer = document.querySelector('.canvas-container');
          canvasContainer.style.width = item.dimensions.width + 'px';
          canvasContainer.style.height = item.dimensions.height + 'px';
        } else {
          // If no dimensions stored, re-enable auto-resize
          autoResizeEnabled = true;
        }

        // Load canvas
        canvas.loadFromJSON(jsonData, function() {
          canvas.renderAll();

          // Load history if available
          if (item.historyData) {
            try {
              const historyDataDecrypted = decryptData(item.historyData);
              const historyObj = JSON.parse(historyDataDecrypted);

              // Restore history
              canvasHistory = historyObj.states || [];
              currentHistoryIndex = historyObj.currentIndex || 0;

              // If no history or invalid data, create a single history point
              if (canvasHistory.length === 0) {
                saveCanvasState('initialize', 'canvas', true); // Auto-save initial state
              }

              // Update buttons and history panel
              updateHistoryButtonStates();
              updateHistoryPanel();
            } catch (historyErr) {
              console.error('Error loading history:', historyErr);
              // If history loading fails, reset history with current canvas state
              canvasHistory = [];
              currentHistoryIndex = -1;
              saveCanvasState('initialize', 'canvas', true); // Auto-save initial state
              updateHistoryButtonStates();
              updateHistoryPanel();
            }
          } else {
            // If no history data, reset history with current canvas state
            canvasHistory = [];
            currentHistoryIndex = -1;
            saveCanvasState('initialize', 'canvas', true); // Auto-save initial state
            updateHistoryButtonStates();
            updateHistoryPanel();
          }

          galleryModal.hide();

          // Show success message or animation
          const zoomIndicator = document.querySelector('.zoom-indicator');
          const originalContent = zoomIndicator.innerHTML;

          // Include dimensions in the success message
          let dimensionsText = '';
          if (item.dimensions) {
            dimensionsText = ` (${item.dimensions.width}×${item.dimensions.height})`;
          }

          zoomIndicator.innerHTML = `<i class="bi bi-check-circle"></i> <span>${item.name}${dimensionsText} loaded!</span>`;
          zoomIndicator.style.background = 'rgba(0, 180, 0, 0.8)';

          setTimeout(() => {
            zoomIndicator.innerHTML = originalContent;
            zoomIndicator.style.background = '';
          }, 2000);

          // Reset zoom to fit the loaded canvas
          panzoomInstance.reset();
        });
      } catch (err) {
        console.error('Error loading canvas:', err);
        alert('Error loading canvas');
      }
    }).catch(err => {
      console.error('Error getting canvas:', err);
    });
  }

  // Initialize Draggable for toolbar
  const toolbarEl = document.getElementById('sortable-tools');

  // Simplified draggable implementation
  Draggable.create(".tool-button", {
    type: "x,y",
    bounds: toolbarEl,
    onDragEnd: function() {
      // Simple rearrangement based on position
      const buttons = Array.from(document.querySelectorAll('.tool-button'));
      buttons.sort((a, b) => {
        return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
      });

      // Reappend in new order
      buttons.forEach(button => toolbarEl.appendChild(button));

      // Simple animation effect
      gsap.from(buttons, {
        scale: 1.05,
        duration: 0.2,
        ease: "power1.out",
        clearProps: "all"
      });

      // Save the new order
      const order = buttons.map(tool => tool.getAttribute('data-tool'));
      localStorage.setItem('toolbarOrder', JSON.stringify(order));
    }
  });

  // Function to load toolbar order
  function loadToolbarOrder() {
    const savedOrder = localStorage.getItem('toolbarOrder');
    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder);
        const toolbarContainer = document.getElementById('sortable-tools');
        const tools = Array.from(document.querySelectorAll('#sortable-tools .tool-button'));

        // Sort the toolbar based on saved order
        order.forEach(toolId => {
          const tool = tools.find(t => t.getAttribute('data-tool') === toolId);
          if (tool) {
            toolbarContainer.appendChild(tool);
          }
        });
      } catch (e) {
        console.error('Error loading toolbar order:', e);
      }
    }
  }

  // Add a custom class to enable drag style in CSS
  toolbarEl.classList.add('draggable-container');
  const toolButtons = document.querySelectorAll('.tool-button');
  toolButtons.forEach(button => {
    button.classList.add('draggable-item');
  });

  // Load saved toolbar order if exists
  loadToolbarOrder();

  // Initialize FabricJS Canvas
  const canvas = new fabric.Canvas('canvas', {
    isDrawingMode: false,
    backgroundColor: 'white',
    preserveObjectStacking: true
  });

  // Flag to control automatic resizing
  let autoResizeEnabled = true;

  // Resize canvas to fit container on load and window resize with 9:16 aspect ratio
  function resizeCanvas() {
    // Skip resizing if auto-resize is disabled (for custom sized canvases)
    if (!autoResizeEnabled) return;

    const container = document.querySelector('.canvas-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.setDimensions({
      width: containerWidth,
      height: containerHeight
    });
    canvas.renderAll();
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Tool variables
  let currentMode = 'select';
  let drawingColor = '#000000';
  let strokeWidth = 3;
  let fillColor = '#ffffff';
  let useFill = false;
  let isDrawing = false;
  let startX, startY;
  let isPanning = false;

  // History variables
  let canvasHistory = [];
  let currentHistoryIndex = -1;
  const maxHistoryLength = 70; // Maximum number of states to store - increased from 30 to 70
  let isBatchOperation = false; // Flag to merge similar operations
  let lastOperationTime = Date.now();
  const batchTimeout = 1000; // ms to batch operations
  let skipNextHistoryUpdate = false; // Flag to avoid history updates during undo/redo
  let lastAutoSaveTime = Date.now(); // Track when we last auto-saved
  const autoSaveInterval = 10000; // Auto-save every 10 seconds (was 120000ms)
  let shouldAutoSaveNextChange = false; // Flag to trigger auto-save on next change

  // Initialize panzoom for zooming functionality
  const zoomContainer = document.getElementById('zoom-container');
  const panzoomInstance = Panzoom(zoomContainer, {
    maxScale: 5,
    minScale: 0.5,
    contain: 'outside',
    startScale: 1,
    step: 0.1,
    canvas: true,
    excludeClass: 'tool-button',
    onZoom: function(e) {
      updateZoomIndicator(e.detail.scale);
    },
    // Disable panning by default - we'll enable it only when needed
    disablePan: true,
    // This prevents panzoom from handling events when in drawing mode
    handleStartEvent: function(event) {
      // Allow panning only when in select mode with Alt key or when zoom level > 1
      if ((currentMode === 'select' && event.altKey) ||
          (currentMode === 'select' && panzoomInstance.getScale() > 1)) {
        isPanning = true;
        return true; // Let panzoom handle the event
      }
      return false; // Don't let panzoom handle the event
    }
  });

  // Prevent FabricJS from capturing mouse events when panning
  zoomContainer.addEventListener('mousedown', function(e) {
    // If a tool button is clicked, don't interfere
    if (e.target.closest('.tool-button') || e.target.closest('.action-button')) return;

    // Enable panning only when in select mode with Alt key
    if (currentMode === 'select' && e.altKey) {
      e.stopPropagation();
      isPanning = true;
      panzoomInstance.setOptions({ disablePan: false });
    } else if (currentMode === 'select' && panzoomInstance.getScale() > 1) {
      // Also enable panning in select mode when zoomed in
      isPanning = true;
      panzoomInstance.setOptions({ disablePan: false });
    } else {
      // Ensure panning is disabled in other modes
      isPanning = false;
      panzoomInstance.setOptions({ disablePan: true });
    }
  });

  // Reset panning mode on mouse up
  document.addEventListener('mouseup', function() {
    isPanning = false;
    if (currentMode !== 'select') {
      panzoomInstance.setOptions({ disablePan: true });
    }
  });

  // Zoom indicator update
  function updateZoomIndicator(scale) {
    const percentage = Math.round(scale * 100);
    document.getElementById('zoom-level').textContent = `${percentage}%`;
  }

  // Zoom in button
  document.getElementById('zoom-in').addEventListener('click', function() {
    panzoomInstance.zoomIn();
  });

  // Zoom out button
  document.getElementById('zoom-out').addEventListener('click', function() {
    panzoomInstance.zoomOut();
  });

  // Reset zoom button
  document.getElementById('zoom-reset').addEventListener('click', function() {
    panzoomInstance.reset();
  });

  // Mouse wheel zoom support
  zoomContainer.addEventListener('wheel', function(e) {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY;

      if (delta < 0) {
        panzoomInstance.zoomIn();
      } else {
        panzoomInstance.zoomOut();
      }
    }
  }, { passive: false });

  // Sidebar toggle functionality
  document.getElementById('sidebarToggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('collapsed');

    // Resize canvas after sidebar toggle to ensure proper dimensions
    // Only auto-resize if enabled
    if (autoResizeEnabled) {
      setTimeout(resizeCanvas, 300);
    }
  });

  document.getElementById('sidebarCollapse').addEventListener('click', function() {
    document.getElementById('sidebar').classList.add('collapsed');

    // Resize canvas after sidebar toggle to ensure proper dimensions
    // Only auto-resize if enabled
    if (autoResizeEnabled) {
      setTimeout(resizeCanvas, 300);
    }
  });

  // Initialize sidebar as collapsed on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.add('collapsed');
  }

  // Select tool
  document.getElementById('select-tool').addEventListener('click', function() {
    setActiveTool('select');
    canvas.isDrawingMode = false;
  });

  // Draw tool
  document.getElementById('draw-tool').addEventListener('click', function() {
    setActiveTool('draw');
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = drawingColor;
    canvas.freeDrawingBrush.width = strokeWidth;
    // Important: Disable panning when in drawing mode
    panzoomInstance.setOptions({ disablePan: true });
  });

  // Rectangle tool
  document.getElementById('rect-tool').addEventListener('click', function() {
    setActiveTool('rect');
    canvas.isDrawingMode = false;
    // Important: Disable panning when in shape creation mode
    panzoomInstance.setOptions({ disablePan: true });
  });

  // Circle tool
  document.getElementById('circle-tool').addEventListener('click', function() {
    setActiveTool('circle');
    canvas.isDrawingMode = false;
    // Important: Disable panning when in shape creation mode
    panzoomInstance.setOptions({ disablePan: true });
  });

  // Triangle tool
  document.getElementById('triangle-tool').addEventListener('click', function() {
    setActiveTool('triangle');
    canvas.isDrawingMode = false;
    // Important: Disable panning when in shape creation mode
    panzoomInstance.setOptions({ disablePan: true });
  });

  // Text tool
  document.getElementById('text-tool').addEventListener('click', function() {
    setActiveTool('text');
    canvas.isDrawingMode = false;
    // Important: Disable panning when in text creation mode
    panzoomInstance.setOptions({ disablePan: true });

    // Add text object to canvas
    const text = new fabric.IText('Text', {
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      fontFamily: 'Arial',
      fill: drawingColor,
      fontSize: 24,
      originX: 'center',
      originY: 'center'
    });

    canvas.add(text);
    canvas.setActiveObject(text);
  });

  // Upload image
  document.getElementById('upload-image').addEventListener('click', function() {
    document.getElementById('image-upload').click();
  });

  document.getElementById('image-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(f) {
        const data = f.target.result;
        fabric.Image.fromURL(data, function(img) {
          // Scale image to fit canvas while maintaining aspect ratio
          const maxWidth = canvas.getWidth() * 0.8;
          const maxHeight = canvas.getHeight() * 0.8;

          if (img.width > maxWidth || img.height > maxHeight) {
            const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
            img.scale(scale);
          }

          img.set({
            left: canvas.getWidth() / 2,
            top: canvas.getHeight() / 2,
            originX: 'center',
            originY: 'center'
          });

          canvas.add(img);
          canvas.setActiveObject(img);
        });
      };
      reader.readAsDataURL(file);
    }
  });

  // Color picker
  document.getElementById('color-picker').addEventListener('change', function(e) {
    drawingColor = e.target.value;

    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.color = drawingColor;
    }

    // Update active object color if applicable
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === 'i-text') {
        activeObject.set('fill', drawingColor);
      } else {
        activeObject.set('stroke', drawingColor);
      }
      canvas.renderAll();
    }
  });

  // Stroke width slider with value display
  document.getElementById('stroke-width').addEventListener('input', function(e) {
    strokeWidth = parseInt(e.target.value);

    // Update display value
    document.getElementById('stroke-width-value').textContent = `${strokeWidth}px`;

    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.width = strokeWidth;
    }

    // Update active object stroke width if applicable
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.strokeWidth !== undefined) {
      activeObject.set('strokeWidth', strokeWidth);
      canvas.renderAll();
    }
  });

  // Fill toggle
  document.getElementById('fill-toggle').addEventListener('change', function(e) {
    useFill = e.target.checked;
    const fillColorInput = document.getElementById('fill-color');
    fillColorInput.disabled = !useFill;

    // Update Coloris field accessibility
    if (useFill) {
      fillColorInput.closest('.clr-field').classList.remove('disabled');
    } else {
      fillColorInput.closest('.clr-field').classList.add('disabled');
    }

    // Update active object fill if applicable
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.fill !== undefined) {
      activeObject.set('fill', useFill ? fillColor : 'transparent');
      canvas.renderAll();
    }
  });

  // Fill color picker
  document.getElementById('fill-color').addEventListener('change', function(e) {
    fillColor = e.target.value;

    if (!useFill) return;

    // Update active object fill if applicable
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.fill !== undefined) {
      activeObject.set('fill', fillColor);
      canvas.renderAll();
    }
  });

  // Clear canvas
  document.getElementById('clear-canvas').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear the canvas?')) {
      canvas.clear();
      canvas.setBackgroundColor('white', canvas.renderAll.bind(canvas));
    }
  });

  // Save canvas (download)
  document.getElementById('save-canvas').addEventListener('click', function() {
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1.0
    });

    // Add subtle save pulse effect
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.classList.add('save-pulse');

    // Remove class after animation completes
    setTimeout(() => {
      canvasContainer.classList.remove('save-pulse');
    }, 400);

    const link = document.createElement('a');
    link.download = 'musebrush-canvas.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Periodically check if we should mark the next change as an auto-save
  setInterval(() => {
    const now = Date.now();
    const timeSinceLastAutoSave = now - lastAutoSaveTime;

    // If enough time has passed since last auto-save, mark next change as auto-save
    if (timeSinceLastAutoSave > autoSaveInterval && !shouldAutoSaveNextChange) {
      shouldAutoSaveNextChange = true;
      console.log('Next change will be auto-saved');
    }
  }, 5000); // Check every 5 seconds

  // Initialize history with the empty canvas
  saveCanvasState('initialize', 'canvas', true);

  // History functions
  function saveCanvasState(action = 'change', objectType = 'unknown', forceAutoSave = false) {
    if (skipNextHistoryUpdate) {
      skipNextHistoryUpdate = false;
      return;
    }

    // Skip saving state for draw-start events
    if (action === 'draw-start') {
      return;
    }

    const json = JSON.stringify(canvas.toJSON(['id']));
    const now = Date.now();

    // Create a description of the action
    let actionDescription = getActionDescription(action, objectType);

    // Check if this change should be an auto-save (based on the flag or if forced)
    let isAutoSave = shouldAutoSaveNextChange || forceAutoSave;

    // Reset the flag if this is an auto-save
    if (isAutoSave) {
      shouldAutoSaveNextChange = false;
      lastAutoSaveTime = now;
      console.log('Auto-saving at', new Date(now).toLocaleTimeString(), 'for action:', actionDescription);
    }

    // Check if we should batch with previous operation
    if (isBatchOperation && (now - lastOperationTime < batchTimeout) && currentHistoryIndex >= 0) {
      // Replace the last state instead of adding a new one
      canvasHistory[currentHistoryIndex].state = json;
      // If we were supposed to auto-save, mark this state as an auto-save
      if (isAutoSave) {
        canvasHistory[currentHistoryIndex].isAutoSave = true;
      }
      // Update the action description to show continued action
      canvasHistory[currentHistoryIndex].action =
          canvasHistory[currentHistoryIndex].action.replace(/^(Drawing|Moving|Resizing)/, "Continuing $1");
    } else {
      // Add new state to history with timestamp and action info
      canvasHistory.push({
        state: json,
        timestamp: now,
        isAutoSave: isAutoSave,
        action: actionDescription,
        tool: currentMode,
        objectType: objectType
      });
      currentHistoryIndex = canvasHistory.length - 1;

      // If this is an auto-save, remove non-auto-saved past states
      if (isAutoSave) {
        removePastNonAutoSavedStates();
      }

      // Clean history if it exceeds the limit
      if (canvasHistory.length > maxHistoryLength) {
        thinOutHistory();
      }
    }

    lastOperationTime = now;
    updateHistoryButtonStates();
  }

  // Helper function to create descriptive action texts
  function getActionDescription(action, objectType) {
    switch(action) {
      case 'add':
        if (objectType === 'image') return 'Added image';
        if (objectType === 'i-text') return 'Added text';
        if (objectType === 'rect') return 'Added rectangle';
        if (objectType === 'circle') return 'Added circle';
        if (objectType === 'triangle') return 'Added triangle';
        return `Added ${objectType}`;

      case 'modify':
        if (objectType === 'image') return 'Modified image';
        if (objectType === 'i-text') return 'Edited text';
        if (objectType === 'path') return 'Modified drawing';
        return `Modified ${objectType}`;

      case 'remove':
        return `Removed ${objectType}`;

      case 'draw':
        return 'Drawing path';

      case 'draw-start':
        return 'Started drawing';

      case 'initialize':
        return 'Initial canvas';

      default:
        return `Changed ${objectType}`;
    }
  }

  function cleanHistoryIfNeeded(currentTime) {
    // Check if we need to auto-save based on time interval
    const timeElapsedSinceLastAutoSave = currentTime - lastAutoSaveTime;

    // Auto-save check is now handled in saveCanvasState
    // This function is kept for compatibility but no longer needed for auto-save logic

    // If we have too many history items, thin out the history
    if (canvasHistory.length > maxHistoryLength) {
      thinOutHistory();
    }
  }

  function removePastNonAutoSavedStates() {
    // Keep states that are: 1) auto-saved, 2) current state or future states
    const newHistory = [];
    let newCurrentIndex = -1;

    // Get the current state object reference
    const currentState = canvasHistory[currentHistoryIndex];

    for (let i = 0; i < canvasHistory.length; i++) {
      // Keep if it's an auto-saved state, the current state, or a future state
      if (canvasHistory[i].isAutoSave || i >= currentHistoryIndex) {
        // If this is the current state, store its new index
        if (i === currentHistoryIndex) {
          newCurrentIndex = newHistory.length;
        }
        newHistory.push(canvasHistory[i]);
      }
    }

    // Update history array and current index
    canvasHistory = newHistory;
    currentHistoryIndex = newCurrentIndex;
  }

  function thinOutHistory() {
    // Don't thin out if we don't have enough items
    if (canvasHistory.length <= 10) return;

    // We want to keep the earliest states, the most recent states, and auto-saved states
    // First, ensure we're not deleting the current state
    let indexesToKeep = [currentHistoryIndex];

    // Always keep the initial state (first state in history)
    indexesToKeep.push(0);

    // Find the oldest auto-save and always keep it
    let oldestAutoSaveIndex = -1;
    for (let i = 0; i < canvasHistory.length; i++) {
      if (canvasHistory[i].isAutoSave) {
        oldestAutoSaveIndex = i;
        break;
      }
    }

    if (oldestAutoSaveIndex !== -1) {
      indexesToKeep.push(oldestAutoSaveIndex);
    }

    // We'll remove 1/4 of the items, focused on intermediate time frames
    const itemsToRemove = Math.ceil(canvasHistory.length * 0.25);
    let finalLength = canvasHistory.length - itemsToRemove;

    // Calculate time intervals between items
    let timeIntervals = [];
    for (let i = 1; i < canvasHistory.length; i++) {
      // Get timestamps for adjacent states
      const prevState = canvasHistory[i-1];
      const currState = canvasHistory[i];

      // Skip auto-saved states - we want to keep those
      if (currState.isAutoSave) {
        indexesToKeep.push(i);
        continue;
      }

      const prevTimestamp = prevState.timestamp || (lastOperationTime - (canvasHistory.length - i + 1) * 2000);
      const currTimestamp = currState.timestamp || (lastOperationTime - (canvasHistory.length - i) * 2000);
      const interval = currTimestamp - prevTimestamp;

      timeIntervals.push({
        index: i,
        interval: interval
      });
    }

    // Sort by interval (smaller intervals first - those are the candidates for removal)
    timeIntervals.sort((a, b) => a.interval - b.interval);

    // Start removing items with the smallest intervals
    // but preserve the first few and last few states
    const preserveCount = Math.floor(finalLength * 0.2); // Keep 20% oldest and 20% newest items

    // If we have too many auto-saves, we need a different strategy
    // Find all auto-save indexes
    const autoSaveIndexes = [];
    for (let i = 0; i < canvasHistory.length; i++) {
      if (canvasHistory[i].isAutoSave) {
        autoSaveIndexes.push(i);
      }
    }

    // If we have more auto-saves than our max limit allows
    if (autoSaveIndexes.length > maxHistoryLength) {
      // Keep first auto-save and last (maxHistoryLength-1) auto-saves
      // Sort auto-save indexes by recency (newest first)
      autoSaveIndexes.sort((a, b) => b - a);

      // Always keep the very first auto-save
      const firstAutoSaveIndex = autoSaveIndexes.pop();
      indexesToKeep.push(firstAutoSaveIndex);

      // Keep the most recent auto-saves
      const toKeep = Math.min(autoSaveIndexes.length, maxHistoryLength - 2); // -1 for first, -1 for current
      for (let i = 0; i < toKeep; i++) {
        indexesToKeep.push(autoSaveIndexes[i]);
      }
    }

    // Build a list of indexes to keep
    for (let i = 0; i < preserveCount; i++) {
      // Keep these indexes at the beginning
      indexesToKeep.push(i);
      // Keep these indexes at the end
      indexesToKeep.push(canvasHistory.length - 1 - i);
    }

    // Make sure our list of indexes to keep is unique
    indexesToKeep = [...new Set(indexesToKeep)];

    // Remove items with the smallest time intervals that aren't in our keep list
    // Start with the smallest intervals first
    let removedCount = 0;
    let indexesToRemove = [];

    for (const item of timeIntervals) {
      if (!indexesToKeep.includes(item.index) && removedCount < itemsToRemove) {
        indexesToRemove.push(item.index);
        removedCount++;
      }

      // Stop once we've identified enough items to remove
      if (removedCount >= itemsToRemove) break;
    }

    // Sort indexes to remove in descending order to avoid shifting issues when removing
    indexesToRemove.sort((a, b) => b - a);

    // Create new history array by removing the identified items
    for (const index of indexesToRemove) {
      canvasHistory.splice(index, 1);
      // Adjust the current index if necessary
      if (index < currentHistoryIndex) {
        currentHistoryIndex--;
      }
    }
  }

  function undo() {
    if (currentHistoryIndex > 0) {
      currentHistoryIndex--;
      loadCanvasState(currentHistoryIndex);
      updateHistoryButtonStates();

      // Check if we need to set auto-save flag
      const now = Date.now();
      if (now - lastAutoSaveTime > autoSaveInterval && !shouldAutoSaveNextChange) {
        shouldAutoSaveNextChange = true;
        console.log('Next change will be auto-saved (after undo)');
      }
    }
  }

  function redo() {
    if (currentHistoryIndex < canvasHistory.length - 1) {
      currentHistoryIndex++;
      loadCanvasState(currentHistoryIndex);
      updateHistoryButtonStates();

      // Check if we need to set auto-save flag
      const now = Date.now();
      if (now - lastAutoSaveTime > autoSaveInterval && !shouldAutoSaveNextChange) {
        shouldAutoSaveNextChange = true;
        console.log('Next change will be auto-saved (after redo)');
      }
    }
  }

  function loadCanvasState(index) {
    // Set flag to avoid history update during load
    skipNextHistoryUpdate = true;
    const historyItem = canvasHistory[index];
    const stateJson = historyItem.state || historyItem;
    const json = JSON.parse(typeof stateJson === 'string' ? stateJson : JSON.stringify(stateJson));

    // Clear the canvas first to avoid appending future states
    canvas.clear();

    canvas.loadFromJSON(json, function() {
      canvas.renderAll();
      // Critical: ensure the skip flag is still true after canvas loads
      // This prevents object:added events that happen during loadFromJSON from
      // being treated as new changes to the history
      skipNextHistoryUpdate = true;

      // Reset skipNextHistoryUpdate after a small delay to allow all events to process
      setTimeout(() => {
        skipNextHistoryUpdate = false;
      }, 100);
    });

    // Preserve auto-save flag when loading states
    // Don't reset the shouldAutoSaveNextChange flag here
  }

  function updateHistoryButtonStates() {
    const undobutton = document.getElementById('undo-button');
    const redobutton = document.getElementById('redo-button');

    if (undobutton && redobutton) {
      undobutton.disabled = currentHistoryIndex <= 0;
      redobutton.disabled = currentHistoryIndex >= canvasHistory.length - 1;

      // Update history panel if it exists
      updateHistoryPanel();
    }
  }

  function updateHistoryPanel() {
    const historyPanel = document.getElementById('history-panel');
    if (!historyPanel) return;

    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    // Set CSS variable for styling past vs future states
    historyList.style.setProperty('--current-index', (currentHistoryIndex + 1).toString());

    // Clear current list
    historyList.innerHTML = '';

    // Create timestamp formatter
    const formatTime = (index) => {
      const state = canvasHistory[index];
      const timestamp = state && state.timestamp ? state.timestamp : lastOperationTime - (index * 2000);

      if (index === 0) return 'Initial State';

      // Show relative times - more user-friendly
      const now = new Date();
      const elapsedSecs = Math.round((now.getTime() - timestamp) / 1000);

      if (elapsedSecs < 60) return `${elapsedSecs}s ago`;
      if (elapsedSecs < 3600) return `${Math.floor(elapsedSecs / 60)}m ago`;
      return `${Math.floor(elapsedSecs / 3600)}h ago`;
    };

    // Add history items
    canvasHistory.forEach((state, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';
      if (index === currentHistoryIndex) {
        itemEl.classList.add('current');
      }

      // Check if this is an auto-saved state
      const isAutoSave = state && state.isAutoSave;
      if (isAutoSave) {
        itemEl.classList.add('auto-saved');
      }

      // Create action label
      const actionText = state.action || `State ${index + 1}`;

      // Create a more descriptive label
      let stateLabel = actionText;
      if (isAutoSave) {
        stateLabel = `Auto-Saved: ${actionText}`;
      }

      itemEl.innerHTML = `
        <div class="history-item-dot"></div>
        <div class="history-item-label">
          ${stateLabel}
          ${index === currentHistoryIndex ? '<span class="current-state">(current)</span>' : ''}
          <span class="history-time">${formatTime(index)}</span>
        </div>
      `;

      itemEl.addEventListener('click', () => {
        currentHistoryIndex = index;
        loadCanvasState(index);
        updateHistoryButtonStates();
      });

      historyList.appendChild(itemEl);
    });
  }

  // Canvas mouse events for shape creation
  canvas.on('mouse:down', function(options) {
    // Skip if we're panning
    if (isPanning) return;

    if (currentMode !== 'select' && currentMode !== 'draw' && currentMode !== 'text') {
      isDrawing = true;
      const pointer = canvas.getPointer(options.e);
      startX = pointer.x;
      startY = pointer.y;

      if (currentMode === 'rect') {
        const rect = new fabric.Rect({
          left: startX,
          top: startY,
          width: 0,
          height: 0,
          stroke: drawingColor,
          strokeWidth: strokeWidth,
          fill: useFill ? fillColor : 'transparent'
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
      } else if (currentMode === 'circle') {
        const circle = new fabric.Circle({
          left: startX,
          top: startY,
          radius: 0,
          stroke: drawingColor,
          strokeWidth: strokeWidth,
          fill: useFill ? fillColor : 'transparent'
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
      } else if (currentMode === 'triangle') {
        const triangle = new fabric.Triangle({
          left: startX,
          top: startY,
          width: 0,
          height: 0,
          stroke: drawingColor,
          strokeWidth: strokeWidth,
          fill: useFill ? fillColor : 'transparent'
        });
        canvas.add(triangle);
        canvas.setActiveObject(triangle);
      }
    }
  });

  canvas.on('mouse:move', function(options) {
    // Skip if we're panning
    if (isPanning) return;

    if (isDrawing) {
      const pointer = canvas.getPointer(options.e);
      const activeObject = canvas.getActiveObject();

      if (currentMode === 'rect' && activeObject) {
        if (startX > pointer.x) {
          activeObject.set({ left: pointer.x });
        }
        if (startY > pointer.y) {
          activeObject.set({ top: pointer.y });
        }

        activeObject.set({
          width: Math.abs(startX - pointer.x),
          height: Math.abs(startY - pointer.y)
        });
        canvas.renderAll();
      } else if (currentMode === 'circle' && activeObject) {
        const radius = Math.sqrt(
            Math.pow(startX - pointer.x, 2) +
            Math.pow(startY - pointer.y, 2)
        ) / 2;

        const midX = (startX + pointer.x) / 2;
        const midY = (startY + pointer.y) / 2;

        activeObject.set({
          left: midX - radius,
          top: midY - radius,
          radius: radius
        });
        canvas.renderAll();
      } else if (currentMode === 'triangle' && activeObject) {
        if (startX > pointer.x) {
          activeObject.set({ left: pointer.x });
        }
        if (startY > pointer.y) {
          activeObject.set({ top: pointer.y });
        }

        activeObject.set({
          width: Math.abs(startX - pointer.x),
          height: Math.abs(startY - pointer.y)
        });
        canvas.renderAll();
      }
    }
  });

  canvas.on('mouse:up', function() {
    isDrawing = false;
  });

  // Object selected event
  canvas.on('selection:created', updateSidebarProperties);
  canvas.on('selection:updated', updateSidebarProperties);

  function updateSidebarProperties(e) {
    const activeObject = e.selected[0];

    if (activeObject) {
      // Show the sidebar if it's collapsed
      document.getElementById('sidebar').classList.remove('collapsed');

      // Update stroke width slider and display
      if (activeObject.strokeWidth !== undefined) {
        const strokeWidthValue = activeObject.strokeWidth;
        document.getElementById('stroke-width').value = strokeWidthValue;
        document.getElementById('stroke-width-value').textContent = `${strokeWidthValue}px`;
      }

      // Update color picker
      const colorPickerInput = document.getElementById('color-picker');
      let color = '';

      if (activeObject.type === 'i-text' && activeObject.fill) {
        color = activeObject.fill;
      } else if (activeObject.stroke) {
        color = activeObject.stroke;
      }

      if (color) {
        colorPickerInput.value = color;
        // Trigger Coloris update
        colorPickerInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Update fill toggle and fill color
      const fillToggle = document.getElementById('fill-toggle');
      const fillColorInput = document.getElementById('fill-color');

      if (activeObject.fill !== undefined && activeObject.fill !== 'transparent') {
        fillToggle.checked = true;
        fillColorInput.disabled = false;

        if (activeObject.fill && activeObject.fill !== 'transparent') {
          fillColorInput.value = activeObject.fill;
          // Trigger Coloris update
          fillColorInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Make sure Coloris field is enabled
        if (fillColorInput.closest('.clr-field')) {
          fillColorInput.closest('.clr-field').classList.remove('disabled');
        }
      } else {
        fillToggle.checked = false;
        fillColorInput.disabled = true;

        // Make sure Coloris field is disabled
        if (fillColorInput.closest('.clr-field')) {
          fillColorInput.closest('.clr-field').classList.add('disabled');
        }
      }
    }
  }

  // Helper function to set active tool
  function setActiveTool(tool) {
    currentMode = tool;

    // Remove active class from all tool buttons
    const toolButtons = document.querySelectorAll('.tool-button');
    toolButtons.forEach(button => {
      button.classList.remove('active');
    });

    // Add active class to selected tool
    if (tool === 'select') {
      document.getElementById('select-tool').classList.add('active');
      // Only enable panning in select mode when zoomed in
      if (panzoomInstance.getScale() > 1) {
        panzoomInstance.setOptions({ disablePan: false });
      }
    } else if (tool === 'draw') {
      document.getElementById('draw-tool').classList.add('active');
      // Disable panning in draw mode
      panzoomInstance.setOptions({ disablePan: true });
    } else if (tool === 'rect') {
      document.getElementById('rect-tool').classList.add('active');
      // Disable panning in shape mode
      panzoomInstance.setOptions({ disablePan: true });
    } else if (tool === 'circle') {
      document.getElementById('circle-tool').classList.add('active');
      // Disable panning in shape mode
      panzoomInstance.setOptions({ disablePan: true });
    } else if (tool === 'triangle') {
      document.getElementById('triangle-tool').classList.add('active');
      // Disable panning in shape mode
      panzoomInstance.setOptions({ disablePan: true });
    } else if (tool === 'text') {
      document.getElementById('text-tool').classList.add('active');
      // Disable panning in text mode
      panzoomInstance.setOptions({ disablePan: true });
    }
  }

  // Initial setup
  updateZoomIndicator(1);

  // New Canvas Button Click Handler
  document.getElementById('new-canvas').addEventListener('click', function() {
    newCanvasModal.show();
  });

  // Preset Size Buttons
  const presetButtons = document.querySelectorAll('.preset-size-button');
  presetButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      presetButtons.forEach(b => b.classList.remove('active'));

      // Add active class to clicked button
      this.classList.add('active');

      // Set input values
      document.getElementById('canvasWidth').value = this.getAttribute('data-width');
      document.getElementById('canvasHeight').value = this.getAttribute('data-height');
    });
  });

  // Create New Canvas Button
  document.getElementById('createNewCanvas').addEventListener('click', function() {
    const width = parseInt(document.getElementById('canvasWidth').value);
    const height = parseInt(document.getElementById('canvasHeight').value);
    const backgroundColor = document.getElementById('canvasBackground').value;

    // Validate inputs
    if (isNaN(width) || isNaN(height) || width < 50 || height < 50 || width > 3000 || height > 3000) {
      alert('Please enter valid canvas dimensions (between 50x50 and 3000x3000 pixels)');
      return;
    }

    // Clear current canvas
    canvas.clear();

    // Disable auto-resizing for custom-sized canvas
    autoResizeEnabled = false;

    // Update canvas dimensions
    canvas.setDimensions({
      width: width,
      height: height
    });

    // Update the CSS of the canvas container to ensure it displays correctly
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.style.width = width + 'px';
    canvasContainer.style.height = height + 'px';

    // Set background color
    canvas.setBackgroundColor(backgroundColor, canvas.renderAll.bind(canvas));

    // Close modal
    newCanvasModal.hide();

    // Display canvas size in zoom indicator temporarily
    const zoomIndicator = document.querySelector('.zoom-indicator');
    const originalContent = zoomIndicator.innerHTML;

    zoomIndicator.innerHTML = `<i class="bi bi-arrows-fullscreen"></i> <span>${width} × ${height}</span>`;
    zoomIndicator.style.background = 'rgba(0, 0, 0, 0.8)';

    setTimeout(() => {
      zoomIndicator.innerHTML = originalContent;
      zoomIndicator.style.background = '';
    }, 2000);

    // Reset canvas zoom
    panzoomInstance.reset();

    // Reset history for the new canvas
    canvasHistory = [];
    currentHistoryIndex = -1;
    saveCanvasState('initialize', 'canvas', true); // Auto-save initial state
    updateHistoryButtonStates();
    updateHistoryPanel();
  });

  // Theme toggle functionality
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('i');

  // Check for saved theme preference or respect OS theme settings
  const savedTheme = localStorage.getItem('musebrush-theme');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  if (savedTheme === 'night' || (!savedTheme && prefersDarkScheme.matches)) {
    document.body.classList.add('night-theme');
    themeIcon.classList.remove('bi-moon');
    themeIcon.classList.add('bi-sun');
  }

  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('night-theme');

    const isNightTheme = document.body.classList.contains('night-theme');

    // Toggle icon between moon and sun
    if (isNightTheme) {
      themeIcon.classList.remove('bi-moon');
      themeIcon.classList.add('bi-sun');
      localStorage.setItem('musebrush-theme', 'night');
    } else {
      themeIcon.classList.remove('bi-sun');
      themeIcon.classList.add('bi-moon');
      localStorage.setItem('musebrush-theme', 'light');
    }
  });

  // Listen for OS theme changes
  prefersDarkScheme.addEventListener('change', function(e) {
    if (!localStorage.getItem('musebrush-theme')) {
      if (e.matches) {
        document.body.classList.add('night-theme');
        themeIcon.classList.remove('bi-moon');
        themeIcon.classList.add('bi-sun');
      } else {
        document.body.classList.remove('night-theme');
        themeIcon.classList.remove('bi-sun');
        themeIcon.classList.add('bi-moon');
      }
    }
  });

  // Document-level keyboard shortcuts for history
  document.addEventListener('keydown', function(e) {
    // Undo: Ctrl+Z or Command+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }

    // Redo: Ctrl+Y or Command+Y or Ctrl+Shift+Z or Command+Shift+Z
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });

  // Canvas event listeners for history
  canvas.on('object:added', function(e) {
    // Skip if we're in the middle of loading a state from history
    if (skipNextHistoryUpdate) {
      return;
    }

    // Skip history update for text tool which triggers this twice
    if (e.target && e.target.type === 'i-text' && currentMode === 'text') {
      return;
    }

    // If we're not at the end of history, truncate future states
    if (currentHistoryIndex < canvasHistory.length - 1) {
      canvasHistory = canvasHistory.slice(0, currentHistoryIndex + 1);
    }

    isBatchOperation = false;
    saveCanvasState('add', e.target ? e.target.type : 'unknown');
  });

  canvas.on('object:modified', function(e) {
    // Skip if we're in the middle of loading a state from history
    if (skipNextHistoryUpdate) {
      return;
    }

    // If we're not at the end of history, truncate future states
    if (currentHistoryIndex < canvasHistory.length - 1) {
      canvasHistory = canvasHistory.slice(0, currentHistoryIndex + 1);
    }

    isBatchOperation = false;
    saveCanvasState('modify', e.target ? e.target.type : 'unknown');
  });

  canvas.on('object:removed', function(e) {
    // Skip if we're in the middle of loading a state from history
    if (skipNextHistoryUpdate) {
      return;
    }

    // If we're not at the end of history, truncate future states
    if (currentHistoryIndex < canvasHistory.length - 1) {
      canvasHistory = canvasHistory.slice(0, currentHistoryIndex + 1);
    }

    isBatchOperation = false;
    saveCanvasState('remove', e.target ? e.target.type : 'unknown');
  });

  // Batch operations for path drawing and similar frequent updates
  canvas.on('path:created', function(e) {
    // Skip if we're in the middle of loading a state from history
    if (skipNextHistoryUpdate) {
      return;
    }

    // If we're not at the end of history, truncate future states
    if (currentHistoryIndex < canvasHistory.length - 1) {
      canvasHistory = canvasHistory.slice(0, currentHistoryIndex + 1);
    }

    isBatchOperation = true;
    // Increase batch timeout for drawing operations
    setTimeout(() => {
      // Make sure we're not in the middle of another history operation
      if (!skipNextHistoryUpdate) {
        saveCanvasState('draw', 'path');
      }
    }, 100); // Add a small delay to ensure the path is fully rendered
  });

  // Free drawing start (save state before drawing begins)
  canvas.on('mouse:down', function(options) {
    if (canvas.isDrawingMode && !isPanning) {
      // No longer saving canvas state at the start of drawing
      // This line is intentionally removed to ignore drawing start events
    }
  });

  // Undo/Redo button event listeners
  document.getElementById('undo-button').addEventListener('click', function() {
    undo();
  });

  document.getElementById('redo-button').addEventListener('click', function() {
    redo();
  });

  // Toggle history panel
  document.getElementById('history-button').addEventListener('click', function() {
    document.getElementById('history-panel').classList.toggle('visible');
    updateHistoryPanel(); // Update panel contents when showing
  });

  // Close history panel
  document.getElementById('close-history').addEventListener('click', function() {
    document.getElementById('history-panel').classList.remove('visible');
  });

  // Clear history
  document.getElementById('clear-history').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear the history? This cannot be undone.')) {
      // Keep only the current state
      const currentState = canvasHistory[currentHistoryIndex];
      canvasHistory = [currentState];
      currentHistoryIndex = 0;
      updateHistoryPanel();
      updateHistoryButtonStates();

      // Show confirmation
      const notification = document.createElement('div');
      notification.className = 'history-notification';
      notification.innerHTML = '<i class="bi bi-check-circle"></i> History cleared';
      historyPanel.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 2000);
    }
  });
});