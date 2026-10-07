// 幻梦小站定制层配置（Firefly 没有的功能放这里，避免改动上游 schema）
export const huanmengConfig: { featuredProjects: string[] } = {
	// 首页「精选项目」：src/content/projects 下的文件名（不含扩展名），按顺序最多显示 3 个
	featuredProjects: ["llm-factor-platform", "waterline-ai-inspector"],
};
