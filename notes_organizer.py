import colorama
def prRed(skk): print("\033[91m {}\033[00m" .format(skk))


def prGreen(skk): print("\033[92m {}\033[00m" .format(skk))


def prYellow(skk): print("\033[93m {}\033[00m" .format(skk))


def prLightPurple(skk): print("\033[94m {}\033[00m" .format(skk))


def prPurple(skk): print("\033[95m {}\033[00m" .format(skk))


def prCyan(skk): print("\033[96m {}\033[00m" .format(skk))


def prLightGray(skk): print("\033[97m {}\033[00m" .format(skk))


def prBlack(skk): print("\033[98m {}\033[00m" .format(skk))

def prMagenta(skk): print("\033[95m {}\033[00m" .format(skk))


def divider():
    print("\n" * 2)
    print("=" * 50)
    print("\n" * 2)



divider()




prCyan("This")
prYellow("Is")
prGreen("A")
prRed("Test")
prGreen("For")
prCyan("Colorama")
prMagenta("This should be magenta")


divider()



# USE THIS RGB FUNCTION FOR COLORING NOTES
def print_rgb(text, r, g, b):
    """Prints text in the specified RGB color."""
    print(f"\033[38;2;{r};{g};{b}m{text}\033[0m")

# Example usage
print_rgb("This is a different test!", 255, 100, 0) # Orange-ish color
print_rgb("Using RGB", 50, 10, 222) # Blue color
print_rgb("Sucessful!", 150, 255, 150) #Light Green color

divider()


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
        if line and ':' in line:
            term = line.split(':', 1)[0].strip()
            if term:
                key_terms.append(term)
    return key_terms

def find_term_in_notes(notes_content, term):
    """Find a term in the notes and return the surrounding context."""
    term_lower = term.lower()
    notes_lower = notes_content.lower()
    
    # Find all occurrences of the term
    contexts = []
    start_pos = 0
    
    while True:
        pos = notes_lower.find(term_lower, start_pos)
        if pos == -1:
            break
            
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
        start_pos = pos + len(term)
    
    return contexts

def highlight_term_in_context(context, term, r, g, b):
    """Highlight the term in the context with the specified RGB color."""
    paragraph, term_pos = context
    term_len = len(term)
    
    # Print the text before the term
    print(paragraph[:term_pos], end='')
    
    # Print the term in color
    print_rgb(paragraph[term_pos:term_pos+term_len], r, g, b)
    
    # Print the text after the term
    print(paragraph[term_pos+term_len:])
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
    
    # Find and highlight each term in the notes
    for i, term in enumerate(key_terms):
        # Select a color for this term (cycle through the colors)
        color = colors[i % len(colors)]
        
        # Find the term in the notes
        contexts = find_term_in_notes(notes_content, term)
        
        if contexts:
            print(f"Key Term: {term}")
            print("-" * 40)
            
            for context in contexts:
                highlight_term_in_context(context, term, color[0], color[1], color[2])
            
            divider()
        
# Run the function
organize_notes_by_key_terms()

