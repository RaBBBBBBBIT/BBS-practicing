import { describe, expect, it } from "vitest";
import { getHomePageCopy } from "./home-copy";

describe("getHomePageCopy", () => {
  it("describes the technical BBS user frontend", () => {
    expect(getHomePageCopy()).toEqual({
      title: "技术讨论与社区分享",
      subtitle: "面向开发者的主题讨论、经验沉淀和社区互动空间",
      badge: "User Frontend"
    });
  });
});
