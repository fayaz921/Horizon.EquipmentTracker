interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Generate deterministic pleasant background color from name
function stringToColor(str: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const palettes = [
    { bg: '#DBEAFE', text: '#1E40AF' }, // blue
    { bg: '#E0E7FF', text: '#3730A3' }, // indigo
    { bg: '#F3E8FF', text: '#6B21A8' }, // purple
    { bg: '#FCE7F3', text: '#9D174D' }, // pink
    { bg: '#DCFCE7', text: '#166534' }, // emerald
    { bg: '#FEF3C7', text: '#92400E' }, // amber
    { bg: '#FFEDD5', text: '#9A3412' }, // orange
    { bg: '#CFFAFE', text: '#155E75' }, // cyan
  ]
  const index = Math.abs(hash) % palettes.length
  return palettes[index]
}

export const Avatar = ({ name, size = 'md', className = '' }: AvatarProps) => {
  const initials = getInitials(name)
  const { bg, text } = stringToColor(name)

  const sizeStyles = {
    sm: { width: 28, height: 28, fontSize: 11 },
    md: { width: 36, height: 36, fontSize: 13 },
    lg: { width: 44, height: 44, fontSize: 16 },
  }[size]

  return (
    <div
      className={`d-inline-flex align-items-center justify-content-center rounded-circle fw-bold user-select-none flex-shrink-0 ${className}`}
      style={{
        width: sizeStyles.width,
        height: sizeStyles.height,
        fontSize: sizeStyles.fontSize,
        backgroundColor: bg,
        color: text,
      }}
      title={name}
      aria-label={`Avatar for ${name}`}
    >
      {initials}
    </div>
  )
}
