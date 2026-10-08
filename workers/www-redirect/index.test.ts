import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "./index.ts";

test("www redirects to the apex with 301, keeping path and query", async () => {
	const res = await worker.fetch(
		new Request("https://www.huanmeng.si/posts/hello-huanmeng/?from=rss#top"),
	);
	assert.equal(res.status, 301);
	assert.equal(
		res.headers.get("location"),
		"https://huanmeng.si/posts/hello-huanmeng/?from=rss",
	);
});

test("bare www root redirects to the apex root", async () => {
	const res = await worker.fetch(new Request("http://www.huanmeng.si/"));
	assert.equal(res.status, 301);
	assert.equal(res.headers.get("location"), "https://huanmeng.si/");
});
