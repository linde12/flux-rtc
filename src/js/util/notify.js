class DesktopNotification {
  constructor (opts) {
    if (window.Notification) {
      if (Notification.permission === 'granted') {
        // Have permission
        new Notification(opts.title, opts);
      } else if (Notification.permission !== 'denied') {
        // Request permission
        Notification.requestPermission(() => {
          new Notification(opts.title, opts);
        });
      }
    }
  }
}

export default DesktopNotification;
