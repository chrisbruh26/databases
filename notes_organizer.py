def divider():
    print("\n" * 2)
    print("=" * 50)
    print("\n" * 2)

# USE THIS RGB FUNCTION FOR COLORING NOTES
def print_rgb(text, r, g, b):
    """Prints text in the specified RGB color."""
    print(f"\033[38;2;{r};{g};{b}m{text}\033[0m", end='')

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
    """
    Extract key terms from the keyterms.txt file.
    
    Format can be:
    - One term per line
    - Term:Definition (optional)
    - Term#Category (optional)
    - Term:Definition#Category (optional)
    """
    key_terms = []
    term_definitions = {}
    term_categories = {}
    
    for line in keyterms_content.splitlines():
        line = line.strip()
        if not line:  # Skip empty lines
            continue
            
        # Check for category
        category = None
        if '#' in line:
            line, category = line.split('#', 1)
            category = category.strip()
            
        # Check for definition
        definition = None
        if ':' in line:
            term, definition = line.split(':', 1)
            term = term.strip()
            definition = definition.strip()
        else:
            term = line.strip()
            
        if term:
            key_terms.append(term)
            if definition:
                term_definitions[term] = definition
            if category:
                term_categories[term] = category
    
    return key_terms, term_definitions, term_categories

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
    
    # Add a newline after the entire paragraph for readability
    print()

def organize_notes_by_key_terms(filter_terms=None, filter_category=None, show_term_list=True):
    """
    Main function to organize notes by key terms.
    
    Args:
        filter_terms: Optional list of specific terms to filter by
        filter_category: Optional category to filter by
        show_term_list: Whether to show the list of terms at the beginning
    """
    # Read the files
    notes_content = read_file("notes.txt")
    keyterms_content = read_file("keyterms.txt")
    
    if not notes_content or not keyterms_content:
        print("Error: Could not read input files.")
        return
    
    # Extract key terms and their metadata
    all_key_terms, term_definitions, term_categories = extract_key_terms(keyterms_content)
    
    if not all_key_terms:
        print("No key terms found in keyterms.txt")
        return
    
    # Filter terms if specified
    filtered_terms = all_key_terms.copy()
    
    # Filter by category if specified
    if filter_category:
        filtered_terms = [term for term in filtered_terms 
                         if term in term_categories and filter_category.lower() in term_categories[term].lower()]
    
    # Filter by term content if specified
    if filter_terms:
        filtered_terms = [term for term in filtered_terms 
                         if any(filter_term.lower() in term.lower() for filter_term in filter_terms)]
    
    if not filtered_terms:
        print(f"No terms found matching your filters.")
        if filter_terms:
            print(f"Term filters: {', '.join(filter_terms)}")
        if filter_category:
            print(f"Category filter: {filter_category}")
            
        # Show available categories
        categories = set(term_categories.values())
        if categories:
            print(f"\nAvailable categories: {', '.join(sorted(categories))}")
            
        print(f"\nAvailable terms: {', '.join(all_key_terms[:10])}{'...' if len(all_key_terms) > 10 else ''}")
        return
    
    key_terms = filtered_terms
    
    if show_term_list:
        # Group terms by category
        terms_by_category = {}
        uncategorized_terms = []
        
        for term in key_terms:
            if term in term_categories:
                category = term_categories[term]
                if category not in terms_by_category:
                    terms_by_category[category] = []
                terms_by_category[category].append(term)
            else:
                uncategorized_terms.append(term)
        
        print(f"Found {len(key_terms)} key terms:")
        
        # Print terms by category
        if terms_by_category:
            for category, terms in sorted(terms_by_category.items()):
                print(f"\n{category}:")
                # Print terms in columns
                terms_per_row = 3
                for i in range(0, len(terms), terms_per_row):
                    row_terms = terms[i:i+terms_per_row]
                    print("  ".join(f"{term:<20}" for term in row_terms))
        
        # Print uncategorized terms
        if uncategorized_terms:
            if terms_by_category:  # Only print this header if we have categories
                print("\nUncategorized:")
            # Print terms in columns
            terms_per_row = 3
            for i in range(0, len(uncategorized_terms), terms_per_row):
                row_terms = uncategorized_terms[i:i+terms_per_row]
                print("  ".join(f"{term:<20}" for term in row_terms))
    
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
            if term not in term_contexts:
                term_contexts[term] = []
            for context in contexts:
                paragraph = context[0]
                term_contexts[term].append(paragraph)
    
    # Print contexts organized by term
    for term in key_terms:
        if term in term_contexts and term_contexts[term]:
            print(f"Key Term: {term}")
            
            # Print category if available
            if term in term_categories:
                print(f"Category: {term_categories[term]}")
                
            # Print definition if available
            if term in term_definitions:
                print(f"Definition: {term_definitions[term]}")
                
            print("-" * 40)
            
            # Print each context for this term
            for i, paragraph in enumerate(term_contexts[term]):
                if i > 0:
                    print("\n" + "-" * 20 + f" Context {i+1} " + "-" * 20)
                highlight_all_terms_in_paragraph(paragraph, key_terms, term_colors)
            
            divider()

