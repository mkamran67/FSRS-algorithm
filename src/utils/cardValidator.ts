import { Card, RawCardData, State } from "../types";

// State mapping from string to enum
const STATE_MAP: Record<string, State> = {
	NEW: State.New,
	LEARNING: State.Learning,
	REVIEW: State.Review,
	RELEARNING: State.Relearning,
};

export class CardValidator {
	/**
	 * Validates and converts raw card data to a Card object
	 * @param rawData - The raw card data from database/API
	 * @returns A validated Card object
	 * @throws Error if validation fails
	 */
	static validateAndConvert(rawData: RawCardData): Card {
		if (!rawData || typeof rawData !== "object") {
			throw new Error("Invalid card data: must be an object");
		}

		// Validate and convert state
		const state = this.validateState(rawData.state);

		// Validate and convert dates
		const due = this.validateDate(rawData.due, "due");
		const lastReview = rawData.lastReview
			? this.validateDate(rawData.lastReview, "lastReview")
			: undefined;

		// Validate and convert numbers
		const stability = this.validateNumber(rawData.stability, "stability", 0.1, Infinity);
		const difficulty = this.validateNumber(rawData.difficulty, "difficulty", 1, 10);
		const elapsedDays = this.validateNumber(rawData.elapsedDays, "elapsedDays", 0, Infinity);
		const scheduledDays =
			rawData.scheduledDays !== undefined
				? this.validateNumber(rawData.scheduledDays, "scheduledDays", 0, Infinity)
				: 0; // Default to 0 if not provided
		const reps = this.validateInteger(rawData.reps, "reps", 0, Infinity);
		const lapses = this.validateInteger(rawData.lapses, "lapses", 0, Infinity);

		// Additional validation rules
		if (state === State.New && reps > 0) {
			throw new Error("New cards should have 0 reps");
		}

		if (state === State.New && lastReview) {
			throw new Error("New cards should not have a lastReview date");
		}

		if (reps > 0 && !lastReview) {
			throw new Error("Cards with reps > 0 must have a lastReview date");
		}

		if (lapses > reps) {
			throw new Error("Lapses cannot be greater than reps");
		}

		// Construct the validated Card object
		const card: Card = {
			due,
			stability,
			difficulty,
			elapsedDays,
			scheduledDays,
			reps,
			lapses,
			state,
			lastReview,
		};

		return card;
	}

	/**
	 * Validates and converts a state string to State enum
	 */
	private static validateState(state: any): State {
		if (typeof state !== "string") {
			throw new Error(`Invalid state: must be a string, got ${typeof state}`);
		}

		const upperState = state.toUpperCase();
		const mappedState = STATE_MAP[upperState];

		if (mappedState === undefined) {
			const validStates = Object.keys(STATE_MAP).join(", ");
			throw new Error(`Invalid state: "${state}". Must be one of: ${validStates}`);
		}

		return mappedState;
	}

	/**
	 * Validates and converts a date string/Date to Date object
	 */
	private static validateDate(value: any, fieldName: string): Date {
		if (!value) {
			throw new Error(`Invalid ${fieldName}: value is required`);
		}

		let date: Date;

		if (value instanceof Date) {
			date = value;
		} else if (typeof value === "string") {
			date = new Date(value);
		} else {
			throw new Error(`Invalid ${fieldName}: must be a Date or string, got ${typeof value}`);
		}

		if (isNaN(date.getTime())) {
			throw new Error(`Invalid ${fieldName}: "${value}" is not a valid date`);
		}

		return date;
	}

	/**
	 * Validates and converts a number
	 */
	private static validateNumber(
		value: any,
		fieldName: string,
		min: number = -Infinity,
		max: number = Infinity
	): number {
		let num: number;

		if (typeof value === "number") {
			num = value;
		} else if (typeof value === "string") {
			num = parseFloat(value);
		} else {
			throw new Error(`Invalid ${fieldName}: must be a number or string, got ${typeof value}`);
		}

		if (isNaN(num)) {
			throw new Error(`Invalid ${fieldName}: "${value}" is not a valid number`);
		}

		if (num < min || num > max) {
			throw new Error(`Invalid ${fieldName}: ${num} must be between ${min} and ${max}`);
		}

		return num;
	}

	/**
	 * Validates and converts an integer
	 */
	private static validateInteger(
		value: any,
		fieldName: string,
		min: number = -Infinity,
		max: number = Infinity
	): number {
		const num = this.validateNumber(value, fieldName, min, max);

		if (!Number.isInteger(num)) {
			throw new Error(`Invalid ${fieldName}: ${num} must be an integer`);
		}

		return num;
	}

	/**
	 * Batch validate and convert multiple cards
	 */
	static validateAndConvertBatch(rawDataArray: RawCardData[]): {
		valid: Card[];
		errors: Array<{ index: number; error: string; data: RawCardData }>;
	} {
		const valid: Card[] = [];
		const errors: Array<{ index: number; error: string; data: RawCardData }> = [];

		rawDataArray.forEach((rawData, index) => {
			try {
				const card = this.validateAndConvert(rawData);
				valid.push(card);
			} catch (error) {
				errors.push({
					index,
					error: error instanceof Error ? error.message : "Unknown error",
					data: rawData,
				});
			}
		});

		return { valid, errors };
	}

	/**
	 * Checks if a raw object might be valid card data (loose validation)
	 */
	static isCardDataShape(obj: any): obj is RawCardData {
		if (obj === null || obj === undefined) {
			return false;
		}

		const result =
			obj &&
			typeof obj === "object" &&
			"due" in obj &&
			"stability" in obj &&
			"difficulty" in obj &&
			"state" in obj &&
			"reps" in obj &&
			"lapses" in obj;

		return result;
	}
}
