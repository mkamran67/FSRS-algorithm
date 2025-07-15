export function calcElapsedDays(lastReviewDate: Date | null | undefined, now: Date): number {
	if (lastReviewDate) {
		return Math.max(
			0,
			Math.floor((now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24))
		);
	}

	return 0;
}
