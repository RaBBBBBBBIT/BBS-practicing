export interface DashboardCopy {
  title: string;
  subtitle: string;
  badge: string;
}

export function getDashboardCopy(): DashboardCopy {
  return {
    title: "管理后台",
    subtitle: "处理内容审核、举报、用户和分区治理",
    badge: "Admin Console"
  };
}
