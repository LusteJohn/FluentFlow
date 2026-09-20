export const SEED_GRAMMAR_TRIVIA = [
  // ============================================================
  // NOUNS
  // ============================================================
  {
    trivia_id: 1,
    category: "Parts of Speech",
    topic: "Nouns",
    scenario: "At the airport, a gate agent points to the departure screen.",
    example_sentence: "The plane departs from gate 12.",
    usage_note:
      "Nouns are naming words for people, places, things, or ideas. \"Plane\" and \"gate\" are common nouns naming an object and a place.",
    pros:
      "Nouns let you refer to people, places, and things precisely, so listeners know exactly what you mean.",
    cons:
      "Repeating the same noun again and again (\"The plane landed. The plane taxied. The plane stopped.\") sounds stiff - pronouns exist to fix this.",
  },
  {
    trivia_id: 2,
    category: "Parts of Speech",
    topic: "Nouns",
    scenario: "Introducing your family to a new coworker.",
    example_sentence: "My sister works as a nurse in Manila.",
    usage_note:
      "\"Manila\" is a proper noun naming one specific place, while \"sister\" and \"nurse\" are common nouns naming a general role or relationship.",
    pros:
      "Distinguishing proper nouns from common nouns tells the listener whether you mean something unique or something general.",
    cons:
      "Forgetting to capitalize a proper noun (writing \"manila\" instead of \"Manila\") is a common error that blurs this distinction in writing.",
  },
  {
    trivia_id: 3,
    category: "Parts of Speech",
    topic: "Nouns",
    scenario: "Waiting in a long line at a coffee shop.",
    example_sentence: "I really need some patience today.",
    usage_note:
      "\"Patience\" is an abstract noun - it names a quality or idea rather than something you can physically touch.",
    pros:
      "Abstract nouns let you talk about feelings, qualities, and ideas precisely, without needing a whole sentence to explain them.",
    cons:
      "Because abstract nouns aren't physical objects, they're usually uncountable - saying \"many patiences\" is a common mistake; \"a lot of patience\" is correct.",
  },

  // ============================================================
  // PRONOUNS
  // ============================================================
  {
    trivia_id: 4,
    category: "Parts of Speech",
    topic: "Pronouns",
    scenario: "Telling a friend what everyone ordered at dinner.",
    example_sentence: "She ordered a salad, and I had the soup.",
    usage_note:
      "\"She\" and \"I\" are subject pronouns that stand in for names already known, so you don't have to keep repeating them.",
    pros:
      "Pronouns make conversation flow naturally instead of sounding repetitive and robotic.",
    cons:
      "An unclear antecedent - like \"She told her she'd call her\" - leaves the listener guessing who each pronoun actually refers to.",
  },
  {
    trivia_id: 5,
    category: "Parts of Speech",
    topic: "Pronouns",
    scenario: "Sorting out bags at the end of a shopping trip.",
    example_sentence: "This bag is mine, not yours.",
    usage_note:
      "\"Mine\" and \"yours\" are possessive pronouns - they replace a noun entirely, unlike possessive adjectives (\"my bag\", \"your bag\") which sit in front of a noun.",
    pros:
      "Possessive pronouns let you avoid repeating the noun: \"This bag is mine\" is shorter than \"This is my bag, not your bag.\"",
    cons:
      "Learners often mix the two forms up, saying \"This is mine bag\" - possessive pronouns should never be followed directly by a noun.",
  },
  {
    trivia_id: 6,
    category: "Parts of Speech",
    topic: "Pronouns",
    scenario: "Describing trying on a jacket in a fitting room.",
    example_sentence: "I looked at myself in the mirror.",
    usage_note:
      "\"Myself\" is a reflexive pronoun - it refers back to the subject of the sentence, showing the action was done to the speaker.",
    pros:
      "Reflexive pronouns make it clear an action was done to oneself rather than to someone else.",
    cons:
      "Adding a reflexive pronoun where it isn't needed (\"I myself think that...\") is grammatically fine but can sound overly emphatic or informal in careful writing.",
  },

  // ============================================================
  // VERBS
  // ============================================================
  {
    trivia_id: 7,
    category: "Parts of Speech",
    topic: "Verbs",
    scenario: "Talking about a classmate's evening routine.",
    example_sentence: "She studies every night.",
    usage_note:
      "\"Studies\" is the main verb - it shows the action. In the present simple, third-person subjects (he/she/it) take an -s ending.",
    pros:
      "No sentence can exist without a verb - it's the part that actually says what's happening.",
    cons:
      "Forgetting subject-verb agreement (\"She study\" instead of \"She studies\") is one of the most common grammar mistakes learners make.",
  },
  {
    trivia_id: 8,
    category: "Parts of Speech",
    topic: "Verbs",
    scenario: "Getting ready to order at a restaurant.",
    example_sentence: "I would like to order now.",
    usage_note:
      "\"Would\" is a modal verb paired with the main verb \"order\" - it softens the request, making it sound polite instead of blunt.",
    pros:
      "Modal verbs let you express politeness, possibility, or necessity without needing extra explanatory words.",
    cons:
      "Reaching for a strong modal like \"must\" in a casual request (\"You must give me a table\") can sound demanding rather than polite.",
  },
  {
    trivia_id: 9,
    category: "Parts of Speech",
    topic: "Verbs",
    scenario: "Commenting on dinner cooking on the stove at home.",
    example_sentence: "The soup smells delicious.",
    usage_note:
      "\"Smells\" here is a linking verb - it connects the subject to a description rather than showing a physical action being performed.",
    pros:
      "Linking verbs let you describe a state or quality directly, without needing a separate action verb.",
    cons:
      "Learners sometimes wrongly add -ing to linking verbs describing a general state (\"The soup is smelling delicious\" instead of \"The soup smells delicious\").",
  },

  // ============================================================
  // ADJECTIVES
  // ============================================================
  {
    trivia_id: 10,
    category: "Parts of Speech",
    topic: "Adjectives",
    scenario: "Describing your drink to a friend at a coffee shop.",
    example_sentence: "This latte is rich and creamy.",
    usage_note:
      "\"Rich\" and \"creamy\" are adjectives - they describe qualities of the noun \"latte.\"",
    pros:
      "Adjectives add vivid, precise detail to descriptions that a bare noun alone can't provide.",
    cons:
      "English has a specific order for stacked adjectives, so \"creamy rich latte\" sounds off - the natural order is \"rich, creamy latte.\"",
  },
  {
    trivia_id: 11,
    category: "Parts of Speech",
    topic: "Adjectives",
    scenario: "Comparing two woven baskets at a market stall.",
    example_sentence: "This basket is sturdier than that one.",
    usage_note:
      "\"Sturdier\" is a comparative adjective, used to compare exactly two things.",
    pros:
      "Comparative adjectives let you make a direct comparison in just one word, without a longer explanation.",
    cons:
      "A common mistake is doubling the comparison (\"more sturdier\") - a word should only be made comparative one way, not both.",
  },
  {
    trivia_id: 12,
    category: "Parts of Speech",
    topic: "Adjectives",
    scenario: "Chatting about the staff at your favorite coffee shop.",
    example_sentence: "The barista is very friendly.",
    usage_note:
      "\"Friendly\" is an adjective describing a personality trait, connected to the subject by the linking verb \"is.\"",
    pros:
      "Personality adjectives help paint a picture of someone's character, not just their appearance.",
    cons:
      "Adjectives are sometimes confused with adverbs that look similar (\"friendly\" ends in -ly but is an adjective, not an adverb) - a frequent source of mix-ups.",
  },

  // ============================================================
  // ADVERBS
  // ============================================================
  {
    trivia_id: 13,
    category: "Parts of Speech",
    topic: "Adverbs",
    scenario: "Describing a family member's morning routine at home.",
    example_sentence: "She wakes up early every day.",
    usage_note:
      "\"Early\" is an adverb modifying the verb \"wakes up,\" describing when the action happens.",
    pros:
      "Adverbs add detail about time, manner, or frequency without needing a whole extra clause.",
    cons:
      "Misplacing an adverb (\"She wakes early up\") disrupts the natural word order that English speakers expect.",
  },
  {
    trivia_id: 14,
    category: "Parts of Speech",
    topic: "Adverbs",
    scenario: "Talking about a friend's shopping habits.",
    example_sentence: "He rarely buys expensive clothes.",
    usage_note:
      "\"Rarely\" is an adverb of frequency, typically placed before the main verb.",
    pros:
      "Adverbs of frequency let you convey exactly how often something happens in a single word.",
    cons:
      "Because their position differs from other adverbs, learners often misplace them after the verb (\"He buys rarely expensive clothes\").",
  },
  {
    trivia_id: 15,
    category: "Parts of Speech",
    topic: "Adverbs",
    scenario: "Giving your opinion about the service at a restaurant.",
    example_sentence: "The waiter served us quickly.",
    usage_note:
      "\"Quickly\" is an adverb of manner modifying the verb \"served,\" describing how the action was done.",
    pros:
      "Adverbs of manner make actions more vivid and specific than the verb alone.",
    cons:
      "Forgetting the -ly ending when forming an adverb from an adjective (\"He served us quick\" instead of \"quickly\") is a frequent slip.",
  },

  // ============================================================
  // PREPOSITIONS
  // ============================================================
  {
    trivia_id: 16,
    category: "Parts of Speech",
    topic: "Prepositions",
    scenario: "Looking for the TV remote somewhere in the living room.",
    example_sentence: "The remote is on the table.",
    usage_note:
      "\"On\" is a preposition of place, showing the spatial relationship between the remote and the table.",
    pros:
      "A single small preposition can pin down a location precisely, without a longer description.",
    cons:
      "Because there's no single universal rule for in/on/at, learners often misuse them (\"in the table\" instead of \"on the table\").",
  },
  {
    trivia_id: 17,
    category: "Parts of Speech",
    topic: "Prepositions",
    scenario: "Giving a fellow shopper directions through a busy market.",
    example_sentence: "Walk past the fruit stall.",
    usage_note:
      "\"Past\" is a preposition of movement, showing direction relative to the fruit stall.",
    pros:
      "Prepositions of movement let you give directions economically, in just one word.",
    cons:
      "Movement prepositions like \"through,\" \"past,\" and \"across\" overlap in meaning, so learners often pick the wrong one.",
  },
  {
    trivia_id: 18,
    category: "Parts of Speech",
    topic: "Prepositions",
    scenario: "Checking the time and day of an upcoming exam at school.",
    example_sentence: "The exam is at 9 AM on Monday.",
    usage_note:
      "\"At\" is used for clock times and \"on\" for days - prepositions of time follow fairly fixed patterns.",
    pros:
      "Time prepositions let you state a schedule precisely and unambiguously.",
    cons:
      "Mixing up at/on/in for time (\"at Monday\" instead of \"on Monday\") is one of the most commonly memorized - and misused - areas for learners.",
  },

  // ============================================================
  // CONJUNCTIONS
  // ============================================================
  {
    trivia_id: 19,
    category: "Parts of Speech",
    topic: "Conjunctions",
    scenario: "Explaining why you liked a dish at a restaurant.",
    example_sentence: "I like this dish because it's fresh.",
    usage_note:
      "\"Because\" is a subordinating conjunction that introduces a reason clause, connecting it to the main clause.",
    pros:
      "Conjunctions let you combine two related ideas into one clear sentence instead of choppy fragments.",
    cons:
      "Starting a sentence with \"Because\" alone and never finishing the main clause (\"Because it's fresh.\") is a common but often-flagged error in formal writing.",
  },
  {
    trivia_id: 20,
    category: "Parts of Speech",
    topic: "Conjunctions",
    scenario: "Describing the steps of ordering a meal at a restaurant.",
    example_sentence: "First we ordered drinks, then we chose our food.",
    usage_note:
      "\"Then\" links two related actions in the order they happened, guiding the listener through a sequence.",
    pros:
      "Sequencing words make a multi-step process easy to follow without confusion.",
    cons:
      "Overusing \"and then... and then...\" repeatedly makes writing sound childish instead of varying the connecting words.",
  },
  {
    trivia_id: 21,
    category: "Parts of Speech",
    topic: "Conjunctions",
    scenario: "Comparing two stalls at a busy market.",
    example_sentence: "This stall is cheaper, but the quality is lower.",
    usage_note:
      "\"But\" is a coordinating conjunction that signals a contrast between two independent clauses.",
    pros:
      "\"But\" concisely signals contrast in one word, without needing a whole new sentence.",
    cons:
      "Forgetting the comma before \"but\" when joining two independent clauses is a frequent punctuation mistake.",
  },

  // ============================================================
  // INTERJECTIONS
  // ============================================================
  {
    trivia_id: 22,
    category: "Parts of Speech",
    topic: "Interjections",
    scenario: "Tasting a drink for the first time at a coffee shop.",
    example_sentence: "Wow, this coffee is amazing!",
    usage_note:
      "\"Wow\" is an interjection - a word that expresses sudden emotion and stands outside the sentence's normal grammar.",
    pros:
      "Interjections add natural emotional color to speech that a plain statement can't capture.",
    cons:
      "Overusing interjections in formal writing (essays, reports) makes the tone too casual for the context.",
  },
  {
    trivia_id: 23,
    category: "Parts of Speech",
    topic: "Interjections",
    scenario: "Accidentally touching a hot pan while cooking at home.",
    example_sentence: "Ouch! I burned my hand.",
    usage_note:
      "\"Ouch\" expresses a sudden reaction, usually followed by a full sentence explaining what happened.",
    pros:
      "Interjections communicate an instant reaction faster than constructing a full sentence would.",
    cons:
      "Learners sometimes treat interjections as if they were regular verbs (\"I ouch\"), misusing their grammatical role.",
  },
  {
    trivia_id: 24,
    category: "Parts of Speech",
    topic: "Interjections",
    scenario: "Realizing you left your homework at home before class.",
    example_sentence: "Oh no, I forgot my homework!",
    usage_note:
      "\"Oh no\" is an interjection expressing dismay, placed before the clause that explains the situation.",
    pros:
      "Interjections help convey tone and emotion quickly in spoken English.",
    cons:
      "In formal written English, interjections are rare and often avoided, so overusing them can make writing seem unprofessional.",
  },
];