// Concept Map functionality

// Setup concept map
function setupConceptMap() {
    // Get DOM elements
    const canvas = document.getElementById('concept-canvas');
    const conceptSearch = document.getElementById('concept-search');
    const categoryFilter = document.getElementById('concept-category-filter');
    const clearCanvasBtn = document.getElementById('clear-canvas');
    const saveDiagramBtn = document.getElementById('save-diagram');
    const loadDiagramBtn = document.getElementById('load-diagram');
    const toolButtons = document.querySelectorAll('.tool-btn');
    
    // Load saved diagrams from localStorage
    loadSavedDiagrams();
    
    // Populate terms list
    populateConceptTerms();
    
    // Populate category filter
    populateCategoryFilter();
    
    // Set default active tool to move
    activeTool = 'move';
    
    // Set up event listeners for tools
    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tool buttons
            toolButtons.forEach(btn => btn.classList.remove('active'));
            
            // Set active tool
            const tool = button.getAttribute('data-tool');
            
            if (activeTool === tool && tool !== 'move') {
                // If clicking the same tool (except move), deactivate it and set move as default
                activeTool = 'move';
                document.getElementById('move-tool').classList.add('active');
                isConnecting = false;
                connectionStart = null;
                
                // Update cursor for canvas
                canvas.style.cursor = 'default';
            } else {
                // Activate the new tool
                activeTool = tool;
                button.classList.add('active');
                
                // Update cursor based on tool
                if (tool === 'connection') {
                    isConnecting = true;
                    canvas.style.cursor = 'crosshair';
                } else if (tool === 'delete') {
                    canvas.style.cursor = 'no-drop';
                } else if (tool === 'move') {
                    canvas.style.cursor = 'default';
                } else {
                    canvas.style.cursor = 'pointer';
                }
                
                // Reset connection state if not using connection tool
                if (tool !== 'connection') {
                    isConnecting = false;
                    connectionStart = null;
                }
            }
        });
    });
    
    // Set up event listener for search
    conceptSearch.addEventListener('input', () => {
        populateConceptTerms();
    });
    
    // Set up event listener for category filter
    categoryFilter.addEventListener('change', () => {
        populateConceptTerms();
    });
    
    // Set up event listener for clear canvas
    clearCanvasBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
            clearCanvas();
        }
    });
    
    // Set up event listener for save diagram
    saveDiagramBtn.addEventListener('click', () => {
        saveDiagram();
    });
    
    // Set up event listener for load diagram
    loadDiagramBtn.addEventListener('click', () => {
        showLoadDiagramDialog();
    });
    
    // Set up canvas event listeners
    setupCanvasEventListeners();
}

