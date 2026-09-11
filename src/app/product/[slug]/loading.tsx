export default function ProductLoading() {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Breadcrumb Skeleton */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '14px', borderRadius: '4px', backgroundColor: '#1e293b' }} />
        <span style={{ color: '#475569' }}>/</span>
        <div style={{ width: '60px', height: '14px', borderRadius: '4px', backgroundColor: '#1e293b' }} />
        <span style={{ color: '#475569' }}>/</span>
        <div style={{ width: '120px', height: '14px', borderRadius: '4px', backgroundColor: '#1e293b' }} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'start',
        }}
      >
        {/* Gallery Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              width: '100%',
              aspectRatio: '4/3',
              borderRadius: '12px',
              backgroundColor: '#1e293b',
              animation: 'diecastPulse 1.5s ease-in-out infinite',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  animation: 'diecastPulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        </div>

        {/* Product Details Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Brand & Scale pill */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '70px', height: '22px', borderRadius: '6px', backgroundColor: '#1e293b' }} />
            <div style={{ width: '50px', height: '22px', borderRadius: '6px', backgroundColor: '#1e293b' }} />
          </div>

          {/* Title */}
          <div style={{ width: '85%', height: '32px', borderRadius: '6px', backgroundColor: '#1e293b' }} />

          {/* Price */}
          <div style={{ width: '140px', height: '36px', borderRadius: '6px', backgroundColor: '#1e293b' }} />

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#334155', margin: '8px 0' }} />

          {/* Color Selector Skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ width: '90px', height: '16px', borderRadius: '4px', backgroundColor: '#1e293b' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#1e293b',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <div
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                animation: 'diecastPulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                animation: 'diecastPulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes diecastPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
