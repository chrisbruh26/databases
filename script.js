// Global variables to store data
let notesContent = '';
let keytermsContent = '';
let definitionsContent = '';
let learningObjectivesContent = ''; // New variable for learning objectives
let allKeyTerms = [];
let termDefinitions = {};
let termCategories = {};
let termAdditionalInfo = {};
let quizTerms = [];
let quizCurrentQuestion = 0;
let quizCorrectAnswers = 0;
let termImages = {}; // Object to store images associated with terms
let learningObjectives = []; // Array to store learning objectives

// Colors for term highlighting (same as in Python version)
const colors = [
    { r: 255, g: 100, b: 0 },    // Orange
    { r: 50, g: 10, b: 222 },    // Blue
    { r: 150, g: 255, b: 150 },  // Light Green
    { r: 255, g: 50, b: 50 },    // Red
    { r: 200, g: 50, b: 200 },   // Purple
    { r: 50, g: 200, b: 200 },   // Cyan
    { r: 255, g: 255, b: 100 },  // Yellow
    { r: 130, g: 218, b: 255 },  // Blue
    { r: 255, g: 150, b: 150 },  // Light Red
    { r: 150, g: 150, b: 255 }   // Light Blue
];

// CSS classes for term highlighting
const colorClasses = [
    'term-highlight-orange',
    'term-highlight-blue',
    'term-highlight-green',
    'term-highlight-red',
    'term-highlight-purple',
    'term-highlight-cyan',
    'term-highlight-yellow',
    'term-highlight-blue',
    'term-highlight-lightred',
    'term-highlight-lightblue'
];

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up tab navigation
    setupTabs();
    
    // Set up event listeners for file inputs
    setupFileInputs();
    
    // Set up event listeners for search and filter
    setupSearchAndFilter();
    
    // Set up event listeners for term management
    setupTermManagement();
    
    // Set up event listeners for image management
    setupImageManagement();
    
    // Set up event listeners for quiz mode
    setupQuizMode();
    
    // Set up event listeners for study session
    setupStudySession();
    
    // Check for saved data in localStorage
    loadSavedData();
});