// Populate the terms list in the sidebar
function populateConceptTerms() {
    const termsContainer = document.querySelector('.concept-map-terms');
    const searchTerm = document.getElementById('concept-search').value.toLowerCase();
    const categoryFilter = document.getElementById('concept-category-filter').value;
    
    // Clear existing terms
    termsContainer.innerHTML = '';
    
    // Filter terms based on search and category
    const filteredTerms = allKeyTerms.filter(term => {
        const matchesSearch = term.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || termCategories[term] === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    // Add terms to the container
    filteredTerms.forEach(term => {
        const termItem = document.createElement('div');
        termItem.className = 'concept-term-item';
        termItem.setAttribute('draggable', 'true');
        termItem.setAttribute('data-term', term);
        
        let termHTML = term;
        
        // Add category tag if available
        if (termCategories[term]) {
            termHTML += `<span class="category-tag">${termCategories[term]}</span>`;
        }
        
        termItem.innerHTML = termHTML;
        
        // Add drag event listeners
        termItem.addEventListener('dragstart', handleDragStart);
        
        termsContainer.appendChild(termItem);
    });
    
    // Add definitions as draggable items if they exist
    if (Object.keys(termDefinitions).length > 0) {
        const definitionsHeader = document.createElement('h4');
        definitionsHeader.textContent = 'Definitions';
        definitionsHeader.style.marginTop = '15px';
        termsContainer.appendChild(definitionsHeader);
        
        Object.keys(termDefinitions).forEach(term => {
            const definition = termDefinitions[term];
            if (!definition) return;
            
            // Skip if it doesn't match the search or category
            if (!term.toLowerCase().includes(searchTerm)) return;
            if (categoryFilter && termCategories[term] !== categoryFilter) return;
            
            const defItem = document.createElement('div');
            defItem.className = 'concept-term-item';
            defItem.setAttribute('draggable', 'true');
            defItem.setAttribute('data-definition', term);
            
            // Truncate definition if it's too long
            const shortDef = definition.length > 50 ? definition.substring(0, 50) + '...' : definition;
            defItem.textContent = shortDef;
            
            // Add drag event listeners
            defItem.addEventListener('dragstart', handleDragStart);
            
            termsContainer.appendChild(defItem);
        });
    }
}

// Populate category filter dropdown
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('concept-category-filter');
    const categories = new Set();
    
    // Collect all unique categories
    Object.values(termCategories).forEach(category => {
        if (category) {
            categories.add(category);
        }
    });
    
    // Clear existing options (except the first one)
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Handle drag start event
function handleDragStart(e) {
    // Set data for drag operation
    const term = e.target.getAttribute('data-term');
    const definition = e.target.getAttribute('data-definition');
    
    if (term) {
        e.dataTransfer.setData('text/plain', term);
        e.dataTransfer.setData('itemType', 'term');
    } else if (definition) {
        e.dataTransfer.setData('text/plain', definition);
        e.dataTransfer.setData('itemType', 'definition');
        e.dataTransfer.setData('termForDefinition', definition);
    }
    
    // Set drag effect
    e.dataTransfer.effectAllowed = 'copy';
}

// Set up canvas event listeners
function setupCanvasEventListeners() {
    const canvas = document.getElementById('concept-canvas');
    
    // Prevent default drag behavior
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    // Handle drop event
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        
        // Only allow drops when using move tool
        if (activeTool !== 'move') {
            return;
        }
        
        const text = e.dataTransfer.getData('text/plain');
        const itemType = e.dataTransfer.getData('itemType');
        const termForDefinition = e.dataTransfer.getData('termForDefinition');
        
        if (text) {
            // Calculate position relative to canvas
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Create new item
            createCanvasItem(text, x, y, itemType, termForDefinition);
        }
    });
    
    // Handle click event for canvas
    canvas.addEventListener('click', (e) => {
        // Check if we clicked on an item or connection
        const target = e.target;
        if (target !== canvas) {
            // If using delete tool and clicked on a connection
            if (activeTool === 'delete' && target.classList.contains('canvas-connection')) {
                deleteConnection(target);
            }
            return;
        }
        
        // Handle canvas clicks based on active tool
        switch (activeTool) {
            case 'text':
                // Create a text box
                const textX = e.clientX - canvas.getBoundingClientRect().left;
                const textY = e.clientY - canvas.getBoundingClientRect().top;
                
                const text = prompt('Enter text:');
                if (text) {
                    createCanvasItem(text, textX, textY, 'text');
                }
                break;
                
            case 'group':
                // Create a group box
                const groupX = e.clientX - canvas.getBoundingClientRect().left;
                const groupY = e.clientY - canvas.getBoundingClientRect().top;
                
                const groupName = prompt('Enter group name (optional):');
                createCanvasItem(groupName || 'Group', groupX, groupY, 'group');
                break;
                
            case 'connection':
                // Reset connection if clicking on canvas
                isConnecting = false;
                connectionStart = null;
                break;
        }
    });
    
    // Add event listener for connection visualization
    canvas.addEventListener('mousemove', (e) => {
        // If we're in the process of creating a connection
        if (isConnecting && connectionStart) {
            // Remove any temporary connection line
            const tempLine = document.getElementById('temp-connection');
            if (tempLine) {
                tempLine.remove();
            }
            
            // Create temporary connection line
            const startRect = connectionStart.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            
            // Calculate start point (center of the start item)
            const startX = startRect.left + startRect.width / 2 - canvasRect.left;
            const startY = startRect.top + startRect.height / 2 - canvasRect.top;
            
            // Calculate end point (current mouse position)
            const endX = e.clientX - canvasRect.left;
            const endY = e.clientY - canvasRect.top;
            
            // Calculate distance and angle
            const dx = endX - startX;
            const dy = endY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Create temporary connection element
            const tempConnection = document.createElement('div');
            tempConnection.className = 'canvas-connection temp-connection';
            tempConnection.id = 'temp-connection';
            
            // Position and rotate connection
            tempConnection.style.width = `${distance}px`;
            tempConnection.style.left = `${startX}px`;
            tempConnection.style.top = `${startY}px`;
            tempConnection.style.transform = `rotate(${angle}deg)`;
            
            // Add to canvas
            canvas.appendChild(tempConnection);
        }
    });
}