def add_term():
    """Add a new term to keyterms.txt."""
    term = input("Enter the term: ").strip()
    if not term:
        print("Term cannot be empty.")
        return
        
    definition = input("Enter definition (optional): ").strip()
    category = input("Enter category (optional): ").strip()
    
    # Format the new term entry
    new_entry = term
    if definition:
        new_entry += f": {definition}"
    if category:
        new_entry += f"#{category}"
    
    # Append to keyterms.txt
    try:
        with open("keyterms.txt", 'a', encoding='utf-8') as file:
            file.write(f"\n{new_entry}")
        print(f"Term '{term}' added successfully!")
    except Exception as e:
        print(f"Error adding term: {e}")

def quiz_mode(num_questions=5):
    """Quiz the user on random terms."""
    import random
    
    # Read keyterms file
    keyterms_content = read_file("keyterms.txt")
    if not keyterms_content:
        print("Error: Could not read keyterms.txt")
        return
        
    # Extract terms and definitions
    all_terms, term_definitions, term_categories = extract_key_terms(keyterms_content)
    
    # Filter to terms that have definitions
    terms_with_defs = [term for term in all_terms if term in term_definitions]
    
    if not terms_with_defs:
        print("No terms with definitions found. Add definitions to your terms first.")
        return
        
    # Limit number of questions to available terms
    num_questions = min(num_questions, len(terms_with_defs))
    
    # Randomly select terms for the quiz
    quiz_terms = random.sample(terms_with_defs, num_questions)
    
    print(f"\n=== QUIZ MODE: {num_questions} Questions ===\n")
    correct = 0
    
    for i, term in enumerate(quiz_terms, 1):
        print(f"Question {i}: Define '{term}'")
        input("Press Enter when ready to see the answer...")
        
        # Show the definition
        print(f"Definition: {term_definitions[term]}")
        
        # Ask if they got it right
        got_it = input("Did you know this? (y/n): ").strip().lower()
        if got_it == 'y':
            correct += 1
            
        print()  # Add spacing between questions
    
    # Show results
    score = (correct / num_questions) * 100
    print(f"\nQuiz complete! Your score: {correct}/{num_questions} ({score:.1f}%)")
    
    if score >= 90:
        print("Excellent! You've mastered these terms.")
    elif score >= 70:
        print("Good job! Keep reviewing to improve further.")
    else:
        print("Keep studying! Try reviewing the terms again.")

def study_session():
    """Run a focused study session."""
    # Read keyterms file
    keyterms_content = read_file("keyterms.txt")
    if not keyterms_content:
        print("Error: Could not read keyterms.txt")
        return
        
    # Extract terms and categories
    all_terms, term_definitions, term_categories = extract_key_terms(keyterms_content)
    
    # Get all categories
    categories = sorted(set(term_categories.values()))
    
    if not categories:
        print("No categories found. Add categories to your terms first.")
        return
    
    print("\n=== STUDY SESSION ===")
    print("Available categories:")
    
    for i, category in enumerate(categories, 1):
        print(f"  {i}. {category}")
    
    try:
        choice = int(input("\nSelect a category (number): "))
        if 1 <= choice <= len(categories):
            selected_category = categories[choice-1]
            print(f"\nStudying category: {selected_category}")
            organize_notes_by_key_terms(filter_category=selected_category)
        else:
            print("Invalid selection.")
    except ValueError:
        print("Please enter a valid number.")

def interactive_mode():
    """Run the notes organizer in interactive mode."""
    import sys
    
    print("Notes Organizer - Interactive Mode")
    print("=" * 40)
    print("Options:")
    print("  1. Show all terms and contexts")
    print("  2. Filter by specific terms")
    print("  3. Filter by category")
    print("  4. Add new term")
    print("  5. Quiz mode")
    print("  6. Study session by category")
    print("  7. Exit")
    
    while True:
        choice = input("\nEnter your choice (1-7): ").strip()
        
        if choice == '1':
            organize_notes_by_key_terms()
        elif choice == '2':
            filter_input = input("Enter terms to filter by (comma-separated): ").strip()
            if filter_input:
                filter_terms = [term.strip() for term in filter_input.split(',')]
                organize_notes_by_key_terms(filter_terms=filter_terms)
        elif choice == '3':
            category = input("Enter category to filter by: ").strip()
            if category:
                organize_notes_by_key_terms(filter_category=category)
        elif choice == '4':
            add_term()
        elif choice == '5':
            try:
                num = int(input("How many questions? (default: 5): ") or "5")
                quiz_mode(num)
            except ValueError:
                print("Please enter a valid number. Using default of 5 questions.")
                quiz_mode(5)
        elif choice == '6':
            study_session()
        elif choice == '7':
            print("Exiting...")
            sys.exit(0)
        else:
            print("Invalid choice. Please try again.")

# Check if running with command line arguments
if __name__ == "__main__":
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description="Notes Organizer - A study tool")
    parser.add_argument("-t", "--terms", nargs="+", help="Filter by specific terms")
    parser.add_argument("-c", "--category", help="Filter by category")
    parser.add_argument("-q", "--quiz", type=int, help="Run quiz mode with specified number of questions")
    parser.add_argument("-a", "--add", action="store_true", help="Add a new term")
    
    args = parser.parse_args()
    
    if args.add:
        add_term()
    elif args.quiz:
        quiz_mode(args.quiz)
    elif args.terms or args.category:
        organize_notes_by_key_terms(filter_terms=args.terms, filter_category=args.category)
    else:
        # Run in interactive mode if no specific arguments
        interactive_mode()

