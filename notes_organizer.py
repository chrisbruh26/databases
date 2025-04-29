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
    except FileNotFoundError:
        # Create the file if it doesn't exist
        if file_path in ["definitions.txt", "keyterms.txt"]:
            try:
                with open(file_path, 'w', encoding='utf-8') as file:
                    pass  # Create empty file
                print(f"Created new file: {file_path}")
                return ""
            except Exception as e:
                print(f"Error creating file {file_path}: {e}")
                return ""
        else:
            print(f"File not found: {file_path}")
            return ""
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return ""

def extract_key_terms(keyterms_content, definitions_content=None):
    """
    Extract key terms from the keyterms.txt file and definitions from definitions.txt.
    
    Format for keyterms.txt:
    - One term per line
    - Term#Category (optional)
    
    Format for definitions.txt:
    - Term:Definition
    - Term:Definition:AdditionalInfo1:AdditionalInfo2...
    """
    key_terms = []
    term_definitions = {}
    term_categories = {}
    term_additional_info = {}
    
    # Process keyterms.txt for terms and categories
    for line in keyterms_content.splitlines():
        line = line.strip()
        if not line:  # Skip empty lines
            continue
            
        # Check for category
        category = None
        if '#' in line:
            line, category = line.split('#', 1)
            category = category.strip()
            
        term = line.strip()
            
        if term:
            key_terms.append(term)
            if category:
                term_categories[term] = category
    
    # Process definitions.txt for definitions and additional info
    if definitions_content:
        for line in definitions_content.splitlines():
            line = line.strip()
            if not line or ':' not in line:  # Skip lines without definitions
                continue
                
            parts = line.split(':')
            if len(parts) >= 2:
                term = parts[0].strip()
                definition = parts[1].strip()
                
                if term and definition:
                    term_definitions[term] = definition
                    
                    # Extract additional information if available
                    if len(parts) > 2:
                        additional_info = [info.strip() for info in parts[2:] if info.strip()]
                        if additional_info:
                            term_additional_info[term] = additional_info
    
    return key_terms, term_definitions, term_categories, term_additional_info

def find_term_in_notes(notes_content, term):
    """Find a term in the notes and return the surrounding context with intelligent extraction."""
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
        
        # Check if this is a definition-like context
        is_definition = False
        
        # Look for definition patterns
        definition_patterns = [
            r'\b' + re.escape(term.lower()) + r'\s+(?:is|are|refers to|describes|means|defined as)',
            r'\b' + re.escape(term.lower()) + r'(?:s|es)?\s*:\s*\w+',
            r'(?:called|known as|termed)\s+(?:a|an|the)?\s*' + re.escape(term.lower()),
            r'(?:definition|meaning) of\s+(?:a|an|the)?\s*' + re.escape(term.lower())
        ]
        
        for pattern in definition_patterns:
            if re.search(pattern, paragraph.lower()):
                is_definition = True
                break
        
        # Look for function/purpose patterns
        function_patterns = [
            r'\b' + re.escape(term.lower()) + r'(?:s|es)?\s+(?:function|role|purpose|helps|helps to|serves to|allows|enables)',
            r'(?:function|role|purpose) of\s+(?:a|an|the)?\s*' + re.escape(term.lower()),
            r'\b' + re.escape(term.lower()) + r'(?:s|es)?\s+(?:is|are) responsible for'
        ]
        
        is_function = False
        for pattern in function_patterns:
            if re.search(pattern, paragraph.lower()):
                is_function = True
                break
        
        # Look for relationship patterns
        relationship_patterns = [
            r'\b' + re.escape(term.lower()) + r'(?:s|es)?\s+(?:connects|connects to|relates to|interacts with|part of)',
            r'(?:connected|related) to\s+(?:a|an|the)?\s*' + re.escape(term.lower()),
            r'\b' + re.escape(term.lower()) + r'(?:s|es)?\s+(?:contains|includes|consists of)'
        ]
        
        is_relationship = False
        for pattern in relationship_patterns:
            if re.search(pattern, paragraph.lower()):
                is_relationship = True
                break
        
        # Add context with metadata
        contexts.append({
            'text': paragraph,
            'position': term_pos_in_para,
            'is_definition': is_definition,
            'is_function': is_function,
            'is_relationship': is_relationship,
            'relevance_score': sum([is_definition * 3, is_function * 2, is_relationship * 1])
        })
    
    # Sort contexts by relevance score (higher is better)
    contexts.sort(key=lambda x: x['relevance_score'], reverse=True)
    
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
    definitions_content = read_file("definitions.txt")
    
    if not notes_content:
        print("Error: Could not read notes.txt file.")
        return
    
    if not keyterms_content:
        print("Error: No terms found in keyterms.txt")
        return
    
    # Extract key terms and their metadata
    all_key_terms, term_definitions, term_categories, term_additional_info = extract_key_terms(keyterms_content, definitions_content)
    
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
                term_contexts[term].append(context)
    
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
                
            # Print additional information if available
            if term in term_additional_info:
                print("\nAdditional Information:")
                for i, info in enumerate(term_additional_info[term], 1):
                    print(f"  {i}. {info}")
            
            print("-" * 40)
            
            # Print each context for this term, sorted by relevance
            for i, context in enumerate(term_contexts[term]):
                paragraph = context['text']
                
                # Add context type labels
                context_type = []
                if context['is_definition']:
                    context_type.append("Definition")
                if context['is_function']:
                    context_type.append("Function/Purpose")
                if context['is_relationship']:
                    context_type.append("Relationship")
                
                context_header = f" Context {i+1} "
                if context_type:
                    context_header += f"({', '.join(context_type)}) "
                
                if i > 0:
                    print("\n" + "-" * 20 + context_header + "-" * 20)
                else:
                    print(context_header + "-" * 20)
                
                highlight_all_terms_in_paragraph(paragraph, key_terms, term_colors)
            
            divider()

