import { FSRS } from "../fsrs";
import {
	Card,
	Rating,
	State,
	FSRSParameters,
	ReviewLog,
	SchedulingInfo,
	SchedulingCards,
	RawCardData,
} from "../types";

describe("FSRS", () => {
	let fsrs: FSRS;
	let now: Date;

	beforeEach(() => {
		fsrs = new FSRS();
		now = new Date("2024-01-01T00:00:00.000Z");
	});

	describe("constructor", () => {
		it("should initialize with default parameters", () => {
			const params = fsrs.getParameters();
			expect(params.requestRetention).toBe(0.9);
			expect(params.maximumInterval).toBe(36500);
			expect(params.w).toHaveLength(17);
			expect(params.w[0]).toBe(0.4);
		});

		it("should accept custom parameters", () => {
			const customParams: Partial<FSRSParameters> = {
				requestRetention: 0.85,
				maximumInterval: 365,
				w: new Array(19).fill(1),
			};
			const customFsrs = new FSRS(customParams);
			const params = customFsrs.getParameters();

			expect(params.requestRetention).toBe(0.85);
			expect(params.maximumInterval).toBe(365);
			expect(params.w).toEqual(new Array(19).fill(1));
		});

		it("should merge custom parameters with defaults", () => {
			const customParams: Partial<FSRSParameters> = {
				requestRetention: 0.95,
			};
			const customFsrs = new FSRS(customParams);
			const params = customFsrs.getParameters();

			expect(params.requestRetention).toBe(0.95);
			expect(params.maximumInterval).toBe(36500); // default value
		});
	});

	describe("createEmptyCard", () => {
		it("should create a new card with default values", () => {
			const card = fsrs.createEmptyCard(now);

			expect(card.due).toEqual(now);
			expect(card.stability).toBe(0);
			expect(card.difficulty).toBe(0);
			expect(card.elapsedDays).toBe(0);
			expect(card.scheduledDays).toBe(0);
			expect(card.reps).toBe(0);
			expect(card.lapses).toBe(0);
			expect(card.state).toBe(State.New);
			expect(card.lastReview).toBeUndefined();
		});

		it("should use current date if no date provided", () => {
			const beforeCreate = new Date();
			const card = fsrs.createEmptyCard();
			const afterCreate = new Date();

			expect(card.due.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
			expect(card.due.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
		});
	});

	describe("schedule", () => {
		describe("for new cards", () => {
			let newCard: Card;

			beforeEach(() => {
				newCard = fsrs.createEmptyCard(now);
			});

			it("should throw error if card is null or undefined", () => {
				expect(() => fsrs.schedule(null as any)).toThrow("card cannot be null or undefined");
				expect(() => fsrs.schedule(undefined as any)).toThrow("card cannot be null or undefined");
			});

			it("should throw error if current time is before last review", () => {
				const card: Card = {
					...newCard,
					lastReview: new Date("2024-01-02"),
				};
				const pastDate = new Date("2024-01-01");

				expect(() => fsrs.schedule(card, pastDate)).toThrow(
					"Current time cannot be before the last review"
				);
			});

			it("should schedule new card with Again rating", () => {
				const result = fsrs.schedule(newCard, now);
				const againCard = result.again.card;
				const againLog = result.again.reviewLog;

				expect(againCard.state).toBe(State.Relearning);
				expect(againCard.reps).toBe(1);
				expect(againCard.scheduledDays).toBe(1);
				expect(againCard.due).toEqual(new Date("2024-01-02T00:00:00.000Z"));
				expect(againCard.lastReview).toEqual(now);

				expect(againLog.rating).toBe(Rating.Again);
				expect(againLog.state).toBe(State.New);
				expect(againLog.review).toEqual(now);
			});

			it("should schedule new card with Hard rating", () => {
				const result = fsrs.schedule(newCard, now);
				const hardCard = result.hard.card;

				expect(hardCard.state).toBe(State.Learning);
				expect(hardCard.reps).toBe(1);
				expect(hardCard.stability).toBeGreaterThan(0);
				expect(hardCard.difficulty).toBeGreaterThan(0);
				expect(hardCard.scheduledDays).toBeGreaterThanOrEqual(1);
			});

			it("should schedule new card with Good rating", () => {
				const result = fsrs.schedule(newCard, now);
				const goodCard = result.good.card;

				expect(goodCard.state).toBe(State.Learning);
				expect(goodCard.reps).toBe(1);
				expect(goodCard.stability).toBeGreaterThan(0);
				expect(goodCard.difficulty).toBeGreaterThan(0);
				expect(goodCard.scheduledDays).toBeGreaterThanOrEqual(1);
			});

			it("should schedule new card with Easy rating", () => {
				const result = fsrs.schedule(newCard, now);
				const easyCard = result.easy.card;

				expect(easyCard.state).toBe(State.Learning);
				expect(easyCard.reps).toBe(1);
				expect(easyCard.stability).toBeGreaterThan(result.good.card.stability);
				expect(easyCard.difficulty).toBeLessThan(result.good.card.difficulty);
				expect(easyCard.scheduledDays).toBeGreaterThanOrEqual(result.good.card.scheduledDays);
			});
		});

		describe("for review cards", () => {
			let reviewCard: Card;

			beforeEach(() => {
				reviewCard = {
					due: new Date("2024-01-05"),
					stability: 5,
					difficulty: 5,
					elapsedDays: 5,
					scheduledDays: 5,
					reps: 3,
					lapses: 0,
					state: State.Review,
					lastReview: new Date("2023-12-27"),
				};
			});

			it("should handle Again rating for review card", () => {
				const result = fsrs.schedule(reviewCard, now);
				const againCard = result.again.card;

				expect(againCard.state).toBe(State.Relearning);
				expect(againCard.lapses).toBe(1);
				expect(againCard.reps).toBe(4);
				expect(againCard.stability).toBeLessThan(reviewCard.stability);
			});

			it("should handle Hard rating for review card", () => {
				const result = fsrs.schedule(reviewCard, now);
				const hardCard = result.hard.card;

				expect(hardCard.state).toBe(State.Review);
				expect(hardCard.lapses).toBe(0);
				expect(hardCard.reps).toBe(4);
				expect(hardCard.stability).toBeLessThan(reviewCard.stability);
			});

			it("should handle Good rating for review card", () => {
				const result = fsrs.schedule(reviewCard, now);
				const goodCard = result.good.card;

				expect(goodCard.state).toBe(State.Review);
				expect(goodCard.lapses).toBe(0);
				expect(goodCard.reps).toBe(4);
				expect(goodCard.stability).toBeGreaterThan(result.hard.card.stability);
			});

			it("should handle Easy rating for review card", () => {
				const result = fsrs.schedule(reviewCard, now);
				const easyCard = result.easy.card;

				expect(easyCard.state).toBe(State.Review);
				expect(easyCard.lapses).toBe(0);
				expect(easyCard.reps).toBe(4);
				expect(easyCard.stability).toBeGreaterThan(result.good.card.stability);
				expect(easyCard.difficulty).toBeLessThan(result.good.card.difficulty);
			});

			it("should calculate elapsed days correctly", () => {
				const result = fsrs.schedule(reviewCard, now);

				expect(result.again.card.elapsedDays).toBe(5); // 5 days between lastReview and now
			});

			it("should respect maximum interval", () => {
				const customFsrs = new FSRS({ maximumInterval: 30 });
				reviewCard.stability = 100; // Very high stability

				const result = customFsrs.schedule(reviewCard, now);

				expect(result.easy.card.scheduledDays).toBeLessThanOrEqual(30);
				expect(result.good.card.scheduledDays).toBeLessThanOrEqual(30);
				expect(result.hard.card.scheduledDays).toBeLessThanOrEqual(30);
			});

			it("should handle a card object for review", () => {
				const reviewCard: RawCardData = {
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

				const result = fsrs.scheduleRawCard(reviewCard, new Date());

				expect(result.good.card.lastReview).toBeDefined();
			});
		});

		describe("for relearning cards", () => {
			let relearningCard: Card;

			beforeEach(() => {
				relearningCard = {
					due: new Date("2024-01-01"),
					stability: 3,
					difficulty: 6,
					elapsedDays: 1,
					scheduledDays: 1,
					reps: 5,
					lapses: 2,
					state: State.Relearning,
					lastReview: new Date("2023-12-31"),
				};
			});

			it("should handle Again rating for relearning card", () => {
				const result = fsrs.schedule(relearningCard, now);
				const againCard = result.again.card;

				expect(againCard.state).toBe(State.Relearning);
				expect(againCard.lapses).toBe(3);
				expect(againCard.reps).toBe(6);
			});

			it("should move to Review state for successful ratings", () => {
				const result = fsrs.schedule(relearningCard, now);

				expect(result.hard.card.state).toBe(State.Review);
				expect(result.good.card.state).toBe(State.Review);
				expect(result.easy.card.state).toBe(State.Review);
			});
		});
	});

	describe("getRetrievability", () => {
		it("should return undefined for new cards", () => {
			const newCard = fsrs.createEmptyCard(now);
			const retrievability = fsrs.getRetrievability(newCard, now);

			expect(retrievability).toBeUndefined();
		});

		it("should return undefined for cards without lastReview", () => {
			const card: Card = {
				due: now,
				stability: 5,
				difficulty: 5,
				elapsedDays: 0,
				scheduledDays: 0,
				reps: 0,
				lapses: 0,
				state: State.Review,
				lastReview: undefined,
			};

			const retrievability = fsrs.getRetrievability(card, now);
			expect(retrievability).toBeUndefined();
		});

		it("should calculate retrievability for reviewed cards", () => {
			const card: Card = {
				due: new Date("2024-01-10"),
				stability: 10,
				difficulty: 5,
				elapsedDays: 0,
				scheduledDays: 10,
				reps: 1,
				lapses: 0,
				state: State.Review,
				lastReview: now,
			};

			// Same day
			const r1 = fsrs.getRetrievability(card, now);
			expect(r1).toBe(1);

			// After 5 days
			const after5Days = new Date("2024-01-06");
			const r2 = fsrs.getRetrievability(card, after5Days);
			expect(r2).toBeLessThan(1);
			expect(r2).toBeGreaterThan(0);

			// After 10 days (scheduled interval)
			const after10Days = new Date("2024-01-11");
			const r3 = fsrs.getRetrievability(card, after10Days);

			//@ts-ignore
			expect(r3).toBeLessThan(r2);
			expect(r3).toBeCloseTo(0.9, 1); // Should be close to request retention
		});

		it("should decrease over time", () => {
			const card: Card = {
				due: new Date("2024-01-10"),
				stability: 10,
				difficulty: 5,
				elapsedDays: 0,
				scheduledDays: 10,
				reps: 1,
				lapses: 0,
				state: State.Review,
				lastReview: now,
			};

			const r1 = fsrs.getRetrievability(card, new Date("2024-01-02"));
			const r2 = fsrs.getRetrievability(card, new Date("2024-01-05"));
			const r3 = fsrs.getRetrievability(card, new Date("2024-01-10"));

			//@ts-ignore
			expect(r1).toBeGreaterThan(r2);
			//@ts-ignore
			expect(r2).toBeGreaterThan(r3);
		});
	});

	describe("updateParameters", () => {
		it("should update parameters", () => {
			const newParams: Partial<FSRSParameters> = {
				requestRetention: 0.85,
				maximumInterval: 180,
			};

			fsrs.updateParameters(newParams);
			const params = fsrs.getParameters();

			expect(params.requestRetention).toBe(0.85);
			expect(params.maximumInterval).toBe(180);
			expect(params.w).toEqual(expect.any(Array)); // Should keep existing w values
		});

		it("should affect scheduling after update", () => {
			const card = fsrs.createEmptyCard(now);
			const resultBefore = fsrs.schedule(card, now);

			fsrs.updateParameters({ requestRetention: 0.7 });
			const resultAfter = fsrs.schedule(card, now);

			// Lower retention should generally lead to longer intervals
			expect(resultAfter.good.card.scheduledDays).toBeGreaterThanOrEqual(
				resultBefore.good.card.scheduledDays
			);
		});
	});

	describe("getParameters", () => {
		it("should return a copy of parameters", () => {
			const params1 = fsrs.getParameters();
			params1.requestRetention = 0.5;

			const params2 = fsrs.getParameters();
			expect(params2.requestRetention).toBe(0.9); // Should not be modified
		});
	});

	describe("edge cases and integration", () => {
		it("should handle very high difficulty", () => {
			const card: Card = {
				due: now,
				stability: 5,
				difficulty: 10, // Maximum difficulty
				elapsedDays: 5,
				scheduledDays: 5,
				reps: 3,
				lapses: 0,
				state: State.Review,
				lastReview: new Date("2023-12-27"),
			};

			const result = fsrs.schedule(card, now);
			expect(result.good.card.difficulty).toBeLessThanOrEqual(10);
			expect(result.easy.card.difficulty).toBeLessThanOrEqual(10);
		});

		it("should handle very low difficulty", () => {
			const card: Card = {
				due: now,
				stability: 5,
				difficulty: 1, // Minimum difficulty
				elapsedDays: 5,
				scheduledDays: 5,
				reps: 3,
				lapses: 0,
				state: State.Review,
				lastReview: new Date("2023-12-27"),
			};

			const result = fsrs.schedule(card, now);
			expect(result.again.card.difficulty).toBeGreaterThanOrEqual(1);
			expect(result.hard.card.difficulty).toBeGreaterThanOrEqual(1);
		});

		it("should handle scheduling with no elapsed time", () => {
			const card: Card = {
				due: now,
				stability: 5,
				difficulty: 5,
				elapsedDays: 0,
				scheduledDays: 5,
				reps: 1,
				lapses: 0,
				state: State.Review,
				lastReview: now,
			};

			const result = fsrs.schedule(card, now);
			expect(result.good.card.elapsedDays).toBe(0);
		});

		it("should produce consistent results for same input", () => {
			const card = fsrs.createEmptyCard(now);
			const result1 = fsrs.schedule(card, now);
			const result2 = fsrs.schedule(card, now);

			expect(result1.good.card).toEqual(result2.good.card);
			expect(result1.good.reviewLog).toEqual(result2.good.reviewLog);
		});

		it("should handle a full learning cycle", () => {
			let card = fsrs.createEmptyCard(now);
			let currentDate = new Date(now);

			// First review - Good
			let result = fsrs.schedule(card, currentDate);
			card = result.good.card;
			expect(card.state).toBe(State.Learning);
			expect(card.reps).toBe(1);

			// Second review - Again (lapse)
			currentDate = new Date(card.due);
			result = fsrs.schedule(card, currentDate);
			card = result.again.card;
			expect(card.state).toBe(State.Relearning);
			expect(card.lapses).toBe(1);

			// Third review - Good (back to review)
			currentDate = new Date(card.due);
			result = fsrs.schedule(card, currentDate);
			card = result.good.card;
			expect(card.state).toBe(State.Review);
			expect(card.reps).toBe(3);
		});
	});
});
