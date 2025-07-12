# FSRS Algorithm TypeScript Implementation

A TypeScript implementation of the Free Spaced Repetition Scheduler (FSRS) algorithm - a modern, evidence-based alternative to traditional spaced repetition algorithms like SM-2.

## Features

- 🎯 **Optimized Algorithm**: Based on the latest research in memory and learning
- 🔧 **Customizable Parameters**: Tune the algorithm to your specific needs
- 📊 **Detailed Scheduling**: Get comprehensive scheduling information for each rating
- 🎮 **Easy Integration**: Simple API for integrating into your applications
- 🧪 **Well Tested**: Comprehensive test suite included
- 📱 **Universal**: Works in Node.js and browsers

## Installation

```bash
npm install fsrs-algorithm
```

## Quick Start

```typescript
import { FSRS, Rating, State } from "fsrs-algorithm";

// Create FSRS instance with default parameters
const fsrs = new FSRS();

// Create a new card
let card = fsrs.createEmptyCard();

// Schedule the card after user rates it as "Good"
const scheduling = fsrs.schedule(card, Rating.Good);

// Get the updated card for the chosen rating
card = scheduling.good.card;

console.log(`Next review: ${card.due}`);
console.log(`Difficulty: ${card.difficulty}`);
console.log(`Stability: ${card.stability}`);
```

## API Reference

### FSRS Class

#### Constructor

```typescript
new FSRS(parameters?: Partial<FSRSParameters>)
```

#### Methods

- `createEmptyCard(now?: Date): Card` - Create a new card
- `schedule(card: Card, rating: Rating, now?: Date): SchedulingCards` - Schedule a card
- `getRetrievability(card: Card, now?: Date): number` - Get card's retrievability
- `updateParameters(parameters: Partial<FSRSParameters>): void` - Update algorithm parameters
- `getParameters(): FSRSParameters` - Get current parameters

### Types

#### Rating

```typescript
enum Rating {
	Again = 1, // Failed recall
	Hard = 2, // Difficult recall
	Good = 3, // Successful recall
	Easy = 4, // Easy recall
}
```

#### State

```typescript
enum State {
	New = 0, // New card
	Learning = 1, // Card being learned
	Review = 2, // Card in review
	Relearning = 3, // Card being relearned after failure
}
```

#### Card

```typescript
interface Card {
	due: Date; // When the card is due for review
	stability: number; // How stable the memory is
	difficulty: number; // How difficult the card is (1-10)
	elapsedDays: number; // Days since last review
	scheduledDays: number; // Days the card was scheduled for
	reps: number; // Total repetitions
	lapses: number; // Number of times failed
	state: State; // Current state
	lastReview?: Date; // Last review date
}
```

## Advanced Usage

### Custom Parameters

```typescript
const fsrs = new FSRS({
	requestRetention: 0.85, // Target retention rate (85%)
	maximumInterval: 36500, // Maximum interval in days
	w: [
		/* 19 custom parameters */
	],
});
```

### Handling Reviews

```typescript
// Get all possible scheduling outcomes
const scheduling = fsrs.schedule(card, rating);

// Choose based on user's performance
if (userRating === Rating.Good) {
	card = scheduling.good.card;

	// Log the review for analytics
	const reviewLog = scheduling.good.reviewLog;
	console.log("Review logged:", reviewLog);
}
```

### Retrievability Tracking

```typescript
// Check how likely the user is to remember
const retrievability = fsrs.getRetrievability(card);
console.log(`Memory strength: ${(retrievability * 100).toFixed(1)}%`);
```

# FSRS Algorithm Explained Simply

Think of FSRS as a **smart study scheduler** that learns how your brain works with each flashcard.

## 🧠 **The Basic Idea**

Imagine you're learning vocabulary words. Some words stick in your memory longer than others, and some words are just naturally harder for you. FSRS tracks both of these factors to predict the perfect time to review each card.

## 🔑 **Key Concepts**

### 1. **Stability** - How sticky is this memory?

- **High stability** = The memory sticks well (like your own name)
- **Low stability** = The memory fades quickly (like a phone number you just heard)
- FSRS calculates how long you can wait before you'll likely forget

### 2. **Difficulty** - How hard is this card for YOU?

- **Easy cards** = Low difficulty (1-3 out of 10)
- **Hard cards** = High difficulty (7-10 out of 10)
- This is personal - what's easy for you might be hard for someone else

### 3. **Retrievability** - How likely are you to remember right now?

- **90%** = Very likely to remember
- **50%** = Coin flip
- **10%** = Probably forgotten

## ⚙️ **How It Works**

### Step 1: You review a card and rate your performance

- **Again** (Failed) - "I forgot this completely"
- **Hard** - "I remembered but it was difficult"
- **Good** - "I remembered it normally"
- **Easy** - "I remembered it effortlessly"

### Step 2: FSRS updates the card's profile

```
If you said "Easy":
→ Difficulty goes DOWN (it's easier for you)
→ Stability goes UP (memory is stronger)
→ Next review is LONGER away

If you said "Again":
→ Difficulty goes UP (it's harder for you)
→ Stability goes DOWN (memory is weaker)
→ Next review is VERY SOON
```

### Step 3: FSRS schedules your next review

The algorithm asks: _"When will this person's memory strength drop to about 90%?"_

That's when you see the card again.

## 📊 **Real Example**

Let's say you're learning the Spanish word "gato" (cat):

**First time seeing it:**

- You rate it "Good"
- FSRS sets: Difficulty = 5, Stability = 3 days
- Next review: 3 days from now

**Second review (3 days later):**

- You rate it "Easy"
- FSRS updates: Difficulty = 4, Stability = 8 days
- Next review: 8 days from now

**Third review (8 days later):**

- You rate it "Again" (you forgot!)
- FSRS updates: Difficulty = 6, Stability = 2 days
- Next review: 2 days from now (back to frequent practice)

## 🆚 **Why FSRS is Better Than Older Systems**

**Old algorithm (SM-2):**

- "If you got it right, wait 2x longer next time"
- Same formula for everyone
- Doesn't consider individual differences

**FSRS:**

- "Let me learn YOUR memory patterns"
- Adapts to your personal strengths/weaknesses
- Uses modern research about how memory actually works

## 🎯 **The Goal**

FSRS tries to show you each card at the **perfect moment**:

- Not too early (waste of time)
- Not too late (you've already forgotten)
- Right when your memory is starting to fade

This maximizes learning while minimizing study time.

## 💡 **In Practice**

When you use an app with FSRS:

1. Study normally, rating each card honestly
2. FSRS silently builds a "memory profile" for each card
3. It gets better at predicting your memory over time
4. You spend less time reviewing and remember more

## License

MIT