def add_term():
    """Add a new term to keyterms.txt and definitions.txt."""
    term = input("Enter the term: ").strip()
    if not term:
        print("Term cannot be empty.")
        return
        
    definition = input("Enter definition (optional): ").strip()
    additional_info = []
    
    if definition:
        # Allow adding multiple pieces of additional information
        print("\nYou can add additional information about this term.")
        print("This could include functions, relationships to other terms, examples, etc.")
        print("Enter each piece of information separately, or leave blank to finish.")
        
        while True:
            info = input("Additional information (leave empty to finish): ").strip()
            if not info:
                break
            additional_info.append(info)
    
    category = input("Enter category (optional): ").strip()
    
    # Add term to keyterms.txt (with category only)
    term_entry = term
    if category:
        term_entry += f"#{category}"
    
    # Add definition and additional info to definitions.txt
    if definition:
        def_entry = f"{term}:{definition}"
        if additional_info:
            for info in additional_info:
                def_entry += f":{info}"
    
    # Write to files
    try:
        # Add to keyterms.txt
        with open("keyterms.txt", 'a', encoding='utf-8') as file:
            file.write(f"\n{term_entry}")
        
        # Add to definitions.txt if there's a definition
        if definition:
            with open("definitions.txt", 'a', encoding='utf-8') as file:
                file.write(f"\n{def_entry}")
        
        print(f"Term '{term}' added successfully!")
    except Exception as e:
        print(f"Error adding term: {e}")

