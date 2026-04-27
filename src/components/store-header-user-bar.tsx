"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  getShortlist,
  logout,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "@/lib/api";

const NOTIFICATION_ROLES = new Set(["customer", "designer", "admin", "blogadmin"]);

function formatNotificationTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type StoreHeaderUserBarProps = {
  userName: string;
  userRole: string;
  /** Increment after adding to shortlist so the count refreshes without a full page reload. */
  shortlistRefreshKey?: number;
};

export default function StoreHeaderUserBar({
  userName,
  userRole,
  shortlistRefreshKey = 0,
}: StoreHeaderUserBarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isMarkingAllNotificationsRead, setIsMarkingAllNotificationsRead] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [shortlistCount, setShortlistCount] = useState(0);

  const unreadNotificationsCount = notifications.filter((item) => !item.isRead).length;

  useEffect(() => {
    const close = () => {
      setIsNotificationsOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (userRole !== "customer") {
      setShortlistCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const items = await getShortlist();
        if (!cancelled) {
          setShortlistCount(Array.isArray(items) ? items.length : 0);
        }
      } catch {
        if (!cancelled) setShortlistCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userRole, shortlistRefreshKey]);

  useEffect(() => {
    if (!NOTIFICATION_ROLES.has(userRole)) {
      setNotifications([]);
      setNotificationsError("");
      setIsLoadingNotifications(false);
      return;
    }

    let isMounted = true;
    const loadNotifications = async () => {
      if (isMounted) setIsLoadingNotifications(true);
      if (isMounted) setNotificationsError("");
      try {
        const items = await getNotifications();
        if (!isMounted) return;
        setNotifications(Array.isArray(items) ? items : []);
      } catch (err: unknown) {
        if (!isMounted) return;
        setNotificationsError(err instanceof Error ? err.message : "Failed to fetch notifications.");
        setNotifications([]);
      } finally {
        if (isMounted) setIsLoadingNotifications(false);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [userRole]);

  const handleMarkAllNotificationsRead = async () => {
    if (unreadNotificationsCount <= 0 || isMarkingAllNotificationsRead) return;
    setIsMarkingAllNotificationsRead(true);
    setNotificationsError("");
    const previous = notifications;
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await markAllNotificationsAsRead();
    } catch (err: unknown) {
      setNotifications(previous);
      setNotificationsError(err instanceof Error ? err.message : "Failed to mark all notifications as read.");
    } finally {
      setIsMarkingAllNotificationsRead(false);
    }
  };

  const handleNotificationClick = useCallback(
    async (notification: NotificationItem) => {
      setIsNotificationsOpen(false);
      if (!notification.isRead) {
        setNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
        try {
          const updated = await markNotificationAsRead(notification.id);
          setNotifications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        } catch {
          setNotifications((prev) =>
            prev.map((item) => (item.id === notification.id ? { ...item, isRead: false } : item))
          );
        }
      }
      const target = typeof notification.link === "string" ? notification.link.trim() : "";
      if (!target) return;
      if (target.startsWith("/shortlist/")) {
        if (userRole === "customer") {
          router.push("/dashboard?shortlist=1");
        } else {
          router.push("/dashboard");
        }
        return;
      }
      if (target.startsWith("http://") || target.startsWith("https://")) {
        window.open(target, "_blank", "noopener,noreferrer");
        return;
      }
      router.push(target.startsWith("/") ? target : `/${target}`);
    },
    [router, userRole]
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const email = localStorage.getItem("userEmail") || "";
      const password = localStorage.getItem("userPassword") || "";
      await logout({ email, password });
      localStorage.clear();
      router.push("/login");
    } catch {
      localStorage.clear();
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const goToShortlist = () => {
    if (userRole === "customer") {
      router.push("/dashboard?shortlist=1");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {NOTIFICATION_ROLES.has(userRole) && (
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsNotificationsOpen((v) => !v);
            }}
            className="relative p-0.5 sm:p-0"
            aria-label="Open notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.674C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
              {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
            </span>
          </button>
          {isNotificationsOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 z-[350] mt-2 w-[340px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-widest text-gray-600">Notifications</div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleMarkAllNotificationsRead}
                    disabled={unreadNotificationsCount <= 0 || isMarkingAllNotificationsRead}
                    className="text-[10px] font-black uppercase tracking-widest text-[#0468a3] disabled:cursor-not-allowed disabled:text-gray-300"
                  >
                    {isMarkingAllNotificationsRead ? "Marking..." : "Mark all read"}
                  </button>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {unreadNotificationsCount} unread
                  </div>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="px-4 py-6 text-center text-xs font-bold text-gray-500">Loading notifications...</div>
                ) : notificationsError ? (
                  <div className="px-4 py-6 text-center text-xs font-bold text-red-600">{notificationsError}</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs font-bold text-gray-500">No notifications yet.</div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void handleNotificationClick(item)}
                      className={`w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${item.isRead ? "bg-white" : "bg-[#fffaf0]"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`text-xs leading-5 ${
                            item.isRead ? "text-gray-700" : "font-semibold text-gray-900"
                          }`}
                        >
                          {item.message}
                        </p>
                        {!item.isRead && <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#0468a3]" />}
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {formatNotificationTime(item.createdAt)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          goToShortlist();
        }}
        className="relative p-0.5 sm:p-0"
        aria-label="Open shortlist"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white sm:-right-2 sm:-top-2">
          {userRole === "customer" ? shortlistCount : 0}
        </span>
      </button>

      {userName ? (
        <button
          onClick={handleLogout}
          className="ml-0 flex flex-col items-center justify-center sm:ml-1"
          type="button"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-[11px] font-bold text-[#ffcb05] sm:h-8 sm:w-8 sm:text-xs">
            {userName.charAt(0)}
          </div>
          <span className="mt-0.5 text-[9px] font-bold uppercase sm:text-[10px]">{isLoggingOut ? "..." : "Logout"}</span>
        </button>
      ) : null}
    </div>
  );
}
