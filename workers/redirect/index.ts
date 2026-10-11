// huanmeng.si and www.huanmeng.si → https://blogs.huanmeng.si, path and query kept.
// 302, not 301: browsers cache a 301 indefinitely, which would pin visitors to the blog
// if the apex later hosts something else.
// A Worker instead of a Redirect Rule because the deploy token has no Dynamic Redirect permission.
const BLOG = "https://blogs.huanmeng.si";

export default {
	async fetch(request: Request): Promise<Response> {
		const { pathname, search } = new URL(request.url);
		return Response.redirect(`${BLOG}${pathname}${search}`, 302);
	},
};