def update_term():
    """Update an existing term in keyterms.txt and definitions.txt."""
    # Read the current terms and definitions
    keyterms_content = read_file("keyterms.txt")
    definitions_content = read_file("definitions.txt")
    
    if not keyterms_content:
        print("Error: Could not read keyterms.txt")
        return
        
    # Extract terms and their metadata
    all_terms, term_definitions, term_categories, term_additional_info = extract_key_terms(keyterms_content, definitions_content)
    
    if not all_terms:
        print("No terms found in keyterms.txt")
        return
    
    # Display available terms
    print("Available terms:")
    terms_per_row = 3
    for i in range(0, len(all_terms), terms_per_row):
        row_terms = all_terms[i:i+terms_per_row]
        print("  ".join(f"{term:<20}" for term in row_terms))
    
    # Ask which term to update
    term_to_update = input("\nEnter the term to update: ").strip()
    if not term_to_update:
        print("No term specified.")
        return
    
    # Find the closest match if exact match not found
    if term_to_update not in all_terms:
        matches = [t for t in all_terms if term_to_update.lower() in t.lower()]
        if matches:
            print(f"Exact match not found. Did you mean one of these?")
            for i, match in enumerate(matches, 1):
                print(f"  {i}. {match}")
            try:
                choice = int(input("\nSelect a term (number) or 0 to cancel: "))
                if 1 <= choice <= len(matches):
                    term_to_update = matches[choice-1]
                else:
                    print("Operation cancelled.")
                    return
            except ValueError:
                print("Invalid input. Operation cancelled.")
                return
        else:
            print(f"No term found containing '{term_to_update}'.")
            return
    
    # Show current information
    current_definition = term_definitions.get(term_to_update, "")
    current_category = term_categories.get(term_to_update, "")
    current_additional_info = term_additional_info.get(term_to_update, [])
    
    print(f"\nUpdating term: {term_to_update}")
    if current_definition:
        print(f"Current definition: {current_definition}")
    if current_additional_info:
        print("Current additional information:")
        for i, info in enumerate(current_additional_info, 1):
            print(f"  {i}. {info}")
    if current_category:
        print(f"Current category: {current_category}")
    
    # Get new values
    new_definition = input(f"Enter new definition (leave empty to {'keep current' if current_definition else 'skip'}): ").strip()
    
    # Handle additional information
    new_additional_info = []
    if current_additional_info or new_definition:
        print("\nYou can update additional information about this term.")
        print("This could include functions, relationships to other terms, examples, etc.")
        
        if current_additional_info:
            keep_current = input("Keep current additional information? (y/n): ").strip().lower()
            if keep_current == 'y':
                new_additional_info = current_additional_info.copy()
        
        if not new_additional_info or input("Add more information? (y/n): ").strip().lower() == 'y':
            print("Enter each piece of information separately, or leave blank to finish.")
            while True:
                info = input("Additional information (leave empty to finish): ").strip()
                if not info:
                    break
                new_additional_info.append(info)
    
    new_category = input(f"Enter new category (leave empty to {'keep current' if current_category else 'skip'}): ").strip()
    
    # Use current values if new ones are not provided
    if not new_definition and current_definition:
        new_definition = current_definition
    if not new_category and current_category:
        new_category = current_category
    
    # Update keyterms.txt (term and category)
    try:
        with open("keyterms.txt", 'r', encoding='utf-8') as file:
            keyterm_lines = file.readlines()
        
        # Find and update the term in keyterms.txt
        keyterm_updated = False
        for i, line in enumerate(keyterm_lines):
            line = line.strip()
            if not line:
                continue
                
            # Parse the line to extract the term
            parsed_line = line
            if '#' in parsed_line:
                parsed_line = parsed_line.split('#', 1)[0]
            
            term = parsed_line.strip()
            
            if term == term_to_update:
                # Construct the updated line
                updated_line = term_to_update
                if new_category:
                    updated_line += f"#{new_category}"
                
                keyterm_lines[i] = updated_line + '\n'
                keyterm_updated = True
                break
        
        if keyterm_updated:
            # Write the updated content back to keyterms.txt
            with open("keyterms.txt", 'w', encoding='utf-8') as file:
                file.writelines(keyterm_lines)
        else:
            print(f"Could not find term '{term_to_update}' in keyterms.txt. This is unexpected.")
            return
            
        # Update definitions.txt if there's a definition
        if new_definition:
            with open("definitions.txt", 'r', encoding='utf-8') as file:
                def_lines = file.readlines()
            
            # Find if the term already exists in definitions.txt
            def_updated = False
            for i, line in enumerate(def_lines):
                line = line.strip()
                if not line or ':' not in line:
                    continue
                
                parts = line.split(':', 1)
                term = parts[0].strip()
                
                if term == term_to_update:
                    # Construct the updated definition line
                    updated_line = f"{term_to_update}:{new_definition}"
                    for info in new_additional_info:
                        updated_line += f":{info}"
                    
                    def_lines[i] = updated_line + '\n'
                    def_updated = True
                    break
            
            # If term not found in definitions.txt, append it
            if not def_updated:
                new_line = f"{term_to_update}:{new_definition}"
                for info in new_additional_info:
                    new_line += f":{info}"
                def_lines.append(new_line + '\n')
            
            # Write the updated content back to definitions.txt
            with open("definitions.txt", 'w', encoding='utf-8') as file:
                file.writelines(def_lines)
        
        print(f"Term '{term_to_update}' updated successfully!")
            
    except Exception as e:
        print(f"Error updating term: {e}")

def quiz_mode(num_questions=5):
    """Quiz the user on random terms."""
    import random
    
    # Read keyterms and definitions files
    keyterms_content = read_file("keyterms.txt")
    definitions_content = read_file("definitions.txt")
    
    if not keyterms_content:
        print("Error: Could not read keyterms.txt")
        return
        
    # Extract terms and definitions
    all_terms, term_definitions, term_categories, term_additional_info = extract_key_terms(keyterms_content, definitions_content)
    
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
        
        # If there's a category, give a hint
        if term in term_categories:
            print(f"Hint: This term is in the category '{term_categories[term]}'")
            
        input("Press Enter when ready to see the answer...")
        
        # Show the definition
        print(f"Definition: {term_definitions[term]}")
        
        # Show additional information if available
        if term in term_additional_info:
            print("\nAdditional Information:")
            for j, info in enumerate(term_additional_info[term], 1):
                print(f"  {j}. {info}")
        
        # Ask if they got it right
        got_it = input("\nDid you know this? (y/n/partial): ").strip().lower()
        if got_it == 'y':
            correct += 1
        elif got_it == 'partial':
            correct += 0.5
            
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
        
    # Offer to review missed terms
    if correct < num_questions:
        review = input("\nWould you like to review the terms you missed? (y/n): ").strip().lower()
        if review == 'y':
            print("\n=== REVIEW ===\n")
            for term in quiz_terms:
                print(f"Term: {term}")
                if term in term_categories:
                    print(f"Category: {term_categories[term]}")
                print(f"Definition: {term_definitions[term]}")
                if term in term_additional_info:
                    print("Additional Information:")
                    for info in term_additional_info[term]:
                        print(f"  - {info}")
                print()
                input("Press Enter to continue...")
                print()