// Create a new item on the canvas
function createCanvasItem(text, x, y, itemType, termForDefinition = null) {
    const canvas = document.getElementById('concept-canvas');
    
    // Create item element
    const item = document.createElement('div');
    item.className = `canvas-item ${itemType}`;
    item.textContent = text;
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;
    
    // Store item data
    const itemData = {
        id: Date.now().toString(),
        type: itemType,
        text: text,
        x: x,
        y: y
    };
    
    // Add additional data for definitions
    if (itemType === 'definition' && termForDefinition) {
        itemData.termForDefinition = termForDefinition;
        item.setAttribute('data-term', termForDefinition);
    }
    
    // Set item ID
    item.setAttribute('id', itemData.id);
    
    // Add item to canvas
    canvas.appendChild(item);
    
    // Add item to items array
    conceptMapItems.push(itemData);
    
    // Add event listeners for item
    setupItemEventListeners(item);
}

// Set up event listeners for canvas items
function setupItemEventListeners(item) {
    // Mouse down event for dragging or tool actions
    item.addEventListener('mousedown', (e) => {
        // Prevent default behavior
        e.preventDefault();
        
        // Handle different tools
        switch (activeTool) {
            case 'connection':
                // Handle connection tool
                if (!isConnecting || !connectionStart) {
                    // Start connection
                    connectionStart = item;
                    isConnecting = true;
                } else {
                    // Complete connection
                    createConnection(connectionStart, item);
                    connectionStart = null;
                    isConnecting = false;
                }
                return;
                
            case 'delete':
                // Handle delete tool
                deleteCanvasItem(item);
                return;
                
            case 'move':
            default:
                // Handle move tool (default)
                // Start dragging
                isDragging = true;
                draggedItem = item;
                
                // Calculate drag offset
                const rect = item.getBoundingClientRect();
                dragOffset.x = e.clientX - rect.left;
                dragOffset.y = e.clientY - rect.top;
                
                // Add active class
                item.classList.add('dragging');
                break;
        }
    });
    
    // Double click to edit text
    item.addEventListener('dblclick', (e) => {
        // Only allow editing if using move tool
        if (activeTool !== 'move') return;
        
        const newText = prompt('Edit text:', item.textContent);
        if (newText !== null) {
            item.textContent = newText;
            
            // Update item in items array
            const itemId = item.getAttribute('id');
            const itemIndex = conceptMapItems.findIndex(i => i.id === itemId);
            if (itemIndex !== -1) {
                conceptMapItems[itemIndex].text = newText;
            }
        }
    });
    
    // Context menu for delete (right-click)
    item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        deleteCanvasItem(item);
    });
    
    // Mouse over event to show delete cursor when using delete tool
    item.addEventListener('mouseover', () => {
        if (activeTool === 'delete') {
            item.style.cursor = 'no-drop';
        } else if (activeTool === 'connection') {
            item.style.cursor = 'crosshair';
        } else {
            item.style.cursor = 'move';
        }
    });
    
    // Mouse out event to reset cursor
    item.addEventListener('mouseout', () => {
        item.style.cursor = '';
    });
}

// Create a connection between two items
function createConnection(startItem, endItem) {
    // Don't connect an item to itself
    if (startItem === endItem) {
        return;
    }
    
    const canvas = document.getElementById('concept-canvas');
    const startId = startItem.getAttribute('id');
    const endId = endItem.getAttribute('id');
    
    // Check if connection already exists
    const connectionExists = conceptMapConnections.some(conn => 
        (conn.startId === startId && conn.endId === endId) || 
        (conn.startId === endId && conn.endId === startId)
    );
    
    if (connectionExists) {
        return;
    }
    
    // Prompt for connection label
    const label = prompt('Enter connection label (optional):');
    
    // Create connection data
    const connectionData = {
        id: `conn-${Date.now()}`,
        startId: startId,
        endId: endId,
        label: label || ''
    };
    
    // Add connection to connections array
    conceptMapConnections.push(connectionData);
    
    // Draw connection
    drawConnection(connectionData);
}

