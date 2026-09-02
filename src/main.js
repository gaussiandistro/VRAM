import "./style.css";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const WEEK_PATTERN = { 1: "Blue", 2: "White", 3: "RAM", 4: "Blue", 5: "White" };
let DAY_EXCEPTIONS = {};
let NO_SCHOOL_DATES = new Set();
let SCHEDULES = {};
let LUNCHES = {};
let SCHOOL_END_SECONDS = {};
let DISPLAY_SCHEDULES = {};

function secondsFromTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60 + minutes) * 60;
}

function rebuildScheduleIndexes() {
  SCHOOL_END_SECONDS = Object.fromEntries(
    Object.entries(SCHEDULES).map(([name, schedule]) => [
      name,
      schedule[schedule.length - 1]?.endSeconds || 0,
    ])
  );
  DISPLAY_SCHEDULES = Object.fromEntries(
    Object.entries(SCHEDULES).map(([name, schedule]) => [
      name,
      [
        ...schedule.map((item) => ({ ...item, isLunch: false })),
        ...(LUNCHES[name] || []).map((item) => ({ ...item, isLunch: true })),
      ].sort((a, b) => a.startSeconds - b.startSeconds),
    ])
  );
}

const DAY_CLASS = {
  Blue: "day-blue",
  White: "day-white",
  RAM: "day-ram",
  "ER White": "day-white",
};
const byId = (id) => document.getElementById(id);
const elements = {
  dayMessage: byId("dayMessage"),
  currentPeriod: byId("currentPeriod"),
  countdown: byId("countdown"),
  progressRing: byId("progressRing"),
  progressPercent: byId("progressPercent"),
  periodTimes: byId("periodTimes"),
  clockToggle: byId("clockToggle"),
  devPanel: byId("devPanel"),
  devDate: byId("devDate"),
  devTime: byId("devTime"),
  devApply: byId("devApply"),
  devReset: byId("devReset"),
  devStatus: byId("devStatus"),
  lunchSection: byId("lunchSection"),
  scheduleToggle: byId("scheduleToggle"),
  schedulePanel: byId("schedulePanel"),
  scheduleList: byId("scheduleList"),
  scheduleTitle: byId("scheduleTitle"),
  daySelector: byId("daySelector"),
  notifSection: byId("notifSection"),
  notifToggle: byId("notifToggle"),
  notifHint: byId("notifHint"),
  notifOptions: byId("notifOptions"),
  notifPeriodEnd: byId("notifPeriodEnd"),
  notifLunchEnd: byId("notifLunchEnd"),
  notifUpcoming: byId("notifUpcoming"),
  lunches: {
    A: { timer: byId("lunchATimer"), status: byId("lunchAStatus") },
    B: { timer: byId("lunchBTimer"), status: byId("lunchBStatus") },
    C: { timer: byId("lunchCTimer"), status: byId("lunchCStatus") },
  },
};

function setText(element, text) {
  if (element && element.textContent !== text) element.textContent = text;
}
function setHidden(element, hidden) {
  element?.classList.toggle("hidden", hidden);
}

const CLOCK_STORAGE_KEY = "vram-clock";
const NOTIF_STORAGE_KEY = "vram-notifs";
const INSTALLATION_STORAGE_KEY = "vram-installation-id";
const DEFAULT_NOTIF_SETTINGS = {
  enabled: false,
  periodEnd: true,
  lunchEnd: true,
  upcoming: true,
};
const isDevelopment = import.meta.env.DEV;
let clockFormat = "12";
let simulatedNow = null;
let simulatedRealTime = 0;
let notifSettings = loadNotifSettings();
let notificationSubscriptionId = null;

