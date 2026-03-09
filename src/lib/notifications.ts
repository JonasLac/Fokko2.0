/**
 * Fokko Notification helpers
 * Uses the Web Notifications API (works on Android Chrome & PWA installs).
 * iOS Safari requires the app to be added to home screen (PWA) for notifications.
 */

const NOTIF_PERMISSION_KEY = "fokko-notif-permission-asked";

/** Request permission and return the result */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  localStorage.setItem(NOTIF_PERMISSION_KEY, "yes");
  return result;
};

/** Whether we've already asked */
export const hasAskedPermission = (): boolean => {
  return !!localStorage.getItem(NOTIF_PERMISSION_KEY);
};

/** Whether notifications are supported and granted */
export const canNotify = (): boolean => {
  return "Notification" in window && Notification.permission === "granted";
};

/** Show an immediate notification */
export const showNotification = (title: string, body: string, icon?: string) => {
  if (!canNotify()) return;
  try {
    new Notification(title, {
      body,
      icon: icon || "/LogoFokko.png",
      badge: "/LogoFokko.png",
      tag: "fokko",
      silent: false,
    });
  } catch (e) {
    console.warn("Notification failed:", e);
  }
};

/** Schedule a daily task reminder using a setTimeout approach.
 *  Finds how many ms until the next `hour:minute` and fires then.
 *  Clears any previously scheduled timer stored in window.
 */
const REMINDER_TIMER_KEY = "__fokko_reminder_timer__";

export const scheduleDailyReminder = (hour = 9, minute = 0) => {
  if (!canNotify()) return;

  // Clear previous timer if exists
  const w = window as unknown as Record<string, unknown>;
  const existing = w[REMINDER_TIMER_KEY];
  if (typeof existing === "number") clearTimeout(existing);

  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next.getTime() - now.getTime();

  const timerId = window.setTimeout(() => {
    showNotification(
      "Fokko 📋",
      "Bom dia! Você tem tarefas pendentes para hoje. Vamos focar? 💪",
    );
    // Reschedule for next day
    scheduleDailyReminder(hour, minute);
  }, delay);

  (window as Record<string, unknown>)[REMINDER_TIMER_KEY] = timerId;
};

/** Notify that a focus session just finished */
export const notifyFocusComplete = (minutes: number) => {
  showNotification(
    "Sessão de foco concluída! 🎯",
    `Você focou por ${minutes} minuto${minutes !== 1 ? "s" : ""}. Faça uma pausa merecida!`,
  );
};
