export enum Rating {
	Again = 1, // "I forgot this"
	Hard = 2, // "Difficult to remember"
	Good = 3, // "Normal recall"
	Easy = 4, // "Super easy"
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