try {
  if (localStorage.getItem(CLOCK_STORAGE_KEY) === "24") clockFormat = "24";
} catch {
  // Storage unavailable.
}
function saveClockFormat() {
  try {
    localStorage.setItem(CLOCK_STORAGE_KEY, clockFormat);
  } catch {
    // Storage unavailable.
  }
}
function loadNotifSettings() {
  try {
    return {
      ...DEFAULT_NOTIF_SETTINGS,
      ...(JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY)) || {}),
    };
  } catch {
    return { ...DEFAULT_NOTIF_SETTINGS };
  }
}
function saveNotifSettings() {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifSettings));
  } catch {
    // Storage unavailable.
  }
  void syncNotificationPreferences().catch(() => {
    // The subscription may not exist yet.
  });
}
function notificationsSupported() {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}
function notificationPermission() {
  return notificationsSupported() ? Notification.permission : "denied";
}
async function getServiceWorkerRegistration() {
  try {
    return await navigator.serviceWorker.getRegistration();
  } catch {
    return null;
  }
}
function getInstallationId() {
  try {
    let id = localStorage.getItem(INSTALLATION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(INSTALLATION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(
    atob((value + padding).replace(/-/g, "+").replace(/_/g, "/")),
    (character) => character.charCodeAt(0)
  );
}
async function getPushSubscription() {
  const registration = await getServiceWorkerRegistration();
  if (!registration || !VAPID_PUBLIC_KEY) return null;
  const existing = await registration.pushManager.getSubscription();
  return (
    existing ||
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  );
}
async function syncNotificationPreferences() {
  if (!supabase || !notificationSubscriptionId) return;
  const { error } = await supabase.rpc("update_notification_preferences", {
    p_subscription_id: notificationSubscriptionId,
    p_enabled: notifSettings.enabled,
    p_period_end: notifSettings.periodEnd,
    p_lunch_end: notifSettings.lunchEnd,
    p_upcoming: notifSettings.upcoming,
  });
  if (error) throw error;
}
async function savePushSubscription(subscription = null) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const pushSubscription = subscription || (await getPushSubscription());
  if (!pushSubscription) throw new Error("Push notifications are not supported here.");
  const { endpoint, keys } = pushSubscription.toJSON();
  if (!endpoint || !keys?.p256dh || !keys.auth) throw new Error("Invalid push subscription.");
  const { data, error } = await supabase.rpc("upsert_push_subscription", {
    p_installation_id: getInstallationId(),
    p_endpoint: endpoint,
    p_p256dh: keys.p256dh,
    p_auth: keys.auth,
  });
  if (error) throw error;
  notificationSubscriptionId = data;
  await syncNotificationPreferences();
}

async function restorePushSubscription() {
  if (!supabase || notificationPermission() !== "granted") return;
  const registration = await getServiceWorkerRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) await savePushSubscription(subscription);
}

function currentDateTime() {
  return simulatedNow
    ? new Date(simulatedNow.getTime() + Date.now() - simulatedRealTime)
    : new Date();
}
function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function secondsIntoDay(date) {
  return (
    date.getHours() * 3600 +
    date.getMinutes() * 60 +
    date.getSeconds() +
    date.getMilliseconds() / 1000
  );
}
function formatClock(time) {
  const [hoursString, minutes] = time.split(":");
  const hours = Number(hoursString);
  if (clockFormat === "24") return `${String(hours).padStart(2, "0")}:${minutes}`;
  return `${hours % 12 || 12}:${minutes} ${hours >= 12 ? "PM" : "AM"}`;
}
function formatDuration(seconds) {
  const total = Math.ceil(Math.max(0, seconds));
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
function formatShortDuration(seconds) {
  const total = Math.ceil(Math.max(0, seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function getDayType(date) {
  const key = dateKey(date);
  if (NO_SCHOOL_DATES.has(key)) return null;
  const type = DAY_EXCEPTIONS[key] || WEEK_PATTERN[date.getDay()];
  return SCHEDULES[type] ? type : null;
}
function getNextSchoolDay(date) {
  const next = new Date(date);
  do next.setDate(next.getDate() + 1);
  while (!getDayType(next));
  return next;
}
function getDisplayDayInfo(now) {
  const type = getDayType(now);
  if (type && secondsIntoDay(now) < SCHOOL_END_SECONDS[type])
    return { date: now, type, relation: "today" };
  const date = getNextSchoolDay(now);
  return { date, type: getDayType(date), relation: "next" };
}
function getCurrentPeriod(type, seconds) {
  return (
    SCHEDULES[type]?.find(
      (period) => seconds >= period.startSeconds && seconds < period.endSeconds
    ) || null
  );
}
function getNextPeriod(type, seconds) {
  return SCHEDULES[type]?.find((period) => period.startSeconds > seconds) || null;
}

let lastDayMessageKey = "";
let lastProgressDegrees;
let lastProgressPercent;
let renderedScheduleType;
let highlightedPeriodId;
let scheduleRows = new Map();
function renderDayMessage(now) {
  const info = getDisplayDayInfo(now);
  const key = `${dateKey(info.date)}:${info.type}:${info.relation}`;
  if (key === lastDayMessageKey) return;
  lastDayMessageKey = key;
  if (!info.type) return setText(elements.dayMessage, "No school.");
  const span = document.createElement("span");
  span.className = DAY_CLASS[info.type] || "";
  span.textContent = info.type;
  const article = info.type === "ER White" ? "an" : "a";
  if (info.relation === "today")
    elements.dayMessage?.replaceChildren(`Today is ${article} `, span, " Day.");
  else
    elements.dayMessage?.replaceChildren(
      `${info.date.toLocaleDateString("en-US", { weekday: "long" })} will be ${article} `,
      span,
      " Day."
    );
}
function setProgress(progress) {
  const normalized = Math.max(0, Math.min(1, progress));
  const percent = Math.round(normalized * 100);
  const degrees = Math.round(normalized * 36000) / 100;
  if (degrees !== lastProgressDegrees)
    elements.progressRing?.style.setProperty("--progress", `${degrees}deg`);
  if (percent !== lastProgressPercent) {
    elements.progressRing?.setAttribute("aria-valuenow", String(percent));
    setText(elements.progressPercent, `${percent}%`);
  }
  lastProgressDegrees = degrees;
  lastProgressPercent = percent;
}
function updateLunch(type, current, seconds) {
  const isLunch = (LUNCHES[type] || []).some(
    (lunch) => lunch.startSeconds <= current.endSeconds && lunch.endSeconds > current.startSeconds
  );
  setHidden(elements.lunchSection, !isLunch);
  if (!isLunch) return;
  for (const lunch of LUNCHES[type] || []) {
    const target = elements.lunches[lunch.id];
    if (!target) continue;
    const remaining =
      seconds < lunch.startSeconds
        ? lunch.startSeconds - seconds
        : seconds < lunch.endSeconds
          ? lunch.endSeconds - seconds
          : 0;
    setText(target.timer, formatShortDuration(remaining));
    setText(
      target.status,
      seconds < lunch.startSeconds
        ? "until lunch"
        : seconds < lunch.endSeconds
          ? "remaining"
          : "finished"
    );
  }
}
function updateMainTracker(now) {
  const type = getDayType(now);
  const seconds = secondsIntoDay(now);
  if (!type) {
    setText(elements.currentPeriod, "No school today");
    setText(elements.countdown, "--:--:--");
    setText(elements.periodTimes, "");
    setProgress(0);
    setHidden(elements.lunchSection, true);
    return;
  }
  const current = getCurrentPeriod(type, seconds);
  if (!current) {
    const first = SCHEDULES[type][0];
    const next = getNextPeriod(type, seconds);
    if (seconds < first.startSeconds) {
      setText(elements.currentPeriod, "School starts in");
      setText(elements.countdown, formatDuration(first.startSeconds - seconds));
      setText(elements.periodTimes, formatClock(first.start));
      setProgress(0);
    } else if (next) {
      setText(elements.currentPeriod, `${next.name} starts in`);
      setText(elements.countdown, formatDuration(next.startSeconds - seconds));
      setText(elements.periodTimes, formatClock(next.start));
      setProgress(0);
    } else {
      setText(elements.currentPeriod, "School is over");
      setText(elements.countdown, "00:00:00");
      setText(elements.periodTimes, "");
      setProgress(1);
    }
    setHidden(elements.lunchSection, true);
    return;
  }
  setText(elements.currentPeriod, current.name);
  setText(elements.countdown, formatDuration(current.endSeconds - seconds));
  setText(elements.periodTimes, `${formatClock(current.start)} – ${formatClock(current.end)}`);
  setProgress((seconds - current.startSeconds) / (current.endSeconds - current.startSeconds));
  updateLunch(type, current, seconds);
}
function selectedScheduleType(now) {
  return !elements.daySelector || elements.daySelector.value === "auto"
    ? getDisplayDayInfo(now).type
    : elements.daySelector.value;
}
function updateScheduleHighlight(type, now) {
  const id = getDayType(now) === type ? getCurrentPeriod(type, secondsIntoDay(now))?.id : undefined;
  if (id === highlightedPeriodId) return;
  if (highlightedPeriodId) scheduleRows.get(highlightedPeriodId)?.classList.remove("current");
  if (id) scheduleRows.get(id)?.classList.add("current");
  highlightedPeriodId = id;
}
function renderSchedule(now, force = false) {
  if (!elements.scheduleList || !elements.scheduleTitle) return;
  const type = selectedScheduleType(now);
  if (!force && type === renderedScheduleType) return updateScheduleHighlight(type, now);
  renderedScheduleType = type;
  highlightedPeriodId = undefined;
  scheduleRows = new Map();
  if (!type) {
    setText(elements.scheduleTitle, "No Schedule");
    elements.scheduleList.replaceChildren();
    return;
  }
  setText(elements.scheduleTitle, `${type} Day Schedule`);
  const fragment = document.createDocumentFragment();
  for (const item of DISPLAY_SCHEDULES[type] || []) {
    const row = document.createElement("div");
    row.className = `schedule-row${item.isLunch ? " lunch-row" : ""}`;
    if (!item.isLunch) scheduleRows.set(item.id, row);
    const name = document.createElement("span");
    name.textContent = item.name;
    const time = document.createElement("span");
    time.className = "schedule-time";
    time.textContent = `${formatClock(item.start)} – ${formatClock(item.end)}`;
    row.append(name, time);
    fragment.append(row);
  }
  elements.scheduleList.replaceChildren(fragment);
  updateScheduleHighlight(type, now);
}

async function loadScheduleData() {
  if (!supabase) return;
  const [
    { data: types, error: typesError },
    { data: blocks, error: blocksError },
    { data: dates, error: datesError },
  ] = await Promise.all([
    supabase.from("schedule_types").select("id, name").eq("active", true),
    supabase
      .from("schedule_blocks")
      .select("block_id, name, kind, start_time, end_time, sort_order, schedule_types!inner(name)")
      .order("sort_order"),
    supabase
      .from("calendar_dates")
      .select("date, is_school_day, schedule_type:schedule_types(name)"),
  ]);
  if (typesError || blocksError || datesError) throw typesError || blocksError || datesError;
  const schedules = Object.fromEntries((types || []).map((type) => [type.name, []]));
  const lunches = Object.fromEntries((types || []).map((type) => [type.name, []]));
  for (const block of blocks || []) {
    const type = Array.isArray(block.schedule_types)
      ? block.schedule_types[0]
      : block.schedule_types;
    const target = block.kind === "lunch" ? lunches : schedules;
    if (!type || !target[type.name]) continue;
    const start = block.start_time.slice(0, 5);
    const end = block.end_time.slice(0, 5);
    target[type.name].push({
      id: block.block_id,
      name: block.name,
      kind: block.kind,
      start,
      end,
      startSeconds: secondsFromTime(start),
      endSeconds: secondsFromTime(end),
    });
  }
  for (const schedule of Object.values(schedules))
    schedule.sort((a, b) => a.startSeconds - b.startSeconds);
  for (const lunch of Object.values(lunches)) lunch.sort((a, b) => a.startSeconds - b.startSeconds);
  SCHEDULES = schedules;
  LUNCHES = lunches;
  DAY_EXCEPTIONS = {};
  NO_SCHOOL_DATES = new Set();
  for (const entry of dates || []) {
    const type = Array.isArray(entry.schedule_type) ? entry.schedule_type[0] : entry.schedule_type;
    if (entry.is_school_day && type) DAY_EXCEPTIONS[entry.date] = type.name;
    else if (!entry.is_school_day) NO_SCHOOL_DATES.add(entry.date);
  }
  rebuildScheduleIndexes();
  renderedScheduleType = undefined;
  updateEverything();
}

function updateClockToggleLabel() {
  setText(elements.clockToggle, clockFormat === "12" ? "24h" : "12h");
  elements.clockToggle?.setAttribute("aria-pressed", String(clockFormat === "24"));
}
elements.clockToggle?.addEventListener("click", () => {
  clockFormat = clockFormat === "12" ? "24" : "12";
  saveClockFormat();
  updateClockToggleLabel();
  updateEverything();
  renderSchedule(currentDateTime(), true);
});
elements.scheduleToggle?.addEventListener("click", () => {
  const open = elements.schedulePanel?.classList.contains("hidden") ?? false;
  if (open) renderSchedule(currentDateTime(), true);
  setHidden(elements.schedulePanel, !open);
  elements.scheduleToggle?.setAttribute("aria-expanded", String(open));
  setText(elements.scheduleToggle, open ? "Hide Schedule" : "Show Schedule");
});
elements.daySelector?.addEventListener("change", () => renderSchedule(currentDateTime(), true));

function updateNotificationUI() {
  const permission = notificationPermission();
  const unsupported = !notificationsSupported();
  setHidden(elements.notifToggle, unsupported);
  setHidden(elements.notifSection, unsupported);
  if (unsupported) return;
  elements.notifToggle.disabled = permission === "denied";
  elements.notifToggle.setAttribute(
    "aria-pressed",
    String(permission === "granted" && notifSettings.enabled)
  );
  setText(
    elements.notifToggle,
    permission === "denied"
      ? "Notifications blocked"
      : notifSettings.enabled
        ? "Disable Notifications"
        : "Enable Notifications"
  );
  setHidden(elements.notifOptions, permission !== "granted" || !notifSettings.enabled);
  setText(
    elements.notifHint,
    permission === "denied" ? "Allow notifications to receive schedule alerts on this device." : ""
  );
  setHidden(elements.notifHint, permission !== "denied");
  for (const [checkbox, key] of [
    [elements.notifPeriodEnd, "periodEnd"],
    [elements.notifLunchEnd, "lunchEnd"],
    [elements.notifUpcoming, "upcoming"],
  ])
    if (checkbox) checkbox.checked = notifSettings[key];
}
elements.notifToggle?.addEventListener("click", async () => {
  if (notifSettings.enabled) {
    notifSettings.enabled = false;
    saveNotifSettings();
    updateNotificationUI();
    return;
  }
  if (notificationPermission() !== "granted") {
    try {
      if ((await Notification.requestPermission()) !== "granted") return updateNotificationUI();
    } catch {
      return updateNotificationUI();
    }
  }
  try {
    await savePushSubscription();
    notifSettings.enabled = true;
    saveNotifSettings();
    updateNotificationUI();
  } catch {
    notifSettings.enabled = false;
    updateNotificationUI();
  }
});
for (const [checkbox, key] of [
  [elements.notifPeriodEnd, "periodEnd"],
  [elements.notifLunchEnd, "lunchEnd"],
  [elements.notifUpcoming, "upcoming"],
])
  checkbox?.addEventListener("change", () => {
    notifSettings[key] = checkbox.checked;
    saveNotifSettings();
    updateNotificationUI();
  });

function updateEverything() {
  const now = currentDateTime();
  renderDayMessage(now);
  updateMainTracker(now);
  if (elements.schedulePanel && !elements.schedulePanel.classList.contains("hidden"))
    renderSchedule(now);
}
let updateTimer;
function queueNextUpdate() {
  if (document.hidden) return;
  updateTimer = setTimeout(
    () => {
      updateEverything();
      queueNextUpdate();
    },
    1020 - (Date.now() % 1000)
  );
}
document.addEventListener("visibilitychange", () => {
  clearTimeout(updateTimer);
  if (!document.hidden) {
    updateEverything();
    queueNextUpdate();
  }
});
window.addEventListener("focus", () => {
  if (!document.hidden) updateEverything();
});

function toInputDate(date) {
  return dateKey(date);
}
function toInputTime(date) {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
function updateDevStatus() {
  if (!isDevelopment || !elements.devStatus) return;
  setText(
    elements.devStatus,
    simulatedNow
      ? `Simulating ${currentDateTime().toLocaleString()}`
      : "Using your computer's current time."
  );
}
function applySimulatedTime() {
  const parsed = new Date(`${elements.devDate?.value}T${elements.devTime?.value}`);
  if (!elements.devDate?.value || !elements.devTime?.value || Number.isNaN(parsed.getTime()))
    return setText(elements.devStatus, "Enter a valid date and time.");
  simulatedNow = parsed;
  simulatedRealTime = Date.now();
  updateDevStatus();
  updateEverything();
  renderSchedule(currentDateTime(), true);
}
function resetSimulatedTime() {
  simulatedNow = null;
  simulatedRealTime = 0;
  if (elements.devDate) elements.devDate.value = toInputDate(new Date());
  if (elements.devTime) elements.devTime.value = toInputTime(new Date());
  updateDevStatus();
  updateEverything();
  renderSchedule(currentDateTime(), true);
}
if (isDevelopment && elements.devPanel) {
  const now = new Date();
  elements.devPanel.classList.remove("hidden");
  elements.devDate.value = toInputDate(now);
  elements.devTime.value = toInputTime(now);
  elements.devApply?.addEventListener("click", applySimulatedTime);
  elements.devReset?.addEventListener("click", resetSimulatedTime);
  updateDevStatus();
}

updateClockToggleLabel();
updateNotificationUI();
void loadScheduleData().catch(() => {});
void (async () => {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
    await navigator.serviceWorker.ready;
    await restorePushSubscription();
  } catch {
    // Service workers or push subscriptions are unavailable in this environment.
  }
})();
updateEverything();
queueNextUpdate();
