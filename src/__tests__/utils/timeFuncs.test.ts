import { calcElapsedDays, isValidDate } from "../../utils/timeFuncs";

describe("timeFuncs", () => {
	describe("isValidDate", () => {
		test("returns true for valid Date objects", () => {
			expect(isValidDate(new Date())).toBe(true);
			expect(isValidDate(new Date("2023-01-01"))).toBe(true);
			expect(isValidDate(new Date(2023, 0, 1))).toBe(true);
			expect(isValidDate(new Date(1640995200000))).toBe(true); // timestamp
		});

		test("returns false for invalid Date objects", () => {
			expect(isValidDate(new Date("invalid-date"))).toBe(false);
			expect(isValidDate(new Date("not a date"))).toBe(false);
			expect(isValidDate(new Date(""))).toBe(false);
			expect(isValidDate(new Date(NaN))).toBe(false);
		});

		test("returns false for non-Date objects", () => {
			expect(isValidDate(null)).toBe(false);
			expect(isValidDate(undefined)).toBe(false);
			expect(isValidDate("2023-01-01")).toBe(false);
			expect(isValidDate(1640995200000)).toBe(false);
			expect(isValidDate({})).toBe(false);
			expect(isValidDate([])).toBe(false);
			expect(isValidDate(true)).toBe(false);
			expect(isValidDate(false)).toBe(false);
		});

		test("should return false for date string", () => {
			const result = isValidDate("2025-07-19T22:52:36.294Z");

			expect(result).toBe(false);
		});

		test("should return false for invalid date string", () => {
			const result = isValidDate("not a valid date");

			expect(result).toBe(false);
		});

		test("should return true for valid date object", () => {
			const result = isValidDate(new Date());

			expect(result).toBe(true);
		});

		test("should return true for valid date object", () => {
			const result = isValidDate(new Date("2025-07-19T22:52:36.294Z"));

			expect(result).toBe(true);
		});
	});

	describe("calcElapsedDays", () => {
		const mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});

		beforeEach(() => {
			mockConsoleWarn.mockClear();
		});

		afterAll(() => {
			mockConsoleWarn.mockRestore();
		});

		test("should get a 0 for null date", () => {
			const result = calcElapsedDays(null, new Date());

			expect(result).toBe(0);
		});

		test("should get a 0 for invalid date", () => {
			//@ts-ignore
			const result = calcElapsedDays(null, "Not a valid date");

			expect(result).toBe(0);
		});

		test("calculates correct elapsed days for valid dates", () => {
			const now = new Date("2023-01-10T12:00:00Z");
			const lastReviewDate = new Date("2023-01-05T12:00:00Z");

			expect(calcElapsedDays(lastReviewDate, now)).toBe(5);
		});

		test("calculates correct elapsed days for dates with different times", () => {
			const now = new Date("2023-01-10T23:59:59Z");
			const lastReviewDate = new Date("2023-01-05T00:00:01Z");

			// Should floor the result, so 5.99... days becomes 5
			expect(calcElapsedDays(lastReviewDate, now)).toBe(5);
		});

		test("returns 0 for same date", () => {
			const date = new Date("2023-01-10T12:00:00Z");

			expect(calcElapsedDays(date, date)).toBe(0);
		});

		test("returns 0 when lastReviewDate is in the future", () => {
			const now = new Date("2023-01-05T12:00:00Z");
			const futureDate = new Date("2023-01-10T12:00:00Z");

			// Math.max(0, negative_number) should return 0
			expect(calcElapsedDays(futureDate, now)).toBe(0);
		});

		test("handles large time differences correctly", () => {
			const now = new Date("2023-12-31T12:00:00Z");
			const lastReviewDate = new Date("2023-01-01T12:00:00Z");

			expect(calcElapsedDays(lastReviewDate, now)).toBe(364);
		});

		test("returns 0 for null lastReviewDate", () => {
			const now = new Date("2023-01-10T12:00:00Z");

			expect(calcElapsedDays(null, now)).toBe(0);
		});

		test("returns 0 for undefined lastReviewDate", () => {
			const now = new Date("2023-01-10T12:00:00Z");

			expect(calcElapsedDays(undefined, now)).toBe(0);
		});

		test("returns 0 and logs warning for invalid lastReviewDate", () => {
			const now = new Date("2023-01-10T12:00:00Z");
			const invalidDate = new Date("invalid-date");

			const result = calcElapsedDays(invalidDate, now);

			expect(result).toBe(0);
			expect(mockConsoleWarn).toHaveBeenCalledWith(
				"Invalid date provided, make sure your dates are valid dates!"
			);
		});

		test("handles Date objects created from invalid strings", () => {
			const now = new Date("2023-01-10T12:00:00Z");
			const invalidDate = new Date("not-a-date");

			const result = calcElapsedDays(invalidDate, now);

			expect(result).toBe(0);
			expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
		});

		test("works with Date objects created from timestamps", () => {
			const now = new Date(1640995200000); // 2022-01-01 00:00:00 UTC
			const lastReviewDate = new Date(1640908800000); // 2021-12-31 00:00:00 UTC

			expect(calcElapsedDays(lastReviewDate, now)).toBe(1);
		});

		test("handles millisecond precision correctly", () => {
			const now = new Date("2023-01-02T00:00:00.999Z");
			const lastReviewDate = new Date("2023-01-01T00:00:00.001Z");

			// Should be almost exactly 1 day, should floor to 1
			expect(calcElapsedDays(lastReviewDate, now)).toBe(1);
		});

		test("does not log warning for valid dates", () => {
			const now = new Date("2023-01-10T12:00:00Z");
			const validDate = new Date("2023-01-05T12:00:00Z");

			calcElapsedDays(validDate, now);

			expect(mockConsoleWarn).not.toHaveBeenCalled();
		});
	});
});
