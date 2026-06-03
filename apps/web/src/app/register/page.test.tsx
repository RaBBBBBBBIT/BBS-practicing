import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RegisterPage from "./page";

vi.mock("../../components/auth-form", () => ({
  AuthForm: ({ mode }: { mode: string }) => <form data-mode={mode}>auth form</form>
}));

describe("RegisterPage", () => {
  it("renders the registration form and login link", () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain("注册账号");
    expect(html).toContain('data-mode="register"');
    expect(html).toContain("/login");
  });
});
