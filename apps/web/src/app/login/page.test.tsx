import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

vi.mock("../../components/auth-form", () => ({
  AuthForm: ({ mode }: { mode: string }) => <form data-mode={mode}>auth form</form>
}));

describe("LoginPage", () => {
  it("renders the login form and registration link", () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain("登录账号");
    expect(html).toContain('data-mode="login"');
    expect(html).toContain("/register");
  });
});
