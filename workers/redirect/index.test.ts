import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "./index.ts";

test("apex redirects to the blog subdomain with 302, keeping path and query", async () => {
	const res = await worker.fetch(
		new Request("https://huanmeng.si/posts/hello-huanmeng/?from=rss#top"),
	);
	assert.equal(res.status, 302);
	assert.equal(
		res.headers.get("location"),
		"https://blogs.huanmeng.si/posts/hello-huanmeng/?from=rss",
	);
});

test("www root redirects to the blog subdomain root", async () => {
	const res = await worker.fetch(new Request("http://www.huanmeng.si/"));
	assert.equal(res.status, 302);
	assert.equal(res.headers.get("location"), "https://blogs.huanmeng.si/");
});
