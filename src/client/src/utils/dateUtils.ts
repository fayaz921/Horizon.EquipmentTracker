/** Pakistan Standard Time offset in minutes: UTC+05:00 */
const PKT_OFFSET_MINUTES = 5 * 60

/**
 * Returns current date string in Pakistan Standard Time (yyyy-MM-dd).
 */
export function getTodayPkt(): string {
  const now = new Date()
  const pktMs = now.getTime() + PKT_OFFSET_MINUTES * 60 * 1000
  const pktDate = new Date(pktMs)
  return pktDate.toISOString().slice(0, 10)
}

/**
 * Returns tomorrow's date string in Pakistan Standard Time (yyyy-MM-dd).
 */
export function getTomorrowPkt(): string {
  const now = new Date()
  const pktMs = now.getTime() + PKT_OFFSET_MINUTES * 60 * 1000
  const pktDate = new Date(pktMs)
  pktDate.setUTCDate(pktDate.getUTCDate() + 1)
  return pktDate.toISOString().slice(0, 10)
}

/**
 * Formats an ISO-8601 date string (yyyy-MM-dd) to a human-readable form.
 * e.g. "2026-10-25" → "25 Oct 2026"
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Karachi',
  })
}

/**
 * Formats an ISO-8601 UTC timestamp to a human-readable PKT date+time.
 * e.g. "2026-10-25T07:30:00Z" → "25 Oct 2026, 12:30 PM"
 */
export function formatTimestampPkt(isoStr: string): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Karachi',
  })
}
