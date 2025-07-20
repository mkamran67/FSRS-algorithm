# FSRS - Free Spaced Repetition Scheduler

A TypeScript/JavaScript implementation of the FSRS (Free Spaced Repetition Scheduler) algorithm for optimizing memory retention through spaced repetition learning.

## What is FSRS?

FSRS is a modern spaced repetition algorithm that schedules review sessions for flashcards or learning materials based on memory research. It dynamically adjusts review intervals based on your performance, helping you learn more efficiently by showing difficult cards more frequently and easy cards less often.

## Features

- 🧠 **Scientific Algorithm**: Based on memory research and forgetting curves
- ⚙️ **Configurable Parameters**: Customize the algorithm for your learning style
- 📊 **Difficulty Tracking**: Automatically adjusts card difficulty based on performance
- 🔄 **State Management**: Handles different learning states (New, Learning, Review, Relearning)
- 📈 **Retrievability Calculation**: Track memory strength over time
- 🎯 **Retention Optimization**: Optimize for your target retention rate

## Installation

```bash
npm install fsrs-algorithm
# or
yarn add fsrs-algorithm
```

## Quick Start

```typescript
import { FSRS, Rating, State } from "fsrs-algorithm";

// Initialize FSRS with default parameters
const fsrs = new FSRS();

// Create a new card
const card = fsrs.createEmptyCard();

// Schedule the card based on your rating
const now = new Date();
const schedulingOptions = fsrs.schedule(card, now);

// Rate your performance (1=Again, 2=Hard, 3=Good, 4=Easy)
const yourRating = Rating.Good;
const scheduledCard = schedulingOptions.good.card;
const reviewLog = schedulingOptions.good.reviewLog;

console.log(`Next review: ${scheduledCard.due}`);
console.log(`Interval: ${scheduledCard.scheduledDays} days`);
```

## API Reference

### Constructor

```typescript
const fsrs = new FSRS(parameters?: Partial<FSRSParameters>);
```

**Parameters:**

- `requestRetention` (default: 0.9): Target retention rate (0.0-1.0)
- `maximumInterval` (default: 3650): Maximum review interval in days
- `w`: Array of 19 algorithm weights (uses optimized defaults)

### Methods

#### `createEmptyCard(now?: Date): Card`

Creates a new flashcard ready for learning.

```typescript
const card = fsrs.createEmptyCard();
```

#### `schedule(card: Card, now?: Date): SchedulingCards`

Returns scheduling options for all possible ratings.

```typescript
const options = fsrs.schedule(card, new Date());

// Access different rating outcomes
const againOption = options.again; // Rating.Again (1)
const hardOption = options.hard; // Rating.Hard (2)
const goodOption = options.good; // Rating.Good (3)
const easyOption = options.easy; // Rating.Easy (4)
```

#### `getRetrievability(card: Card, now?: Date): number`

Calculate the current probability of successfully recalling the card (0.0-1.0).

```typescript
const retrievability = fsrs.getRetrievability(card);
console.log(`${Math.round(retrievability * 100)}% chance of recall`);
```

#### `updateParameters(newParameters: Partial<FSRSParameters>): void`

Update algorithm parameters.

```typescript
fsrs.updateParameters({
	requestRetention: 0.85, // Target 85% retention
	maximumInterval: 1825, // Max 5 years
});
```

## Data Types

### Card

```typescript
interface Card {
	due: Date; // When to review next
	stability: number; // Memory strength
	difficulty: number; // Card difficulty (1-10)
	elapsedDays: number; // Days since last review
	scheduledDays: number; // Scheduled interval
	reps: number; // Total reviews
	lapses: number; // Number of times forgotten
	state: State; // Current learning state
	lastReview?: Date; // Last review date
}
```

### Rating

```typescript
enum Rating {
	Again = 1, // Forgot the card
	Hard = 2, // Remembered with difficulty
	Good = 3, // Remembered easily
	Easy = 4, // Too easy
}
```

### State

```typescript
enum State {
	New = 0, // Never studied
	Learning = 1, // First time learning
	Review = 2, // Regular review
	Relearning = 3, // Relearning after forgetting
}
```

## Usage Examples

### Pseudocode flow

```

// 1. You'd create an empty card for new cards -- structure as below

interface Card {
	due: Date; // When to show this card next
	stability: number; // How "sticky" the memory is
	difficulty: number; // How hard this card is (1-10)
	elapsedDays: number; // Days since last review
	scheduledDays: number; // How long it was scheduled for
	reps: number; // Total times reviewed
	lapses: number; // Times you failed/forgot
	state: State; // New/Learning/Review/Relearning
	lastReview?: Date; // When you last saw it
}

cosnt today = new Date();
const newCard = fsrs.createEmptyCard(today); // new empty card

// 2. get hypothetical outcomes for empty card -- structure is below
export interface SchedulingInfo {
	card: Card;
	reviewLog: ReviewLog;
}

export interface SchedulingCards {
	again: SchedulingInfo;
	hard: SchedulingInfo;
	good: SchedulingInfo;
	easy: SchedulingInfo;
}

const cardPossibilities = fsrs.schedule(newCard, today); // this would return SchedulingCards

// 3. Show user possibilities
// 4. On user selection save new selection in database/cache for next iteration.
// 	ReviewLog is for historical data on specific card to view overall history.
// 5. On next "study" session you would pull these cards
// 	and get hypothetical outcomes per card show them and repeat the steps, as below.

// Note the different method, this takes an object like below, converts/validates and returns possible outcomes like the 'schedule' method.

const reviewCard: RawCardData = {
					id: "cmdauwe2l0001vexwplv74vjf",
					userId: "5NANdkHyQ1p0riBtDeHPOfdRwdv7y1DM",
					cardId: "cmd4fgv3f0001veq4loisxygg",
					due: "2025-07-25T22:52:36.294Z", // These are strings not Date objects
					stability: 5.8,
					difficulty: 3.99,
					elapsedDays: 0,
					reps: 1,
					lapses: 0,
					state: "REVIEW",
					lastReview: "2025-07-19T22:52:36.294Z", // These are strings not Date objects
					createdAt: "2025-07-19T23:05:41.949Z",
					updatedAt: "2025-07-19T23:05:41.949Z",
				};

const hypotheticalOutcomes = fsrs.scheduleRawCard(rawData, now);




```

