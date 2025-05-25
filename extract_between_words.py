#!/usr/bin/env python3
"""
Extract content between two specified words from a file.

This script reads the content of lotsofcode.txt, finds the text between
the START_WORD and END_WORD, and writes that content to code_output.txt.
"""

# Define the start and end words to search for
START_WORD = "songtitlegen.py" # Change this to your desired start word
END_WORD = "NEXT IDEAS"  # Change this to your desired end word

# Input and output file paths
INPUT_FILE = "songtitlegens_every_version.txt"
OUTPUT_FILE = "songtitlegen_original.txt"

def extract_between_words(start_word, end_word, input_file, output_file):
    """
    Extract text between start_word and end_word from input_file and save to output_file.
    
    Args:
        start_word (str): The word/phrase that marks the beginning of the extraction
        end_word (str): The word/phrase that marks the end of the extraction
        input_file (str): Path to the input file
        output_file (str): Path to the output file
    
    Returns:
        bool: True if extraction was successful, False otherwise
    """
    try:
        # Read the entire file content
        with open(input_file, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Find the positions of the start and end words
        start_pos = content.find(start_word)
        if start_pos == -1:
            print(f"Error: Start word '{start_word}' not found in the file.")
            return False
        
        # Start position is at the beginning of the start_word
        # We can either include or exclude the start_word itself
        # Here we include it by not adjusting start_pos
        
        # Find the end word starting from the position after start_word
        end_pos = content.find(end_word, start_pos + len(start_word))
        if end_pos == -1:
            print(f"Error: End word '{end_word}' not found after the start word.")
            return False
        
        # Extract the text between (and including) the start and end positions
        extracted_text = content[start_pos:end_pos].strip()
        
        # Write the extracted text to the output file
        with open(output_file, 'w', encoding='utf-8') as file:
            file.write(extracted_text)
        
        print(f"Successfully extracted text between '{start_word}' and '{end_word}'")
        print(f"Output saved to '{output_file}'")
        return True
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return False

if __name__ == "__main__":
    extract_between_words(START_WORD, END_WORD, INPUT_FILE, OUTPUT_FILE)