// Tab navigation setup
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// File input setup
function setupFileInputs() {
    // Load files button
    document.getElementById('load-files').addEventListener('click', () => {
        const notesFile = document.getElementById('notes-file').files[0];
        const keytermsFile = document.getElementById('keyterms-file').files[0];
        const definitionsFile = document.getElementById('definitions-file').files[0];
        const learningObjectivesFile = document.getElementById('learning-objectives-file').files[0];
        const bulkNotesFiles = document.getElementById('bulk-notes-files').files;
        
        let filesLoaded = false;
        
        // Load notes file
        if (notesFile) {
            filesLoaded = true;
            const notesReader = new FileReader();
            notesReader.onload = (e) => {
                notesContent = e.target.result;
                saveToLocalStorage('notesContent', notesContent);
                alert('Notes file loaded successfully!');
            };
            notesReader.readAsText(notesFile);
        }
        
        // Load keyterms file
        if (keytermsFile) {
            filesLoaded = true;
            const keytermsReader = new FileReader();
            keytermsReader.onload = (e) => {
                keytermsContent = e.target.result;
                saveToLocalStorage('keytermsContent', keytermsContent);
                alert('Key terms file loaded successfully!');
                processKeyTerms();
            };
            keytermsReader.readAsText(keytermsFile);
        }
        
        // Load definitions file
        if (definitionsFile) {
            filesLoaded = true;
            const definitionsReader = new FileReader();
            definitionsReader.onload = (e) => {
                definitionsContent = e.target.result;
                saveToLocalStorage('definitionsContent', definitionsContent);
                alert('Definitions file loaded successfully!');
                processKeyTerms();
            };
            definitionsReader.readAsText(definitionsFile);
        }
        
        // Load learning objectives file
        if (learningObjectivesFile) {
            filesLoaded = true;
            const learningObjectivesReader = new FileReader();
            learningObjectivesReader.onload = (e) => {
                learningObjectivesContent = e.target.result;
                saveToLocalStorage('learningObjectivesContent', learningObjectivesContent);
                alert('Learning objectives file loaded successfully!');
                processLearningObjectives();
            };
            learningObjectivesReader.readAsText(learningObjectivesFile);
        }
        
        // Load bulk notes files
        if (bulkNotesFiles.length > 0) {
            filesLoaded = true;
            loadBulkNotesFiles(bulkNotesFiles);
        }
        
        // If no files selected, show error
        if (!filesLoaded) {
            alert('Please select at least one file to load.');
        }
    });
    
    // Function to load multiple notes files
    function loadBulkNotesFiles(files) {
        let loadedCount = 0;
        let combinedContent = notesContent || '';
        
        // Create a progress indicator
        const progressContainer = document.createElement('div');
        progressContainer.className = 'bulk-upload-progress';
        progressContainer.innerHTML = `
            <p>Loading files: <span id="files-progress">0/${files.length}</span></p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;
        document.querySelector('.file-section').appendChild(progressContainer);
        
        const updateProgress = () => {
            const progressSpan = document.getElementById('files-progress');
            const progressFill = progressContainer.querySelector('.progress-fill');
            
            progressSpan.textContent = `${loadedCount}/${files.length}`;
            const percentage = (loadedCount / files.length) * 100;
            progressFill.style.width = `${percentage}%`;
        };
        
        // Process each file sequentially
        const processNextFile = (index) => {
            if (index >= files.length) {
                // All files processed
                notesContent = combinedContent;
                saveToLocalStorage('notesContent', notesContent);
                
                // Remove progress indicator
                progressContainer.remove();
                
                alert(`Successfully loaded ${files.length} notes files!`);
                return;
            }
            
            const file = files[index];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                // Add a separator between files
                if (combinedContent && e.target.result) {
                    combinedContent += '\n\n--- ' + file.name + ' ---\n\n';
                }
                
                combinedContent += e.target.result;
                loadedCount++;
                updateProgress();
                
                // Process next file
                processNextFile(index + 1);
            };
            
            reader.onerror = () => {
                alert(`Error reading file: ${file.name}`);
                loadedCount++;
                updateProgress();
                processNextFile(index + 1);
            };
            
            reader.readAsText(file);
        };
        
        // Start processing files
        processNextFile(0);
    }
    
    // Save files button
    document.getElementById('save-files').addEventListener('click', () => {
        // Save notes file
        if (notesContent) {
            downloadFile('notes.txt', notesContent);
        }
        
        // Save keyterms file
        if (keytermsContent) {
            downloadFile('keyterms.txt', keytermsContent);
        }
        
        // Save definitions file
        if (definitionsContent) {
            downloadFile('definitions.txt', definitionsContent);
        }
        
        // Save learning objectives file
        if (learningObjectivesContent) {
            downloadFile('learning_objectives.txt', learningObjectivesContent);
        }
        
        // If no content to save, show error
        if (!notesContent && !keytermsContent && !definitionsContent && !learningObjectivesContent) {
            alert('No content to save. Please load files first.');
        }
    });
}

// Search and filter setup
function setupSearchAndFilter() {
    // Apply filters button
    document.getElementById('apply-filters').addEventListener('click', () => {
        const filterTermsInput = document.getElementById('filter-terms').value;
        const filterCategory = document.getElementById('filter-category').value;
        const searchWord = document.getElementById('search-word').value.trim();
        
        // Parse filter terms
        const filterTerms = filterTermsInput ? 
            filterTermsInput.split(',').map(term => term.trim()) : null;
        
        if (searchWord) {
            // If a search word is provided, search for it in the notes
            searchForWord(searchWord);
        } else {
            // Otherwise, apply filters and display results for key terms
            organizeNotesByKeyTerms(filterTerms, filterCategory);
        }
    });
    
    // Clear filters button
    document.getElementById('clear-filters').addEventListener('click', () => {
        document.getElementById('filter-terms').value = '';
        document.getElementById('filter-category').value = '';
        document.getElementById('search-word').value = '';
        
        // Display all terms
        organizeNotesByKeyTerms();
    });
}

// Term management setup
function setupTermManagement() {
    // Add more information field button
    document.getElementById('add-info-field').addEventListener('click', () => {
        const container = document.getElementById('additional-info-container');
        const newRow = document.createElement('div');
        newRow.className = 'additional-info-row';
        newRow.innerHTML = `
            <input type="text" class="additional-info" placeholder="Enter additional information">
            <button class="remove-info">Remove</button>
        `;
        container.appendChild(newRow);
        
        // Add event listener to the new remove button
        newRow.querySelector('.remove-info').addEventListener('click', (e) => {
            e.target.parentElement.remove();
        });
    });
    
    // Add event listener to existing remove buttons
    document.querySelectorAll('.remove-info').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.parentElement.remove();
        });
    });
    
    // Save new term button
    document.getElementById('save-new-term').addEventListener('click', () => {
        const term = document.getElementById('new-term').value.trim();
        const definition = document.getElementById('new-definition').value.trim();
        const category = document.getElementById('new-category').value.trim();
        
        if (!term) {
            alert('Term cannot be empty.');
            return;
        }
        
        // Get additional information
        const additionalInfoInputs = document.querySelectorAll('.additional-info');
        const additionalInfo = [];
        additionalInfoInputs.forEach(input => {
            const info = input.value.trim();
            if (info) {
                additionalInfo.push(info);
            }
        });
        
        // Add term to keyterms.txt
        let termEntry = term;
        if (category) {
            termEntry += `#${category}`;
        }
        
        // Update keytermsContent
        keytermsContent += (keytermsContent ? '\n' : '') + termEntry;
        
        // Add definition and additional info to definitions.txt if provided
        if (definition) {
            let defEntry = `${term}:${definition}`;
            additionalInfo.forEach(info => {
                defEntry += `:${info}`;
            });
            
            // Update definitionsContent
            definitionsContent += (definitionsContent ? '\n' : '') + defEntry;
        }
        
        // Save to localStorage
        saveToLocalStorage('keytermsContent', keytermsContent);
        saveToLocalStorage('definitionsContent', definitionsContent);
        
        // Process key terms
        processKeyTerms();
        
        // Clear form
        document.getElementById('new-term').value = '';
        document.getElementById('new-definition').value = '';
        document.getElementById('new-category').value = '';
        document.getElementById('additional-info-container').innerHTML = `
            <div class="additional-info-row">
                <input type="text" class="additional-info" placeholder="Enter additional information">
                <button class="remove-info">Remove</button>
            </div>
        `;
        
        // Add event listener to the new remove button
        document.querySelector('.remove-info').addEventListener('click', (e) => {
            e.target.parentElement.remove();
        });
        
        alert(`Term '${term}' added successfully!`);
    });
    
    // Update term selection change
    document.getElementById('term-to-update').addEventListener('change', () => {
        const termToUpdate = document.getElementById('term-to-update').value;
        
        if (termToUpdate) {
            // Populate form with current values
            const currentDefinition = termDefinitions[termToUpdate] || '';
            const currentCategory = termCategories[termToUpdate] || '';
            const currentAdditionalInfo = termAdditionalInfo[termToUpdate] || [];
            
            document.getElementById('update-definition').value = currentDefinition;
            document.getElementById('update-category').value = currentCategory;
            
            // Populate additional info fields
            const container = document.getElementById('update-info-container');
            container.innerHTML = '';
            
            if (currentAdditionalInfo.length > 0) {
                currentAdditionalInfo.forEach(info => {
                    const newRow = document.createElement('div');
                    newRow.className = 'additional-info-row';
                    newRow.innerHTML = `
                        <input type="text" class="update-additional-info" value="${info}" placeholder="Enter additional information">
                        <button class="remove-update-info">Remove</button>
                    `;
                    container.appendChild(newRow);
                });
            } else {
                const newRow = document.createElement('div');
                newRow.className = 'additional-info-row';
                newRow.innerHTML = `
                    <input type="text" class="update-additional-info" placeholder="Enter additional information">
                    <button class="remove-update-info">Remove</button>
                `;
                container.appendChild(newRow);
            }
            
            // Add event listeners to remove buttons
            document.querySelectorAll('.remove-update-info').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.target.parentElement.remove();
                });
            });
        }
    });
    
    // Add more update information field button
    document.getElementById('add-update-info-field').addEventListener('click', () => {
        const container = document.getElementById('update-info-container');
        const newRow = document.createElement('div');
        newRow.className = 'additional-info-row';
        newRow.innerHTML = `
            <input type="text" class="update-additional-info" placeholder="Enter additional information">
            <button class="remove-update-info">Remove</button>
        `;
        container.appendChild(newRow);
        
        // Add event listener to the new remove button
        newRow.querySelector('.remove-update-info').addEventListener('click', (e) => {
            e.target.parentElement.remove();
        });
    });
    
    // Save updated term button
    document.getElementById('save-updated-term').addEventListener('click', () => {
        const termToUpdate = document.getElementById('term-to-update').value;
        
        if (!termToUpdate) {
            alert('Please select a term to update.');
            return;
        }
        
        const newDefinition = document.getElementById('update-definition').value.trim();
        const newCategory = document.getElementById('update-category').value.trim();
        
        // Get additional information
        const additionalInfoInputs = document.querySelectorAll('.update-additional-info');
        const newAdditionalInfo = [];
        additionalInfoInputs.forEach(input => {
            const info = input.value.trim();
            if (info) {
                newAdditionalInfo.push(info);
            }
        });
        
        // Update keyterms.txt
        const keytermsLines = keytermsContent.split('\n');
        let keytermsUpdated = false;
        
        for (let i = 0; i < keytermsLines.length; i++) {
            let line = keytermsLines[i].trim();
            if (!line) continue;
            
            // Parse the line to extract the term
            let parsedLine = line;
            let termCategory = '';
            
            if (parsedLine.includes('#')) {
                const parts = parsedLine.split('#');
                parsedLine = parts[0].trim();
                termCategory = parts[1].trim();
            }
            
            if (parsedLine === termToUpdate) {
                // Construct the updated line
                let updatedLine = termToUpdate;
                if (newCategory) {
                    updatedLine += `#${newCategory}`;
                }
                
                keytermsLines[i] = updatedLine;
                keytermsUpdated = true;
                break;
            }
        }
        
        if (keytermsUpdated) {
            keytermsContent = keytermsLines.join('\n');
        } else {
            alert(`Could not find term '${termToUpdate}' in keyterms.txt. This is unexpected.`);
            return;
        }
        
        // Update definitions.txt if there's a definition
        if (newDefinition || newAdditionalInfo.length > 0) {
            const defLines = definitionsContent ? definitionsContent.split('\n') : [];
            let defUpdated = false;
            
            for (let i = 0; i < defLines.length; i++) {
                let line = defLines[i].trim();
                if (!line || !line.includes(':')) continue;
                
                const parts = line.split(':');
                const term = parts[0].trim();
                
                if (term === termToUpdate) {
                    // Construct the updated definition line
                    let updatedLine = `${termToUpdate}:${newDefinition}`;
                    newAdditionalInfo.forEach(info => {
                        updatedLine += `:${info}`;
                    });
                    
                    defLines[i] = updatedLine;
                    defUpdated = true;
                    break;
                }
            }
            
            // If term not found in definitions.txt, append it
            if (!defUpdated) {
                let newLine = `${termToUpdate}:${newDefinition}`;
                newAdditionalInfo.forEach(info => {
                    newLine += `:${info}`;
                });
                defLines.push(newLine);
            }
            
            definitionsContent = defLines.join('\n');
        }
        
        // Save to localStorage
        saveToLocalStorage('keytermsContent', keytermsContent);
        saveToLocalStorage('definitionsContent', definitionsContent);
        
        // Process key terms
        processKeyTerms();
        
        alert(`Term '${termToUpdate}' updated successfully!`);
    });
}

// Quiz mode setup
function setupQuizMode() {
    // Start quiz button
    document.getElementById('start-quiz').addEventListener('click', () => {
        const numQuestions = parseInt(document.getElementById('quiz-questions').value);
        const category = document.getElementById('quiz-category').value.trim();
        
        startQuiz(numQuestions, category);
    });
    
    // Show answer button
    document.getElementById('show-answer').addEventListener('click', () => {
        document.querySelector('.quiz-answer').style.display = 'block';
        document.querySelector('.quiz-navigation').style.display = 'block';
    });
    
    // Next question button
    document.getElementById('next-question').addEventListener('click', () => {
        goToNextQuestion();
    });
    
    // Assessment buttons
    document.querySelectorAll('.assessment-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const value = e.target.getAttribute('data-value');
            
            if (value === 'y') {
                quizCorrectAnswers += 1;
            } else if (value === 'partial') {
                quizCorrectAnswers += 0.5;
            }
            
            goToNextQuestion();
        });
    });
    
    // Review missed terms button
    document.getElementById('review-missed').addEventListener('click', () => {
        reviewMissedTerms();
    });
    
    // Restart quiz button
    document.getElementById('restart-quiz').addEventListener('click', () => {
        const numQuestions = parseInt(document.getElementById('quiz-questions').value);
        const category = document.getElementById('quiz-category').value.trim();
        
        startQuiz(numQuestions, category);
    });
}

