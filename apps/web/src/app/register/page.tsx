import Link from "next/link";
import { AuthForm } from "../../components/auth-form";

export default function RegisterPage() {
  return (
    <main className="page-shell narrow">
      <nav className="top-nav" aria-label="论坛导航">
        <Link href="/">首页</Link>
        <Link href="/login">登录</Link>
      </nav>
      <section className="auth-layout">
        <p className="eyebrow">新用户注册</p>
        <h1>注册账号</h1>
        <p>创建账号后可以马上发布你的第一个主题。</p>
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
