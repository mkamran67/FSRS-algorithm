export enum Rating {
	Again = 1,
	Hard = 2,
	Good = 3,
	Easy = 4,
}

export enum State {
	New = 0,
	Learning = 1,
	Review = 2,
	Relearning = 3,
}

export interface FSRSParameters {
	requestRetention: number;
	maximumInterval: number;
	w: number[]; // 19 parameters for the FSRS algorithm
}

export interface Card {
	due: Date;
	stability: number;
	difficulty: number;
	elapsedDays: number;
	scheduledDays: number;
	reps: number;
	lapses: number;
	state: State;
	lastReview?: Date;
}

export interface ReviewLog {
	rating: Rating;
	state: State;
	due: Date;
	stability: number;
	difficulty: number;
	elapsedDays: number;
	lastElapsedDays: number;
	scheduledDays: number;
	review: Date;
}

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
