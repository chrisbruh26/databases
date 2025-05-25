document.addEventListener("DOMContentLoaded", function() {
    // DOM elements
    const outputArea = document.getElementById("output");
    const generationMode = document.getElementById("generation-mode");
    const submitBtn = document.getElementById("submitBtn");
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");
    const modeButtons = document.querySelectorAll(".mode-button");
    const outputCountSlider = document.getElementById("output-count");
    const outputCountValue = document.getElementById("output-count-value");
    const creativitySlider = document.getElementById("creativity");
    const creativityValue = document.getElementById("creativity-value");
    const minWordsSlider = document.getElementById("min-words");
    const minWordsValue = document.getElementById("min-words-value");
    const maxWordsSlider = document.getElementById("max-words");
    const maxWordsValue = document.getElementById("max-words-value");
    const grammarCheck = document.getElementById("grammar-check");
    const showSource = document.getElementById("show-source");
    const capitalizeCheck = document.getElementById("capitalize");
    const filterDuplicatesCheck = document.getElementById("filter-duplicates");
    const addPunctuationCheck = document.getElementById("add-punctuation");
    const priorityInput = document.getElementById("priority-input");
    const addPriorityBtn = document.getElementById("add-priority");
    const priorityWordsContainer = document.getElementById("priority-words-container");
    const fileUpload = document.getElementById("file-upload");
    const uploadBtn = document.getElementById("upload-btn");
    const fileList = document.getElementById("file-list");
    const sourceWeights = document.getElementById("source-weights");
    const exportSettingsBtn = document.getElementById("export-settings");
    const importSettingsBtn = document.getElementById("import-settings");
    
    // App state
    const state = {
        sources: {
            default: {
                name: "Default Lyrics",
                content: "",
                weight: 100,
                words: [],
                wordsByType: {}
            }
        },
        settings: {
            outputCount: 10,
            creativity: 5,
            minWords: 3,
            maxWords: 7,
            grammarCheck: true,
            showSource: false,
            capitalize: true,
            filterDuplicates: true,
            addPunctuation: false
        },
        priorityWords: [],
        wordTypes: [
            "noun", "verb", "adjective", "adverb", 
            "pronoun", "preposition", "conjunction", "article"
        ]
    };
    
    // Initialize UI elements
    function initUI() {
        // Tab switching
        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const tabName = tab.getAttribute("data-tab");
                
                // Update active tab
                tabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                
                // Show corresponding content
                tabContents.forEach(content => {
                    content.classList.remove("active");
                });
                document.getElementById(`${tabName}-tab`).classList.add("active");
            });
        });
        
        // Mode buttons
        modeButtons.forEach(button => {
            button.addEventListener("click", () => {
                const mode = button.getAttribute("data-mode");
                generationMode.value = mode;
                generateOutput();
            });
        });
        
        // Sliders
        outputCountSlider.addEventListener("input", () => {
            outputCountValue.textContent = outputCountSlider.value;
            state.settings.outputCount = parseInt(outputCountSlider.value);
        });
        
        creativitySlider.addEventListener("input", () => {
            creativityValue.textContent = creativitySlider.value;
            state.settings.creativity = parseInt(creativitySlider.value);
        });
        
        minWordsSlider.addEventListener("input", () => {
            minWordsValue.textContent = minWordsSlider.value;
            state.settings.minWords = parseInt(minWordsSlider.value);
            
            // Ensure max words is at least min words
            if (parseInt(maxWordsSlider.value) < parseInt(minWordsSlider.value)) {
                maxWordsSlider.value = minWordsSlider.value;
                maxWordsValue.textContent = maxWordsSlider.value;
                state.settings.maxWords = parseInt(maxWordsSlider.value);
            }
        });
        
        maxWordsSlider.addEventListener("input", () => {
            maxWordsValue.textContent = maxWordsSlider.value;
            state.settings.maxWords = parseInt(maxWordsSlider.value);
            
            // Ensure min words is at most max words
            if (parseInt(minWordsSlider.value) > parseInt(maxWordsSlider.value)) {
                minWordsSlider.value = maxWordsSlider.value;
                minWordsValue.textContent = minWordsSlider.value;
                state.settings.minWords = parseInt(minWordsSlider.value);
            }
        });
        
        // Checkboxes
        grammarCheck.addEventListener("change", () => {
            state.settings.grammarCheck = grammarCheck.checked;
        });
        
        showSource.addEventListener("change", () => {
            state.settings.showSource = showSource.checked;
        });
        
        capitalizeCheck.addEventListener("change", () => {
            state.settings.capitalize = capitalizeCheck.checked;
        });
        
        filterDuplicatesCheck.addEventListener("change", () => {
            state.settings.filterDuplicates = filterDuplicatesCheck.checked;
        });
        
        addPunctuationCheck.addEventListener("change", () => {
            state.settings.addPunctuation = addPunctuationCheck.checked;
        });
        
        // Priority words
        addPriorityBtn.addEventListener("click", addPriorityWord);
        priorityInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                addPriorityWord();
            }
        });
        
        // File upload
        uploadBtn.addEventListener("click", () => {
            if (fileUpload.files.length > 0) {
                handleFileUpload(fileUpload.files);
            }
        });
        
        // Export/Import settings
        exportSettingsBtn.addEventListener("click", exportSettings);
        importSettingsBtn.addEventListener("click", importSettings);
        
        // Generate button
        submitBtn.addEventListener("click", generateOutput);
    }
    
    // Function to append text to the output area
    function appendToOutput(text, source = null) {
        const newLine = document.createElement("div");
        
        if (state.settings.showSource && source) {
            const textSpan = document.createElement("span");
            textSpan.textContent = text;
            
            const sourceSpan = document.createElement("span");
            sourceSpan.className = "source-badge";
            sourceSpan.textContent = source;
            
            newLine.appendChild(textSpan);
            newLine.appendChild(sourceSpan);
        } else {
            newLine.textContent = text;
        }
        
        // Add a glitch effect for fun
        newLine.classList.add("glitch-effect");
        
        outputArea.appendChild(newLine);
        
        // Auto-scroll to the bottom
        outputArea.scrollTop = outputArea.scrollHeight;
        
        // Remove the glitch effect after animation completes
        setTimeout(() => {
            newLine.classList.remove("glitch-effect");
        }, 300);
    }
    
    // Function to clear the output area
    function clearOutput() {
        outputArea.innerHTML = "";
    }
    
    // Function to add a priority word
    function addPriorityWord() {
        const word = priorityInput.value.trim();
        
        if (word && !state.priorityWords.includes(word)) {
            state.priorityWords.push(word);
            
            const wordElement = document.createElement("div");
            wordElement.className = "priority-word";
            wordElement.textContent = word;
            
            const removeBtn = document.createElement("span");
            removeBtn.textContent = "×";
            removeBtn.addEventListener("click", () => {
                state.priorityWords = state.priorityWords.filter(w => w !== word);
                wordElement.remove();
            });
            
            wordElement.appendChild(removeBtn);
            priorityWordsContainer.appendChild(wordElement);
            
            priorityInput.value = "";
        }
    }
    
    // Function to handle file upload
    function handleFileUpload(files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const content = e.target.result;
                const sourceId = "source_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
                
                // Add to sources
                state.sources[sourceId] = {
                    name: file.name,
                    content: content,
                    weight: 100,
                    words: [],
                    wordsByType: {}
                };
                
                // Process the content
                processSourceContent(sourceId);
                
                // Add to UI
                addSourceToUI(sourceId);
            };
            
            reader.readAsText(file);
        });
    }
    
    // Function to add a source to the UI
    function addSourceToUI(sourceId) {
        const source = state.sources[sourceId];
        
        // Add to file list
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";
        fileItem.innerHTML = `
            <span>${source.name}</span>
            <span class="file-remove" data-id="${sourceId}">×</span>
        `;
        fileList.appendChild(fileItem);
        
        // Add weight slider
        const weightContainer = document.createElement("div");
        weightContainer.className = "slider-container";
        weightContainer.innerHTML = `
            <div class="slider-label">
                <span>${source.name}: <span id="${sourceId}-weight-value">100%</span></span>
            </div>
            <input type="range" min="0" max="100" value="100" class="slider source-weight" data-source="${sourceId}">
        `;
        sourceWeights.appendChild(weightContainer);
        
        // Add event listeners
        fileItem.querySelector(".file-remove").addEventListener("click", () => {
            removeSource(sourceId);
        });
        
        weightContainer.querySelector(".source-weight").addEventListener("input", (e) => {
            const weight = e.target.value;
            document.getElementById(`${sourceId}-weight-value`).textContent = `${weight}%`;
            state.sources[sourceId].weight = parseInt(weight);
        });
    }
    
    // Function to remove a source
    function removeSource(sourceId) {
        // Don"t allow removing the default source
        if (sourceId === "default") {
            appendToOutput("Cannot remove the default source.");
            return;
        }
        
        // Remove from state
        delete state.sources[sourceId];
        
        // Remove from UI
        const fileItem = fileList.querySelector(`.file-remove[data-id="${sourceId}"]`).parentNode;
        fileItem.remove();
        
        const weightContainer = sourceWeights.querySelector(`.source-weight[data-source="${sourceId}"]`).parentNode.parentNode;
        weightContainer.remove();
    }
    
    // Function to process source content
    function processSourceContent(sourceId) {
        const source = state.sources[sourceId];
        let text = source.content.toLowerCase();
        
        // Clean up the text
        text = text.replace(/\n/g, " ");
        text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
        
        // Split into words
        source.words = text.split(/\s+/).filter(word => word.length > 0);
        
        // Categorize words
        categorizeWords(sourceId);
    }
    
    // Function to categorize words by type
    function categorizeWords(sourceId) {
        const source = state.sources[sourceId];
        
        // Initialize word type containers
        state.wordTypes.forEach(type => {
            source.wordsByType[type] = [];
        });
        
        // Common words by type
        const commonWords = {
            article: ["a", "an", "the"],
            pronoun: ["i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "her", "its", "our", "their"],
            preposition: ["in", "on", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "of"],
            conjunction: ["and", "but", "or", "nor", "for", "yet", "so"],
            verb: ["is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "shall", "should", "may", "might", "must", "can", "could", "go", "see", "look", "come", "think", "say", "tell", "know", "get", "make", "take", "find", "give", "use", "fall", "love", "keep", "let", "seem", "help", "talk", "turn", "start", "show", "hear", "play", "run", "move", "like", "live", "believe", "hold", "bring", "happen", "write", "sit", "stand", "lose", "pay", "meet", "include", "continue", "set", "learn", "change", "lead", "understand", "watch", "follow", "stop", "create", "speak", "read", "allow", "add", "spend", "grow", "open", "walk", "win", "offer", "remember", "consider", "appear", "buy", "wait", "serve", "die", "send", "build", "stay", "fall", "cut", "reach", "kill", "remain", "suggest", "raise", "pass", "sell", "require", "report", "decide", "pull"],
            adjective: ["good", "new", "first", "last", "long", "great", "little", "own", "other", "old", "right", "big", "high", "different", "small", "large", "next", "early", "young", "important", "few", "public", "bad", "same", "able", "mighty", "dizzy", "lonely", "crooked", "clear", "straight", "deeper", "missing"],
            adverb: ["up", "so", "out", "just", "now", "how", "then", "more", "also", "here", "well", "only", "very", "even", "back", "there", "still", "too", "when", "never", "really", "most", "why", "away", "again", "quite", "rather", "often", "always", "almost", "especially", "ever", "instead", "already", "together", "probably", "whatever", "sometimes", "completely", "suddenly", "hopefully", "actually", "finally", "mainly", "nearly", "eventually", "exactly", "certainly", "normally", "simply", "generally", "otherwise", "obviously", "possibly", "carefully", "clearly", "definitely", "absolutely", "apparently", "usually", "recently", "totally", "directly", "immediately", "currently", "relatively", "constantly", "properly", "seriously", "originally", "basically", "strongly", "naturally", "specifically", "entirely", "significantly", "personally", "occasionally", "honestly", "gradually", "ultimately", "necessarily", "slightly", "frequently", "deliberately", "surely", "unfortunately", "regularly", "initially", "essentially", "successfully", "literally", "largely", "equally", "perfectly", "highly", "properly", "primarily", "quickly", "slowly"]
        };
        
        // Custom tags dictionary
        const customTags = {
            "dna": "noun",
            "tna": "noun",
            "dick": "noun",
            "workin\"": "verb",
            "fuckin\"": "verb",
            "see-through": "adjective"
        };
        
        // Categorize each word
        source.words.forEach(word => {
            const cleanWord = word.toLowerCase();
            let wordType = "noun"; // Default to noun
            
            // Check custom tags first
            if (customTags[cleanWord]) {
                wordType = customTags[cleanWord];
            } 
            // Check common word lists
            else {
                for (const [type, words] of Object.entries(commonWords)) {
                    if (words.includes(cleanWord)) {
                        wordType = type;
                        break;
                    }
                }
            }
            
            // Add to the appropriate category
            source.wordsByType[wordType].push(word);
        });
        
        // Remove duplicates if enabled
        if (state.settings.filterDuplicates) {
            state.wordTypes.forEach(type => {
                source.wordsByType[type] = removeDuplicates(source.wordsByType[type]);
            });
        }
    }
    
    // Function to remove duplicates from a word list
    function removeDuplicates(wordList) {
        const lowercaseList = wordList.map(word => word.toLowerCase());
        const seen = new Set();
        const uniqueList = [];
        
        lowercaseList.forEach((word, index) => {
            if (!seen.has(word)) {
                uniqueList.push(wordList[index]);
                seen.add(word);
            }
        });
        
        return uniqueList;
    }
    
    // Function to get a random word of a specific type
    function getRandomWord(type, sourceId = null) {
        // If a specific source is requested
        if (sourceId && state.sources[sourceId] && state.sources[sourceId].wordsByType[type].length > 0) {
            const words = state.sources[sourceId].wordsByType[type];
            return {
                word: words[Math.floor(Math.random() * words.length)],
                source: state.sources[sourceId].name
            };
        }
        
        // Otherwise, select from all sources based on weights
        const sourceIds = Object.keys(state.sources);
        const totalWeight = sourceIds.reduce((sum, id) => sum + state.sources[id].weight, 0);
        
        if (totalWeight === 0) {
            return { word: "", source: "none" };
        }
        
        let randomWeight = Math.random() * totalWeight;
        let selectedSource = null;
        
        for (const id of sourceIds) {
            randomWeight -= state.sources[id].weight;
            if (randomWeight <= 0) {
                selectedSource = id;
                break;
            }
        }
        
        // If no source has words of this type, try another source
        if (!selectedSource || state.sources[selectedSource].wordsByType[type].length === 0) {
            for (const id of sourceIds) {
                if (state.sources[id].wordsByType[type].length > 0) {
                    selectedSource = id;
                    break;
                }
            }
        }
        
        // If still no source found, return empty
        if (!selectedSource || state.sources[selectedSource].wordsByType[type].length === 0) {
            return { word: "", source: "none" };
        }
        
        const words = state.sources[selectedSource].wordsByType[type];
        return {
            word: words[Math.floor(Math.random() * words.length)],
            source: state.sources[selectedSource].name
        };
    }
    
    // Function to get a random word from priority words
    function getRandomPriorityWord() {
        if (state.priorityWords.length === 0) {
            return null;
        }
        
        return {
            word: state.priorityWords[Math.floor(Math.random() * state.priorityWords.length)],
            source: "priority"
        };
    }
    
    // Function to capitalize the first letter of a string
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Function to add random punctuation
    function addRandomPunctuation(string) {
        const punctuation = [".", "!", "?", "...", ",", ";", ":", "-"];
        const randomPunct = punctuation[Math.floor(Math.random() * punctuation.length)];
        
        // Only add punctuation at the end if it doesn"t already have it
        if (!string.match(/[.,!?;:-]$/)) {
            return string + randomPunct;
        }
        
        return string;
    }
    
    // Generation functions
    function generateTrueRandom() {
        const wordCount = Math.floor(Math.random() * (state.settings.maxWords - state.settings.minWords + 1)) + state.settings.minWords;
        const words = [];
        const sources = [];
        
        for (let i = 0; i < wordCount; i++) {
            // Occasionally use a priority word if available
            if (state.priorityWords.length > 0 && Math.random() < 0.3) {
                const result = getRandomPriorityWord();
                words.push(result.word);
                sources.push(result.source);
            } else {
                // Get a random word of any type
                const types = state.wordTypes;
                const randomType = types[Math.floor(Math.random() * types.length)];
                const result = getRandomWord(randomType);
                
                if (result.word) {
                    words.push(result.word);
                    sources.push(result.source);
                }
            }
        }
        
        let output = words.join(" ");
        
        // Apply formatting
        if (state.settings.capitalize) {
            output = capitalizeFirstLetter(output);
        }
        
        if (state.settings.addPunctuation) {
            output = addRandomPunctuation(output);
        }
        
        return { text: output, sources };
    }
    
    function generateSongTitle() {
        let words = [];
        let sources = [];
        
        // Basic pattern: Article + Adjective + Noun
        // Or: Adjective + Noun + Preposition + Article + Noun
        
        if (Math.random() < 0.5) {
            // Pattern 1: Article + Adjective + Noun
            const article = getRandomWord("article");
            const adjective = getRandomWord("adjective");
            const noun = getRandomWord("noun");
            
            words = [article.word, adjective.word, noun.word];
            sources = [article.source, adjective.source, noun.source];
        } else {
            // Pattern 2: Adjective + Noun + Preposition + Article + Noun
            const adjective = getRandomWord("adjective");
            const noun1 = getRandomWord("noun");
            const preposition = getRandomWord("preposition");
            const article = getRandomWord("article");
            const noun2 = getRandomWord("noun");
            
            words = [adjective.word, noun1.word, preposition.word, article.word, noun2.word];
            sources = [adjective.source, noun1.source, preposition.source, article.source, noun2.source];
        }
        
        // Occasionally insert a priority word if available
        if (state.priorityWords.length > 0 && Math.random() < 0.4) {
            const priorityWord = getRandomPriorityWord();
            const insertPosition = Math.floor(Math.random() * (words.length + 1));
            
            words.splice(insertPosition, 0, priorityWord.word);
            sources.splice(insertPosition, 0, priorityWord.source);
        }
        
        let output = words.join(" ");
        
        // Apply formatting
        if (state.settings.capitalize) {
            output = capitalizeFirstLetter(output);
        }
        
        if (state.settings.addPunctuation && Math.random() < 0.3) {
            output = addRandomPunctuation(output);
        }
        
        return { text: output, sources };
    }
    
    function generateLyricLine() {
        let words = [];
        let sources = [];
        
        // Basic pattern: Pronoun + Verb + Preposition + Article + Adjective + Noun
        const pronoun = getRandomWord("pronoun");
        const verb = getRandomWord("verb");
        const preposition = getRandomWord("preposition");
        const article = getRandomWord("article");
        const adjective = getRandomWord("adjective");
        const noun = getRandomWord("noun");
        
        // Base structure
        words = [pronoun.word, verb.word, preposition.word, article.word];
        sources = [pronoun.source, verb.source, preposition.source, article.source];
        
        // Add adjective sometimes
        if (Math.random() < 0.7) {
            words.push(adjective.word);
            sources.push(adjective.source);
        }
        
        // Always add a noun
        words.push(noun.word);
        sources.push(noun.source);
        
        // Sometimes add an adverb at the beginning or end
        if (Math.random() < 0.4) {
            const adverb = getRandomWord("adverb");
            if (Math.random() < 0.5) {
                // Add at beginning
                words.unshift(adverb.word);
                sources.unshift(adverb.source);
            } else {
                // Add at end
                words.push(adverb.word);
                sources.push(adverb.source);
            }
        }
        
        // Occasionally insert a priority word if available
        if (state.priorityWords.length > 0 && Math.random() < 0.5) {
            const priorityWord = getRandomPriorityWord();
            const insertPosition = Math.floor(Math.random() * (words.length + 1));
            
            words.splice(insertPosition, 0, priorityWord.word);
            sources.splice(insertPosition, 0, priorityWord.source);
        }
        
        let output = words.join(" ");
        
        // Apply formatting
        if (state.settings.capitalize) {
            output = capitalizeFirstLetter(output);
        }
        
        if (state.settings.addPunctuation) {
            output = addRandomPunctuation(output);
        }
        
        return { text: output, sources };
    }
    
    function generateSmartMix() {
        // This mode tries to create more contextually aware combinations
        // by using word pairs that might appear together in the source text
        
        let words = [];
        let sources = [];
        let currentType = null;
        let lastWord = null;
        
        // Start with a random word type
        const startTypes = ["noun", "pronoun", "adjective"];
        currentType = startTypes[Math.floor(Math.random() * startTypes.length)];
        
        // Get the first word
        const firstWordResult = getRandomWord(currentType);
        words.push(firstWordResult.word);
        sources.push(firstWordResult.source);
        lastWord = firstWordResult.word;
        
        // Define type transitions based on grammar rules
        const typeTransitions = {
            "noun": ["verb", "conjunction", "preposition"],
            "pronoun": ["verb", "adverb"],
            "verb": ["noun", "pronoun", "adverb", "preposition"],
            "adjective": ["noun", "adverb"],
            "adverb": ["verb", "adjective"],
            "preposition": ["article", "noun", "pronoun"],
            "article": ["noun", "adjective"],
            "conjunction": ["noun", "pronoun", "article"]
        };
        
        // Generate a sequence of words
        const wordCount = Math.floor(Math.random() * (state.settings.maxWords - state.settings.minWords + 1)) + state.settings.minWords;
        
        for (let i = 1; i < wordCount; i++) {
            // Determine the next word type based on grammar rules if enabled
            if (state.settings.grammarCheck && typeTransitions[currentType]) {
                const possibleTypes = typeTransitions[currentType];
                currentType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
            } else {
                // Otherwise, just pick a random type
                currentType = state.wordTypes[Math.floor(Math.random() * state.wordTypes.length)];
            }
            
            // Occasionally use a priority word if available
            if (state.priorityWords.length > 0 && Math.random() < 0.3) {
                const priorityResult = getRandomPriorityWord();
                words.push(priorityResult.word);
                sources.push(priorityResult.source);
                lastWord = priorityResult.word;
            } else {
                // Get a word of the determined type
                const wordResult = getRandomWord(currentType);
                
                if (wordResult.word && (!state.settings.filterDuplicates || wordResult.word.toLowerCase() !== lastWord.toLowerCase())) {
                    words.push(wordResult.word);
                    sources.push(wordResult.source);
                    lastWord = wordResult.word;
                }
            }
        }
        
        let output = words.join(" ");
        
        // Apply formatting
        if (state.settings.capitalize) {
            output = capitalizeFirstLetter(output);
        }
        
        if (state.settings.addPunctuation) {
            output = addRandomPunctuation(output);
        }
        
        return { text: output, sources };
    }
    
    function generateThemed() {
        // This mode prioritizes using the priority words
        if (state.priorityWords.length === 0) {
            appendToOutput("No priority words set. Please add some priority words first.");
            return { text: "", sources: [] };
        }
        
        let words = [];
        let sources = [];
        
        // Start with 1-2 priority words
        const priorityCount = Math.min(state.priorityWords.length, Math.floor(Math.random() * 2) + 1);
        
        for (let i = 0; i < priorityCount; i++) {
            const priorityResult = getRandomPriorityWord();
            words.push(priorityResult.word);
            sources.push(priorityResult.source);
        }
        
        // Add more words to reach the desired length
        const targetLength = Math.floor(Math.random() * (state.settings.maxWords - state.settings.minWords + 1)) + state.settings.minWords;
        
        while (words.length < targetLength) {
            // Determine the next word type based on the last word if grammar check is enabled
            let nextType;
            
            if (state.settings.grammarCheck) {
                // Simple grammar rules
                if (words.length === 0) {
                    nextType = ["noun", "pronoun", "adjective", "article"][Math.floor(Math.random() * 4)];
                } else {
                    const lastWord = words[words.length - 1].toLowerCase();
                    
                    if (state.sources.default.wordsByType.article.includes(lastWord)) {
                        nextType = Math.random() < 0.7 ? "adjective" : "noun";
                    } else if (state.sources.default.wordsByType.adjective.includes(lastWord)) {
                        nextType = "noun";
                    } else if (state.sources.default.wordsByType.noun.includes(lastWord)) {
                        nextType = ["verb", "preposition"][Math.floor(Math.random() * 2)];
                    } else if (state.sources.default.wordsByType.verb.includes(lastWord)) {
                        nextType = ["noun", "adverb", "preposition"][Math.floor(Math.random() * 3)];
                    } else if (state.sources.default.wordsByType.preposition.includes(lastWord)) {
                        nextType = ["article", "noun", "pronoun"][Math.floor(Math.random() * 3)];
                    } else {
                        nextType = state.wordTypes[Math.floor(Math.random() * state.wordTypes.length)];
                    }
                }
            } else {
                nextType = state.wordTypes[Math.floor(Math.random() * state.wordTypes.length)];
            }
            
            // Get a word of the determined type
            const wordResult = getRandomWord(nextType);
            
            if (wordResult.word && (!state.settings.filterDuplicates || !words.includes(wordResult.word))) {
                words.push(wordResult.word);
                sources.push(wordResult.source);
            }
        }
        
        let output = words.join(" ");
        
        // Apply formatting
        if (state.settings.capitalize) {
            output = capitalizeFirstLetter(output);
        }
        
        if (state.settings.addPunctuation) {
            output = addRandomPunctuation(output);
        }
        
        return { text: output, sources };
    }
    
    // Function to generate output based on the selected mode
    function generateOutput() {
        const mode = generationMode.value;
        const count = state.settings.outputCount;
        
        clearOutput();
        
        let modeText;
        let generatorFunction;
        
        switch (mode) {
            case "0":
                modeText = "TRUE RANDOM";
                generatorFunction = generateTrueRandom;
                break;
            case "1":
                modeText = "SONG TITLE";
                generatorFunction = generateSongTitle;
                break;
            case "2":
                modeText = "LYRIC LINE";
                generatorFunction = generateLyricLine;
                break;
            case "3":
                modeText = "SMART MIX";
                generatorFunction = generateSmartMix;
                break;
            case "4":
                modeText = "THEMED";
                generatorFunction = generateThemed;
                break;
            default:
                appendToOutput("Invalid mode. Please select a valid mode.");
                return;
        }
        
        appendToOutput(`Generating ${count} outputs in ${modeText} mode:`);
        
        for (let i = 0; i < count; i++) {
            const result = generatorFunction();
            
            if (result.text) {
                // If showing sources, we"ll handle it in appendToOutput
                if (state.settings.showSource) {
                    const sourceText = result.sources.join(", ");
                    appendToOutput(`${i+1}. ${result.text}`, sourceText);
                } else {
                    appendToOutput(`${i+1}. ${result.text}`);
                }
            }
        }
        
        appendToOutput("---");
    }
    
    // Function to export settings
    function exportSettings() {
        const exportData = {
            settings: state.settings,
            priorityWords: state.priorityWords
        };
        
        const dataStr = JSON.stringify(exportData);
        const dataUri = "data:application/json;charset=utf-8,"+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = "lyric_generator_settings.json";
        
        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
    }
    
    // Function to import settings
    function importSettings() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // Update settings
                    if (importedData.settings) {
                        state.settings = { ...state.settings, ...importedData.settings };
                        
                        // Update UI to reflect imported settings
                        outputCountSlider.value = state.settings.outputCount;
                        outputCountValue.textContent = state.settings.outputCount;
                        
                        creativitySlider.value = state.settings.creativity;
                        creativityValue.textContent = state.settings.creativity;
                        
                        minWordsSlider.value = state.settings.minWords;
                        minWordsValue.textContent = state.settings.minWords;
                        
                        maxWordsSlider.value = state.settings.maxWords;
                        maxWordsValue.textContent = state.settings.maxWords;
                        
                        grammarCheck.checked = state.settings.grammarCheck;
                        showSource.checked = state.settings.showSource;
                        capitalizeCheck.checked = state.settings.capitalize;
                        filterDuplicatesCheck.checked = state.settings.filterDuplicates;
                        addPunctuationCheck.checked = state.settings.addPunctuation;
                    }
                    
                    // Update priority words
                    if (importedData.priorityWords) {
                        // Clear existing priority words
                        state.priorityWords = [];
                        priorityWordsContainer.innerHTML = "";
                        
                        // Add imported priority words
                        importedData.priorityWords.forEach(word => {
                            state.priorityWords.push(word);
                            
                            const wordElement = document.createElement("div");
                            wordElement.className = "priority-word";
                            wordElement.textContent = word;
                            
                            const removeBtn = document.createElement("span");
                            removeBtn.textContent = "×";
                            removeBtn.addEventListener("click", () => {
                                state.priorityWords = state.priorityWords.filter(w => w !== word);
                                wordElement.remove();
                            });
                            
                            wordElement.appendChild(removeBtn);
                            priorityWordsContainer.appendChild(wordElement);
                        });
                    }
                    
                    appendToOutput("Settings imported successfully.");
                } catch (error) {
                    appendToOutput("Error importing settings: " + error.message);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // Initialize the app
    function init() {
        // Embed the default lyrics
        const defaultLyrics = `Oh god!
Sean Don
Fall Out... Boi

Di-di-did you trip down 12 steps into Malibu, ooh, ooh, ooh
(Malibu, ooh, ooh, ooh)
So why the hell is there a light that"s keeping us forever
Bel Air baby, did you get dressed up, pretty pout, pout
(While you bottomed out, out, out, out, oh)
I can"t stop it when there"s chemicals keeping us together
Uh, uh, uh, I"m singing

Whoa, how the mighty fall, the mighty fall, the mighty fall
They fall in love, how the mighty fall, the mighty fall, the mighty fall
Oh, how the mighty fall in love

Your crooked love is just a pyramid scheme and I"m dizzy on dreams
(And I"m dizzy on dreams)
But if you ask me two"s a whole lot lonelier than one
Baby, we should have left our love in the gutter where we found it
(Gutter where we found it)
"Cause you think, you think your only crime is that you got caught
I"m singing

Whoa, how the mighty fall, the mighty fall, the mighty fall
They fall in love, how the mighty fall, the mighty fall, the mighty fall
Oh, how the mighty fall in love`;

        // Predefined titles list
        const titles = ["20","Dollar","Nose","Bleed","7","Minutes","In","Heaven","Church","Sunshine","Riptide","Bishops","Knife","Trick","The","Mighty","Fall","Death","Valley","The","Kids","Arent","Alright","She\"s","My","Winona","The","Takes","Over","The","Breaks","Over","Don\"t","You","Know","Who","I","Think","I","Am","?","The","After","Life","Of","The","Party","Its","Hard","To","Say","I","Do","When","I","Don\"t","Back","To","Earth","Grand","Theft","Autumn","/","Where","Is","Your","Boy","Get","Busy","Living","Or","Get","Busy","Dying","Do","Your","Part","To","Save","The","Scene","and","Stop","Going","To","Shows","Saturday","A","Little","Less","Sixteen","Candles","A","Little","More","Touch","Me","Twin","Skeletons","Hotel","In","NYC","I","Don\"t","Care","Sugar","We\"re","Going","Down","Dance","Dance","My","Songs","Know","What","You","Did","In","The","Dark","Light","Em","Up","Young","Volcanoes","Alone","Together","Centuries","Stay","Frosty","Royal","Milk","Tea","The","Pheonix","Wilson","Expensive","Mistakes","The","Last","Of","The","Real","Ones","Thanks","For","The","Memories","Immortals","Irresistible","Young","And","Menace","Champion","Just","One","Yesterday","This","Ain\"t","A","Scene","It\"s","An","Arms","Race","Where","Did","The","Party","Go","Save","Rock","And","Roll","Fourth","Of","July","Sophomore","Slump","Or","Comeback","Of","The","Year","The","Shipped","Gold","Standard","7","Minutes","In","Heaven","Hum","Hallelujah","Dear", "Future","Self","Hands","Up","XO","27","Run","Dry","Explode","I\"m","Like","A","Lawyer","With","The","Way","I\"m","Always","Trying","To","Get","You","Off","Tell","That","Mick","He","Just","Made","My","List","Of","Things","To","Do","Today","Yule","Shoot","Your","Eye","Out","What","A","Catch","Donnie"];
        
        // Combine lyrics and titles
        state.sources.default.content = defaultLyrics + " " + titles.join(" ");
        
        // Process the default content
        processSourceContent("default");
        
        // Initialize UI
        initUI();
        
        // Initial instructions
        appendToOutput("Welcome to the Lyric & Title Generator!");
        appendToOutput("Select a generation mode and click \"Generate\" to create outputs.");
        appendToOutput("Try uploading your own text files in the Sources tab.");
        appendToOutput("---");
    }
    
    // Start the app
    init();
});