// Study session setup
function setupStudySession() {
    // Study by category button
    document.getElementById('study-by-category').addEventListener('click', () => {
        showCategorySelection();
    });
    
    // Study terms with definitions button
    document.getElementById('study-with-definitions').addEventListener('click', () => {
        studyTermsWithDefinitions();
    });
    
    // Study terms with additional info button
    document.getElementById('study-with-additional-info').addEventListener('click', () => {
        studyTermsWithAdditionalInfo();
    });
    
    // Study terms by frequency button
    document.getElementById('study-by-frequency').addEventListener('click', () => {
        studyTermsByFrequency();
    });
    
    // Learning objectives practice button
    document.getElementById('study-learning-objectives').addEventListener('click', () => {
        startLearningObjectivesQuiz();
    });
    
    // Back buttons
    document.getElementById('back-to-study-options').addEventListener('click', () => {
        document.querySelector('.category-selection').style.display = 'none';
        document.querySelector('.study-options').style.display = 'block';
    });
    
    document.getElementById('back-from-frequency').addEventListener('click', () => {
        document.querySelector('.frequency-selection').style.display = 'none';
        document.querySelector('.study-options').style.display = 'block';
    });
    
    document.getElementById('back-from-study-session').addEventListener('click', () => {
        document.querySelector('.study-session-content').style.display = 'none';
        document.querySelector('.study-options').style.display = 'block';
    });
    
    document.getElementById('back-from-objectives').addEventListener('click', () => {
        document.querySelector('.learning-objectives-quiz').style.display = 'none';
        document.querySelector('.study-options').style.display = 'block';
        
        // Reset the learning objectives quiz state
        resetLearningObjectivesQuiz();
    });
    
    // Study top terms button
    document.getElementById('study-top-terms').addEventListener('click', () => {
        const numTerms = parseInt(document.getElementById('top-terms').value);
        studyTopTerms(numTerms);
    });
    
    // Learning objectives quiz navigation
    document.getElementById('check-objective').addEventListener('click', () => {
        showObjectiveFeedback();
    });
    
    document.getElementById('next-objective').addEventListener('click', () => {
        if (currentObjectiveIndex < learningObjectives.length - 1) {
            currentObjectiveIndex++;
            showCurrentObjective();
        }
    });
    
    document.getElementById('prev-objective').addEventListener('click', () => {
        if (currentObjectiveIndex > 0) {
            currentObjectiveIndex--;
            showCurrentObjective();
        }
    });
    
    document.getElementById('finish-objectives').addEventListener('click', () => {
        showObjectivesResults();
    });
    
    document.getElementById('next-objective').addEventListener('click', () => {
        navigateObjectives(1);
    });
    
    document.getElementById('finish-objectives').addEventListener('click', () => {
        showObjectivesResults();
    });
    
    // Understanding level buttons
    document.querySelectorAll('.understanding-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const level = parseInt(e.target.getAttribute('data-level'));
            recordUnderstandingLevel(level);
        });
    });
}

// Process key terms from keyterms.txt and definitions.txt
function processKeyTerms() {
    if (!keytermsContent) {
        alert('No key terms content available. Please load keyterms.txt first.');
        return;
    }
    
    // Reset arrays and objects
    allKeyTerms = [];
    termDefinitions = {};
    termCategories = {};
    termAdditionalInfo = {};
    
    // Process keyterms.txt for terms and categories
    const keytermsLines = keytermsContent.split('\n');
    
    for (const line of keytermsLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Check for category
        let category = null;
        let term = trimmedLine;
        
        if (trimmedLine.includes('#')) {
            const parts = trimmedLine.split('#');
            term = parts[0].trim();
            category = parts[1].trim();
        }
        
        if (term) {
            allKeyTerms.push(term);
            if (category) {
                termCategories[term] = category;
            }
        }
    }
    
    // Process definitions.txt for definitions and additional info
    if (definitionsContent) {
        const definitionsLines = definitionsContent.split('\n');
        
        for (const line of definitionsLines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.includes(':')) continue;
            
            const parts = trimmedLine.split(':');
            if (parts.length >= 2) {
                const term = parts[0].trim();
                const definition = parts[1].trim();
                
                if (term && definition) {
                    termDefinitions[term] = definition;
                    
                    // Extract additional information if available
                    if (parts.length > 2) {
                        const additionalInfo = parts.slice(2)
                            .map(info => info.trim())
                            .filter(info => info);
                        
                        if (additionalInfo.length > 0) {
                            termAdditionalInfo[term] = additionalInfo;
                        }
                    }
                }
            }
        }
    }
    
    // Update term selection dropdown
    updateTermSelectionDropdown();
    
    // Display terms if we're on the search tab
    if (document.getElementById('search').classList.contains('active')) {
        organizeNotesByKeyTerms();
    }
}

// Process learning objectives from learning_objectives.txt
function processLearningObjectives() {
    if (!learningObjectivesContent) {
        alert('No learning objectives content available. Please load a learning objectives file first.');
        return;
    }
    
    // Reset learning objectives array
    learningObjectives = [];
    
    // Process learning objectives file
    // Each line is considered a separate learning objective
    const lines = learningObjectivesContent.split('\n');
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Add the learning objective to the array
        learningObjectives.push(trimmedLine);
    }
    
    // Log the number of learning objectives loaded
    console.log(`Loaded ${learningObjectives.length} learning objectives`);
}

// Start learning objectives quiz
function startLearningObjectivesQuiz() {
    if (!learningObjectives || learningObjectives.length === 0) {
        alert('No learning objectives available. Please load a learning objectives file first.');
        return;
    }
    
    // Hide study options and show learning objectives quiz
    document.querySelector('.study-options').style.display = 'none';
    document.querySelector('.learning-objectives-quiz').style.display = 'block';
    
    // Reset quiz state
    resetLearningObjectivesQuiz();
    
    // Initialize the first objective
    showCurrentObjective();
}

// Reset learning objectives quiz state
function resetLearningObjectivesQuiz() {
    // Initialize quiz variables
    currentObjectiveIndex = 0;
    objectiveResponses = [];
    
    // Reset UI elements
    document.getElementById('objective-answer').value = '';
    document.querySelector('.objective-feedback').style.display = 'none';
    document.querySelector('.objectives-results').style.display = 'none';
    
    // Reset navigation buttons
    document.getElementById('prev-objective').disabled = true;
    document.getElementById('next-objective').disabled = false;
    document.getElementById('next-objective').style.display = 'inline-block';
    document.getElementById('finish-objectives').style.display = 'none';
}

// Global variables for learning objectives quiz
let currentObjectiveIndex = 0;
let objectiveResponses = [];

// Show current learning objective
function showCurrentObjective() {
    const objective = learningObjectives[currentObjectiveIndex];
    const totalObjectives = learningObjectives.length;
    
    // Update objective number and text
    document.getElementById('objective-number').textContent = `Objective ${currentObjectiveIndex + 1} of ${totalObjectives}`;
    document.getElementById('objective-text').textContent = objective;
    
    // Clear answer field if no previous response
    if (!objectiveResponses[currentObjectiveIndex]) {
        document.getElementById('objective-answer').value = '';
    } else {
        document.getElementById('objective-answer').value = objectiveResponses[currentObjectiveIndex].answer;
    }
    
    // Hide feedback section
    document.querySelector('.objective-feedback').style.display = 'none';
    
    // Update navigation buttons
    document.getElementById('prev-objective').disabled = currentObjectiveIndex === 0;
    
    // Show finish button on last objective, otherwise show next button
    if (currentObjectiveIndex === totalObjectives - 1) {
        document.getElementById('next-objective').style.display = 'none';
        document.getElementById('finish-objectives').style.display = 'inline-block';
    } else {
        document.getElementById('next-objective').style.display = 'inline-block';
        document.getElementById('finish-objectives').style.display = 'none';
    }
}

