'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaPhone, FaEnvelope, FaWhatsapp, FaInstagram, FaFacebook, FaMapMarkerAlt, FaRegClock } from 'react-icons/fa';
import styles from './Footer.module.css';

type PolicyModalType = 'privacy' | 'shipping' | 'refund' | 'authenticity' | null;

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState<PolicyModalType>(null);

  const closeModal = () => setActivePolicy(null);

  return (
    <>
      <footer id="footer" className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.logoSection}>
            <Link href="/">
              <Image src="/FOOTER-LOGO.png" alt="Diecast Hub Logo" width={200} height={80} style={{ width: 'auto', height: '80px' }} />
            </Link>
          </div>
          <div className={styles.grid}>
            <div>
              <h3 className={styles.heading}>SHOP</h3>
              <ul className={styles.list}>
                <li><Link href="/catalog">All Products</Link></li>
                <li><Link href="/#new-arrivals">New Arrivals</Link></li>
                <li><Link href="/#featured">Featured Models</Link></li>
                <li><Link href="/#preorders">Pre-Orders</Link></li>
                <li><Link href="/#brands">Brands</Link></li>
                <li><Link href="/#scales">Scales</Link></li>
                <li><Link href="/#categories">Categories</Link></li>
              </ul>
            </div>
            <div>
              <h3 className={styles.heading}>VISIT US</h3>
              <ul className={styles.list}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <FaMapMarkerAlt size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <a href="https://maps.app.goo.gl/MNECrUf4pB2k8xFE6?g_st=iw" target="_blank" rel="noopener noreferrer" style={{ lineHeight: '1.4' }}>
                    Manjeri,<br />
                    Kacherippadi, Kerala
                  </a>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px' }}>
                  <FaRegClock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ lineHeight: '1.4' }}>
                    10:30 AM – 10:00 PM<br />
                    All Days (Mon – Sun)
                  </div>
                </li>
                <li style={{ marginTop: '14px' }}>
                  <Link href="/diecast-cars-manjeri" style={{ color: 'var(--color-primary-light-blue, #38bdf8)', fontSize: '13px', fontWeight: 600 }}>
                    Store Details & FAQs →
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className={styles.heading}>TERMS AND CONDITIONS</h3>
              <ul className={styles.list}>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setActivePolicy('privacy')} 
                    className={styles.linkButton}
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setActivePolicy('shipping')} 
                    className={styles.linkButton}
                  >
                    Shipping & Delivery
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setActivePolicy('refund')} 
                    className={styles.linkButton}
                  >
                    Return & Refund
                  </button>
                </li>
                <li>
                  <Link href="/#WhyCollectWithDiecastHub" className={styles.linkButton}>
                    Authenticity Guarantee
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className={styles.heading}>GET IN TOUCH</h3>
              <ul className={styles.list}>
                <li>
                  <a href="tel:+918111993264" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaPhone size={18} style={{ flexShrink: 0 }} /> <span style={{ wordBreak: 'break-word' }}>+91 8111-993264</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:Diecasthubmanjeri@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaEnvelope size={18} style={{ flexShrink: 0 }} /> <span style={{ wordBreak: 'break-all' }}>Diecasthubmanjeri@gmail.com</span>
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/918111993264?text=Hello%20Diecast%20Hub!" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaWhatsapp size={18} style={{ flexShrink: 0 }} /> <span style={{ wordBreak: 'break-word' }}>Message Us</span>
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/diecast__hub_?stkn=aGFqYmV6dWtjOWN6&utm_source=qr" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaInstagram size={18} style={{ flexShrink: 0 }} /> <span style={{ wordBreak: 'break-word' }}>@diecast__hub_</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className={styles.bottom}>
            <p>© 2026 Diecast Hub. All Rights Reserved.</p>
            <div className={styles.socials}>
              <a href="https://www.instagram.com/diecast__hub_?stkn=aGFqYmV6dWtjOWN6&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FaInstagram size={18} style={{ flexShrink: 0 }} /></a>
              <a href="https://www.facebook.com/profile.php?id=61592186271650&ref=PROFILE_EDIT_xav_ig_profile_page_web" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FaFacebook size={18} style={{ flexShrink: 0 }} /></a>
              <a href="https://wa.me/918111993264?text=Hello%20Diecast%20Hub!" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <FaWhatsapp size={18} style={{ flexShrink: 0 }} /></a>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Pop Up Modal */}
      {activePolicy && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {activePolicy === 'privacy' && 'Privacy & Return Policy'}
                {activePolicy === 'refund' && 'Return & Refund Policy'}
                {activePolicy === 'shipping' && 'Shipping & Delivery Policy'}
                {activePolicy === 'authenticity' && 'Authenticity & Quality Guarantee'}
              </h3>
              <button 
                type="button" 
                className={styles.closeBtn} 
                onClick={closeModal} 
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {(activePolicy === 'refund' || activePolicy === 'privacy') && (
                <div className={styles.policyText}>
                  <h4 className={styles.policySubheading}>Return & Refund Policy</h4>
                  <p>
                    Returns are accepted only for damaged, defective, or incorrect products. Please report any issue within 48 hours of delivery with your order number, photos, and a clear unboxing video.
                  </p>
                  
                  <div className={styles.highlightNotice}>
                    <div className={styles.noticeIcon}>⚠️</div>
                    <div className={styles.noticeText}>
                      <strong>Mandatory Video Requirement:</strong>
                      <p>
                        A continuous unboxing video with no cuts, edits, or pauses is strictly mandatory for any refund, return, or replacement claims.
                      </p>
                    </div>
                  </div>

                  <p>
                    Change-of-mind returns are not accepted. Refunds or replacements are subject to product inspection and availability.
                  </p>

                  {activePolicy === 'privacy' && (
                    <div className={styles.extraSection}>
                      <h4 className={styles.policySubheading} style={{ marginTop: '20px' }}>Privacy Commitment</h4>
                      <p>
                        We respect your privacy. All customer information collected (shipping address, phone number, and email) is strictly used for order processing, delivery, and customer support. We never share or sell your personal details to third parties.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activePolicy === 'shipping' && (
                <div className={styles.policyText}>
                  <p>
                    Welcome to <strong>DIECAST HUB</strong>. We are committed to delivering your order accurately, in good condition, and always on time.
                  </p>

                  <h4 className={styles.policySubheading} style={{ marginTop: '16px' }}>1. Shipping Options & Delivery Partners</h4>
                  <p>We offer reliable shipping options across India through our trusted logistics partners:</p>
                  <ul style={{ paddingLeft: '20px', marginBottom: '14px', color: '#b8c9d9', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>Indian Post (Door-to-Door Delivery):</strong> Ideal for home delivery to all locations, including remote areas across India.</li>
                    <li><strong>Speed & Safe Courier Service:</strong> Available for fast and secure standard deliveries.</li>
                  </ul>

                  <h4 className={styles.policySubheading} style={{ marginTop: '16px' }}>Order Processing Time</h4>
                  <ul style={{ paddingLeft: '20px', marginBottom: '14px', color: '#b8c9d9', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>All orders are processed within 1 to 2 business days (excluding Sundays and public holidays) after receiving your order confirmation email.</li>
                    <li>You will receive a notification email/SMS with tracking details once your order has shipped.</li>
                  </ul>

                  <h4 className={styles.policySubheading} style={{ marginTop: '16px' }}>2. Delivery Timelines</h4>
                  <ul style={{ paddingLeft: '20px', marginBottom: '14px', color: '#b8c9d9', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>Standard Courier (Speed & Safe):</strong> Estimated delivery within 2 to 4 business days, depending on your location.</li>
                    <li><strong>Indian Post:</strong> Estimated delivery within 5 to 7 business days, depending on the destination pin code.</li>
                  </ul>

                  <h4 className={styles.policySubheading} style={{ marginTop: '16px' }}>3. Order Tracking</h4>
                  <p>
                    Once your order is dispatched, we will provide you with a Tracking ID and a link to track your shipment via the respective postal or courier service website.
                  </p>

                  <h4 className={styles.policySubheading} style={{ marginTop: '16px' }}>4. Undelivered or Delayed Packages</h4>
                  <p>
                    In case of delays caused by unforeseen circumstances, weather conditions, or postal delays, we will assist you in tracking your package. Please ensure your shipping address and contact number are correctly entered at checkout to avoid delivery issues.
                  </p>

                  <h4 className={styles.policySubheading} style={{ marginTop: '16px' }}>5. Contact Us</h4>
                  <p>If you have any questions about your order&apos;s shipping status, please reach out to us:</p>
                  <ul style={{ paddingLeft: '20px', color: '#b8c9d9', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>Email:</strong> <a href="mailto:Diecasthubmanjeri@gmail.com" style={{ color: 'var(--color-primary-light-blue)' }}>Diecasthubmanjeri@gmail.com</a></li>
                    <li><strong>Phone/WhatsApp:</strong> <a href="https://wa.me/918111993264" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-light-blue)' }}>+91 8111-993264</a></li>
                  </ul>
                </div>
              )}

              {activePolicy === 'authenticity' && (
                <div className={styles.policyText}>
                  <p>
                    Every model car available at Diecast Hub is 100% authentic, officially licensed, and sourced directly from verified manufacturers and distributors.
                  </p>
                  <p>
                    Each model undergoes rigorous inspection for paint finish, detailing, and packaging condition before shipment.
                  </p>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button 
                type="button" 
                className={styles.modalActionBtn} 
                onClick={closeModal}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
