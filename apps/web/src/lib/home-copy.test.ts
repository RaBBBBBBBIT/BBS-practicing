import { describe, expect, it } from "vitest";
import { getHomePageCopy } from "./home-copy";

describe("getHomePageCopy", () => {
  it("describes a usable technical community frontend", () => {
    expect(getHomePageCopy()).toEqual({
      title: "开发者技术社区",
      subtitle: "浏览分区主题，登录后发布问题、经验和实践记录。",
      badge: "BBS Community"
    });
  });
});