// Show feedback for current objective
function showObjectiveFeedback() {
    const answer = document.getElementById('objective-answer').value.trim();
    
    if (!answer) {
        alert('Please enter your answer before checking understanding.');
        return;
    }
    
    // Save the response
    objectiveResponses[currentObjectiveIndex] = {
        objective: learningObjectives[currentObjectiveIndex],
        answer: answer,
        understanding: null // Will be set when user clicks an understanding button
    };
    
    // Show feedback section
    document.querySelector('.objective-feedback').style.display = 'block';
    
    // Add event listeners to understanding buttons if not already added
    document.querySelectorAll('.understanding-btn').forEach(button => {
        // Remove existing listeners to prevent duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new listener
        newButton.addEventListener('click', (e) => {
            const level = parseInt(e.target.getAttribute('data-level'));
            objectiveResponses[currentObjectiveIndex].understanding = level;
            
            // Highlight selected button
            document.querySelectorAll('.understanding-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            e.target.classList.add('selected');
        });
    });
}

// Update term selection dropdown for the update term form
function updateTermSelectionDropdown() {
    const dropdown = document.getElementById('term-to-update');
    dropdown.innerHTML = '<option value="">-- Select a term --</option>';
    
    allKeyTerms.forEach(term => {
        const option = document.createElement('option');
        option.value = term;
        option.textContent = term;
        dropdown.appendChild(option);
    });
}

// Organize notes by key terms
function organizeNotesByKeyTerms(filterTerms = null, filterCategory = null) {
    if (!notesContent) {
        alert('No notes content available. Please load notes.txt first.');
        return;
    }
    
    if (!allKeyTerms || allKeyTerms.length === 0) {
        alert('No key terms available. Please load keyterms.txt first.');
        return;
    }
    
    // Filter terms if specified
    let filteredTerms = [...allKeyTerms];
    
    // Filter by category if specified
    if (filterCategory) {
        filteredTerms = filteredTerms.filter(term => 
            term in termCategories && 
            termCategories[term].toLowerCase().includes(filterCategory.toLowerCase())
        );
    }
    
    // Filter by term content if specified
    if (filterTerms) {
        filteredTerms = filteredTerms.filter(term => 
            filterTerms.some(filterTerm => 
                term.toLowerCase().includes(filterTerm.toLowerCase())
            )
        );
    }
    
    if (filteredTerms.length === 0) {
        let message = 'No terms found matching your filters.';
        
        if (filterTerms) {
            message += `\nTerm filters: ${filterTerms.join(', ')}`;
        }
        
        if (filterCategory) {
            message += `\nCategory filter: ${filterCategory}`;
        }
        
        // Show available categories
        const categories = Object.values(termCategories);
        const uniqueCategories = [...new Set(categories)];
        
        if (uniqueCategories.length > 0) {
            message += `\n\nAvailable categories: ${uniqueCategories.sort().join(', ')}`;
        }
        
        // Show available terms
        const displayTerms = allKeyTerms.slice(0, 10);
        message += `\n\nAvailable terms: ${displayTerms.join(', ')}${allKeyTerms.length > 10 ? '...' : ''}`;
        
        alert(message);
        return;
    }
    
    const keyTerms = filteredTerms;
    
    // Display terms list
    displayTermsList(keyTerms);
    
    // Find contexts for each term
    const termContexts = {};
    
    for (const term of keyTerms) {
        const contexts = findTermInNotes(notesContent, term);
        if (contexts.length > 0) {
            termContexts[term] = contexts;
        }
    }
    
    // Display contexts
    displayTermContexts(keyTerms, termContexts);
}

// Display terms list
function displayTermsList(keyTerms) {
    const termsContainer = document.getElementById('terms-container');
    termsContainer.innerHTML = '';
    
    // Group terms by category
    const termsByCategory = {};
    const uncategorizedTerms = [];
    
    for (const term of keyTerms) {
        if (term in termCategories) {
            const category = termCategories[term];
            if (!(category in termsByCategory)) {
                termsByCategory[category] = [];
            }
            termsByCategory[category].push(term);
        } else {
            uncategorizedTerms.push(term);
        }
    }
    
    // Create HTML for terms list
    let html = `<p>Found ${keyTerms.length} key terms:</p>`;
    
    // Add terms by category
    if (Object.keys(termsByCategory).length > 0) {
        for (const [category, terms] of Object.entries(termsByCategory).sort()) {
            html += `<h4>${category}</h4><ul>`;
            for (const term of terms) {
                html += `<li>${term}</li>`;
            }
            html += `</ul>`;
        }
    }
    
    // Add uncategorized terms
    if (uncategorizedTerms.length > 0) {
        if (Object.keys(termsByCategory).length > 0) {
            html += `<h4>Uncategorized</h4>`;
        }
        html += `<ul>`;
        for (const term of uncategorizedTerms) {
            html += `<li>${term}</li>`;
        }
        html += `</ul>`;
    }
    
    termsContainer.innerHTML = html;
}

// Display term contexts
function displayTermContexts(keyTerms, termContexts) {
    const contextsContainer = document.getElementById('contexts-container');
    contextsContainer.innerHTML = '';
    
    // Create term colors (cycling through the colorClasses array)
    const termColorClasses = {};
    keyTerms.forEach((term, index) => {
        termColorClasses[term] = colorClasses[index % colorClasses.length];
    });
    
    // Create HTML for contexts
    for (const term of keyTerms) {
        if (term in termContexts && termContexts[term].length > 0) {
            const termCard = document.createElement('div');
            termCard.className = 'term-card';
            
            let cardHtml = `<h4>${term}</h4>`;
            
            // Add category if available
            if (term in termCategories) {
                cardHtml += `<div class="category">${termCategories[term]}</div>`;
            }
            
            // Add definition if available
            if (term in termDefinitions) {
                cardHtml += `<div class="definition"><strong>Definition:</strong> ${termDefinitions[term]}</div>`;
            }
            
            // Add additional information if available
            if (term in termAdditionalInfo) {
                cardHtml += `<div class="additional-info"><strong>Additional Information:</strong><ul>`;
                for (const info of termAdditionalInfo[term]) {
                    cardHtml += `<li>${info}</li>`;
                }
                cardHtml += `</ul></div>`;
            }
            
            // Add contexts
            for (let i = 0; i < termContexts[term].length; i++) {
                const context = termContexts[term][i];
                
                // Add context type labels
                const contextTypes = [];
                if (context.is_definition) contextTypes.push('<span class="context-type context-definition">Definition</span>');
                if (context.is_function) contextTypes.push('<span class="context-type context-function">Function/Purpose</span>');
                if (context.is_relationship) contextTypes.push('<span class="context-type context-relationship">Relationship</span>');
                
                const contextHeader = `Context ${i+1} ${contextTypes.length > 0 ? contextTypes.join(' ') : ''}`;
                
                cardHtml += `<div class="context">
                    <h5>${contextHeader}</h5>
                    <p>${highlightAllTermsInParagraph(context.text, keyTerms, termColorClasses)}</p>
                </div>`;
            }
            
            termCard.innerHTML = cardHtml;
            
            // Add images for this term if available
            if (termImages[term] && termImages[term].length > 0) {
                displayImagesForTerm(term, termCard);
            }
            
            contextsContainer.appendChild(termCard);
        }
    }
}

// Find a term in the notes and return the surrounding context
function findTermInNotes(notesContent, term) {
    // Create a regex pattern that matches the term, including possible plurals and punctuation
    const pattern = new RegExp('\\b' + escapeRegExp(term.toLowerCase()) + '(?:s|,|\\.|:|;)?\\b', 'gi');
    
    // Find all occurrences of the term
    const contexts = [];
    const paragraphsFound = new Set(); // Track paragraphs we've already found
    let match;
    
    while ((match = pattern.exec(notesContent.toLowerCase())) !== null) {
        const pos = match.index;
        
        // Get context (paragraph containing the term)
        // Find the start of the paragraph
        let paraStart = notesContent.lastIndexOf('\n\n', pos);
        if (paraStart === -1) {
            paraStart = 0;
        } else {
            paraStart += 2; // Skip the newlines
        }
        
        // Find the end of the paragraph
        let paraEnd = notesContent.indexOf('\n\n', pos);
        if (paraEnd === -1) {
            paraEnd = notesContent.length;
        }
        
        // Extract the paragraph
        const paragraph = notesContent.substring(paraStart, paraEnd).trim();
        
        // Skip if we've already processed this paragraph for this term
        const paragraphKey = `${paraStart}-${paraEnd}`;
        if (paragraphsFound.has(paragraphKey)) {
            continue;
        }
        
        // Mark this paragraph as found
        paragraphsFound.add(paragraphKey);
        
        // Calculate the position of the term within the extracted paragraph
        const termPosInPara = pos - paraStart;
        
        // Check if this is a definition-like context
        let isDefinition = false;
        
        // Look for definition patterns
        const definitionPatterns = [
            new RegExp('\\b' + escapeRegExp(term.toLowerCase()) + '\\s+(?:is|are|refers to|describes|means|defined as)', 'i'),
            new RegExp('\\b' + escapeRegExp(term.toLowerCase()) + '(?:s|es)?\\s*:\\s*\\w+', 'i'),
            new RegExp('(?:called|known as|termed)\\s+(?:a|an|the)?\\s*' + escapeRegExp(term.toLowerCase()), 'i'),
            new RegExp('(?:definition|meaning) of\\s+(?:a|an|the)?\\s*' + escapeRegExp(term.toLowerCase()), 'i')
        ];
        
        for (const pattern of definitionPatterns) {
            if (pattern.test(paragraph.toLowerCase())) {
                isDefinition = true;
                break;
            }
        }
        
        // Look for function/purpose patterns
        let isFunction = false;
        const functionPatterns = [
            new RegExp('\\b' + escapeRegExp(term.toLowerCase()) + '(?:s|es)?\\s+(?:function|role|purpose|helps|helps to|serves to|allows|enables)', 'i'),
            new RegExp('(?:function|role|purpose) of\\s+(?:a|an|the)?\\s*' + escapeRegExp(term.toLowerCase()), 'i'),
            new RegExp('\\b' + escapeRegExp(term.toLowerCase()) + '(?:s|es)?\\s+(?:is|are) responsible for', 'i')
        ];
        
        for (const pattern of functionPatterns) {
            if (pattern.test(paragraph.toLowerCase())) {
                isFunction = true;
                break;
            }
        }
        
        // Look for relationship patterns
        let isRelationship = false;
        const relationshipPatterns = [
            new RegExp('\\b' + escapeRegExp(term.toLowerCase()) + '(?:s|es)?\\s+(?:connects|connects to|relates to|interacts with|part of)', 'i'),
            new RegExp('(?:connected|related) to\\s+(?:a|an|the)?\\s*' + escapeRegExp(term.toLowerCase()), 'i'),
            new RegExp('\\b' + escapeRegExp(term.toLowerCase()) + '(?:s|es)?\\s+(?:contains|includes|consists of)', 'i')
        ];
        
        for (const pattern of relationshipPatterns) {
            if (pattern.test(paragraph.toLowerCase())) {
                isRelationship = true;
                break;
            }
        }
        
        // Add context with metadata
        contexts.push({
            text: paragraph,
            position: termPosInPara,
            is_definition: isDefinition,
            is_function: isFunction,
            is_relationship: isRelationship,
            relevance_score: (isDefinition * 3) + (isFunction * 2) + (isRelationship * 1)
        });
    }
    
    // Sort contexts by relevance score (higher is better)
    contexts.sort((a, b) => b.relevance_score - a.relevance_score);
    
    return contexts;
}

// Highlight all key terms in a paragraph
function highlightAllTermsInParagraph(paragraph, keyTerms, termColorClasses) {
    // Create a list of all term occurrences with their positions
    const termOccurrences = [];
    
    for (const term of keyTerms) {
        const colorClass = termColorClasses[term];
        
        // Create a regex pattern that matches the term followed by optional 's', ',', or '.'
        const pattern = new RegExp('\\b' + escapeRegExp(term.toLowerCase()) + '(?:s|,|\\.|:|;)?\\b', 'gi');
        
        // Find all matches in the paragraph
        let match;
        while ((match = pattern.exec(paragraph.toLowerCase())) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            
            // Get the actual text as it appears in the original paragraph
            const actualText = paragraph.substring(start, end);
            termOccurrences.push({ start, end, text: actualText, colorClass });
        }
    }
    
    // Sort occurrences by position
    termOccurrences.sort((a, b) => a.start - b.start);
    
    // Check for overlapping terms and remove them
    const nonOverlapping = [];
    let lastEnd = -1;
    
    for (const occurrence of termOccurrences) {
        if (occurrence.start >= lastEnd) { // No overlap
            nonOverlapping.push(occurrence);
            lastEnd = occurrence.end;
        }
    }
    
    // Build the highlighted HTML
    let result = '';
    let lastPos = 0;
    
    for (const { start, end, text, colorClass } of nonOverlapping) {
        // Add text before the term
        result += escapeHtml(paragraph.substring(lastPos, start));
        
        // Add the term with highlighting
        result += `<span class="term-highlight ${colorClass}">${escapeHtml(text)}</span>`;
        
        lastPos = end;
    }
    
    // Add any remaining text
    result += escapeHtml(paragraph.substring(lastPos));
    
    return result;
}

// Start quiz
function startQuiz(numQuestions, category) {
    // Filter terms with definitions
    const termsWithDefs = allKeyTerms.filter(term => term in termDefinitions);
    
    if (termsWithDefs.length === 0) {
        alert('No terms with definitions found. Add definitions to your terms first.');
        return;
    }
    
    // Filter by category if specified
    let filteredTerms = termsWithDefs;
    if (category) {
        filteredTerms = filteredTerms.filter(term => 
            term in termCategories && 
            termCategories[term].toLowerCase().includes(category.toLowerCase())
        );
        
        if (filteredTerms.length === 0) {
            alert(`No terms found in category '${category}'. Please try a different category.`);
            return;
        }
    }
    
    // Limit number of questions to available terms
    numQuestions = Math.min(numQuestions, filteredTerms.length);
    
    // Randomly select terms for the quiz
    quizTerms = [];
    const tempTerms = [...filteredTerms];
    
    for (let i = 0; i < numQuestions; i++) {
        const randomIndex = Math.floor(Math.random() * tempTerms.length);
        quizTerms.push(tempTerms[randomIndex]);
        tempTerms.splice(randomIndex, 1);
    }
    
    // Reset quiz state
    quizCurrentQuestion = 0;
    quizCorrectAnswers = 0;
    
    // Hide quiz setup and show quiz area
    document.querySelector('.quiz-setup').style.display = 'none';
    document.querySelector('.quiz-area').style.display = 'block';
    
    // Show first question
    showQuizQuestion();
}

// Show quiz question
function showQuizQuestion() {
    const term = quizTerms[quizCurrentQuestion];
    
    // Update question number
    document.getElementById('question-number').textContent = `Question ${quizCurrentQuestion + 1} of ${quizTerms.length}`;
    
    // Update question text
    document.getElementById('question-text').textContent = `Define '${term}'`;
    
    // Show hint if category is available
    const hintElement = document.getElementById('question-hint');
    if (term in termCategories) {
        hintElement.textContent = `Hint: This term is in the category '${termCategories[term]}'`;
        hintElement.style.display = 'block';
    } else {
        hintElement.style.display = 'none';
    }
    
    // Update answer
    document.getElementById('answer-definition').textContent = termDefinitions[term];
    
    // Update additional info
    const additionalInfoElement = document.getElementById('answer-additional-info');
    if (term in termAdditionalInfo && termAdditionalInfo[term].length > 0) {
        let html = '<h4>Additional Information:</h4><ul>';
        for (const info of termAdditionalInfo[term]) {
            html += `<li>${info}</li>`;
        }
        html += '</ul>';
        additionalInfoElement.innerHTML = html;
        additionalInfoElement.style.display = 'block';
    } else {
        additionalInfoElement.innerHTML = '';
        additionalInfoElement.style.display = 'none';
    }
    
    // Hide answer and navigation
    document.querySelector('.quiz-answer').style.display = 'none';
    document.querySelector('.quiz-navigation').style.display = 'none';
    document.querySelector('.quiz-results').style.display = 'none';
}

// Go to next question
function goToNextQuestion() {
    quizCurrentQuestion++;
    
    if (quizCurrentQuestion < quizTerms.length) {
        showQuizQuestion();
    } else {
        showQuizResults();
    }
}

// Show quiz results
function showQuizResults() {
    const score = (quizCorrectAnswers / quizTerms.length) * 100;
    
    document.getElementById('quiz-score').textContent = 
        `Your score: ${quizCorrectAnswers}/${quizTerms.length} (${score.toFixed(1)}%)`;
    
    let feedback = '';
    if (score >= 90) {
        feedback = 'Excellent! You\'ve mastered these terms.';
    } else if (score >= 70) {
        feedback = 'Good job! Keep reviewing to improve further.';
    } else {
        feedback = 'Keep studying! Try reviewing the terms again.';
    }
    
    document.getElementById('quiz-feedback').textContent = feedback;
    
    // Show results
    document.querySelector('.quiz-question').style.display = 'none';
    document.querySelector('.quiz-answer').style.display = 'none';
    document.querySelector('.quiz-navigation').style.display = 'none';
    document.querySelector('.quiz-results').style.display = 'block';
}

// Review missed terms
function reviewMissedTerms() {
    // For simplicity, we'll just show all terms from the quiz
    // In a real implementation, you would track which terms were missed
    
    document.querySelector('.quiz-results').style.display = 'none';
    
    const reviewHtml = document.createElement('div');
    reviewHtml.className = 'review-terms';
    
    reviewHtml.innerHTML = '<h3>Review Terms</h3>';
    
    for (const term of quizTerms) {
        reviewHtml.innerHTML += `
            <div class="term-card">
                <h4>${term}</h4>
                ${term in termCategories ? `<div class="category">${termCategories[term]}</div>` : ''}
                <div class="definition"><strong>Definition:</strong> ${termDefinitions[term]}</div>
                ${term in termAdditionalInfo && termAdditionalInfo[term].length > 0 ? 
                    `<div class="additional-info">
                        <strong>Additional Information:</strong>
                        <ul>${termAdditionalInfo[term].map(info => `<li>${info}</li>`).join('')}</ul>
                    </div>` : 
                    ''}
            </div>
        `;
    }
    
    reviewHtml.innerHTML += '<button id="back-to-results">Back to Results</button>';
    
    document.querySelector('.quiz-area').appendChild(reviewHtml);
    
    // Add event listener to back button
    document.getElementById('back-to-results').addEventListener('click', () => {
        document.querySelector('.review-terms').remove();
        document.querySelector('.quiz-results').style.display = 'block';
    });
}

// Show category selection for study session
function showCategorySelection() {
    // Get all categories
    const categories = [...new Set(Object.values(termCategories))].sort();
    
    if (categories.length === 0) {
        alert('No categories found. Add categories to your terms first.');
        return;
    }
    
    // Hide study options and show category selection
    document.querySelector('.study-options').style.display = 'none';
    document.querySelector('.category-selection').style.display = 'block';
    
    // Populate categories list
    const categoriesList = document.getElementById('categories-list');
    categoriesList.innerHTML = '';
    
    for (const category of categories) {
        // Count terms in this category
        const count = allKeyTerms.filter(term => 
            term in termCategories && termCategories[term] === category
        ).length;
        
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.textContent = `${category} (${count} terms)`;
        categoryItem.addEventListener('click', () => {
            studyByCategory(category);
        });
        
        categoriesList.appendChild(categoryItem);
    }
}

// Study by category
function studyByCategory(category) {
    // Filter terms by category
    const filteredTerms = allKeyTerms.filter(term => 
        term in termCategories && termCategories[term] === category
    );
    
    // Hide category selection and show study session
    document.querySelector('.category-selection').style.display = 'none';
    document.querySelector('.study-session-content').style.display = 'block';
    
    // Set study session title
    document.getElementById('study-session-title').textContent = `Studying Category: ${category}`;
    
    // Display terms list
    const termsListElement = document.getElementById('study-terms-list');
    termsListElement.innerHTML = `<p>Found ${filteredTerms.length} terms in category '${category}':</p><ul>`;
    
    for (const term of filteredTerms) {
        termsListElement.innerHTML += `<li>${term}</li>`;
    }
    
    termsListElement.innerHTML += '</ul>';
    
    // Display term contexts
    const termContexts = {};
    
    for (const term of filteredTerms) {
        const contexts = findTermInNotes(notesContent, term);
        if (contexts.length > 0) {
            termContexts[term] = contexts;
        }
    }
    
    // Create term colors (cycling through the colorClasses array)
    const termColorClasses = {};
    filteredTerms.forEach((term, index) => {
        termColorClasses[term] = colorClasses[index % colorClasses.length];
    });
    
    // Display contexts
    const studyContentElement = document.getElementById('study-content');
    studyContentElement.innerHTML = '';
    
    for (const term of filteredTerms) {
        if (term in termContexts && termContexts[term].length > 0) {
            const termCard = document.createElement('div');
            termCard.className = 'term-card';
            
            let cardHtml = `<h4>${term}</h4>`;
            
            // Add category
            cardHtml += `<div class="category">${category}</div>`;
            
            // Add definition if available
            if (term in termDefinitions) {
                cardHtml += `<div class="definition"><strong>Definition:</strong> ${termDefinitions[term]}</div>`;
            }
            
            // Add additional information if available
            if (term in termAdditionalInfo) {
                cardHtml += `<div class="additional-info"><strong>Additional Information:</strong><ul>`;
                for (const info of termAdditionalInfo[term]) {
                    cardHtml += `<li>${info}</li>`;
                }
                cardHtml += `</ul></div>`;
            }
            
            // Add contexts
            for (let i = 0; i < termContexts[term].length; i++) {
                const context = termContexts[term][i];
                
                // Add context type labels
                const contextTypes = [];
                if (context.is_definition) contextTypes.push('<span class="context-type context-definition">Definition</span>');
                if (context.is_function) contextTypes.push('<span class="context-type context-function">Function/Purpose</span>');
                if (context.is_relationship) contextTypes.push('<span class="context-type context-relationship">Relationship</span>');
                
                const contextHeader = `Context ${i+1} ${contextTypes.length > 0 ? contextTypes.join(' ') : ''}`;
                
                cardHtml += `<div class="context">
                    <h5>${contextHeader}</h5>
                    <p>${highlightAllTermsInParagraph(context.text, filteredTerms, termColorClasses)}</p>
                </div>`;
            }
            
            termCard.innerHTML = cardHtml;
            studyContentElement.appendChild(termCard);
        }
    }
}

// Study terms with definitions
function studyTermsWithDefinitions() {
    // Filter terms with definitions
    const termsWithDefs = allKeyTerms.filter(term => term in termDefinitions);
    
    if (termsWithDefs.length === 0) {
        alert('No terms with definitions found. Add definitions to your terms first.');
        return;
    }
    
    // Hide study options and show study session
    document.querySelector('.study-options').style.display = 'none';
    document.querySelector('.study-session-content').style.display = 'block';
    
    // Set study session title
    document.getElementById('study-session-title').textContent = 'Studying Terms with Definitions';
    
    // Display terms list
    const termsListElement = document.getElementById('study-terms-list');
    termsListElement.innerHTML = `<p>Found ${termsWithDefs.length} terms with definitions:</p><ul>`;
    
    for (const term of termsWithDefs) {
        termsListElement.innerHTML += `<li>${term}</li>`;
    }
    
    termsListElement.innerHTML += '</ul>';
    
    // Display term contexts
    organizeAndDisplayTerms(termsWithDefs);
}

// Study terms with additional info
function studyTermsWithAdditionalInfo() {
    // Filter terms with additional info
    const termsWithInfo = allKeyTerms.filter(term => 
        term in termAdditionalInfo && termAdditionalInfo[term].length > 0
    );
    
    if (termsWithInfo.length === 0) {
        alert('No terms with additional information found.');
        return;
    }
    
    // Hide study options and show study session
    document.querySelector('.study-options').style.display = 'none';
    document.querySelector('.study-session-content').style.display = 'block';
    
    // Set study session title
    document.getElementById('study-session-title').textContent = 'Studying Terms with Additional Information';
    
    // Display terms list
    const termsListElement = document.getElementById('study-terms-list');
    termsListElement.innerHTML = `<p>Found ${termsWithInfo.length} terms with additional information:</p><ul>`;
    
    for (const term of termsWithInfo) {
        termsListElement.innerHTML += `<li>${term}</li>`;
    }
    
    termsListElement.innerHTML += '</ul>';
    
    // Display term contexts
    organizeAndDisplayTerms(termsWithInfo);
}

// Study terms by frequency in notes
function studyTermsByFrequency() {
    if (!notesContent) {
        alert('No notes content available. Please load notes.txt first.');
        return;
    }
    
    // Count occurrences of each term
    const termCounts = {};
    
    for (const term of allKeyTerms) {
        const contexts = findTermInNotes(notesContent, term);
        termCounts[term] = contexts.length;
    }
    
    // Sort terms by occurrence count (descending)
    const sortedTerms = Object.entries(termCounts)
        .sort((a, b) => b[1] - a[1]);
    
    // Hide study options and show frequency selection
    document.querySelector('.study-options').style.display = 'none';
    document.querySelector('.frequency-selection').style.display = 'block';
    
    // Populate frequency list
    const frequencyList = document.getElementById('frequency-list');
    frequencyList.innerHTML = '';
    
    for (let i = 0; i < Math.min(sortedTerms.length, 10); i++) {
        const [term, count] = sortedTerms[i];
        
        const frequencyItem = document.createElement('div');
        frequencyItem.className = 'frequency-item';
        frequencyItem.textContent = `${i+1}. ${term} (${count} occurrences)`;
        
        frequencyList.appendChild(frequencyItem);
    }
}

// Study top terms by frequency
function studyTopTerms(numTerms) {
    if (!notesContent) {
        alert('No notes content available. Please load notes.txt first.');
        return;
    }
    
    // Count occurrences of each term
    const termCounts = {};
    
    for (const term of allKeyTerms) {
        const contexts = findTermInNotes(notesContent, term);
        termCounts[term] = contexts.length;
    }
    
    // Sort terms by occurrence count (descending)
    const sortedTerms = Object.entries(termCounts)
        .sort((a, b) => b[1] - a[1]);
    
    // Get top terms
    const topTerms = sortedTerms.slice(0, numTerms).map(([term, _]) => term);
    
    // Hide frequency selection and show study session
    document.querySelector('.frequency-selection').style.display = 'none';
    document.querySelector('.study-session-content').style.display = 'block';
    
    // Set study session title
    document.getElementById('study-session-title').textContent = `Studying Top ${numTerms} Terms by Frequency`;
    
    // Display terms list
    const termsListElement = document.getElementById('study-terms-list');
    termsListElement.innerHTML = `<p>Studying top ${topTerms.length} terms by frequency:</p><ul>`;
    
    for (let i = 0; i < topTerms.length; i++) {
        const term = topTerms[i];
        termsListElement.innerHTML += `<li>${term} (${termCounts[term]} occurrences)</li>`;
    }
    
    termsListElement.innerHTML += '</ul>';
    
    // Display term contexts
    organizeAndDisplayTerms(topTerms);
}

// Organize and display terms (common function for study sessions)
function organizeAndDisplayTerms(terms) {
    // Display term contexts
    const termContexts = {};
    
    for (const term of terms) {
        const contexts = findTermInNotes(notesContent, term);
        if (contexts.length > 0) {
            termContexts[term] = contexts;
        }
    }
    
    // Create term colors (cycling through the colorClasses array)
    const termColorClasses = {};
    terms.forEach((term, index) => {
        termColorClasses[term] = colorClasses[index % colorClasses.length];
    });
    
    // Display contexts
    const studyContentElement = document.getElementById('study-content');
    studyContentElement.innerHTML = '';
    
    for (const term of terms) {
        const termCard = document.createElement('div');
        termCard.className = 'term-card';
        
        let cardHtml = `<h4>${term}</h4>`;
        
        // Add category if available
        if (term in termCategories) {
            cardHtml += `<div class="category">${termCategories[term]}</div>`;
        }
        
        // Add definition if available
        if (term in termDefinitions) {
            cardHtml += `<div class="definition"><strong>Definition:</strong> ${termDefinitions[term]}</div>`;
        }
        
        // Add additional information if available
        if (term in termAdditionalInfo) {
            cardHtml += `<div class="additional-info"><strong>Additional Information:</strong><ul>`;
            for (const info of termAdditionalInfo[term]) {
                cardHtml += `<li>${info}</li>`;
            }
            cardHtml += `</ul></div>`;
        }
        
        // Add contexts if available
        if (term in termContexts && termContexts[term].length > 0) {
            for (let i = 0; i < termContexts[term].length; i++) {
                const context = termContexts[term][i];
                
                // Add context type labels
                const contextTypes = [];
                if (context.is_definition) contextTypes.push('<span class="context-type context-definition">Definition</span>');
                if (context.is_function) contextTypes.push('<span class="context-type context-function">Function/Purpose</span>');
                if (context.is_relationship) contextTypes.push('<span class="context-type context-relationship">Relationship</span>');
                
                const contextHeader = `Context ${i+1} ${contextTypes.length > 0 ? contextTypes.join(' ') : ''}`;
                
                cardHtml += `<div class="context">
                    <h5>${contextHeader}</h5>
                    <p>${highlightAllTermsInParagraph(context.text, terms, termColorClasses)}</p>
                </div>`;
            }
        } else {
            cardHtml += `<p>No contexts found in notes for this term.</p>`;
        }
        
        termCard.innerHTML = cardHtml;
        
        // Add images for this term if available
        if (termImages[term] && termImages[term].length > 0) {
            displayImagesForTerm(term, termCard);
        }
        
        studyContentElement.appendChild(termCard);
    }
}

// Helper function to escape regular expression special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to escape HTML special characters
function escapeHtml(string) {
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return string.replace(/[&<>"']/g, match => htmlEscapes[match]);
}

// Helper function to download a file
function downloadFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
}

// Helper function to save data to localStorage
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

// Image management setup
function setupImageManagement() {
    // Set up image tabs
    const imageTabButtons = document.querySelectorAll('.image-tab-btn');
    const imageTabPanes = document.querySelectorAll('.image-tab-pane');
    
    imageTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            imageTabButtons.forEach(btn => btn.classList.remove('active'));
            imageTabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Save single image button
    document.getElementById('save-image').addEventListener('click', () => {
        const imageFile = document.getElementById('image-upload').files[0];
        const imageTitle = document.getElementById('image-title').value.trim();
        const imageDescription = document.getElementById('image-description').value.trim();
        const associatedTermsText = document.getElementById('associated-terms').value.trim();
        
        if (!imageFile) {
            alert('Please select an image to upload.');
            return;
        }
        
        if (!imageTitle) {
            alert('Please enter a title for the image.');
            return;
        }
        
        if (!associatedTermsText) {
            alert('Please enter at least one term to associate with this image.');
            return;
        }
        
        // Parse associated terms
        const associatedTerms = associatedTermsText.split(',')
            .map(term => term.trim())
            .filter(term => term);
        
        // Read the image file
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // Create image object
            const imageObject = {
                id: Date.now().toString(), // Use timestamp as unique ID
                title: imageTitle,
                description: imageDescription,
                data: imageData,
                terms: associatedTerms
            };
            
            // Associate image with terms
            associatedTerms.forEach(term => {
                if (!termImages[term]) {
                    termImages[term] = [];
                }
                termImages[term].push(imageObject.id);
            });
            
            // Save image to localStorage
            saveImageToLocalStorage(imageObject);
            
            // Update images list
            displaySavedImages();
            
            // Clear form
            document.getElementById('image-upload').value = '';
            document.getElementById('image-title').value = '';
            document.getElementById('image-description').value = '';
            document.getElementById('associated-terms').value = '';
        };
        
        reader.readAsDataURL(imageFile);
    });
    
    // Save bulk images button
    document.getElementById('save-bulk-images').addEventListener('click', () => {
        const imageFiles = document.getElementById('bulk-image-upload').files;
        const commonTermsText = document.getElementById('bulk-associated-terms').value.trim();
        const useFilenamesAsTitles = document.getElementById('custom-titles').checked;
        
        if (imageFiles.length === 0) {
            alert('Please select at least one image to upload.');
            return;
        }
        
        if (!commonTermsText) {
            alert('Please enter at least one term to associate with these images.');
            return;
        }
        
        // Parse common terms
        const commonTerms = commonTermsText.split(',')
            .map(term => term.trim())
            .filter(term => term);
        
        // Create a progress indicator
        const progressContainer = document.createElement('div');
        progressContainer.className = 'bulk-upload-progress';
        progressContainer.innerHTML = `
            <p>Uploading images: <span id="images-progress">0/${imageFiles.length}</span></p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;
        document.getElementById('bulk-images').appendChild(progressContainer);
        
        let uploadedCount = 0;
        
        const updateProgress = () => {
            const progressSpan = document.getElementById('images-progress');
            const progressFill = progressContainer.querySelector('.progress-fill');
            
            progressSpan.textContent = `${uploadedCount}/${imageFiles.length}`;
            const percentage = (uploadedCount / imageFiles.length) * 100;
            progressFill.style.width = `${percentage}%`;
        };
        
        // Process each image file
        const processNextImage = (index) => {
            if (index >= imageFiles.length) {
                // All images processed
                progressContainer.remove();
                alert(`Successfully uploaded ${imageFiles.length} images!`);
                
                // Update images list
                displaySavedImages();
                
                // Clear form
                document.getElementById('bulk-image-upload').value = '';
                document.getElementById('bulk-associated-terms').value = '';
                return;
            }
            
            const file = imageFiles[index];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageData = e.target.result;
                
                // Generate title from filename if option is checked
                let imageTitle = '';
                if (useFilenamesAsTitles) {
                    // Remove file extension
                    imageTitle = file.name.replace(/\.[^/.]+$/, "");
                } else {
                    // Use index-based title
                    imageTitle = `Image ${index + 1}`;
                }
                
                // Create image object
                const imageObject = {
                    id: Date.now().toString() + index, // Use timestamp + index as unique ID
                    title: imageTitle,
                    description: '', // No description for bulk uploads
                    data: imageData,
                    terms: commonTerms
                };
                
                // Associate image with terms
                commonTerms.forEach(term => {
                    if (!termImages[term]) {
                        termImages[term] = [];
                    }
                    termImages[term].push(imageObject.id);
                });
                
                // Save image to localStorage
                saveImageToLocalStorage(imageObject);
                
                uploadedCount++;
                updateProgress();
                
                // Process next image
                processNextImage(index + 1);
            };
            
            reader.onerror = () => {
                alert(`Error reading image: ${file.name}`);
                uploadedCount++;
                updateProgress();
                processNextImage(index + 1);
            };
            
            reader.readAsDataURL(file);
        };
        
        // Start processing images
        processNextImage(0);
    });
            document.getElementById('image-upload').value = '';
            document.getElementById('image-title').value = '';
            document.getElementById('image-description').value = '';
            document.getElementById('associated-terms').value = '';
            
            alert('Image saved successfully!');
        };
        
        reader.readAsDataURL(imageFile);
    
    
    // Display saved images on load
    displaySavedImages();


// Display saved images
function displaySavedImages() {
    const imagesList = document.getElementById('images-list');
    imagesList.innerHTML = '';
    
    // Get all saved images
    const savedImages = getAllSavedImages();
    
    if (savedImages.length === 0) {
        imagesList.innerHTML = '<p>No images saved yet.</p>';
        return;
    }
    
    // Create HTML for each image
    savedImages.forEach(image => {
        const imageCard = document.createElement('div');
        imageCard.className = 'image-card';
        
        imageCard.innerHTML = `
            <img src="${image.data}" alt="${image.title}" class="image-card-thumbnail">
            <div class="image-card-content">
                <div class="image-card-title">${image.title}</div>
                ${image.description ? `<div class="image-card-description">${image.description}</div>` : ''}
                <div class="image-card-terms">
                    ${image.terms.map(term => `<span>${term}</span>`).join('')}
                </div>
                <div class="image-card-actions">
                    <button class="view-image" data-id="${image.id}">View</button>
                    <button class="delete-image" data-id="${image.id}">Delete</button>
                </div>
            </div>
        `;
        
        imagesList.appendChild(imageCard);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-image').forEach(button => {
        button.addEventListener('click', (e) => {
            const imageId = e.target.getAttribute('data-id');
            const image = getSavedImageById(imageId);
            
            if (image) {
                // Create modal to view image
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h3>${image.title}</h3>
                        ${image.description ? `<p>${image.description}</p>` : ''}
                        <img src="${image.data}" alt="${image.title}" style="max-width: 100%; max-height: 80vh;">
                        <div class="image-card-terms">
                            <p>Associated terms:</p>
                            ${image.terms.map(term => `<span>${term}</span>`).join('')}
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Add event listener to close button
                modal.querySelector('.close-modal').addEventListener('click', () => {
                    modal.remove();
                });
                
                // Close modal when clicking outside
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
            }
        });
    });
    
    document.querySelectorAll('.delete-image').forEach(button => {
        button.addEventListener('click', (e) => {
            const imageId = e.target.getAttribute('data-id');
            
            if (confirm('Are you sure you want to delete this image?')) {
                deleteImage(imageId);
                displaySavedImages();
            }
        });
    });
}

// Save image to localStorage
function saveImageToLocalStorage(imageObject) {
    try {
        // Get existing images
        const existingImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
        
        // Add new image
        existingImages.push(imageObject);
        
        // Save back to localStorage
        localStorage.setItem('savedImages', JSON.stringify(existingImages));
        
        // Save term associations
        localStorage.setItem('termImages', JSON.stringify(termImages));
    } catch (e) {
        console.error('Error saving image to localStorage:', e);
    }
}

// Get all saved images
function getAllSavedImages() {
    try {
        return JSON.parse(localStorage.getItem('savedImages') || '[]');
    } catch (e) {
        console.error('Error getting saved images:', e);
        return [];
    }
}

// Get saved image by ID
function getSavedImageById(id) {
    const savedImages = getAllSavedImages();
    return savedImages.find(image => image.id === id);
}

// Delete image
function deleteImage(id) {
    try {
        // Get existing images
        const existingImages = getAllSavedImages();
        
        // Find the image to delete
        const imageToDelete = existingImages.find(image => image.id === id);
        
        if (imageToDelete) {
            // Remove image from term associations
            imageToDelete.terms.forEach(term => {
                if (termImages[term]) {
                    termImages[term] = termImages[term].filter(imageId => imageId !== id);
                    
                    // Remove term from termImages if it has no more images
                    if (termImages[term].length === 0) {
                        delete termImages[term];
                    }
                }
            });
            
            // Remove image from saved images
            const updatedImages = existingImages.filter(image => image.id !== id);
            
            // Save back to localStorage
            localStorage.setItem('savedImages', JSON.stringify(updatedImages));
            localStorage.setItem('termImages', JSON.stringify(termImages));
        }
    } catch (e) {
        console.error('Error deleting image:', e);
    }
}

// Display images for a term
function displayImagesForTerm(term, container) {
    // Check if term has associated images
    if (!termImages[term] || termImages[term].length === 0) {
        return;
    }
    
    // Create container for images
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'context-images';
    imagesContainer.innerHTML = '<h4>Related Images</h4>';
    
    // Get images for this term
    const imageIds = termImages[term];
    const images = imageIds.map(id => getSavedImageById(id)).filter(img => img); // Filter out any null values
    
    // Add each image
    images.forEach(image => {
        const imageElement = document.createElement('div');
        imageElement.className = 'context-image';
        imageElement.innerHTML = `
            <img src="${image.data}" alt="${image.title}">
            <div class="context-image-title">${image.title}</div>
            ${image.description ? `<div class="context-image-description">${image.description}</div>` : ''}
        `;
        
        imagesContainer.appendChild(imageElement);
    });
    
    // Add to container
    container.appendChild(imagesContainer);
}

// Helper function to load saved data from localStorage
function loadSavedData() {
    try {
        notesContent = localStorage.getItem('notesContent') || '';
        keytermsContent = localStorage.getItem('keytermsContent') || '';
        definitionsContent = localStorage.getItem('definitionsContent') || '';
        
        // Load term images
        const savedTermImages = localStorage.getItem('termImages');
        if (savedTermImages) {
            termImages = JSON.parse(savedTermImages);
        }
        
        if (keytermsContent) {
            processKeyTerms();
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
    }
}

// Search for any word in the notes
function searchForWord(word) {
    if (!notesContent) {
        alert('No notes content available. Please load notes.txt first.');
        return;
    }
    
    if (!word) {
        alert('Please enter a word to search for.');
        return;
    }
    
    // Find all occurrences of the word in the notes
    const contexts = findWordInNotes(notesContent, word);
    
    if (contexts.length === 0) {
        alert(`No occurrences of "${word}" found in the notes.`);
        return;
    }
    
    // Display the search results
    displaySearchResults(word, contexts);
}

// Find a word in the notes and return the surrounding context
function findWordInNotes(notesContent, word) {
    // Create a regex pattern that matches the word
    const pattern = new RegExp('\\b' + escapeRegExp(word.toLowerCase()) + '(?:s|,|\\.|:|;)?\\b', 'gi');
    
    // Find all occurrences of the word
    const contexts = [];
    const paragraphsFound = new Set(); // Track paragraphs we've already found
    let match;
    
    while ((match = pattern.exec(notesContent.toLowerCase())) !== null) {
        const pos = match.index;
        
        // Get context (paragraph containing the word)
        // Find the start of the paragraph
        let paraStart = notesContent.lastIndexOf('\n\n', pos);
        if (paraStart === -1) {
            paraStart = 0;
        } else {
            paraStart += 2; // Skip the newlines
        }
        
        // Find the end of the paragraph
        let paraEnd = notesContent.indexOf('\n\n', pos);
        if (paraEnd === -1) {
            paraEnd = notesContent.length;
        }
        
        // Extract the paragraph
        const paragraph = notesContent.substring(paraStart, paraEnd).trim();
        
        // Skip if we've already processed this paragraph
        const paragraphKey = `${paraStart}-${paraEnd}`;
        if (paragraphsFound.has(paragraphKey)) {
            continue;
        }
        
        // Mark this paragraph as found
        paragraphsFound.add(paragraphKey);
        
        // Calculate the position of the term in the paragraph
        const termPosInPara = notesContent.substring(paraStart, pos).length;
        
        // Add context with metadata
        contexts.push({
            text: paragraph,
            position: termPosInPara
        });
    }
    
    return contexts;
}

// Display search results for a word
function displaySearchResults(word, contexts) {
    // Clear the terms container
    const termsContainer = document.getElementById('terms-container');
    termsContainer.innerHTML = `<p>Search results for "${word}":</p><p>Found ${contexts.length} occurrences in the notes.</p>`;
    
    // Display contexts in the contexts container
    const contextsContainer = document.getElementById('contexts-container');
    contextsContainer.innerHTML = '';
    
    // Create a card for the search results
    const searchCard = document.createElement('div');
    searchCard.className = 'term-card';
    searchCard.innerHTML = `<h4>Search Results for "${word}"</h4>`;
    
    // Add each context
    contexts.forEach((context, index) => {
        // Highlight the search word in the context
        const highlightedText = highlightWordInText(context.text, word);
        
        searchCard.innerHTML += `
            <div class="context">
                <h5>Result ${index + 1}</h5>
                <p>${highlightedText}</p>
            </div>
        `;
    });
    
    contextsContainer.appendChild(searchCard);
}

// Highlight a specific word in text
function highlightWordInText(text, word) {
    // Create a regex pattern that matches the word
    const pattern = new RegExp('\\b(' + escapeRegExp(word) + ')(?:s|,|\\.|:|;)?\\b', 'gi');
    
    // Replace all occurrences with highlighted version
    return text.replace(pattern, '<span class="term-highlight term-highlight-orange">$1</span>');
}

// Show objectives results
function showObjectivesResults() {
    // Hide question and feedback sections
    document.querySelector('.learning-objective-question').style.display = 'none';
    document.querySelector('.objective-feedback').style.display = 'none';
    
    // Show results section
    document.querySelector('.objectives-results').style.display = 'block';
    
    // Generate summary
    const summaryElement = document.getElementById('objectives-summary');
    summaryElement.innerHTML = '';
    
    // Create summary table
    const table = document.createElement('table');
    table.className = 'objectives-summary-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>#</th>
                <th>Learning Objective</th>
                <th>Your Answer</th>
                <th>Understanding Level</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    
    // Add rows for each objective
    objectiveResponses.forEach((response, index) => {
        const row = document.createElement('tr');
        
        // Determine understanding level text
        let understandingText = 'Not assessed';
        let understandingClass = '';
        
        if (response.understanding !== null) {
            switch (response.understanding) {
                case 1:
                    understandingText = 'Not at all';
                    understandingClass = 'understanding-low';
                    break;
                case 2:
                    understandingText = 'Somewhat';
                    understandingClass = 'understanding-medium-low';
                    break;
                case 3:
                    understandingText = 'Mostly';
                    understandingClass = 'understanding-medium-high';
                    break;
                case 4:
                    understandingText = 'Completely';
                    understandingClass = 'understanding-high';
                    break;
            }
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${response.objective}</td>
            <td>${response.answer}</td>
            <td class="${understandingClass}">${understandingText}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    summaryElement.appendChild(table);
}
