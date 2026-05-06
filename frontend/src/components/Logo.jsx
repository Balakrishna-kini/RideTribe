import React from 'react'

const Logo = ({ size = 'medium', variant = 'light', showText = true }) => {
  const sizes = {
    small: { icon: 28, text: '1rem', gap: 6 },
    medium: { icon: 36, text: '1.3rem', gap: 8 },
    large: { icon: 52, text: '2rem', gap: 12 },
    xlarge: { icon: 72, text: '2.8rem', gap: 16 },
  }

  const s = sizes[size] || sizes.medium
  const textColor = variant === 'dark' ? '#0A0A0A' : '#FFFFFF'
  const accentColor = '#FF6B00'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap, textDecoration: 'none' }}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Road / Highway perspective icon – matching the reference image */}
        {/* Two converging road lines forming a highway vanishing point */}
        <path
          d="M12 56 L28 8 L36 8 L52 56 Z"
          fill={accentColor}
        />
        {/* Center dashed line (road markings) */}
        <rect x="30" y="14" width="4" height="6" rx="1" fill="#0A0A0A" />
        <rect x="29.5" y="24" width="5" height="7" rx="1" fill="#0A0A0A" />
        <rect x="28.5" y="35" width="7" height="8" rx="1" fill="#0A0A0A" />
        <rect x="27" y="47" width="10" height="9" rx="1" fill="#0A0A0A" />
      </svg>
      {showText && (
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: s.text,
            letterSpacing: '-0.02em',
            color: textColor,
            lineHeight: 1,
          }}
        >
          Rider
          <span style={{ color: accentColor }}>Tribe</span>
        </span>
      )}
    </div>
  )
}

export default Logo
