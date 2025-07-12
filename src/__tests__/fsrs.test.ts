import { FSRS, Rating, State } from "../index";

describe("FSRS", () => {
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
		const card = fsrs.createEmptyCard(now);
		const scheduling = fsrs.schedule(card, Rating.Good, now);

		expect(scheduling.good.card.state).toBe(State.Review);
		expect(scheduling.good.card.reps).toBe(2);
		expect(scheduling.good.card.difficulty).toBeGreaterThan(0);
		expect(scheduling.good.card.stability).toBeGreaterThan(0);
	});

	// test("should schedule new card with Again rating", () => {
	// 	const card = fsrs.createEmptyCard(now);
	// 	const scheduling = fsrs.schedule(card, Rating.Again, now);

	// 	expect(scheduling.again.card.state).toBe(State.Learning);
	// 	expect(scheduling.again.card.scheduledDays).toBe(1);
	// });

	// test("should handle review card", () => {
	// 	let card = fsrs.createEmptyCard(now);
	// 	const firstReview = fsrs.schedule(card, Rating.Good, now);
	// 	card = firstReview.good.card;

	// 	const laterDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days later
	// 	const secondReview = fsrs.schedule(card, Rating.Good, laterDate);

	// 	expect(secondReview.good.card.reps).toBe(2);
	// 	expect(secondReview.good.card.elapsedDays).toBe(3);
	// });

	// test("should calculate retrievability", () => {
	// 	let card = fsrs.createEmptyCard(now);
	// 	const scheduling = fsrs.schedule(card, Rating.Good, now);
	// 	card = scheduling.good.card;

	// 	const laterDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day later
	// 	const retrievability = fsrs.getRetrievability(card, laterDate);

	// 	expect(retrievability).toBeGreaterThan(0);
	// 	expect(retrievability).toBeLessThanOrEqual(1);
	// });

	// test("should update parameters", () => {
	// 	const newParams = { requestRetention: 0.85 };
	// 	fsrs.updateParameters(newParams);

	// 	expect(fsrs.getParameters().requestRetention).toBe(0.85);
	// });
});