def study_session():
    """Run a focused study session."""
    # Read keyterms and definitions files
    keyterms_content = read_file("keyterms.txt")
    definitions_content = read_file("definitions.txt")
    
    if not keyterms_content:
        print("Error: Could not read keyterms.txt")
        return
        
    # Extract terms and categories
    all_terms, term_definitions, term_categories, term_additional_info = extract_key_terms(keyterms_content, definitions_content)
    
    print("\n=== STUDY SESSION ===")
    print("Study options:")
    print("  1. Study by category")
    print("  2. Study terms with definitions")
    print("  3. Study terms with additional information")
    print("  4. Study terms that appear most in notes")
    
    try:
        option = int(input("\nSelect an option (1-4): "))
        
        if option == 1:
            # Get all categories
            categories = sorted(set(term_categories.values()))
            
            if not categories:
                print("No categories found. Add categories to your terms first.")
                return
            
            print("\nAvailable categories:")
            
            for i, category in enumerate(categories, 1):
                # Count terms in this category
                count = len([t for t in all_terms if t in term_categories and term_categories[t] == category])
                print(f"  {i}. {category} ({count} terms)")
            
            choice = int(input("\nSelect a category (number): "))
            if 1 <= choice <= len(categories):
                selected_category = categories[choice-1]
                print(f"\nStudying category: {selected_category}")
                organize_notes_by_key_terms(filter_category=selected_category)
            else:
                print("Invalid selection.")
                
        elif option == 2:
            # Study terms with definitions
            terms_with_defs = [t for t in all_terms if t in term_definitions]
            
            if not terms_with_defs:
                print("No terms with definitions found. Add definitions to your terms first.")
                return
                
            print(f"\nFound {len(terms_with_defs)} terms with definitions.")
            organize_notes_by_key_terms(filter_terms=terms_with_defs)
            
        elif option == 3:
            # Study terms with additional information
            terms_with_info = [t for t in all_terms if t in term_additional_info]
            
            if not terms_with_info:
                print("No terms with additional information found.")
                return
                
            print(f"\nFound {len(terms_with_info)} terms with additional information.")
            organize_notes_by_key_terms(filter_terms=terms_with_info)
            
        elif option == 4:
            # Study terms that appear most in notes
            notes_content = read_file("notes.txt")
            if not notes_content:
                print("Error: Could not read notes.txt")
                return
                
            # Count occurrences of each term
            term_counts = {}
            for term in all_terms:
                contexts = find_term_in_notes(notes_content, term)
                term_counts[term] = len(contexts)
            
            # Sort terms by occurrence count (descending)
            sorted_terms = sorted(term_counts.items(), key=lambda x: x[1], reverse=True)
            
            # Display top terms
            print("\nTerms by frequency in notes:")
            for i, (term, count) in enumerate(sorted_terms[:10], 1):
                print(f"  {i}. {term} ({count} occurrences)")
                
            # Ask how many top terms to study
            try:
                num = int(input("\nHow many top terms to study? (default: 5): ") or "5")
                top_terms = [term for term, _ in sorted_terms[:num]]
                organize_notes_by_key_terms(filter_terms=top_terms)
            except ValueError:
                print("Invalid input. Using default of 5 terms.")
                top_terms = [term for term, _ in sorted_terms[:5]]
                organize_notes_by_key_terms(filter_terms=top_terms)
        else:
            print("Invalid option.")
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
    print("  5. Update existing term")
    print("  6. Quiz mode")
    print("  7. Study session by category")
    print("  8. Exit")
    
    while True:
        choice = input("\nEnter your choice (1-8): ").strip()
        
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
            update_term()
        elif choice == '6':
            try:
                num = int(input("How many questions? (default: 5): ") or "5")
                quiz_mode(num)
            except ValueError:
                print("Please enter a valid number. Using default of 5 questions.")
                quiz_mode(5)
        elif choice == '7':
            study_session()
        elif choice == '8':
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
    parser.add_argument("-u", "--update", action="store_true", help="Update an existing term")
    
    args = parser.parse_args()
    
    if args.add:
        add_term()
    elif args.update:
        update_term()
    elif args.quiz:
        quiz_mode(args.quiz)
    elif args.terms or args.category:
        organize_notes_by_key_terms(filter_terms=args.terms, filter_category=args.category)
    else:
        # Run in interactive mode if no specific arguments
        interactive_mode()

