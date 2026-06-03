export interface ShellBadgeProps {
  label: string;
}

export function ShellBadge({ label }: ShellBadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid #d0d7de",
        borderRadius: 6,
        padding: "4px 8px",
        fontSize: 12,
        fontWeight: 600,
        color: "#0969da",
        background: "#f6f8fa"
      }}
    >
      {label}
    </span>
  );
}
