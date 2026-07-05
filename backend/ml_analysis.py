# =========================================
# Keyword Definitions
# =========================================

NEGATIVE_WORDS = [
    "sad", "angry", "afraid", "depressed", "failure",
    "tired", "lonely", "scared", "anxious", "worried",
    "stressed", "failed", "disappointed", "exhausted",
    "drained", "confused", "tense", "nervous",
    "heart started beating fast"
]

POSITIVE_WORDS = [
    "happy", "confident", "excited", "calm", "proud",
    "successful", "achieved", "won", "relaxed", "satisfied"
]

ACTION_WORDS = [
    "plan", "create", "schedule", "prepare", "practice",
    "studying", "work hard", "improve", "improving",
    "started", "following", "decided", "focus",
    "meet", "discuss", "solve", "adapt", "confront"
]

REFLECTION_WORDS = [
    "think", "thinking", "reflect", "consider",
    "pause", "think again", "stop and think"
]

AVOIDANT_WORDS = [
    "avoid", "ignore", "give up and stop",
    "quit", "do nothing", "stopped trying",
    "stop trying", "wait and see", "on their own"
]

AMBIVALENT_WORDS = [
    "not sure", "unsure", "dont know if", "don’t know if",
    "no energy", "not enough energy",
    "unsure of myself", "want to but", "although i want"
]

HELPLESS_WORDS = [
    "nothing matters", "no way", "useless",
    "impossible", "pointless",
    "dont know what else i can do",
    "don’t know what else i can do"
]


# =========================================
# Classification Function
# =========================================

def classify_from_input(text: str):
    t = text.lower()

    # -------- Emotional Tone --------
    if any(w in t for w in NEGATIVE_WORDS):
        emotional_tone = "negative"
    elif any(w in t for w in POSITIVE_WORDS):
        emotional_tone = "positive"
    else:
        emotional_tone = "neutral"

    # -------- Coping Style (PRIORITY ORDER) --------
    if any(w in t for w in AVOIDANT_WORDS):
        coping_style = "avoidant"
    elif any(w in t for w in ACTION_WORDS):
        coping_style = "problem-focused"
    elif any(w in t for w in AMBIVALENT_WORDS):
        coping_style = "emotion-focused"
    elif any(w in t for w in REFLECTION_WORDS):
        coping_style = "emotion-focused"
    else:
        coping_style = "emotion-focused"

    # -------- Hope Level --------
    if any(w in t for w in HELPLESS_WORDS):
        hope_level = "helpless"
    elif coping_style == "avoidant":
        hope_level = "helpless"
    elif any(w in t for w in AMBIVALENT_WORDS):
        hope_level = "neutral"
    elif coping_style == "problem-focused":
        hope_level = "hopeful"
    elif emotional_tone == "positive":
        hope_level = "hopeful"
    elif emotional_tone == "negative":
        hope_level = "neutral"
    else:
        hope_level = "neutral"

    # -------- Conflict Resolution --------
    if coping_style == "problem-focused":
        conflict_resolution = "active"
    elif coping_style == "avoidant":
        conflict_resolution = "passive"
    elif emotional_tone == "negative":
        conflict_resolution = "passive"
    else:
        conflict_resolution = "neutral"

    return emotional_tone, coping_style, hope_level, conflict_resolution


# =========================================
# Summary Generator
# =========================================

def generate_summary(emotional_tone, coping_style, hope_level, conflict_resolution):
    summary = []

    if emotional_tone == "negative":
        summary.append("The individual is experiencing emotional distress.")
    elif emotional_tone == "positive":
        summary.append("The individual shows a positive and emotionally stable state.")
    else:
        summary.append("The individual shows an emotionally neutral state.")

    if coping_style == "problem-focused":
        summary.append("They are actively addressing the situation through planning or action.")
    elif coping_style == "avoidant":
        summary.append("They are withdrawing from action and avoiding direct engagement.")
    else:
        summary.append("They are processing the situation internally without taking direct action.")

    if hope_level == "hopeful":
        summary.append("There is optimism toward future improvement.")
    elif hope_level == "helpless":
        summary.append("The outlook reflects pessimism and a lack of perceived control.")
    else:
        summary.append("The outlook remains uncertain and ambivalent.")

    if conflict_resolution == "active":
        summary.append("Conflicts are approached with an intention to resolve them.")
    elif conflict_resolution == "passive":
        summary.append("Conflicts are handled passively without direct resolution.")
    else:
        summary.append("There is no clear conflict resolution strategy at this stage.")

    return " ".join(summary)


# =========================================
# Run Example
# =========================================

if __name__ == "__main__":
    story = input("Enter story: ")

    et, cs, hl, cr = classify_from_input(story)
    summary = generate_summary(et, cs, hl, cr)

    print("\nANALYSIS RESULT")
    print("Emotional Tone:", et)
    print("Coping Style:", cs)
    print("Hope Level:", hl)
    print("Conflict Resolution:", cr)
    print("\nSummary:")
    print(summary)
