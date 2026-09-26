/**
 * Browser notifications about new requests. Chrome on Android shows them only from a service
 * worker (the Notification constructor throws there), so phones rely on the in-page toast.
 */
export const notificationsSupported = 'Notification' in window && !/Android/i.test(navigator.userAgent)

export function notify(title: string, options: NotificationOptions) {
  if (!notificationsSupported || Notification.permission !== 'granted') return
  try {
    new Notification(title, options)
  } catch (error) {
    console.warn('Could not show a notification', error)
  }
}
