import { useState, useRef, useEffect } from 'react';
import styles from './CustomDropdown.module.css';

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (val: string) => void;
}

export default function CustomDropdown({ label, value, options, onChange }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.dropdownHeader} onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption?.label}</span>
        <svg className={`${styles.icon} ${isOpen ? styles.open : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      {isOpen && (
        <div className={styles.dropdownList}>
          {options.map((opt) => (
            <div 
              key={opt.value} 
              className={`${styles.dropdownItem} ${opt.value === value ? styles.selected : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
