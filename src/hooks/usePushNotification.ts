import { useState, useEffect, useCallback } from "react";

const PERMISSION_KEY = "tempmail_push_permission_asked";

export function usePushNotification() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.log("Push notifications not supported");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem(PERMISSION_KEY, "true");
      return result === "granted";
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== "granted") {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        tag: "tempmail-notification",
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Focus window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error("Failed to send notification:", error);
      return null;
    }
  }, [isSupported, permission]);

  const hasAskedPermission = localStorage.getItem(PERMISSION_KEY) === "true";

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    hasAskedPermission,
    isGranted: permission === "granted",
    isDenied: permission === "denied",
  };
}
