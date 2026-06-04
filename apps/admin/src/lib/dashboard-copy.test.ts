import { describe, expect, it } from "vitest";
import { getDashboardCopy } from "./dashboard-copy";

describe("getDashboardCopy", () => {
  it("describes the moderation dashboard", () => {
    expect(getDashboardCopy()).toEqual({
      title: "管理后台",
      subtitle: "处理内容审核、举报、用户和分区治理",
      badge: "后台控制台"
    });
  });
});
