interface TagListProps {
  tags: string[];
  className?: string;
  ariaLabel?: string;
}

export function TagList({ tags, className, ariaLabel = "标签" }: TagListProps) {
  if (tags.length === 0) {
    return null;
  }

  const classes = ["tag-list", className].filter(Boolean).join(" ");

  return (
    <div className={classes} aria-label={ariaLabel}>
      {tags.map((tag) => (
        <span className={`tag-pill ${getTagTone(tag)}`} key={tag}>
          {getTagLabel(tag)}
        </span>
      ))}
    </div>
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
    unanswered: "待回复"
  };

  return labels[tag] ?? tag;
}
