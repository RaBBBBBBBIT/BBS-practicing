import Link from "next/link";

export type CommunityTab = "overview" | "categories" | "discussions" | "members" | "labels";

const communityTabs: Array<{ id: CommunityTab; href: string; label: string }> = [
  { id: "overview", href: "/", label: "概览" },
  { id: "categories", href: "/#categories", label: "分区" },
  { id: "discussions", href: "/#discussions", label: "讨论" },
  { id: "members", href: "/members", label: "成员" },
  { id: "labels", href: "/tags", label: "标签" }
];

export function GlobalTopBar() {
  return (
    <header className="global-topbar">
      <div className="topbar-brand">
        <span className="brand-mark" aria-hidden="true">
          B
        </span>
        <Link href="/">BBS 社区</Link>
      </div>
      <label className="topbar-search">
        <span className="sr-only">搜索讨论</span>
        <input type="search" placeholder="搜索或跳转..." />
      </label>
      <nav className="topbar-links" aria-label="主导航">
        <Link href="/#discussions">讨论</Link>
        <Link href="/#categories">分区</Link>
        <Link href="/tags">标签</Link>
        <Link href="/members">成员</Link>
        <Link href="/notifications">通知</Link>
        <Link href="/messages">私信</Link>
      </nav>
      <nav className="topbar-auth" aria-label="用户操作">
        <Link href="/login">登录</Link>
        <Link className="topbar-signup" href="/register">
          注册
        </Link>
      </nav>
    </header>
  );
}

export function CommunityTabs({ active = "overview" }: { active?: CommunityTab }) {
  return (
    <nav className="community-tabs" aria-label="社区导航">
      {communityTabs.map((tab) => (
        <Link aria-current={active === tab.id ? "page" : undefined} className={active === tab.id ? "is-active" : undefined} href={tab.href} key={tab.id}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
