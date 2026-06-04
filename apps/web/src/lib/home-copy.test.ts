import { describe, expect, it } from "vitest";
import { getHomePageCopy } from "./home-copy";

describe("getHomePageCopy", () => {
  it("describes a usable technical community frontend", () => {
    expect(getHomePageCopy()).toEqual({
      title: "开发者讨论工作台",
      subtitle: "围绕工程实践、接口设计、部署运行和协作问题展开讨论。",
      badge: "BBS 社区"
    });
  });
});
