export default function GlobalLoading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '3px solid #1e293b',
          borderTopColor: '#38bdf8',
          animation: 'diecastSpin 0.75s linear infinite',
        }}
      />
      <style>{`
        @keyframes diecastSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px' }}>
        Loading Diecast Hub...
      </p>
    </div>
  );
}
