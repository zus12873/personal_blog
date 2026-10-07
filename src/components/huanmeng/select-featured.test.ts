import assert from "node:assert/strict";
import { test } from "node:test";
import { selectFeatured } from "./select-featured.ts";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
const ids = (list: { id: string }[]) => list.map((item) => item.id);

test("按名单顺序挑选", () => {
	assert.deepEqual(ids(selectFeatured(items, ["c", "a"])), ["c", "a"]);
});

test("跳过不存在的 id", () => {
	assert.deepEqual(ids(selectFeatured(items, ["x", "b"])), ["b"]);
});

test("重复 id 只取一次", () => {
	assert.deepEqual(ids(selectFeatured(items, ["a", "a", "b"])), ["a", "b"]);
});

test("最多取 max 个，默认 3", () => {
	assert.equal(selectFeatured(items, ["a", "b", "c", "d"]).length, 3);
	assert.equal(selectFeatured(items, ["a", "b", "c"], 2).length, 2);
});

test("名单为空返回空数组", () => {
	assert.deepEqual(selectFeatured(items, []), []);
});
