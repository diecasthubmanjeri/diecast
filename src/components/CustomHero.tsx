'use client';
import styles from './CustomHero.module.css';

export default function CustomHero() {
  return (
    <div className={styles.heroSection}>
      <div className={styles.contentWrapper}>
        <div className={styles.leftContent}>
          <div className={styles.textContent}>
            <div className={styles.logoContainer}>
              <span className={styles.logoDiecast}>DIECAST</span>
              <div className={styles.logoHubWrapper}>
                <span className={styles.logoHub}>HUB</span>
              </div>
            </div>
            <h1 className={styles.heroTitle}>
              PRECISION<br />
              IN EVERY <span className={styles.textBlue}>DETAIL.</span>
            </h1>
            <h2 className={styles.heroSubtitle}>
              FOR COLLECTORS.<br />
              BY COLLECTORS.
            </h2>
            <div className={styles.titleDivider}></div>
          </div>
        </div>

        <div className={styles.rightContent}>
          <img 
            src="/Gemini_Generated_Image_d8d1oxd8d1oxd8d1.png" 
            alt="Diecast Car" 
            className={styles.heroImage} 
          />
        </div>

        {/* <div className={styles.bottomSection}>
          <div className={styles.featuresContainer}>
            <div className={styles.featureItem}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 19v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1" />
                <path d="M15 19v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1" />
                <path d="M3 10l1.5-4h15L21 10" />
                <path d="M2.5 10a2.5 2.5 0 0 0 0 5h19a2.5 2.5 0 0 0 0-5H2.5z" />
                <circle cx="6" cy="12" r="1" />
                <circle cx="18" cy="12" r="1" />
              </svg>
              <span>TRUE TO SCALE</span>
            </div>
            <div className={styles.featureDivider}></div>
            <div className={styles.featureItem}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>PREMIUM<br/>QUALITY</span>
            </div>
            <div className={styles.featureDivider}></div>
            <div className={styles.featureItem}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v7" />
                <path d="M22 12h-7" />
                <path d="M12 22v-7" />
                <path d="M2 12h7" />
              </svg>
              <span>REALISTIC<br/>DETAILS</span>
            </div>
            <div className={styles.featureDivider}></div>
            <div className={styles.featureItem}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
              <span>COLLECTOR<br/>GRADE</span>
            </div>
          </div>

          <div className={styles.bottomRightText}>
            DETAILS THAT<br />
            <span className={styles.textBlue}>MAKE THE DIFFERENCE.</span>
            <div className={styles.accentBars}>
              <div className={styles.accentBarWhite}></div>
              <div className={styles.accentBarBlue}></div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
