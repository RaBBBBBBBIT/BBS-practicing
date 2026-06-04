import Link from "next/link";
import { AuthForm } from "../../components/auth-form";

export default function LoginPage() {
  return (
    <main className="page-shell narrow">
      <nav className="top-nav" aria-label="论坛导航">
        <Link href="/">首页</Link>
        <Link href="/register">注册</Link>
      </nav>
      <section className="auth-layout">
        <p className="eyebrow">账号登录</p>
        <h1>登录账号</h1>
        <p>登录后可以发布主题并继续讨论。</p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
