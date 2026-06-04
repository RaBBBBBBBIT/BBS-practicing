import Link from "next/link";

interface TagListProps {
  tags: string[];
  className?: string;
  ariaLabel?: string;
  linked?: boolean;
}

export function TagList({ tags, className, ariaLabel = "标签", linked = true }: TagListProps) {
  if (tags.length === 0) {
    return null;
  }

  const classes = ["tag-list", className].filter(Boolean).join(" ");

  return (
    <div className={classes} aria-label={ariaLabel}>
      {tags.map((tag) => (
        <TagPill key={tag} tag={tag} linked={linked} />
      ))}
    </div>
  );
}

function TagPill({ tag, linked }: { tag: string; linked: boolean }) {
  const className = `tag-pill ${getTagTone(tag)}`;
  const label = getTagLabel(tag);

  if (!linked) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link className={className} href={`/?tag=${encodeURIComponent(tag)}`}>
      {label}
    </Link>
  );
}

function getTagTone(tag: string): string {
  if (["auth", "bug", "security"].includes(tag)) {
    return "tag-danger";
  }

  if (["solved", "answered", "frontend", "devops"].includes(tag)) {
    return "tag-success";
  }

  if (["unanswered", "open", "architecture"].includes(tag)) {
    return "tag-state";
  }

  if (["docker", "postgresql", "prisma", "nextjs", "nestjs", "api", "react"].includes(tag)) {
    return "tag-tech";
  }

  return "tag-neutral";
}

export function getTagLabel(tag: string): string {
  const labels: Record<string, string> = {
    answered: "已回复",
    api: "接口",
    architecture: "架构",
    auth: "认证",
    bug: "缺陷",
    devops: "运维",
    frontend: "前端",
    open: "开放",
    security: "安全",
    solved: "已解决",
    locked: "已锁定",
    unanswered: "待回复"
  };

  return labels[tag] ?? tag;
}
