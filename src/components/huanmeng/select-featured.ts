/** 按名单顺序从 items 中挑出精选条目：跳过不存在的 id、去重、最多 max 个 */
export function selectFeatured<T extends { id: string }>(
	items: readonly T[],
	ids: readonly string[],
	max = 3,
): T[] {
	const byId = new Map(items.map((item) => [item.id, item]));
	const picked: T[] = [];
	for (const id of ids) {
		if (picked.length >= max) break;
		const item = byId.get(id);
		if (item && !picked.includes(item)) picked.push(item);
	}
	return picked;
}
