import { calcElapsedDays } from "../../utils/timeFuncs";

describe("timeFuncs", () => {
	test("should get a 0 for null date", () => {
		const result = calcElapsedDays(null, new Date());

		expect(result).toBe(0);
	});
});
