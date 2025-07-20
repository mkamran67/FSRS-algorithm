import { CardValidator } from "../../utils/cardValidator";
import { RawCardData, State } from "../../types";

describe("CardValidator", () => {
	describe("validateAndConvert", () => {
		const validRawCard: RawCardData = {
			id: "cmdauwe2l0001vexwplv74vjf",
			userId: "5NANdkHyQ1p0riBtDeHPOfdRwdv7y1DM",
			cardId: "cmd4fgv3f0001veq4loisxygg",
			due: "2025-07-25T22:52:36.294Z",
			stability: 5.8,
			difficulty: 3.99,
			elapsedDays: 0,
			reps: 1,
			lapses: 0,
			state: "REVIEW",
			lastReview: "2025-07-19T22:52:36.294Z",
			createdAt: "2025-07-19T23:05:41.949Z",
			updatedAt: "2025-07-19T23:05:41.949Z",
		};

		it("should convert valid raw card data", () => {
			const card = CardValidator.validateAndConvert(validRawCard);

			expect(card.due).toBeInstanceOf(Date);
			expect(card.due.toISOString()).toBe("2025-07-25T22:52:36.294Z");
			expect(card.stability).toBe(5.8);
			expect(card.difficulty).toBe(3.99);
			expect(card.elapsedDays).toBe(0);
			expect(card.scheduledDays).toBe(0); // Default value
			expect(card.reps).toBe(1);
			expect(card.lapses).toBe(0);
			expect(card.state).toBe(State.Review);
			expect(card.lastReview).toBeInstanceOf(Date);
			expect(card.lastReview?.toISOString()).toBe("2025-07-19T22:52:36.294Z");
		});

		it("should handle string numbers", () => {
			const rawCard: RawCardData = {
				...validRawCard,
				stability: "5.8",
				difficulty: "3.99",
				elapsedDays: "0",
				reps: "1",
				lapses: "0",
			};

			const card = CardValidator.validateAndConvert(rawCard);

			expect(card.stability).toBe(5.8);
			expect(card.difficulty).toBe(3.99);
			expect(card.elapsedDays).toBe(0);
			expect(card.reps).toBe(1);
			expect(card.lapses).toBe(0);
		});

		it("should handle Date objects", () => {
			const dueDate = new Date("2025-07-25T22:52:36.294Z");
			const lastReviewDate = new Date("2025-07-19T22:52:36.294Z");

			const rawCard: RawCardData = {
				...validRawCard,
				due: dueDate,
				lastReview: lastReviewDate,
			};

			const card = CardValidator.validateAndConvert(rawCard);

			expect(card.due).toBe(dueDate);
			expect(card.lastReview).toBe(lastReviewDate);
		});

		it("should handle scheduledDays when provided", () => {
			const rawCard: RawCardData = {
				...validRawCard,
				scheduledDays: 6,
			};

			const card = CardValidator.validateAndConvert(rawCard);
			expect(card.scheduledDays).toBe(6);
		});

		it("should handle different state strings", () => {
			const states = [
				{ input: "NEW", expected: State.New },
				{ input: "new", expected: State.New },
				{ input: "LEARNING", expected: State.Learning },
				{ input: "learning", expected: State.Learning },
				{ input: "REVIEW", expected: State.Review },
				{ input: "review", expected: State.Review },
				{ input: "RELEARNING", expected: State.Relearning },
				{ input: "relearning", expected: State.Relearning },
			];

			states.forEach(({ input, expected }) => {
				const rawCard: RawCardData = {
					...validRawCard,
					state: input,
					reps: 0,
					lastReview: undefined,
				};

				const card = CardValidator.validateAndConvert(rawCard);
				expect(card.state).toBe(expected);
			});
		});

		it("should handle new cards without lastReview", () => {
			const rawCard: RawCardData = {
				...validRawCard,
				state: "NEW",
				reps: 0,
				lastReview: undefined,
			};

			const card = CardValidator.validateAndConvert(rawCard);

			expect(card.state).toBe(State.New);
			expect(card.lastReview).toBeUndefined();
		});

		it("should handle null lastReview", () => {
			const rawCard: RawCardData = {
				...validRawCard,
				state: "NEW",
				reps: 0,
				lastReview: null,
			};

			const card = CardValidator.validateAndConvert(rawCard);
			expect(card.lastReview).toBeUndefined();
		});

		describe("validation errors", () => {
			it("should throw error for invalid input", () => {
				expect(() => CardValidator.validateAndConvert(null as any)).toThrow(
					"Invalid card data: must be an object"
				);

				expect(() => CardValidator.validateAndConvert(undefined as any)).toThrow(
					"Invalid card data: must be an object"
				);

				expect(() => CardValidator.validateAndConvert("string" as any)).toThrow(
					"Invalid card data: must be an object"
				);
			});

			it("should throw error for invalid state", () => {
				const rawCard: RawCardData = {
					...validRawCard,
					state: "INVALID_STATE",
				};

				expect(() => CardValidator.validateAndConvert(rawCard)).toThrow(
					'Invalid state: "INVALID_STATE". Must be one of: NEW, LEARNING, REVIEW, RELEARNING'
				);
			});

			it("should throw error for non-string state", () => {
				const rawCard: RawCardData = {
					...validRawCard,
					state: 123 as any,
				};

				expect(() => CardValidator.validateAndConvert(rawCard)).toThrow(
					"Invalid state: must be a string, got number"
				);
			});

			it("should throw error for invalid dates", () => {
				const rawCard1: RawCardData = {
					...validRawCard,
					due: "invalid-date",
				};

				expect(() => CardValidator.validateAndConvert(rawCard1)).toThrow(
					'Invalid due: "invalid-date" is not a valid date'
				);

				const rawCard2: RawCardData = {
					...validRawCard,
					lastReview: "invalid-date",
				};

				expect(() => CardValidator.validateAndConvert(rawCard2)).toThrow(
					'Invalid lastReview: "invalid-date" is not a valid date'
				);
			});

			it("should throw error for invalid numbers", () => {
				const rawCard: RawCardData = {
					...validRawCard,
					stability: "not-a-number",
				};

				expect(() => CardValidator.validateAndConvert(rawCard)).toThrow(
					'Invalid stability: "not-a-number" is not a valid number'
				);
			});

			it("should throw error for numbers out of range", () => {
				const rawCard1: RawCardData = {
					...validRawCard,
					difficulty: 0.5, // Below minimum of 1
				};

				expect(() => CardValidator.validateAndConvert(rawCard1)).toThrow(
					"Invalid difficulty: 0.5 must be between 1 and 10"
				);

				const rawCard2: RawCardData = {
					...validRawCard,
					difficulty: 11, // Above maximum of 10
				};

				expect(() => CardValidator.validateAndConvert(rawCard2)).toThrow(
					"Invalid difficulty: 11 must be between 1 and 10"
				);
			});

			it("should throw error for non-integer reps and lapses", () => {
				const rawCard1: RawCardData = {
					...validRawCard,
					reps: 1.5,
				};

				expect(() => CardValidator.validateAndConvert(rawCard1)).toThrow(
					"Invalid reps: 1.5 must be an integer"
				);

				const rawCard2: RawCardData = {
					...validRawCard,
					lapses: 0.5,
				};

				expect(() => CardValidator.validateAndConvert(rawCard2)).toThrow(
					"Invalid lapses: 0.5 must be an integer"
				);
			});

			it("should throw error for negative values", () => {
				const rawCard: RawCardData = {
					...validRawCard,
					elapsedDays: -1,
				};

				expect(() => CardValidator.validateAndConvert(rawCard)).toThrow(
					"Invalid elapsedDays: -1 must be between 0 and Infinity"
				);
			});

			it("should throw error for invalid card states", () => {
				// New card with reps > 0
				const rawCard1: RawCardData = {
					...validRawCard,
					state: "NEW",
					reps: 1,
					lastReview: undefined,
				};

				expect(() => CardValidator.validateAndConvert(rawCard1)).toThrow(
					"New cards should have 0 reps"
				);

				// New card with lastReview
				const rawCard2: RawCardData = {
					...validRawCard,
					state: "NEW",
					reps: 0,
					lastReview: "2025-07-19T22:52:36.294Z",
				};

				expect(() => CardValidator.validateAndConvert(rawCard2)).toThrow(
					"New cards should not have a lastReview date"
				);

				// Card with reps but no lastReview
				const rawCard3: RawCardData = {
					...validRawCard,
					reps: 1,
					lastReview: undefined,
				};

				expect(() => CardValidator.validateAndConvert(rawCard3)).toThrow(
					"Cards with reps > 0 must have a lastReview date"
				);

				// Lapses > reps
				const rawCard4: RawCardData = {
					...validRawCard,
					reps: 2,
					lapses: 3,
				};

				expect(() => CardValidator.validateAndConvert(rawCard4)).toThrow(
					"Lapses cannot be greater than reps"
				);
			});
		});
	});

	describe("validateAndConvertBatch", () => {
		it("should process valid cards", () => {
			const rawCards: RawCardData[] = [
				{
					due: "2025-07-25T22:52:36.294Z",
					stability: 5.8,
					difficulty: 3.99,
					elapsedDays: 0,
					reps: 1,
					lapses: 0,
					state: "REVIEW",
					lastReview: "2025-07-19T22:52:36.294Z",
				},
				{
					due: "2025-07-26T22:52:36.294Z",
					stability: 2.4,
					difficulty: 5,
					elapsedDays: 0,
					reps: 0,
					lapses: 0,
					state: "NEW",
				},
			];

			const result = CardValidator.validateAndConvertBatch(rawCards);

			expect(result.valid).toHaveLength(2);
			expect(result.errors).toHaveLength(0);
			expect(result.valid[0].state).toBe(State.Review);
			expect(result.valid[1].state).toBe(State.New);
		});

		it("should collect errors for invalid cards", () => {
			const rawCards: RawCardData[] = [
				{
					due: "2025-07-25T22:52:36.294Z",
					stability: 5.8,
					difficulty: 3.99,
					elapsedDays: 0,
					reps: 1,
					lapses: 0,
					state: "REVIEW",
					lastReview: "2025-07-19T22:52:36.294Z",
				},
				{
					due: "invalid-date",
					stability: 5.8,
					difficulty: 3.99,
					elapsedDays: 0,
					reps: 1,
					lapses: 0,
					state: "REVIEW",
					lastReview: "2025-07-19T22:52:36.294Z",
				},
				{
					due: "2025-07-25T22:52:36.294Z",
					stability: "not-a-number",
					difficulty: 3.99,
					elapsedDays: 0,
					reps: 1,
					lapses: 0,
					state: "REVIEW",
					lastReview: "2025-07-19T22:52:36.294Z",
				},
			];

			const result = CardValidator.validateAndConvertBatch(rawCards);

			expect(result.valid).toHaveLength(1);
			expect(result.errors).toHaveLength(2);

			expect(result.errors[0].index).toBe(1);
			expect(result.errors[0].error).toContain("Invalid due");
			expect(result.errors[0].data).toBe(rawCards[1]);

			expect(result.errors[1].index).toBe(2);
			expect(result.errors[1].error).toContain("Invalid stability");
			expect(result.errors[1].data).toBe(rawCards[2]);
		});
	});

	describe("isCardDataShape", () => {
		it("should return true for valid card shapes", () => {
			const validShape = {
				due: "2025-07-25T22:52:36.294Z",
				stability: 5.8,
				difficulty: 3.99,
				elapsedDays: 0,
				reps: 1,
				lapses: 0,
				state: "REVIEW",
				extra: "field", // Extra fields are OK
			};

			expect(CardValidator.isCardDataShape(validShape)).toBe(true);
		});

		it("should return false for invalid shapes", () => {
			expect(CardValidator.isCardDataShape(null)).toBe(false);
			expect(CardValidator.isCardDataShape(undefined)).toBe(false);
			expect(CardValidator.isCardDataShape("string")).toBe(false);
			expect(CardValidator.isCardDataShape(123)).toBe(false);
			expect(CardValidator.isCardDataShape([])).toBe(false);

			// Missing required fields
			expect(CardValidator.isCardDataShape({ due: "date" })).toBe(false);
			expect(
				CardValidator.isCardDataShape({
					due: "date",
					stability: 1,
					difficulty: 1,
					// Missing state, reps, lapses
				})
			).toBe(false);
		});
	});
});
