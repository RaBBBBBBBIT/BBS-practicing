export interface HomePageCopy {
  title: string;
  subtitle: string;
  badge: string;
}

export function getHomePageCopy(): HomePageCopy {
  return {
    title: "技术讨论与社区分享",
    subtitle: "面向开发者的主题讨论、经验沉淀和社区互动空间",
    badge: "User Frontend"
  };
}
