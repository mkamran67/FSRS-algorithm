import {
	Card,
	Rating,
	State,
	FSRSParameters,
	ReviewLog,
	SchedulingInfo,
	SchedulingCards,
	RawCardData,
} from "./types";
import { CardValidator } from "./utils/cardValidator";
import { calcElapsedDays } from "./utils/timeFuncs";

// Implementation of FSRS-4.5
// Based on the FSRS-4.5 algorithm specification.
// This version has been updated for clarity and adherence to the standard.
export class FSRS {
	private parameters: FSRSParameters;

	constructor(parameters?: Partial<FSRSParameters>) {
		// Default FSRS-4.5 parameters optimized for general use.
		// These 17 parameters are the core of the algorithm.
		this.parameters = {
			requestRetention: 0.9, // Target probability of recalling a card
			maximumInterval: 36500, // Maximum number of days for an interval
			w: [
				// w[0]: Initial stability for Again
				0.4,
				// w[1]: Initial stability for Hard
				0.6,
				// w[2]: Initial stability for Good
				2.4,
				// w[3]: Initial stability for Easy
				5.8,
				// w[4]: Initial difficulty for Good
				4.93,
				// w[5]: Difficulty change factor
				0.94,
				// w[6]: Difficulty change factor
				0.86,
				// w[7]: Mean reversion weight for difficulty
				0.01,
				// w[8]: Stability increase factor
				1.49,
				// w[9]: Stability exponent
				0.14,
				// w[10]: Stability factor for memory retrieval
				0.94,
				// w[11]: Stability factor for forgotten cards
				2.18,
				// w[12]: Difficulty exponent for forgotten cards
				0.05,
				// w[13]: Stability exponent for forgotten cards
				0.34,
				// w[14]: Retrieval exponent for forgotten cards
				1.26,
				// w[15]: Penalty factor for "Hard" rating
				0.29,
				// w[16]: Bonus factor for "Easy" rating
				2.61,
			],
			...parameters,
		};
	}

	/**
	 * Creates a new, empty card object.
	 * @param now The current date, defaults to new Date().
	 * @returns A new Card object.
	 */
	createEmptyCard(now: Date = new Date()): Card {
		return {
			due: new Date(now),
			stability: 0,
			difficulty: 0,
			elapsedDays: 0,
			scheduledDays: 0,
			reps: 0,
			lapses: 0,
			state: State.New,
			lastReview: undefined,
		};
	}

	/**
	 * Generates scheduling information for all possible ratings for a given card.
	 * @param card The card to schedule.
	 * @param now The current date of the review.
	 * @returns An object containing the card and review log for each rating.
	 */
	schedule(card: Card, now: Date = new Date()): SchedulingCards {
		if (!card) throw new Error("card cannot be null or undefined");

		if (card.lastReview && now < card.lastReview)
			throw new Error("Current time cannot be before the last review");

		return this.buildSchedulingCards(card, now);
	}

	/**
	 * Converts raw card data, validates it, and then schedules it.
	 * @param rawData The raw card data from a database or API.
	 * @param now The current date of the review.
	 * @returns Scheduling cards for all ratings.
	 */
	scheduleRawCard(rawData: RawCardData, now: Date = new Date()): SchedulingCards {
		const card = this.convertRawCard(rawData);
		return this.schedule(card, now);
	}

	/**
	 * Converts and validates raw card data into a formal Card object.
	 * @param rawData The raw card data.
	 * @returns A validated Card object.
	 */
	convertRawCard(rawData: RawCardData): Card {
		return CardValidator.validateAndConvert(rawData);
	}

	/**
	 * Batch converts and validates multiple raw cards.
	 * @param rawDataArray Array of raw card data.
	 * @returns An object containing arrays of valid cards and any errors encountered.
	 */
	convertRawCardBatch(rawDataArray: RawCardData[]): {
		valid: Card[];
		errors: Array<{ index: number; error: string; data: RawCardData }>;
	} {
		return CardValidator.validateAndConvertBatch(rawDataArray);
	}

	/**
	 * Calculates the probability of recalling a card at a given time.
	 * @param card The card to calculate retrievability for.
	 * @param now The date for which to calculate retrievability.
	 * @returns A number between 0 and 1, representing the probability of recall.
	 */
	getRetrievability(card: Card, now: Date = new Date()): number | undefined {
		if (card.state === State.New || !card.lastReview) {
			return undefined;
		}
		const elapsedDays = calcElapsedDays(card.lastReview, now);
		return this.retrievability(elapsedDays, card.stability);
	}

	// ----------------------------- FSRS-4.5 Algorithm Core -----------------------------

	private buildSchedulingCards(card: Card, now: Date): SchedulingCards {
		const cards: SchedulingCards = {} as SchedulingCards;

		[Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].forEach((rating) => {
			const scheduledCard = this.calculateScheduledCard(card, rating, now);
			const reviewLog = this.buildReviewLog(card, rating, now);

			const key = this.getRatingKey(rating);
			cards[key] = {
				card: scheduledCard,
				reviewLog,
			};
		});

		return cards;
	}

