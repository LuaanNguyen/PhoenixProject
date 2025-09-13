"use client";

import { useState, useEffect } from "react";
import { useStore } from "../(lib)/store";

interface Notification {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  timestamp: Date;
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { filteredPoints } = useStore();

  useEffect(() => {
    // Check for high PM2.5 readings - throttled for performance
    const highReadings = filteredPoints.filter((point) => point.pm25 > 75);

    if (highReadings.length > 0 && notifications.length === 0) {
      const latestHigh = highReadings[0];
      const id = `alert-${latestHigh.id}-${Date.now()}`;

      const newNotification: Notification = {
        id,
        type: "danger",
        title: "High PM2.5 Alert",
        message: `${latestHigh.id.replace(
          /_/g,
          " "
        )} - ${latestHigh.pm25.toFixed(1)} μg/m³`,
        timestamp: new Date(),
      };

      setNotifications([newNotification]);

      // Auto remove after 8 seconds
      setTimeout(() => {
        setNotifications([]);
      }, 8000);
    }
  }, [filteredPoints.length]); // Only trigger on data length change

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border-l-4 bg-white/95 backdrop-blur-sm transform transition-all duration-300 animate-slide-in-right ${
            notification.type === "danger"
              ? "border-red-500"
              : notification.type === "warning"
              ? "border-yellow-500"
              : "border-blue-500"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div
                className={`flex items-center gap-2 mb-1 ${
                  notification.type === "danger"
                    ? "text-red-700"
                    : notification.type === "warning"
                    ? "text-yellow-700"
                    : "text-blue-700"
                }`}
              >
                <span className="text-sm">
                  {notification.type === "danger"
                    ? "🚨"
                    : notification.type === "warning"
                    ? "⚠️"
                    : "ℹ️"}
                </span>
                <h4 className="font-semibold text-sm">{notification.title}</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
