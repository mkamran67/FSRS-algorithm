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

export class FSRS {
	private parameters: FSRSParameters;

	constructor(parameters?: Partial<FSRSParameters>) {
		// Default FSRS parameters optimized for general use
		this.parameters = {
			requestRetention: 0.9, // Default 90%
			maximumInterval: 3650, // 10 years
			w: [
				0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29,
				2.61, 0.0, 0.0,
			],
			...parameters,
		};
	}

	/**
	 * Create a new card
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

	schedule(card: Card, now: Date = new Date()): SchedulingCards {
		if (!card) throw new Error("card cannot be null or undefined");

		if (card.lastReview && now < card.lastReview)
			throw new Error("Current time cannot be before the last review");

		return this.buildSchedulingCards(card, now);
	}

	/**
	 * Schedule a card from raw data
	 * Combines validation and scheduling in one operation
	 * @param rawData - The raw card data
	 * @param now - Current time (optional)
	 * @returns Scheduling cards for all ratings
	 * @throws Error if validation fails
	 */
	scheduleRawCard(rawData: RawCardData, now: Date = new Date()): SchedulingCards {
		const card = this.convertRawCard(rawData);
		return this.schedule(card, now);
	}

	/**
	 * Converts and validates raw card data from database/API
	 * @param rawData - The raw card data
	 * @returns A validated Card object
	 * @throws Error if validation fails
	 */
	convertRawCard(rawData: RawCardData): Card {
		return CardValidator.validateAndConvert(rawData);
	}

	/**
	 * Batch convert and validate multiple raw cards
	 * @param rawDataArray - Array of raw card data
	 * @returns Object with valid cards and errors
	 */
	convertRawCardBatch(rawDataArray: RawCardData[]): {
		valid: Card[];
		errors: Array<{ index: number; error: string; data: RawCardData }>;
	} {
		return CardValidator.validateAndConvertBatch(rawDataArray);
	}

	private buildSchedulingCards(card: Card, now: Date): SchedulingCards {
		const cards: SchedulingCards = {} as SchedulingCards;

		[Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].forEach((rating) => {
			const scheduledCard = this.scheduleCard(card, rating, now);
			const reviewLog = this.buildReviewLog(card, scheduledCard, rating, now);

			const key = this.getRatingKey(rating);
			cards[key] = {
				card: scheduledCard,
				reviewLog,
			};
		});

		return cards;
	}

	private scheduleCard(card: Card, rating: Rating, now: Date): Card {
		const newCard = { ...card };

		if (card.state === State.New) {
			const initDifficulty = this.initDifficulty(rating);
			const initStability = this.initStability(rating);

			newCard.difficulty = initDifficulty;
			newCard.stability = initStability;
			newCard.reps = 1;
			newCard.state = rating === Rating.Again ? State.Learning : State.Review;

			const interval = rating === Rating.Again ? 1 : Math.max(1, Math.round(initStability));
			newCard.scheduledDays = interval;
			newCard.due = this.addDays(now, interval);
		} else {
			const elapsedDays = card.lastReview ? calcElapsedDays(card.lastReview, now) : 0;

			newCard.elapsedDays = elapsedDays;
			newCard.reps += 1;

			if (rating === Rating.Again) {
				newCard.lapses += 1;
				newCard.state = State.Relearning;
			} else {
				newCard.state = State.Review;
			}

			newCard.difficulty = this.nextDifficulty(card.difficulty, rating);
			newCard.stability = this.nextStability(card.difficulty, card.stability, elapsedDays, rating);

			const interval = this.nextInterval(newCard.stability);
			newCard.scheduledDays = interval;
			newCard.due = this.addDays(now, interval);
		}

		newCard.lastReview = new Date(now);
		return newCard;
	}

	private buildReviewLog(card: Card, scheduledCard: Card, rating: Rating, now: Date): ReviewLog {
		const elapsedDays = card.lastReview ? calcElapsedDays(card.lastReview, now) : 0;

		return {
			rating,
			state: card.state,
			due: new Date(card.due),
			stability: card.stability,
			difficulty: card.difficulty,
			elapsedDays,
			lastElapsedDays: card.elapsedDays,
			scheduledDays: card.scheduledDays,
			review: new Date(now),
		};
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

	// ----------------------------- FSRS Algorithm Core Functions -----------------------------

	private initStability(rating: Rating): number {
		return Math.max(this.parameters.w[rating - 1], 0.1);
	}

	private initDifficulty(rating: Rating): number {
		// Rotating
		return Math.min(Math.max(this.parameters.w[4] - (rating - 3) * this.parameters.w[5], 1), 10);
	}

	private nextDifficulty(difficulty: number, rating: Rating): number {
		// difficulty = how hard the card is 1 - 10
		// rating = 1-4 (Again, Hard, Good, Easy)
		const nextD = difficulty - this.parameters.w[6] * (rating - 3);
		// Prevents extremes on either scales low or high difficulty
		return Math.min(Math.max(this.meanReversion(this.parameters.w[4], nextD), 1), 10);
	}

	private nextStability(
		difficulty: number,
		stability: number,
		elapsedDays: number,
		rating: Rating
	): number {
		const hardPenalty = rating === Rating.Hard ? this.parameters.w[15] : 1;
		const easyBonus = rating === Rating.Easy ? this.parameters.w[16] : 1;

		if (rating === Rating.Again) {
			const baseStabilityForForgottenCards = this.parameters.w[11];

			return (
				baseStabilityForForgottenCards *
				Math.pow(difficulty, -this.parameters.w[12]) *
				(Math.pow(stability + 1, this.parameters.w[13]) - 1) *
				Math.exp(this.parameters.w[14] * (1 - this.retrievability(elapsedDays, stability)))
			);
		} else {
			return (
				stability *
				(Math.exp(this.parameters.w[8]) *
					(11 - difficulty) *
					Math.pow(stability, -this.parameters.w[9]) *
					(Math.exp(this.parameters.w[10] * (1 - this.retrievability(elapsedDays, stability))) -
						1) *
					hardPenalty *
					easyBonus +
					1)
			);
		}
	}

	private nextInterval(stability: number): number {
		const interval =
			(stability / this.factor()) *
			(Math.pow(this.parameters.requestRetention, 1 / this.decay()) - 1);
		return Math.min(Math.max(Math.round(interval), 1), this.parameters.maximumInterval);
	}

	private retrievability(elapsedDays: number, stability: number): number {
		return Math.pow(1 + (this.factor() * elapsedDays) / stability, this.decay());
	}

	private meanReversion(init: number, current: number): number {
		return this.parameters.w[7] * init + (1 - this.parameters.w[7]) * current;
	}

	private factor(): number {
		return Math.pow(0.9, 1 / this.decay()) - 1;
	}

	private decay(): number {
		return -0.5;
	}

	private addDays(date: Date, days: number): Date {
		const result = new Date(date);
		result.setDate(result.getDate() + days);
		return result;
	}

	getRetrievability(card: Card, now: Date = new Date()): number {
		if (card.state === State.New || !card.lastReview) return 1;

		const elapsedDays = calcElapsedDays(card.lastReview, now);

		return this.retrievability(elapsedDays, card.stability);
	}

	updateParameters(newParameters: Partial<FSRSParameters>): void {
		this.parameters = { ...this.parameters, ...newParameters };
	}

	getParameters(): FSRSParameters {
		return { ...this.parameters };
	}
}
