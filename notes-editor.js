// Notes Editor functionality

// Setup notes editor
function setupNotes() {
    // Get DOM elements
    const notesEditor = document.getElementById('notes-editor');
    const noteTitle = document.getElementById('note-title');
    const newNoteBtn = document.getElementById('new-note');
    const saveAllNotesBtn = document.getElementById('save-all-notes');
    const notesList = document.querySelector('.notes-list');
    const formatButtons = document.querySelectorAll('.format-btn');
    const wordCount = document.getElementById('word-count');
    const saveStatus = document.getElementById('save-status');
    
    // Load saved notes from localStorage
    loadSavedNotes();
    
    // Display notes list
    displayNotesList();
    
    // Set up event listener for new note button
    newNoteBtn.addEventListener('click', () => {
        createNewNote();
    });
    
    // Set up event listener for save all notes button
    saveAllNotesBtn.addEventListener('click', () => {
        saveAllNotes();
    });
    
    // Set up event listeners for format buttons
    formatButtons.forEach(button => {
        button.addEventListener('click', () => {
            formatText(button.id);
        });
    });
    
    // Set up event listener for note title
    noteTitle.addEventListener('input', () => {
        if (activeNote) {
            activeNote.title = noteTitle.value;
            updateNotesList();
            saveStatus.textContent = 'Unsaved';
        }
    });
    
    // Set up event listener for notes editor
    notesEditor.addEventListener('input', () => {
        if (activeNote) {
            activeNote.content = notesEditor.innerHTML;
            updateWordCount();
            saveStatus.textContent = 'Unsaved';
        }
    });
    
    // Set up auto-save timer
    setInterval(() => {
        if (activeNote && activeNote.content !== lastSavedContent) {
            saveNote(activeNote);
            lastSavedContent = activeNote.content;
            saveStatus.textContent = 'Saved';
        }
    }, 5000); // Auto-save every 5 seconds
    
    // Create a default note if none exist
    if (notes.length === 0) {
        createNewNote();
    } else {
        // Load the first note
        loadNote(notes[0]);
    }
}

// Load saved notes from localStorage
function loadSavedNotes() {
    const savedNotes = getFromLocalStorage('notes');
    if (savedNotes) {
        notes = savedNotes;
    }
}

// Display the list of notes
function displayNotesList() {
    const notesList = document.querySelector('.notes-list');
    
    // Clear existing list
    notesList.innerHTML = '';
    
    // Add each note to the list
    notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.setAttribute('data-id', note.id);
        
        // Add active class if this is the active note
        if (activeNote && note.id === activeNote.id) {
            noteItem.classList.add('active');
        }
        
        // Create note preview
        const previewText = note.content.replace(/<[^>]*>/g, '').substring(0, 50);
        
        noteItem.innerHTML = `
            <div class="note-title">${note.title || 'Untitled Note'}</div>
            <div class="note-preview">${previewText}...</div>
        `;
        
        // Add event listener for clicking on note
        noteItem.addEventListener('click', () => {
            loadNote(note);
        });
        
        // Add event listener for right-click (delete)
        noteItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            if (confirm(`Delete note "${note.title || 'Untitled Note'}"?`)) {
                deleteNote(note.id);
            }
        });
        
        notesList.appendChild(noteItem);
    });
}

