export default function Panel({ children, className = '', glow = false, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={`bg-ink-panel border border-ink-border rounded-lg shadow-panel ${
        glow ? 'shadow-glow' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