### Basic Learning Session

```typescript
import { FSRS, Rating } from "fsrs-algorithm";

const fsrs = new FSRS();
let card = fsrs.createEmptyCard();

// Study session
function reviewCard(rating: Rating) {
	const options = fsrs.schedule(card, new Date());

	switch (rating) {
		case Rating.Again:
			card = options.again.card;
			break;
		case Rating.Hard:
			card = options.hard.card;
			break;
		case Rating.Good:
			card = options.good.card;
			break;
		case Rating.Easy:
			card = options.easy.card;
			break;
	}

	console.log(`Next review: ${card.due.toLocaleDateString()}`);
	console.log(`Difficulty: ${card.difficulty.toFixed(2)}`);
	console.log(`Stability: ${card.stability.toFixed(2)} days`);
}

// User rates the card as "Good"
reviewCard(Rating.Good);
```

### Using Card Objects from your Database

```
// Note the different method, this takes an object like below, converts/validates and returns possible outcomes like the 'schedule' method.

const reviewCard: RawCardData = {
					id: "cmdauwe2l0001vexwplv74vjf",
					userId: "5NANdkHyQ1p0riBtDeHPOfdRwdv7y1DM",
					cardId: "cmd4fgv3f0001veq4loisxygg",
					due: "2025-07-25T22:52:36.294Z", // These are strings not Date objects
					stability: 5.8,
					difficulty: 3.99,
					elapsedDays: 0,
					reps: 1,
					lapses: 0,
					state: "REVIEW",
					lastReview: "2025-07-19T22:52:36.294Z", // These are strings not Date objects
					createdAt: "2025-07-19T23:05:41.949Z",
					updatedAt: "2025-07-19T23:05:41.949Z",
				};

const hypotheticalOutcomes = fsrs.scheduleRawCard(rawData, now);

// Now you can render these for the user again.

```

### Custom Parameters

```typescript
// Optimize for different learning scenarios
const fsrs = new FSRS({
	requestRetention: 0.95, // Higher retention for important material
	maximumInterval: 365, // Review at least annually
});
```

### Tracking Multiple Cards

```typescript
interface StudyCard extends Card {
	id: string;
	front: string;
	back: string;
}

class StudySession {
	private fsrs = new FSRS();
	private cards: StudyCard[] = [];

	addCard(front: string, back: string): StudyCard {
		const card: StudyCard = {
			...this.fsrs.createEmptyCard(),
			id: crypto.randomUUID(),
			front,
			back,
		};
		this.cards.push(card);
		return card;
	}

	getDueCards(now = new Date()): StudyCard[] {
		return this.cards.filter((card) => card.due <= now);
	}

	reviewCard(cardId: string, rating: Rating): void {
		const cardIndex = this.cards.findIndex((c) => c.id === cardId);
		if (cardIndex === -1) return;

		const options = this.fsrs.schedule(this.cards[cardIndex]);
		const ratingKey = this.getRatingKey(rating);
		this.cards[cardIndex] = {
			...this.cards[cardIndex],
			...options[ratingKey].card,
		};
	}

	private getRatingKey(rating: Rating): keyof SchedulingCards {
		const map = {
			[Rating.Again]: "again",
			[Rating.Hard]: "hard",
			[Rating.Good]: "good",
			[Rating.Easy]: "easy",
		};
		return map[rating];
	}
}
```

## Configuration

### Algorithm Parameters

The FSRS algorithm uses 19 weight parameters (`w[0]` to `w[18]`) that control different aspects of the scheduling:

- `w[0-3]`: Initial stability for each rating
- `w[4-5]`: Initial difficulty calculation
- `w[6-7]`: Difficulty adjustment and mean reversion
- `w[8-10]`: Stability calculation for successful reviews
- `w[11-14]`: Stability calculation for failed reviews (lapses)
- `w[15-16]`: Hard/Easy rating penalties and bonuses

The default weights are optimized for general use, but you can customize them:

```typescript
const customWeights = [
	0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
	0.0, 0.0,
];

const fsrs = new FSRS({ w: customWeights });
```

### Retention Rate

Adjust the target retention rate based on your needs:

```typescript
// Conservative (more frequent reviews)
const conservative = new FSRS({ requestRetention: 0.95 });

// Aggressive (less frequent reviews, more forgetting)
const aggressive = new FSRS({ requestRetention: 0.8 });
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## References

- [FSRS Algorithm Paper](https://www.nature.com/articles/s41598-024-57552-7)
- [FSRS GitHub Repository](https://github.com/open-spaced-repetition/fsrs4anki)
- [Spaced Repetition Research](https://www.gwern.net/Spaced-repetition)

---

##### PS.

This is an Alpha release, I've got some cleanup to do and perhaps allow different ways to incorporate this various application structures.