// Update the notes list (without full redraw)
function updateNotesList() {
    const noteItems = document.querySelectorAll('.note-item');
    
    noteItems.forEach(item => {
        const noteId = item.getAttribute('data-id');
        const note = notes.find(n => n.id === noteId);
        
        if (note) {
            const titleElement = item.querySelector('.note-title');
            if (titleElement) {
                titleElement.textContent = note.title || 'Untitled Note';
            }
            
            const previewElement = item.querySelector('.note-preview');
            if (previewElement) {
                const previewText = note.content.replace(/<[^>]*>/g, '').substring(0, 50);
                previewElement.textContent = `${previewText}...`;
            }
            
            // Update active class
            if (activeNote && note.id === activeNote.id) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    });
}

// Create a new note
function createNewNote() {
    // Create note object
    const newNote = {
        id: Date.now().toString(),
        title: 'New Note',
        content: '',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    // Add to notes array
    notes.unshift(newNote);
    
    // Save notes
    saveAllNotes();
    
    // Update notes list
    displayNotesList();
    
    // Load the new note
    loadNote(newNote);
}

// Load a note into the editor
function loadNote(note) {
    // Save current note if there is one
    if (activeNote) {
        saveNote(activeNote);
    }
    
    // Set active note
    activeNote = note;
    lastSavedContent = note.content;
    
    // Update editor
    document.getElementById('note-title').value = note.title || '';
    document.getElementById('notes-editor').innerHTML = note.content;
    
    // Update word count
    updateWordCount();
    
    // Update notes list
    updateNotesList();
    
    // Update save status
    document.getElementById('save-status').textContent = 'Saved';
}

// Save a note
function saveNote(note) {
    // Update note
    note.updated = new Date().toISOString();
    
    // Save to localStorage
    saveAllNotes();
}

// Save all notes
function saveAllNotes() {
    saveToLocalStorage('notes', notes);
    document.getElementById('save-status').textContent = 'All Saved';
}

// Delete a note
function deleteNote(noteId) {
    // Find note index
    const noteIndex = notes.findIndex(note => note.id === noteId);
    
    if (noteIndex === -1) {
        return;
    }
    
    // Remove note from array
    notes.splice(noteIndex, 1);
    
    // Save notes
    saveAllNotes();
    
    // Update notes list
    displayNotesList();
    
    // If the active note was deleted, load another note
    if (activeNote && activeNote.id === noteId) {
        if (notes.length > 0) {
            loadNote(notes[0]);
        } else {
            // No notes left, create a new one
            createNewNote();
        }
    }
}

// Format text in the editor
function formatText(formatType) {
    const editor = document.getElementById('notes-editor');
    
    // Save selection
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Apply formatting based on type
    switch (formatType) {
        case 'bold-text':
            document.execCommand('bold', false, null);
            break;
        case 'italic-text':
            document.execCommand('italic', false, null);
            break;
        case 'underline-text':
            document.execCommand('underline', false, null);
            break;
        case 'heading-text':
            document.execCommand('formatBlock', false, '<h3>');
            break;
        case 'list-text':
            document.execCommand('insertUnorderedList', false, null);
            break;
        case 'link-term':
            insertTermLink();
            break;
    }
    
    // Update note content
    if (activeNote) {
        activeNote.content = editor.innerHTML;
        document.getElementById('save-status').textContent = 'Unsaved';
    }
}

// Insert a term link
function insertTermLink() {
    // Get all terms
    const terms = allKeyTerms;
    
    if (terms.length === 0) {
        alert('No terms available. Please add terms first.');
        return;
    }
    
    // Create term selection dialog
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>Select Term</h3>
            <input type="text" id="term-search" placeholder="Search terms...">
            <div class="term-list scrollable" style="max-height: 300px; margin-top: 10px;">
                ${terms.map(term => `
                    <div class="term-item" data-term="${term}">
                        ${term}
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
    
    // Add event listener for term search
    const termSearch = dialog.querySelector('#term-search');
    termSearch.addEventListener('input', () => {
        const searchTerm = termSearch.value.toLowerCase();
        const termItems = dialog.querySelectorAll('.term-item');
        
        termItems.forEach(item => {
            const term = item.getAttribute('data-term').toLowerCase();
            if (term.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
    
    // Add event listeners for term items
    dialog.querySelectorAll('.term-item').forEach(item => {
        item.addEventListener('click', () => {
            const term = item.getAttribute('data-term');
            insertTermLinkToEditor(term);
            dialog.remove();
        });
    });
}

// Insert a term link to the editor
function insertTermLinkToEditor(term) {
    const editor = document.getElementById('notes-editor');
    
    // Create link element
    const link = document.createElement('a');
    link.className = 'term-link';
    link.textContent = term;
    link.setAttribute('data-term', term);
    link.href = '#';
    
    // Add event listener for link click
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showTermDefinition(term);
    });
    
    // Insert link at cursor position
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(link);
    
    // Move cursor after the link
    range.setStartAfter(link);
    range.setEndAfter(link);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Update note content
    if (activeNote) {
        activeNote.content = editor.innerHTML;
        document.getElementById('save-status').textContent = 'Unsaved';
    }
}

// Show term definition in a popup
function showTermDefinition(term) {
    // Get term definition
    const definition = termDefinitions[term] || 'No definition available';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>${term}</h3>
            <p>${definition}</p>
        </div>
    `;
    
    // Add dialog to body
    document.body.appendChild(dialog);
    
    // Add event listener for close button
    dialog.querySelector('.close-modal').addEventListener('click', () => {
        dialog.remove();
    });
}

// Update word count
function updateWordCount() {
    const editor = document.getElementById('notes-editor');
    const text = editor.innerText || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    
    document.getElementById('word-count').textContent = `${words.length} words`;
}
