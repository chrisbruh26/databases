from textblob import TextBlob
import random

# Read the content of the file
with open('lyrics.txt', 'r') as file:
    text = file.read()

# Convert all words in the text to lowercase
text = text.lower()
text = text.replace("\n", " ")
text = text.replace(",", "")

# Split the text into a list of words
lyrics = text.split()

# Combine the titles list with the list of words from the text
titles = ['20','Dollar','Nose','Bleed','7','Minutes','In','Heaven','Church','Sunshine','Riptide','Bishops','Knife','Trick','The','Mighty','Fall','Death','Valley','The','Kids','Arent','Alright','She\'s','My','Winona','The','Takes','Over','The','Breaks','Over','Don\'t','You','Know','Who','I','Think','I','Am','?','The','After','Life','Of','The','Party','Its','Hard','To','Say','I','Do','When','I ','Don\'t','Back','To','Earth','Grand','Theft','Autumn','/','Where','Is','Your','Boy','Get','Busy','Living','Or','Get','Busy','Dying','Do','Your','Part','To','Save','The','Scene','and','Stop','Going','To','Shows','Saturday','A','Little','Less','Sixteen','Candles','A','Little','More','Touch','Me','Twin','Skeletons','Hotel','In','NYC','I','Don\'t','Care','Sugar','We\'re','Going','Down','Dance','Dance','My','Songs','Know','What','You','Did','In','The','Dark','Light','Em','Up','Young','Volcanoes','Alone','Together','Centuries','Stay','Frosty','Royal','Milk','Tea','The','Pheonix','Wilson','Expensive','Mistakes','The','Last','Of','The','Real','Ones','Thanks','For','The','Memories','Immortals','Irresistible','Young','And','Menace','Champion','Just','One','Yesterday','This','Ain\'t','A','Scene','It\'s','An','Arms','Race','Where','Did','The','Party','Go','Save','Rock','And','Roll','Fourth','Of','July','Sophomore','Slump','Or','Comeback','Of','The','Year','The','Shipped','Gold','Standard','7','Minutes','In','Heaven','Hum','Hallelujah','Dear', 'Future','Self','Hands','Up','XO','27','Run','Dry','Explode','I\'m','Like','A','Lawyer','With','The','Way','I\'m','Always','Trying','To','Get','You','Off','Tell','That','Mick','He','Just','Made','My','List','Of','Things','To','Do','Today','Yule','Shoot','Your','Eye','Out','What','A','Catch','Donnie']
FOB = titles + lyrics

# Join the combined list into a single string
FOB_string = ' '.join(FOB)

# Create a TextBlob object
blob = TextBlob(FOB_string)

# Initialize lists for different parts of speech
nouns = []
verbs = []
adjectives = []
adverbs = []
pronouns = []
prepositions = []
conjunctions = []
others = []
articles = []
object_pronouns = [] # NOT USED YET - pronouns to start a sentence with, trying to see if this one will work with blobs
subject_pronouns = [] # NOT USED YET 
# actually this may need to be done manually but that's fine - organize as usual, then manually remove and append "we", "us", and "them"

# Custom dictionary for manual tags
custom_tags = {
    "DNA": "NN",         # Noun
    "TNA": "NN",         # Noun
    "dick": "NN",
    "workin'": "VB",     # Verb (informal form)
    "fuckin'": "VB",     # Verb (informal form) - I specifically wanted to add this word, will need to do custom ones manually in the future but that's fine 
    "see-through": "JJ", # Adjective

    # maybe create a tag for words that I want to have a higher priority when being chosen, and increase the chances of putting one of those words in the title

    # Add more custom tags as needed
}

# Categorize words based on their parts of speech
for word, pos in blob.tags: 
    pos = custom_tags.get(word, pos)  # Use custom tags if available
    if pos.startswith('NN'):
        nouns.append(word)
    elif pos.startswith('VB'):
        verbs.append(word)
    elif pos.startswith('JJ'):
        adjectives.append(word)
    elif pos.startswith('RB'):
        adverbs.append(word)
    elif pos == 'PRP':
        pronouns.append(word)
    elif pos == 'IN':
        prepositions.append(word)
    elif pos == 'CC':
        conjunctions.append(word)
    elif pos == 'DT':  # Articles are often tagged as determiners (DT)
        articles.append(word)    
    else:
        others.append(word)


