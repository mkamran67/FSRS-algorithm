export function calcElapsedDays(
	lastReviewDate: Date | null | undefined,
	currentDate: Date
): number {
	if (lastReviewDate) {
		return Math.max(
			0,
			Math.floor((currentDate.getTime() - lastReviewDate.getTime()) / (100 * 60 * 60 * 24))
		);
	}

	return 0;
}
