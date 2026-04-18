function Bone({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ background: '#242424', borderRadius: '6px', ...style }}
    />
  )
}

export function HomePageSkeleton() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px' }}>
      <Bone style={{ height: '44px', width: '220px', marginBottom: '32px', borderRadius: '4px' }} />

      <div style={{ background: '#161616', border: '1px solid #272727', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <Bone style={{ height: '10px', width: '70px', marginBottom: '14px' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <Bone style={{ height: '40px', width: '150px', flexShrink: 0 }} />
          <Bone style={{ height: '40px', flex: 1 }} />
          <Bone style={{ height: '40px', width: '80px', flexShrink: 0 }} />
        </div>
      </div>

      <div style={{ background: '#161616', border: '1px solid #272727', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ borderBottom: '1px solid #272727', padding: '12px 20px', display: 'flex', gap: '40px' }}>
          <Bone style={{ height: '10px', width: '40px' }} />
          <Bone style={{ height: '10px', width: '80px' }} />
        </div>
        <TableRowsSkeleton rows={5} />
      </div>
    </div>
  )
}

export function TableRowsSkeleton({ rows = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i} style={{ borderBottom: '1px solid #1e1e1e' }}>
          <td style={{ padding: '14px 20px' }}>
            <Bone style={{ height: '14px', width: '56px', animationDelay: `${i * 50}ms` }} />
          </td>
          <td style={{ padding: '14px 20px' }}>
            <Bone style={{
              height: '14px',
              width: `${[120, 160, 100, 145, 175][i % 5]}px`,
              animationDelay: `${i * 50}ms`,
            }} />
          </td>
          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
            <Bone style={{ height: '10px', width: '44px', marginLeft: 'auto', animationDelay: `${i * 50}ms` }} />
          </td>
        </tr>
      ))}
    </tbody>
  )
}

export function AuthPageSkeleton() {
  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <Bone style={{ height: '56px', width: '56px', borderRadius: '50%' }} />
          <Bone style={{ height: '40px', width: '180px', borderRadius: '4px' }} />
          <Bone style={{ height: '14px', width: '220px' }} />
        </div>
        <div style={{ background: '#161616', border: '1px solid #272727', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Bone style={{ height: '10px', width: '40px' }} />
            <Bone style={{ height: '40px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Bone style={{ height: '10px', width: '56px' }} />
            <Bone style={{ height: '40px' }} />
          </div>
          <Bone style={{ height: '44px' }} />
        </div>
      </div>
    </div>
  )
}
