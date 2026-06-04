export interface HomePageCopy {
  title: string;
  subtitle: string;
  badge: string;
}

export function getHomePageCopy(): HomePageCopy {
  return {
    title: "开发者讨论工作台",
    subtitle: "围绕工程实践、接口设计、部署运行和协作问题展开讨论。",
    badge: "BBS 社区"
  };
}
