export interface HomePageCopy {
  title: string;
  subtitle: string;
  badge: string;
}

export function getHomePageCopy(): HomePageCopy {
  return {
    title: "开发者技术社区",
    subtitle: "浏览分区主题，登录后发布问题、经验和实践记录。",
    badge: "BBS Community"
  };
}
