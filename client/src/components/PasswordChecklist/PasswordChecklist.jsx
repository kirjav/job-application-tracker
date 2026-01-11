export default function PasswordChecklist({ checks, show = false, id = "password-requirements" }) {
  if (!show) return null;

  return (
    <ul
      id={id}
      style={{
        fontSize: 12,
        marginTop: 8,
        paddingLeft: 16,
        lineHeight: 1.4,
      }}
    >
      {checks.map((c) => (
        <li key={c.key} style={{ opacity: c.valid ? 1 : 0.7 }}>
          {c.valid ? "✓" : "✗"} {c.label}
        </li>
      ))}
    </ul>
  );
}