#def move_specific_word(): # function to move specific words
# I can use others.remove('bel') and others.remove('air)
# and then nouns.append('bel air') 
# and repeat for other words as needed
# 
# 
def move_specific_words():
    if 'll' in others and 'i' in adjectives:
        others.remove('ll')
        adjectives.remove('i')
        pronouns.append("I'll")
        print(pronouns)


    pronouns.remove('malibu') # if I already know the category then I don't need the if statement 
    
    # trying to separate pronouns into different categories so that the title will start with the right form
    # only start with ones like "we" and never "us"
    # need to create a new category for words I think, if blobs will handle it 


# Function to remove duplicates from lists
def remove_duplicates():
    def remove_duplicates_list(word_list):
        lowercase_list = [word.lower() for word in word_list]
        seen = set()
        unique_list = []
        for word in lowercase_list:
            if word not in seen:
                unique_list.append(word)
                seen.add(word)
        return unique_list

    global articles, pronouns, verbs, nouns, adjectives, adverbs, prepositions, conjunctions, others
    articles = remove_duplicates_list(articles)
    pronouns = remove_duplicates_list(pronouns)
    verbs = remove_duplicates_list(verbs)
    nouns = remove_duplicates_list(nouns)
    adjectives = remove_duplicates_list(adjectives)
    adverbs = remove_duplicates_list(adverbs)
    prepositions = remove_duplicates_list(prepositions)
    conjunctions = remove_duplicates_list(conjunctions)
    others = remove_duplicates_list(others)



# Call the function to remove duplicates



def random_title(): 
    
    def true_random():

  
        a = random.choice(FOB) + " " + random.choice(FOB)
        b = random.choice(FOB)
        c = random.choice(FOB)
        d = random.choice(FOB)
        e = random.choice(FOB)
        

        
        fobcombo1 = ((a) + " " + (b))
        fobcombo2 = ((b) + " " + (c))
        fobcombo3 = ((c) + " " + (d))
        fobcombo4 = ((d) + " " + (e))
        fobcombo5 = ((b) + " " + (a))
        fobcombo6 = ((c) + " " + (d))
        fobcombo7 = ((e) + " " + (d))

        fobcombos = [fobcombo1, fobcombo2, fobcombo3, fobcombo4, fobcombo5, fobcombo6, fobcombo7]        
    
            
        fobcombo = random.choice(fobcombos)
        print(fobcombo)

    def random_rules_mode1():

    # BASE FUNCTION FOR RANDOM CHOICE - ARTICLE, ADJECTIVE, NOUN

        word1 = random.choice(articles + adjectives + nouns) # chooses either an article, adjective, or noun
        if word1 in articles: # if the first word is an article
            word2 = random.choice(nouns + adjectives) # then choose either a noun or adjective 
            if word2 in adjectives: # if the second word is an adjective 
                word3 = random.choice(nouns) # then the third word has to be a noun 
            elif word2 in nouns: 
                word3 = random.choice(nouns) # putting two nouns next to each other might not make sense but simpler for now  
        elif word1 in adjectives:
            word2 = random.choice(nouns)
            word3 = random.choice(verbs) # THREE VERBS IN A ROW MAKES SENSE - "live laugh love" or the unhinged
        elif word1 in nouns:              # version - "shoot love swallow"
            word2 = random.choice(verbs)
            word3 = random.choice(adjectives)    

        else:               # NEED TO ADD: elif word1 is adjective or noun   
            word2 = random.choice(nouns) # if the first word is not an article, word 2 is a noun
            word3 = random.choice(verbs) # word 3 is a verb, etc 

        fobcombo = ' '.join([word1, word2, word3])

 
        fobcombo = fobcombo.replace(",", "")
        print(fobcombo)
    
    def random_rules_mode2(): # PRONOUNS AND VERBS - might wanna make more complicated if/then statements to randomly land on different sentence structures
        word1 = random.choice(pronouns)
        word2 = random.choice(verbs)
        word3 = random.choice(prepositions)
        word4 = random.choice(articles)
        word5 = random.choice(nouns)
        
        
        fobcombo = ' '.join([word1, word2, word3, word4, word5])
        print(fobcombo)


    while True:
        mode = input("Options: \n 0. true random \n 1: mode 1 \n 2. mode 2\n Which mode? ")
        if mode=="true random" in mode or mode=="0":
            for i in range(10):
                true_random()

        elif mode=="mode 1" or mode=="1":
            for i in range(10):
                random_rules_mode1()
    
        elif mode=="mode 2" or mode=="2":
            for i in range(10):
                random_rules_mode2()  



def testing_blobnouns(): # get phrases with nouns in them 
    nounphrases = blob.noun_phrases
    randomphrase = random.choice(nounphrases)
    print(randomphrase)




def find_words(): # search for words 
    for word, tag in blob.tags:
        if "ai" in word:
            print(f"The part of speech of '{word}' is: {tag}")


random_title()