	private calculateScheduledCard(card: Card, rating: Rating, now: Date): Card {
		const newCard = { ...card };

		newCard.reps += 1;
		newCard.lastReview = new Date(now);

		if (card.state === State.New) {
			// First review of a new card
			newCard.elapsedDays = 0;
			newCard.difficulty = this.initDifficulty(rating);
			newCard.stability = this.initStability(rating);
		} else {
			// Review of a card that has been seen before
			const elapsedDays = card.lastReview ? calcElapsedDays(card.lastReview, now) : 0;
			newCard.elapsedDays = elapsedDays;
			const R = this.retrievability(elapsedDays, card.stability);
			newCard.difficulty = this.nextDifficulty(card.difficulty, rating);
			newCard.stability = this.nextStability(newCard.difficulty, card.stability, R, rating);
		}

		if (rating === Rating.Again) {
			newCard.lapses += 1;
			newCard.state = State.Relearning;
			// Interval for "Again" is fixed according to the algorithm's forgetting curve
			newCard.scheduledDays = this.nextInterval(newCard.stability);
		} else {
			newCard.state = card.state === State.New ? State.Learning : State.Review;
			newCard.scheduledDays = this.nextInterval(newCard.stability);
		}

		newCard.due = this.addDays(now, newCard.scheduledDays);
		return newCard;
	}

	private buildReviewLog(card: Card, rating: Rating, now: Date): ReviewLog {
		return {
			rating,
			state: card.state,
			due: new Date(card.due),
			stability: card.stability,
			difficulty: card.difficulty,
			elapsedDays: card.lastReview ? calcElapsedDays(card.lastReview, now) : 0,
			lastElapsedDays: card.elapsedDays,
			scheduledDays: card.scheduledDays,
			review: new Date(now),
		};
	}

	// --- FSRS-4.5 Formulas ---

	private initStability(rating: Rating): number {
		return Math.max(this.parameters.w[rating - 1], 0.1);
	}

	private initDifficulty(rating: Rating): number {
		const difficulty = this.parameters.w[4] - (rating - 3) * this.parameters.w[5];
		return Math.min(Math.max(difficulty, 1), 10);
	}

	private nextDifficulty(difficulty: number, rating: Rating): number {
		const nextD = difficulty - this.parameters.w[6] * (rating - 3);

		// Correction: The mean reversion target should be the initial 'Good' difficulty (w[4]).
		const reversionTarget = this.parameters.w[4];

		const revertedD = this.parameters.w[7] * reversionTarget + (1 - this.parameters.w[7]) * nextD;

		return Math.min(Math.max(revertedD, 1), 10);
	}

	private nextStability(
		difficulty: number,
		stability: number,
		retrievability: number,
		rating: Rating
	): number {
		if (rating === Rating.Again) {
			return (
				this.parameters.w[11] *
				Math.pow(difficulty, -this.parameters.w[12]) *
				(Math.pow(stability + 1, this.parameters.w[13]) - 1) *
				Math.exp((1 - retrievability) * this.parameters.w[14])
			);
		} else {
			const hardPenalty = rating === Rating.Hard ? this.parameters.w[15] : 1;
			const easyBonus = rating === Rating.Easy ? this.parameters.w[16] : 1;
			return (
				stability *
				(1 +
					Math.exp(this.parameters.w[8]) *
						(11 - difficulty) *
						Math.pow(stability, -this.parameters.w[9]) *
						(Math.exp((1 - retrievability) * this.parameters.w[10]) - 1)) *
				hardPenalty *
				easyBonus
			);
		}
	}

	private nextInterval(stability: number): number {
		// This formula calculates the interval where the probability of recall
		// is `requestRetention`. The `9` is a magic number from the FSRS-4.5 formula.
		const interval = stability * 9 * (1 / this.parameters.requestRetention - 1);
		return Math.min(Math.max(Math.round(interval), 1), this.parameters.maximumInterval);
	}

	private retrievability(elapsedDays: number, stability: number): number {
		// The probability of recalling a card after `elapsedDays` with a given `stability`.
		// The `9` is a magic number from the FSRS-4.5 formula.
		return Math.pow(1 + elapsedDays / (9 * stability), -1);
	}

	// --- Utility Functions ---

	private addDays(date: Date, days: number): Date {
		const result = new Date(date);
		result.setDate(result.getDate() + days);
		return result;
	}

	private getRatingKey(rating: Rating): keyof SchedulingCards {
		switch (rating) {
			case Rating.Again:
				return "again";
			case Rating.Hard:
				return "hard";
			case Rating.Good:
				return "good";
			case Rating.Easy:
				return "easy";
		}
	}

	// --- Parameter Management ---

	updateParameters(newParameters: Partial<FSRSParameters>): void {
		this.parameters = { ...this.parameters, ...newParameters };
	}

	getParameters(): FSRSParameters {
		return { ...this.parameters };
	}
}
