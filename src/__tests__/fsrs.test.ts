import { FSRS, Rating, State } from "../index";

describe("FSRS", () => {
	describe("Core Functionality of FSRS", () => {
		let fsrs: FSRS;
		let now: Date;

		beforeEach(() => {
			fsrs = new FSRS();
			now = new Date();
		});

		test("should create empty card", () => {
			const card = fsrs.createEmptyCard(now);

			expect(card.state).toBe(State.New);
			expect(card.reps).toBe(0);
			expect(card.lapses).toBe(0);
			expect(card.due).toEqual(now);
		});

		test("should create an empty card and review it for the first time", () => {
			// 1. create empty card
			const card = fsrs.createEmptyCard(now);

			// 2. Generate hypothetical outcomes
			const scheduling = fsrs.schedule(card, now);

			// 3. This should have 1 rep since the user would select 1 and save it
			expect(scheduling.good.card.state).toBe(State.Review);
			expect(scheduling.good.card.reps).toBe(1);
			expect(scheduling.good.card.difficulty).toBeGreaterThan(0);
			expect(scheduling.good.card.stability).toBeGreaterThan(0);
		});

		test("should schedule new card with Again rating", () => {
			const card = fsrs.createEmptyCard(now);
			const tempScheduling = fsrs.schedule(card, now);
			const scheduling = fsrs.schedule(tempScheduling.again.card, now);

			expect(scheduling.again.card.state).toBe(State.Relearning);
			expect(scheduling.again.card.scheduledDays).toBe(1);
			expect(scheduling.again.card.reps).toBe(2);
		});

		test("should handle review card with good rating", () => {
			let card = fsrs.createEmptyCard(now);
			const firstReview = fsrs.schedule(card, now);
			card = firstReview.good.card;

			const laterDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days later
			const secondReview = fsrs.schedule(card, laterDate);

			expect(secondReview.good.card.reps).toBe(2);
			expect(secondReview.good.card.elapsedDays).toBe(3);
		});

		test("should calculate retrievability", () => {
			let card = fsrs.createEmptyCard(now);
			const scheduling = fsrs.schedule(card, now);
			card = scheduling.good.card;

			const laterDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day later
			const retrievability = fsrs.getRetrievability(card, laterDate);

			expect(retrievability).toBeGreaterThan(0);
			expect(retrievability).toBeLessThanOrEqual(1);
		});

		test("should update parameters", () => {
			const newParams = { requestRetention: 0.85 };
			fsrs.updateParameters(newParams);

			expect(fsrs.getParameters().requestRetention).toBe(0.85);
		});
	});

	describe("Utility Methods of FSRS", () => {
		let fsrs: FSRS;
		let now: Date;

		beforeEach(() => {
			fsrs = new FSRS();
			now = new Date();
		});

		it("should return paramaters", () => {
			const params = fsrs.getParameters();

			expect(params.requestRetention).toBe(0.9);
			expect(params.maximumInterval).toBe(3650);
			expect(params.w.length).toBe(19);
		});

		it("should update paramaters", () => {
			const params = fsrs.getParameters();

			expect(params.requestRetention).toBe(0.9);
			expect(params.maximumInterval).toBe(3650);
			expect(params.w.length).toBe(19);

			fsrs.updateParameters({ maximumInterval: 365 });

			const updatedParams = fsrs.getParameters();

			expect(updatedParams.maximumInterval).toBe(365);
		});
	});
});
