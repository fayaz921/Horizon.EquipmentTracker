/**
 * Utility for opening or generating WhatsApp reminder links.
 */

export function openWhatsAppReminder(url: string | null | undefined): void {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}