// Draw a connection between two items
function drawConnection(connectionData) {
    const canvas = document.getElementById('concept-canvas');
    const startItem = document.getElementById(connectionData.startId);
    const endItem = document.getElementById(connectionData.endId);
    
    if (!startItem || !endItem) {
        return;
    }
    
    // Get item positions
    const startRect = startItem.getBoundingClientRect();
    const endRect = endItem.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate center points
    const startX = startRect.left + startRect.width / 2 - canvasRect.left;
    const startY = startRect.top + startRect.height / 2 - canvasRect.top;
    const endX = endRect.left + endRect.width / 2 - canvasRect.left;
    const endY = endRect.top + endRect.height / 2 - canvasRect.top;
    
    // Calculate distance and angle
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Create connection element
    const connection = document.createElement('div');
    connection.className = 'canvas-connection';
    connection.setAttribute('id', connectionData.id);
    connection.setAttribute('data-start', connectionData.startId);
    connection.setAttribute('data-end', connectionData.endId);
    
    // Position and rotate connection
    connection.style.width = `${distance}px`;
    connection.style.left = `${startX}px`;
    connection.style.top = `${startY}px`;
    connection.style.transform = `rotate(${angle}deg)`;
    
    // Add connection to canvas
    canvas.appendChild(connection);
    
    // Add label if provided
    if (connectionData.label) {
        const label = document.createElement('div');
        label.className = 'canvas-connection-label';
        label.textContent = connectionData.label;
        
        // Position label at midpoint
        label.style.left = `${startX + dx / 2}px`;
        label.style.top = `${startY + dy / 2}px`;
        
        // Add label to canvas
        canvas.appendChild(label);
        
        // Store label reference in connection data
        connectionData.labelElement = label;
        
        // Add event listener for label edit
        label.addEventListener('dblclick', (e) => {
            // Only allow editing if using move tool
            if (activeTool !== 'move') return;
            
            const newLabel = prompt('Edit connection label:', connectionData.label);
            if (newLabel !== null) {
                connectionData.label = newLabel;
                label.textContent = newLabel;
            }
        });
        
        // Add event listener for delete tool
        label.addEventListener('click', (e) => {
            if (activeTool === 'delete') {
                deleteConnection(connection);
            }
        });
        
        // Update cursor based on active tool
        label.addEventListener('mouseover', () => {
            if (activeTool === 'delete') {
                label.style.cursor = 'no-drop';
            } else if (activeTool === 'move') {
                label.style.cursor = 'pointer';
            } else {
                label.style.cursor = '';
            }
        });
    }
    
    // Add event listener for connection delete with right-click
    connection.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        deleteConnection(connection);
    });
    
    // Add event listener for delete tool
    connection.addEventListener('click', (e) => {
        if (activeTool === 'delete') {
            deleteConnection(connection);
        }
    });
    
    // Update cursor based on active tool
    connection.addEventListener('mouseover', () => {
        if (activeTool === 'delete') {
            connection.style.cursor = 'no-drop';
        } else {
            connection.style.cursor = '';
        }
    });
    
    return connection;
}

// Delete a connection
function deleteConnection(connectionElement) {
    const connectionId = connectionElement.getAttribute('id');
    
    // Find the connection data
    const connectionData = conceptMapConnections.find(conn => conn.id === connectionId);
    
    if (!connectionData) return;
    
    // Remove connection from connections array
    const connectionIndex = conceptMapConnections.findIndex(conn => conn.id === connectionId);
    if (connectionIndex !== -1) {
        conceptMapConnections.splice(connectionIndex, 1);
    }
    
    // Remove label if it exists
    if (connectionData.labelElement) {
        connectionData.labelElement.classList.add('deleting');
        setTimeout(() => {
            connectionData.labelElement.remove();
        }, 300);
    }
    
    // Remove connection from canvas with fade-out effect
    connectionElement.classList.add('deleting');
    setTimeout(() => {
        connectionElement.remove();
    }, 300);
}

// Delete a canvas item
function deleteCanvasItem(item) {
    // Get item ID
    const itemId = item.getAttribute('id');
    
    // Remove connections involving this item
    removeConnectionsForItem(itemId);
    
    // Remove item from items array
    const itemIndex = conceptMapItems.findIndex(i => i.id === itemId);
    if (itemIndex !== -1) {
        conceptMapItems.splice(itemIndex, 1);
    }
    
    // Remove item from canvas with a fade-out effect
    item.classList.add('deleting');
    setTimeout(() => {
        item.remove();
    }, 300);
}

// Remove connections for a specific item
function removeConnectionsForItem(itemId) {
    // Find connections involving this item
    const connectionsToRemove = conceptMapConnections.filter(conn => 
        conn.startId === itemId || conn.endId === itemId
    );
    
    // Remove each connection
    connectionsToRemove.forEach(conn => {
        // Remove connection element
        const connectionElement = document.getElementById(conn.id);
        if (connectionElement) {
            connectionElement.classList.add('deleting');
            setTimeout(() => {
                connectionElement.remove();
            }, 300);
        }
        
        // Remove label element if it exists
        if (conn.labelElement) {
            conn.labelElement.classList.add('deleting');
            setTimeout(() => {
                conn.labelElement.remove();
            }, 300);
        }
        
        // Remove connection from connections array
        const connectionIndex = conceptMapConnections.findIndex(c => c.id === conn.id);
        if (connectionIndex !== -1) {
            conceptMapConnections.splice(connectionIndex, 1);
        }
    });
}

