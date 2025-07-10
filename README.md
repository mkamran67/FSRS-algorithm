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

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
