export function ManualNote({ children }) {
  return (
    <div style={{
      background: 'var(--primary-light)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      borderRadius: 'var(--radius-sm)',
      padding: '0.75rem 1rem',
      marginBottom: '1rem',
      fontSize: '0.875rem',
      color: 'var(--text-2)',
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
      <span>{children}</span>
    </div>
  );
}

export function ManualTip({ children }) {
  return (
    <div style={{
      background: '#f0fdf4',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: 'var(--radius-sm)',
      padding: '0.75rem 1rem',
      marginBottom: '1rem',
      fontSize: '0.875rem',
      color: 'var(--text-2)',
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
      <span>{children}</span>
    </div>
  );
}

export function ManualWarning({ children }) {
  return (
    <div style={{
      background: '#fffbeb',
      border: '1px solid rgba(245, 158, 11, 0.2)',
      borderRadius: 'var(--radius-sm)',
      padding: '0.75rem 1rem',
      marginBottom: '1rem',
      fontSize: '0.875rem',
      color: 'var(--text-2)',
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
      <span>{children}</span>
    </div>
  );
}

export function ManualStep({ number, title, children }) {
  return (
    <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '1rem' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'var(--primary)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: 2,
      }}>
        {number}
      </div>
      <div style={{ flex: 1 }}>
        {title && <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text)' }}>{title}</p>}
        <div style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

export function ManualSteps({ children }) {
  return (
    <div style={{ margin: '1rem 0 1.5rem' }}>
      {children}
    </div>
  );
}

export function ManualTable({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '0.5rem 0.75rem',
                borderBottom: '2px solid var(--border)',
                color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid var(--border-light)' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '0.5rem 0.75rem', color: 'var(--text-2)', verticalAlign: 'top' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
