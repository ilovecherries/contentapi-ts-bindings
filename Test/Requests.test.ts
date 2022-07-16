import { expect, describe, it } from "vitest";
import { ContentAPI, getPageRequest } from "../Helpers";
import type { GetPageResult } from "../Helpers";

const api = new ContentAPI("oboy.smilebasicsource.com");

describe("api requests", () => {
	it("Basic page request", async () => {
		const id = 384;
		const title = "Off-Topic Megathread";
		const result = await api.request<GetPageResult>(getPageRequest(id));
		expect(result.objects.content.at(0)?.name).equals(title);
	});
});
