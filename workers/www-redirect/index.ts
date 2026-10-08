// www.huanmeng.si → https://huanmeng.si, 301, path and query kept.
// A Worker instead of a Redirect Rule because the deploy token has no Dynamic Redirect permission.
const APEX = "https://huanmeng.si";

export default {
	async fetch(request: Request): Promise<Response> {
		const { pathname, search } = new URL(request.url);
		return Response.redirect(`${APEX}${pathname}${search}`, 301);
	},
};
