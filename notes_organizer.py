def divider():
    print("\n" * 2)
    print("=" * 50)
    print("\n" * 2)

# USE THIS RGB FUNCTION FOR COLORING NOTES
def print_rgb(text, r, g, b):
    """Prints text in the specified RGB color."""
    print(f"\033[38;2;{r};{g};{b}m{text}\033[0m")

# get key terms, look for them in notes, print surrounding text and put key terms in color 
# I want to use this to get definitions for key terms quickly

def read_file(file_path):
    """Read a file and return its contents as a string."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return ""

def extract_key_terms(keyterms_content):
    """Extract key terms from the keyterms.txt file."""
    key_terms = []
    for line in keyterms_content.splitlines():
        line = line.strip()
        if line:  # Just check if the line is not empty
            key_terms.append(line)
    return key_terms

def find_term_in_notes(notes_content, term):
    """Find a term in the notes and return the surrounding context."""
    import re
    
    # Create a regex pattern that matches the term, including possible plurals and punctuation
    pattern = r'\b' + re.escape(term.lower()) + r'(?:s|,|\.|:|;)?\b'
    
    # Find all occurrences of the term
    contexts = []
    
    for match in re.finditer(pattern, notes_content.lower()):
        pos = match.start()
        
        # Get context (paragraph containing the term)
        # Find the start of the paragraph
        para_start = notes_content.rfind('\n\n', 0, pos)
        if para_start == -1:
            para_start = 0
        else:
            para_start += 2  # Skip the newlines
            
        # Find the end of the paragraph
        para_end = notes_content.find('\n\n', pos)
        if para_end == -1:
            para_end = len(notes_content)
            
        # Extract the paragraph
        paragraph = notes_content[para_start:para_end].strip()
        
        # Calculate the position of the term within the extracted paragraph
        term_pos_in_para = pos - para_start
        
        contexts.append((paragraph, term_pos_in_para))
    
    return contexts

def highlight_all_terms_in_paragraph(paragraph, key_terms, term_colors):
    """Highlight all key terms in a paragraph with their respective colors."""
    import re
    
    # Create a list of all term occurrences with their positions
    term_occurrences = []
    
    for term, color in zip(key_terms, term_colors):
        # Create a regex pattern that matches the term followed by optional 's', ',', or '.'
        # The word boundary \b ensures we match whole words
        pattern = r'\b' + re.escape(term.lower()) + r'(?:s|,|\.|:|;)?\b'
        
        # Find all matches in the paragraph
        for match in re.finditer(pattern, paragraph.lower()):
            start, end = match.span()
            # Get the actual text as it appears in the original paragraph
            actual_text = paragraph[start:end]
            term_occurrences.append((start, end, actual_text, color))
    
    # Sort occurrences by position
    term_occurrences.sort(key=lambda x: x[0])
    
    # Check for overlapping terms and remove them
    non_overlapping = []
    last_end = -1
    
    for start, end, term, color in term_occurrences:
        if start >= last_end:  # No overlap
            non_overlapping.append((start, end, term, color))
            last_end = end
    
    # Print the paragraph with highlighted terms
    last_pos = 0
    for start, end, term, color in non_overlapping:
        # Print text before the term
        print(paragraph[last_pos:start], end='')
        
        # Print the term in its color
        print_rgb(paragraph[start:end], color[0], color[1], color[2])
        
        last_pos = end
    
    # Print any remaining text
    print(paragraph[last_pos:])
    print()  # Add a newline for readability

def organize_notes_by_key_terms():
    """Main function to organize notes by key terms."""
    # Read the files
    notes_content = read_file("notes.txt")
    keyterms_content = read_file("keyterms.txt")
    
    if not notes_content or not keyterms_content:
        print("Error: Could not read input files.")
        return
    
    # Extract key terms
    key_terms = extract_key_terms(keyterms_content)
    
    if not key_terms:
        print("No key terms found in keyterms.txt")
        return
    
    print(f"Found {len(key_terms)} key terms.")
    divider()
    
    # Define a set of colors for the terms
    colors = [
        (255, 100, 0),    # Orange
        (50, 10, 222),    # Blue
        (150, 255, 150),  # Light Green
        (255, 50, 50),    # Red
        (200, 50, 200),   # Purple
        (50, 200, 200),   # Cyan
        (255, 255, 100),  # Yellow
        (180, 180, 180),  # Gray
        (255, 150, 150),  # Light Red
        (150, 150, 255)   # Light Blue
    ]
    
    # Create a list of term colors (cycling through the colors list)
    term_colors = [colors[i % len(colors)] for i in range(len(key_terms))]
    
    # Create a dictionary to store all contexts for each term
    term_contexts = {}
    
    # Find contexts for each term
    for term in key_terms:
        contexts = find_term_in_notes(notes_content, term)
        if contexts:
            for context in contexts:
                paragraph = context[0]
                if paragraph not in term_contexts:
                    term_contexts[paragraph] = term
                    
    # Print each unique paragraph with all terms highlighted
    for paragraph, primary_term in term_contexts.items():
        print(f"Key Term: {primary_term}")
        print("-" * 40)
        highlight_all_terms_in_paragraph(paragraph, key_terms, term_colors)
        divider()
        
# Run the function
organize_notes_by_key_terms()

