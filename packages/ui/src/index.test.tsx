import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ShellBadge } from "./index";

describe("ShellBadge", () => {
  it("renders the supplied label", () => {
    const html = renderToStaticMarkup(<ShellBadge label="API online" />);

    expect(html).toContain("API online");
  });
});
