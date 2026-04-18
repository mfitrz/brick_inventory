export default function FormField({ label, hint, ...inputProps }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '7px',
      }}>
        {label}
      </label>
      <input {...inputProps} />
      {hint && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '5px' }}>
          {hint}
        </p>
      )}
    </div>
  )
}