// Update connections when items are moved
function updateConnections() {
    // Redraw all connections
    conceptMapConnections.forEach(conn => {
        // Remove old connection element
        const connectionElement = document.getElementById(conn.id);
        if (connectionElement) {
            connectionElement.remove();
        }
        
        // Remove old label element
        if (conn.labelElement) {
            conn.labelElement.remove();
            conn.labelElement = null;
        }
        
        // Draw new connection
        drawConnection(conn);
    });
}

// Clear the canvas
function clearCanvas() {
    const canvas = document.getElementById('concept-canvas');
    
    // Remove all items
    conceptMapItems.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
            element.remove();
        }
    });
    
    // Remove all connections
    conceptMapConnections.forEach(conn => {
        const element = document.getElementById(conn.id);
        if (element) {
            element.remove();
        }
        
        if (conn.labelElement) {
            conn.labelElement.remove();
        }
    });
    
    // Clear arrays
    conceptMapItems = [];
    conceptMapConnections = [];
}

// Save the current diagram
function saveDiagram() {
    const diagramName = prompt('Enter a name for this diagram:');
    if (!diagramName) {
        return;
    }
    
    // Create diagram data
    const diagramData = {
        id: Date.now().toString(),
        name: diagramName,
        items: JSON.parse(JSON.stringify(conceptMapItems)),
        connections: conceptMapConnections.map(conn => ({
            id: conn.id,
            startId: conn.startId,
            endId: conn.endId,
            label: conn.label || ''
        }))
    };
    
    // Add to saved diagrams
    savedDiagrams.push(diagramData);
    
    // Save to localStorage
    saveToLocalStorage('savedDiagrams', savedDiagrams);
    
    alert(`Diagram "${diagramName}" saved successfully!`);
}

// Load saved diagrams from localStorage
function loadSavedDiagrams() {
    const savedData = getFromLocalStorage('savedDiagrams');
    if (savedData) {
        savedDiagrams = savedData;
    }
}

// Show dialog to load a saved diagram
function showLoadDiagramDialog() {
    if (savedDiagrams.length === 0) {
        alert('No saved diagrams found.');
        return;
    }
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>Load Diagram</h3>
            <div class="saved-diagrams-list">
                ${savedDiagrams.map(diagram => `
                    <div class="saved-diagram-item" data-id="${diagram.id}">
                        <div class="diagram-name">${diagram.name}</div>
                        <div class="diagram-info">
                            ${diagram.items.length} items, ${diagram.connections.length} connections
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Add dialog to body
    document.body.appendChild(dialog);
    
    // Add event listener for close button
    dialog.querySelector('.close-modal').addEventListener('click', () => {
        dialog.remove();
    });
    
    // Add event listeners for diagram items
    dialog.querySelectorAll('.saved-diagram-item').forEach(item => {
        item.addEventListener('click', () => {
            const diagramId = item.getAttribute('data-id');
            const diagram = savedDiagrams.find(d => d.id === diagramId);
            
            if (diagram) {
                loadDiagram(diagram);
                dialog.remove();
            }
        });
    });
}

// Load a saved diagram
function loadDiagram(diagram) {
    // Clear current canvas
    clearCanvas();
    
    // Load items
    diagram.items.forEach(item => {
        createCanvasItem(item.text, item.x, item.y, item.type, item.termForDefinition);
    });
    
    // Load connections
    diagram.connections.forEach(conn => {
        const connectionData = {
            id: conn.id,
            startId: conn.startId,
            endId: conn.endId,
            label: conn.label
        };
        
        conceptMapConnections.push(connectionData);
        drawConnection(connectionData);
    });
}

// Set up global mouse events for dragging
document.addEventListener('mousemove', (e) => {
    if (!isDragging || !draggedItem) {
        return;
    }
    
    // Get canvas position
    const canvas = document.getElementById('concept-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate new position
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;
    
    // Update item position
    draggedItem.style.left = `${x}px`;
    draggedItem.style.top = `${y}px`;
    
    // Update item in items array
    const itemId = draggedItem.getAttribute('id');
    const itemIndex = conceptMapItems.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        conceptMapItems[itemIndex].x = x;
        conceptMapItems[itemIndex].y = y;
    }
    
    // Update connections
    updateConnections();
});

document.addEventListener('mouseup', () => {
    if (isDragging && draggedItem) {
        // Remove active class
        draggedItem.classList.remove('dragging');
        
        // Reset dragging state
        isDragging = false;
        draggedItem = null;
    }
});
