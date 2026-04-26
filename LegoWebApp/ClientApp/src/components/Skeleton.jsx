function Bone({ style = {} }) {
  return (
    <div
      className="animate-pulse"
      style={{ background: '#e8e3db', borderRadius: '6px', ...style }}
    />
  )
}

export function HomePageSkeleton() {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '56px 40px' }}>
      <Bone style={{ height: '52px', width: '260px', marginBottom: '36px', borderRadius: '6px' }} />

      <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: '16px', padding: '32px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(24,24,27,0.07)' }}>
        <Bone style={{ height: '10px', width: '80px', marginBottom: '18px' }} />
        <Bone style={{ height: '50px' }} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(24,24,27,0.07)' }}>
        <div style={{ borderBottom: '1px solid #e5e0d8', padding: '16px 28px', display: 'flex', gap: '60px' }}>
          <Bone style={{ height: '10px', width: '44px' }} />
          <Bone style={{ height: '10px', width: '88px' }} />
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
        <tr key={i} style={{ borderBottom: '1px solid #ede9e3' }}>
          <td style={{ padding: '18px 28px' }}>
            <Bone style={{ height: '14px', width: '60px', animationDelay: `${i * 50}ms` }} />
          </td>
          <td style={{ padding: '18px 28px' }}>
            <Bone style={{
              height: '14px',
              width: `${[130, 170, 110, 155, 185][i % 5]}px`,
              animationDelay: `${i * 50}ms`,
            }} />
          </td>
          <td style={{ padding: '10px 16px', width: '80px' }}>
            <Bone style={{ height: '56px', width: '56px', borderRadius: '8px', margin: '0 auto', animationDelay: `${i * 50}ms` }} />
          </td>
          <td style={{ padding: '18px 28px', textAlign: 'right' }}>
            <Bone style={{ height: '10px', width: '48px', marginLeft: 'auto', animationDelay: `${i * 50}ms` }} />
          </td>
        </tr>
      ))}
    </tbody>
  )
}

export function AuthPageSkeleton() {
  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <Bone style={{ height: '56px', width: '56px', borderRadius: '50%' }} />
          <Bone style={{ height: '44px', width: '200px', borderRadius: '6px' }} />
          <Bone style={{ height: '14px', width: '240px' }} />
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <Bone style={{ height: '10px', width: '44px' }} />
            <Bone style={{ height: '48px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <Bone style={{ height: '10px', width: '60px' }} />
            <Bone style={{ height: '48px' }} />
          </div>
          <Bone style={{ height: '48px' }} />
        </div>
      </div>
    </div>
  )
}
