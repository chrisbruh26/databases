/**
 * Text Styler - A tool for styling text within a specified word range
 * This script allows users to apply styling to a range of words in a text
 * and then copy the styled text for use in other applications.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const textInput = document.getElementById('text-input');
    const startWordInput = document.getElementById('start-word');
    const endWordInput = document.getElementById('end-word');
    const textColorInput = document.getElementById('text-color');
    const fontFamilySelect = document.getElementById('font-family');
    const fontSizeSelect = document.getElementById('font-size');
    const styleBoldCheckbox = document.getElementById('style-bold');
    const styleItalicCheckbox = document.getElementById('style-italic');
    const styleUnderlineCheckbox = document.getElementById('style-underline');
    const styleHighlightCheckbox = document.getElementById('style-highlight');
    const highlightColorInput = document.getElementById('highlight-color');
    const highlightColorRow = document.getElementById('highlight-color-row');
    const applyStyleButton = document.getElementById('apply-style');
    const resetTextButton = document.getElementById('reset-text');
    const textPreview = document.getElementById('text-preview');
    const copyRangeButton = document.getElementById('copy-range');

    // Store the styled content with all applied styles
    let styledContent = null;
    
    // Store styling history to remember styles applied to different parts
    let stylingHistory = [];

    // Event listeners
    textInput.addEventListener('paste', function(e) {
        // Allow paste event to complete
        setTimeout(function() {
            // Preserve formatting when pasting
            preserveFormattedText();
        }, 0);
    });

    // Show/hide highlight color option based on highlight checkbox
    styleHighlightCheckbox.addEventListener('change', function() {
        highlightColorRow.style.display = this.checked ? 'flex' : 'none';
    });

    // Apply styling to the specified word range
    applyStyleButton.addEventListener('click', function() {
        const startWord = startWordInput.value.trim();
        const endWord = endWordInput.value.trim();
        
        if (!textInput.value || !startWord || !endWord) {
            alert('Please enter text and specify both start and end words.');
            return;
        }
        
        applyStyleToWordRange(startWord, endWord);
    });

    // Reset text to original
    resetTextButton.addEventListener('click', function() {
        // Clear styling history
        stylingHistory = [];
        
        // Reset the preview to the original pasted content
        preserveFormattedText();
        
        // Clear the word range inputs
        startWordInput.value = '';
        endWordInput.value = '';
    });

    // Copy the styled text range to clipboard
    copyRangeButton.addEventListener('click', function() {
        const startWord = startWordInput.value.trim();
        const endWord = endWordInput.value.trim();
        
        if (!startWord || !endWord) {
            copyAllStyledText();
            return;
        }
        
        copyStyledRange(startWord, endWord);
    });

    /**
     * Preserve formatting of pasted text
     */
    function preserveFormattedText() {
        // Get the pasted text with formatting
        const pastedText = textInput.value;
        
        // Create a temporary div to hold the pasted content
        const tempDiv = document.createElement('div');
        
        // Set the content
        tempDiv.innerHTML = pastedText;
        
        // Check if there's any HTML formatting in the pasted text
        const hasFormatting = /<\/?[a-z][\s\S]*>/i.test(pastedText);
        
        if (hasFormatting) {
            // If there's HTML formatting, use it directly
            textPreview.innerHTML = pastedText;
        } else {
            // If it's plain text, apply default formatting
            textPreview.textContent = pastedText;
            
            // Apply default font if needed
            textPreview.style.fontFamily = 'Georgia, serif';
        }
        
        // Make the preview editable
        textPreview.setAttribute('contenteditable', 'true');
        
        // Store the initial styled content
        styledContent = textPreview.innerHTML;
    }

    /**
     * Apply styling to text between startWord and endWord
     * @param {string} startWord - The word to start styling from
     * @param {string} endWord - The word to end styling at
     */
    function applyStyleToWordRange(startWord, endWord) {
        // Get the current content of the preview
        const currentContent = textPreview.innerHTML;
        
        // Create a temporary div to work with the HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentContent;
        
        // Get the text content for searching
        const textContent = tempDiv.textContent;
        
        // Find the positions of start and end words
        const startWordRegex = new RegExp(`\\b${escapeRegExp(startWord)}\\b`);
        const endWordRegex = new RegExp(`\\b${escapeRegExp(endWord)}\\b`);
        
        const startMatch = textContent.match(startWordRegex);
        const endMatch = textContent.match(endWordRegex);
        
        if (!startMatch || !endMatch) {
            alert('Could not find one or both of the specified words in the text.');
            return;
        }
        
        // Get the indices of the start and end words in the text content
        const startIndex = textContent.indexOf(startWord, startMatch.index);
        let endIndex = textContent.indexOf(endWord, endMatch.index) + endWord.length;
        
        // Make sure start comes before end
        if (startIndex > endIndex) {
            alert('The start word must appear before the end word in the text.');
            return;
        }
        
        // Create a range to select the text
        const range = document.createRange();
        const selection = window.getSelection();
        
        // Select the text in the preview
        try {
            // Clear any existing selection
            selection.removeAllRanges();
            
            // Find the text nodes that contain our target words
            const nodeInfo = findTextNodesInRange(textPreview, startWord, endWord);
            
            if (!nodeInfo) {
                alert('Could not select the specified word range.');
                return;
            }
            
            // Create a document fragment to hold our styled content
            const fragment = document.createDocumentFragment();
            
            // Create a span with the styling
            const styledSpan = document.createElement('span');
            
            // Apply the selected styles
            styledSpan.style.color = textColorInput.value;
            styledSpan.style.fontFamily = fontFamilySelect.value;
            styledSpan.style.fontSize = fontSizeSelect.value;
            
            if (styleBoldCheckbox.checked) {
                styledSpan.style.fontWeight = 'bold';
            }
            
            if (styleItalicCheckbox.checked) {
                styledSpan.style.fontStyle = 'italic';
            }
            
            if (styleUnderlineCheckbox.checked) {
                styledSpan.style.textDecoration = 'underline';
            }
            
            if (styleHighlightCheckbox.checked) {
                styledSpan.style.backgroundColor = highlightColorInput.value;
            }
            
            // Extract the HTML content for the range
            const rangeContents = extractRangeContent(nodeInfo.startNode, nodeInfo.startOffset, 
                                                     nodeInfo.endNode, nodeInfo.endOffset);
            
            // Set the span content
            styledSpan.innerHTML = rangeContents;
            
            // Replace the selected content with our styled span
            replaceRangeWithNode(nodeInfo.startNode, nodeInfo.startOffset, 
                                nodeInfo.endNode, nodeInfo.endOffset, styledSpan);
            
            // Store the styling in history
            stylingHistory.push({
                startWord: startWord,
                endWord: endWord,
                styles: {
                    color: textColorInput.value,
                    fontFamily: fontFamilySelect.value,
                    fontSize: fontSizeSelect.value,
                    bold: styleBoldCheckbox.checked,
                    italic: styleItalicCheckbox.checked,
                    underline: styleUnderlineCheckbox.checked,
                    highlight: styleHighlightCheckbox.checked,
                    highlightColor: highlightColorInput.value
                }
            });
            
            // Update the styled content
            styledContent = textPreview.innerHTML;
            
            // Add a message about copying
            showCopyMessage();
            
        } catch (e) {
            console.error('Error applying styles:', e);
            alert('An error occurred while applying styles. Please try again with different words.');
        }
    }
    
    /**
     * Find text nodes that contain the start and end words
     * @param {Element} container - The container element to search in
     * @param {string} startWord - The word to start at
     * @param {string} endWord - The word to end at
     * @return {Object|null} Object with start and end nodes and offsets, or null if not found
     */
    function findTextNodesInRange(container, startWord, endWord) {
        const textNodes = [];
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        let startNode = null, endNode = null;
        let startOffset = -1, endOffset = -1;
        
        // Find the start word
        for (let i = 0; i < textNodes.length; i++) {
            const nodeText = textNodes[i].nodeValue;
            const wordIndex = nodeText.indexOf(startWord);
            
            if (wordIndex !== -1) {
                startNode = textNodes[i];
                startOffset = wordIndex;
                break;
            }
        }
        
        // Find the end word
        for (let i = 0; i < textNodes.length; i++) {
            const nodeText = textNodes[i].nodeValue;
            const wordIndex = nodeText.indexOf(endWord);
            
            if (wordIndex !== -1) {
                endNode = textNodes[i];
                endOffset = wordIndex + endWord.length;
                break;
            }
        }
        
        if (startNode && endNode) {
            return {
                startNode: startNode,
                startOffset: startOffset,
                endNode: endNode,
                endOffset: endOffset
            };
        }
        
        return null;
    }
    
    /**
     * Extract HTML content between two points in the DOM
     * @param {Node} startNode - The node to start at
     * @param {number} startOffset - The offset in the start node
     * @param {Node} endNode - The node to end at
     * @param {number} endOffset - The offset in the end node
     * @return {string} The HTML content between the points
     */
    function extractRangeContent(startNode, startOffset, endNode, endOffset) {
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        
        const fragment = range.cloneContents();
        const div = document.createElement('div');
        div.appendChild(fragment);
        
        return div.innerHTML;
    }
    
    /**
     * Replace content between two points in the DOM with a new node
     * @param {Node} startNode - The node to start at
     * @param {number} startOffset - The offset in the start node
     * @param {Node} endNode - The node to end at
     * @param {number} endOffset - The offset in the end node
     * @param {Node} newNode - The node to insert
     */
    function replaceRangeWithNode(startNode, startOffset, endNode, endOffset, newNode) {
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        
        range.deleteContents();
        range.insertNode(newNode);
    }
    
    /**
     * Copy all styled text to clipboard
     */
    function copyAllStyledText() {
        // Create a temporary textarea
        const textarea = document.createElement('textarea');
        textarea.value = textPreview.innerHTML;
        document.body.appendChild(textarea);
        
        // Select and copy
        textarea.select();
        document.execCommand('copy');
        
        // Remove the textarea
        document.body.removeChild(textarea);
        
        // Show success message
        alert('All styled text copied to clipboard!');
    }
    
    /**
     * Copy styled text within a specific range to clipboard
     * @param {string} startWord - The word to start copying from
     * @param {string} endWord - The word to end copying at
     */
    function copyStyledRange(startWord, endWord) {
        // Get the current content
        const content = textPreview.innerHTML;
        
        // Create a temporary div to work with the content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // Get the text content for searching
        const textContent = tempDiv.textContent;
        
        // Find the positions of start and end words
        const startWordRegex = new RegExp(`\\b${escapeRegExp(startWord)}\\b`);
        const endWordRegex = new RegExp(`\\b${escapeRegExp(endWord)}\\b`);
        
        const startMatch = textContent.match(startWordRegex);
        const endMatch = textContent.match(endWordRegex);
        
        if (!startMatch || !endMatch) {
            alert('Could not find one or both of the specified words in the text.');
            return;
        }
        
        try {
            // Find the text nodes that contain our target words
            const nodeInfo = findTextNodesInRange(textPreview, startWord, endWord);
            
            if (!nodeInfo) {
                alert('Could not select the specified word range.');
                return;
            }
            
            // Extract the HTML content for the range
            const rangeContents = extractRangeContent(nodeInfo.startNode, nodeInfo.startOffset, 
                                                     nodeInfo.endNode, nodeInfo.endOffset);
            
            // Copy the HTML to clipboard
            copyHtmlToClipboard(rangeContents);
            
            // Show success message
            alert('Selected range copied to clipboard!');
            
        } catch (e) {
            console.error('Error copying range:', e);
            alert('An error occurred while copying the range. Please try again.');
        }
    }
    
    /**
     * Copy HTML content to clipboard
     * @param {string} html - The HTML content to copy
     */
    function copyHtmlToClipboard(html) {
        // Create a temporary div
        const container = document.createElement('div');
        container.innerHTML = html;
        container.style.position = 'fixed';
        container.style.pointerEvents = 'none';
        container.style.opacity = '0';
        document.body.appendChild(container);
        
        // Select the content
        window.getSelection().removeAllRanges();
        const range = document.createRange();
        range.selectNode(container);
        window.getSelection().addRange(range);
        
        // Copy
        document.execCommand('copy');
        
        // Clean up
        window.getSelection().removeAllRanges();
        document.body.removeChild(container);
    }
    
    /**
     * Show a message about copying the styled text
     */
    function showCopyMessage() {
        // Add a message about copying
        const copyMessage = document.createElement('p');
        copyMessage.textContent = 'Styling applied! Use the "Copy Range" button to copy the styled text.';
        copyMessage.style.color = '#3498db';
        copyMessage.style.marginTop = '10px';
        copyMessage.style.fontStyle = 'italic';
        
        // Remove any existing message before adding a new one
        const existingMessage = textPreview.nextElementSibling;
        if (existingMessage && existingMessage.tagName === 'P') {
            existingMessage.remove();
        }
        
        textPreview.parentNode.insertBefore(copyMessage, textPreview.nextSibling);
    }

    /**
     * Escape special characters in a string for use in a regular expression
     * @param {string} string - The string to escape
     * @return {string} The escaped string
     */
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabName = button.getAttribute('data-tab');
            document.getElementById(tabName).classList.add('active');
        });
    });
});
