import styles from './ProductCard.module.css';

export default function ProductSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true" style={{ opacity: 0.65, pointerEvents: 'none' }}>
      <div className={styles.imageWrapper} style={{ backgroundColor: '#f1f5f9' }}>
        <div className={styles.imageContainer} style={{ backgroundColor: 'transparent' }} />
      </div>
      <div className={styles.content}>
        <div className={styles.meta} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ height: '12px', width: '50px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
          <div style={{ height: '12px', width: '35px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
        </div>
        <div style={{ height: '18px', width: '80%', backgroundColor: '#e2e8f0', borderRadius: '4px', margin: '10px 0 8px' }} />
        <div className={styles.priceRow}>
          <div style={{ height: '20px', width: '70px', backgroundColor: '#cbd5e1', borderRadius: '4px' }} />
        </div>
      </div>
    </div>
  );
}
