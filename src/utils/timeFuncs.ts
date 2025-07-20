export function calcElapsedDays(lastReviewDate: Date | null | undefined, now: Date): number {
	if (lastReviewDate) {
		if (isValidDate(new Date(lastReviewDate))) {
			return Math.max(
				0,
				Math.floor((now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24))
			);
		} else {
			console.warn("Invalid date provided, make sure your dates are valid dates!");
		}
	}

	return 0;
}

export function isValidDate(date: any): boolean {
	// An invalid date object returns NaN for getTime()
	return date instanceof Date && !isNaN(date.getTime());
}
