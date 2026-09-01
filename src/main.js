import "./style.css";

/* =========================================================
   Schedule data
   ========================================================= */

const WEEK_PATTERN = {
  1: "Blue",
  2: "White",
  3: "RAM",
  4: "Blue",
  5: "White",
};

// YYYY-MM-DD
const DAY_EXCEPTIONS = {
  "2026-08-25": "Blue",
  "2026-08-26": "White",
  "2026-08-27": "Blue",
  "2026-08-28": "White",
  "2026-09-08": "Blue",
  "2026-09-09": "White",
  "2026-09-10": "Blue",
  "2026-09-11": "White",
  "2026-10-16": "ER White",
  "2026-10-19": "Blue",
  "2026-10-20": "White",
  "2026-10-21": "Blue",
  "2026-10-22": "ER White",
  "2026-11-02": "Blue",
  "2026-11-04": "White",
  "2026-11-05": "Blue",
  "2026-11-06": "White",
  "2026-11-23": "Blue",
  "2026-11-24": "White",
  "2026-12-16": "Blue",
  "2026-12-17": "White",
};

// YYYY-MM-DD
const NO_SCHOOL_DATES = new Set([
  "2026-09-07",
  "2026-11-03",
  "2026-11-25",
  "2026-11-26",
  "2026-11-27",
]);

function secondsFromTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60 + minutes) * 60;
}

function timeBlock(id, name, start, end) {
  return {
    id,
    name,
    start,
    end,
    startSeconds: secondsFromTime(start),
    endSeconds: secondsFromTime(end),
  };
}

const SCHEDULES = {
  Blue: [
    timeBlock("p1", "1st Period", "07:30", "09:00"),
    timeBlock("passing1", "Passing Period", "09:00", "09:05"),
    timeBlock("home", "Home Lab", "09:05", "09:25"),
    timeBlock("passing2", "Passing Period", "09:25", "09:30"),
    timeBlock("seminar1", "Seminar L1", "09:30", "09:50"),
    timeBlock("passing3", "Passing Period", "09:50", "09:55"),
    timeBlock("seminar2", "Seminar L2", "09:55", "10:40"),
    timeBlock("passing4", "Passing Period", "10:40", "10:45"),
    timeBlock("p5", "5th Period", "10:45", "12:55"),
    timeBlock("passing5", "Passing Period", "12:55", "13:00"),
    timeBlock("p7", "7th Period", "13:00", "14:30"),
  ],
  White: [
    timeBlock("p2", "2nd Period", "07:30", "09:00"),
    timeBlock("passing1", "Passing Period", "09:00", "09:05"),
    timeBlock("p4", "4th Period", "09:05", "10:40"),
    timeBlock("passing2", "Passing Period", "10:40", "10:45"),
    timeBlock("p6", "6th Period", "10:45", "12:55"),
    timeBlock("passing3", "Passing Period", "12:55", "13:00"),
    timeBlock("p8", "8th Period", "13:00", "14:30"),
  ],
  RAM: [
    timeBlock("p1", "1st Period", "07:30", "08:20"),
    timeBlock("passing1", "Passing Period", "08:20", "08:25"),
    timeBlock("p2", "2nd Period", "08:25", "09:15"),
    timeBlock("passing2", "Passing Period", "09:15", "09:20"),
    timeBlock("p4", "4th Period", "09:20", "10:10"),
    timeBlock("passing3", "Passing Period", "10:10", "10:15"),
    timeBlock("p5", "5th Period", "10:15", "11:05"),
    timeBlock("passing4", "Passing Period", "11:05", "11:10"),
    timeBlock("p6", "6th Period", "11:10", "12:40"),
    timeBlock("passing5", "Passing Period", "12:40", "12:45"),
    timeBlock("p7", "7th Period", "12:45", "13:35"),
    timeBlock("passing6", "Passing Period", "13:35", "13:40"),
    timeBlock("p8", "8th Period", "13:40", "14:30"),
  ],
  "ER White": [
    timeBlock("p2", "2nd Period", "07:30", "08:40"),
    timeBlock("p4", "4th Period", "08:40", "09:45"),
    timeBlock("p6", "6th Period", "09:45", "10:45"),
    timeBlock("passing1", "Passing Period", "10:45", "10:50"),
    timeBlock("p8", "8th Period", "10:50", "12:00"),
  ],
};

const LUNCHES = {
  Blue: [
    timeBlock("A", "A Lunch", "10:45", "11:15"),
    timeBlock("B", "B Lunch", "11:35", "12:05"),
    timeBlock("C", "C Lunch", "12:25", "12:55"),
  ],
  White: [
    timeBlock("A", "A Lunch", "10:45", "11:15"),
    timeBlock("B", "B Lunch", "11:35", "12:05"),
    timeBlock("C", "C Lunch", "12:25", "12:55"),
  ],
  RAM: [
    timeBlock("A", "A Lunch", "11:10", "11:35"),
    timeBlock("B", "B Lunch", "11:40", "12:10"),
    timeBlock("C", "C Lunch", "12:15", "12:40"),
  ],
};

const LUNCH_HOST_PERIOD = {
  Blue: "p5",
  White: "p6",
  RAM: "p6",
};

const DAY_CLASS = {
  Blue: "day-blue",
  White: "day-white",
  RAM: "day-ram",
  "ER White": "day-white",
};

const SCHOOL_END_SECONDS = Object.fromEntries(
  Object.entries(SCHEDULES).map(([dayType, schedule]) => [
    dayType,
    schedule[schedule.length - 1].endSeconds,
  ])
);

const DISPLAY_SCHEDULES = Object.fromEntries(
  Object.keys(SCHEDULES).map((dayType) => [
    dayType,
    [
      ...SCHEDULES[dayType].map((item) => ({ ...item, isLunch: false })),
      ...(LUNCHES[dayType] || []).map((item) => ({ ...item, isLunch: true })),
    ].sort((a, b) => a.startSeconds - b.startSeconds),
  ])
);

/* =========================================================
   DOM
   ========================================================= */

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
  notifHint: byId("notifHint"), // Optional: safe if removed from HTML
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
  if (element && element.textContent !== text) {
    element.textContent = text;
  }
}

function setHidden(element, hidden) {
  if (element) {
    element.classList.toggle("hidden", hidden);
  }
}

/* =========================================================
   Clock preference
   ========================================================= */

const CLOCK_STORAGE_KEY = "vram-clock";
const isDevelopment = import.meta.env.DEV;

let clockFormat = "12";
let simulatedNow = null;
let simulatedAt = 0;
let simulatedRealTime = 0;

try {
  if (localStorage.getItem(CLOCK_STORAGE_KEY) === "24") {
    clockFormat = "24";
  }
} catch {
  // Storage unavailable
}

function saveClockFormat() {
  try {
    localStorage.setItem(CLOCK_STORAGE_KEY, clockFormat);
  } catch {
    // Storage unavailable
  }
}

/* =========================================================
   Notification settings
   ========================================================= */

const NOTIF_STORAGE_KEY = "vram-notifs";
const DEFAULT_NOTIF_SETTINGS = {
  enabled: false,
  periodEnd: true,
  lunchEnd: true,
  upcoming: true,
};

const UPCOMING_WARN_SECONDS = 120;
const STALE_WINDOW_SECONDS = 45;

let notifSettings = loadNotifSettings();
let lastNotifiedKey = "";
let lastNotificationTime = 0;
let lastNotificationSeconds = null;
let lastNotificationDay = "";

function loadNotifSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY));
    return { ...DEFAULT_NOTIF_SETTINGS, ...(saved || {}) };
  } catch {
    return { ...DEFAULT_NOTIF_SETTINGS };
  }
}

function saveNotifSettings() {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifSettings));
  } catch {
    // Storage unavailable
  }

  void syncNotifSettingsToServiceWorker();
}

function notificationsSupported() {
  return "Notification" in window;
}

function notificationPermission() {
  return notificationsSupported() ? Notification.permission : "denied";
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.getRegistration();
  } catch {
    return null;
  }
}

async function syncNotifSettingsToServiceWorker() {
  const registration = await getServiceWorkerRegistration();

  registration?.active?.postMessage({
    type: "VRAM_NOTIFICATION_SETTINGS",
    settings: notifSettings,
  });
}

async function markNotificationInServiceWorker(key) {
  if (!key) {
    return;
  }

  const registration = await getServiceWorkerRegistration();

  registration?.active?.postMessage({
    type: "VRAM_MARK_NOTIFICATION",
    key,
  });
}

async function showNotification(title, body, tag, key = "") {
  if (notificationPermission() !== "granted") {
    return;
  }

  const options = {
    body,
    tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  };

  try {
    const registration = await getServiceWorkerRegistration();

    if (registration) {
      await registration.showNotification(title, options);
      await markNotificationInServiceWorker(key);
      return;
    }

    const notification = new Notification(title, options);

    notification.addEventListener("click", () => {
      window.focus();
      notification.close();
    });
  } catch {
    // Notification failed
  }
}

function notificationTag(day, kind, dayType, seconds) {
  return `vram-${day}-${kind}-${dayType}-${seconds}`;
}

const NOTIF_TRANSITIONS = Object.fromEntries(
  Object.keys(SCHEDULES).map((dayType) => {
    const schedule = SCHEDULES[dayType];
    const transitions = [];
    const first = schedule[0];

    transitions.push({
      type: "period",
      seconds: first.startSeconds,
      title: "School starting",
      body: `First block: ${first.name}.`,
      soon: "School starts in 2 minutes.",
    });

    for (const period of schedule) {
      if (period.id.startsWith("passing")) {
        continue;
      }

      const next = schedule.find(
        (item) => item.startSeconds >= period.endSeconds && !item.id.startsWith("passing")
      );

      transitions.push({
        type: "period",
        seconds: period.endSeconds,
        title: "Period ended",
        body: next
          ? `${period.name} ended. Next: ${next.name}.`
          : `${period.name} ended. See you tomorrow!`,
        soon: `${period.name} ends in 2 minutes.`,
      });
    }

    for (const lunch of LUNCHES[dayType] || []) {
      // Preserve the original behavior: avoid a duplicate notification
      // when lunch and a period end at exactly the same second.
      if (transitions.some((item) => item.seconds === lunch.endSeconds)) {
        continue;
      }

      transitions.push({
        type: "lunch",
        seconds: lunch.endSeconds,
        title: "Lunch ended",
        body: `${lunch.name} ended.`,
        soon: `${lunch.name} ends in 2 minutes.`,
      });
    }

    transitions.sort((a, b) => a.seconds - b.seconds);
    return [dayType, transitions];
  })
);

function checkNotifications(now) {
  if (!notifSettings.enabled || notificationPermission() !== "granted") {
    return;
  }

  const todayType = getDayType(now);
  const nowSeconds = secondsIntoDay(now);
  const day = dateKey(now);

  if (
    day !== lastNotificationDay ||
    (lastNotificationSeconds !== null && nowSeconds < lastNotificationSeconds - 2)
  ) {
    lastNotifiedKey = "";
    lastNotificationTime = 0;
  }

  lastNotificationDay = day;
  lastNotificationSeconds = nowSeconds;

  const transitions = todayType ? NOTIF_TRANSITIONS[todayType] : null;

  if (!transitions) {
    return;
  }

  for (const transition of transitions) {
    const transitionKey = `${todayType}:${transition.type}:${transition.seconds}`;
    const secondsLeft = transition.seconds - nowSeconds;

    if (secondsLeft > 0) {
      if (
        notifSettings.upcoming &&
        secondsLeft <= UPCOMING_WARN_SECONDS &&
        lastNotifiedKey !== `warn:${transitionKey}`
      ) {
        const key = `${day}:upcoming:${transitionKey}`;

        lastNotifiedKey = `warn:${transitionKey}`;
        lastNotificationTime = Date.now();

        void showNotification(
          transition.title,
          transition.soon,
          notificationTag(day, "upcoming", todayType, transition.seconds),
          key
        );
      }

      break;
    }

    if (
      secondsLeft >= -STALE_WINDOW_SECONDS &&
      lastNotifiedKey !== transitionKey &&
      Date.now() - lastNotificationTime > 1000
    ) {
      const allowed =
        transition.type === "lunch" ? notifSettings.lunchEnd : notifSettings.periodEnd;

      lastNotifiedKey = transitionKey;
      lastNotificationTime = Date.now();

      if (allowed) {
        const key = `${day}:end:${transitionKey}`;

        void showNotification(
          transition.title,
          transition.body,
          notificationTag(day, "end", todayType, transition.seconds),
          key
        );
      }
    }
  }
}

/* =========================================================
   Development time controls
   ========================================================= */

function currentDateTime() {
  if (!simulatedNow) {
    return new Date();
  }

  return new Date(simulatedNow.getTime() + (Date.now() - simulatedRealTime));
}

function toInputDate(date) {
  return dateKey(date);
}

function toInputTime(date) {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function updateDevStatus() {
  if (!isDevelopment || !elements.devStatus) {
    return;
  }

  setText(
    elements.devStatus,
    simulatedNow
      ? `Simulating ${new Date(simulatedAt + (Date.now() - simulatedRealTime)).toLocaleString()}`
      : "Using your computer's current time."
  );
}

function applySimulatedTime() {
  if (!elements.devDate || !elements.devTime || !elements.devStatus) {
    return;
  }

  const value = `${elements.devDate.value}T${elements.devTime.value}`;
  const parsed = new Date(value);

  if (!elements.devDate.value || !elements.devTime.value || Number.isNaN(parsed.getTime())) {
    setText(elements.devStatus, "Enter a valid date and time.");
    return;
  }

  simulatedNow = parsed;
  simulatedRealTime = Date.now();
  simulatedAt = simulatedNow.getTime();

  updateDevStatus();
  updateEverything();
  renderSchedule(currentDateTime(), true);
}

function resetSimulatedTime() {
  simulatedNow = null;
  simulatedAt = 0;
  simulatedRealTime = 0;

  if (elements.devDate) {
    elements.devDate.value = toInputDate(new Date());
  }

  if (elements.devTime) {
    elements.devTime.value = toInputTime(new Date());
  }

  updateDevStatus();
  updateEverything();
  renderSchedule(currentDateTime(), true);
}

if (isDevelopment && elements.devPanel) {
  const realNow = new Date();

  elements.devPanel.classList.remove("hidden");

  if (elements.devDate) {
    elements.devDate.value = toInputDate(realNow);
  }

  if (elements.devTime) {
    elements.devTime.value = toInputTime(realNow);
  }

  elements.devApply?.addEventListener("click", applySimulatedTime);
  elements.devReset?.addEventListener("click", resetSimulatedTime);

  updateDevStatus();
}

/* =========================================================
   Date/time helpers
   ========================================================= */

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

  if (clockFormat === "24") {
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${suffix}`;
}

function formatDuration(seconds) {
  const totalSeconds = Math.ceil(Math.max(0, seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatShortDuration(seconds) {
  const totalSeconds = Math.ceil(Math.max(0, seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

/* =========================================================
   School day logic
   ========================================================= */

function getDayType(date) {
  const key = dateKey(date);

  if (NO_SCHOOL_DATES.has(key)) {
    return null;
  }

  const dayType = DAY_EXCEPTIONS[key] || WEEK_PATTERN[date.getDay()];
  return SCHEDULES[dayType] ? dayType : null;
}

function getNextSchoolDay(date) {
  const next = new Date(date);

  do {
    next.setDate(next.getDate() + 1);
  } while (!getDayType(next));

  return next;
}

function getDisplayDayInfo(now) {
  const todayType = getDayType(now);

  if (todayType && secondsIntoDay(now) < SCHOOL_END_SECONDS[todayType]) {
    return { date: now, type: todayType, relation: "today" };
  }

  const next = getNextSchoolDay(now);
  return { date: next, type: getDayType(next), relation: "next" };
}

/* =========================================================
   Period logic
   ========================================================= */

function getCurrentPeriod(dayType, nowSeconds) {
  return (
    SCHEDULES[dayType]?.find(
      (period) => nowSeconds >= period.startSeconds && nowSeconds < period.endSeconds
    ) || null
  );
}

function getNextPeriod(dayType, nowSeconds) {
  return SCHEDULES[dayType]?.find((period) => period.startSeconds > nowSeconds) || null;
}

/* =========================================================
   Rendering
   ========================================================= */

let lastDayMessageKey = "";
let lastProgressDegrees;
let lastProgressPercent;
let renderedScheduleType;
let highlightedPeriodId;
let scheduleRows = new Map();

function renderDayMessage(now) {
  const info = getDisplayDayInfo(now);
  const messageKey = `${dateKey(info.date)}:${info.type}:${info.relation}`;

  if (messageKey === lastDayMessageKey) {
    return;
  }

  lastDayMessageKey = messageKey;

  if (!info.type) {
    setText(elements.dayMessage, "No school.");
    return;
  }

  const dayType = document.createElement("span");
  dayType.className = DAY_CLASS[info.type] || "";
  dayType.textContent = info.type;

  const article = info.type === "ER White" ? "an" : "a";

  if (info.relation === "today") {
    elements.dayMessage?.replaceChildren(`Today is ${article} `, dayType, " Day.");
    return;
  }

  const weekday = info.date.toLocaleDateString("en-US", { weekday: "long" });
  elements.dayMessage?.replaceChildren(`${weekday} will be ${article} `, dayType, " Day.");
}

function setProgress(progress) {
  const normalized = Math.max(0, Math.min(1, progress));
  const percent = Math.round(normalized * 100);
  const degrees = Math.round(normalized * 36000) / 100;

  if (degrees !== lastProgressDegrees && elements.progressRing) {
    elements.progressRing.style.setProperty("--progress", `${degrees}deg`);
    lastProgressDegrees = degrees;
  }

  if (percent !== lastProgressPercent) {
    elements.progressRing?.setAttribute("aria-valuenow", String(percent));
    setText(elements.progressPercent, `${percent}%`);
    lastProgressPercent = percent;
  }
}

function updateLunch(dayType, currentPeriod, nowSeconds) {
  const isLunchPeriod = LUNCH_HOST_PERIOD[dayType] === currentPeriod.id;
  setHidden(elements.lunchSection, !isLunchPeriod);

  if (!isLunchPeriod) {
    return;
  }

  for (const lunch of LUNCHES[dayType] || []) {
    const lunchElements = elements.lunches[lunch.id];

    if (!lunchElements) {
      continue;
    }

    let time;
    let status;

    if (nowSeconds < lunch.startSeconds) {
      time = formatShortDuration(lunch.startSeconds - nowSeconds);
      status = "until lunch";
    } else if (nowSeconds < lunch.endSeconds) {
      time = formatShortDuration(lunch.endSeconds - nowSeconds);
      status = "remaining";
    } else {
      time = "00:00";
      status = "finished";
    }

    setText(lunchElements.timer, time);
    setText(lunchElements.status, status);
  }
}

function updateMainTracker(now) {
  const todayType = getDayType(now);
  const nowSeconds = secondsIntoDay(now);

  if (!todayType) {
    setText(elements.currentPeriod, "No school today");
    setText(elements.countdown, "--:--:--");
    setText(elements.periodTimes, "");
    setProgress(0);
    setHidden(elements.lunchSection, true);
    return;
  }

  const current = getCurrentPeriod(todayType, nowSeconds);

  if (!current) {
    const first = SCHEDULES[todayType][0];

    if (nowSeconds < first.startSeconds) {
      setText(elements.currentPeriod, "School starts in");
      setText(elements.countdown, formatDuration(first.startSeconds - nowSeconds));
      setText(elements.periodTimes, formatClock(first.start));
      setProgress(0);
    } else {
      const next = getNextPeriod(todayType, nowSeconds);

      if (next) {
        setText(elements.currentPeriod, `${next.name} starts in`);
        setText(elements.countdown, formatDuration(next.startSeconds - nowSeconds));
        setText(elements.periodTimes, formatClock(next.start));
        setProgress(0);
      } else {
        setText(elements.currentPeriod, "School is over");
        setText(elements.countdown, "00:00:00");
        setText(elements.periodTimes, "");
        setProgress(1);
      }
    }

    setHidden(elements.lunchSection, true);
    return;
  }

  const totalTime = current.endSeconds - current.startSeconds;
  const elapsed = nowSeconds - current.startSeconds;

  setText(elements.currentPeriod, current.name);
  setText(elements.countdown, formatDuration(current.endSeconds - nowSeconds));
  setText(elements.periodTimes, `${formatClock(current.start)} – ${formatClock(current.end)}`);
  setProgress(elapsed / totalTime);
  updateLunch(todayType, current, nowSeconds);
}

function selectedScheduleType(now) {
  if (!elements.daySelector) {
    return getDisplayDayInfo(now).type;
  }

  return elements.daySelector.value === "auto"
    ? getDisplayDayInfo(now).type
    : elements.daySelector.value;
}

function updateScheduleHighlight(dayType, now) {
  const currentId =
    getDayType(now) === dayType ? getCurrentPeriod(dayType, secondsIntoDay(now))?.id : undefined;

  if (currentId === highlightedPeriodId) {
    return;
  }

  if (highlightedPeriodId) {
    scheduleRows.get(highlightedPeriodId)?.classList.remove("current");
  }

  if (currentId) {
    scheduleRows.get(currentId)?.classList.add("current");
  }

  highlightedPeriodId = currentId;
}

function renderSchedule(now, force = false) {
  if (!elements.scheduleList || !elements.scheduleTitle) {
    return;
  }

  const dayType = selectedScheduleType(now);

  if (!force && dayType === renderedScheduleType) {
    updateScheduleHighlight(dayType, now);
    return;
  }

  renderedScheduleType = dayType;
  highlightedPeriodId = undefined;
  scheduleRows = new Map();

  if (!dayType) {
    setText(elements.scheduleTitle, "No Schedule");
    elements.scheduleList.replaceChildren();
    return;
  }

  setText(elements.scheduleTitle, `${dayType} Day Schedule`);

  const fragment = document.createDocumentFragment();

  for (const item of DISPLAY_SCHEDULES[dayType]) {
    const row = document.createElement("div");
    row.className = "schedule-row";

    if (item.isLunch) {
      row.classList.add("lunch-row");
    } else {
      scheduleRows.set(item.id, row);
    }

    const name = document.createElement("span");
    name.textContent = item.name;

    const time = document.createElement("span");
    time.className = "schedule-time";
    time.textContent = `${formatClock(item.start)} – ${formatClock(item.end)}`;

    row.append(name, time);
    fragment.append(row);
  }

  elements.scheduleList.replaceChildren(fragment);
  updateScheduleHighlight(dayType, now);
}

/* =========================================================
   UI events
   ========================================================= */

elements.scheduleToggle?.addEventListener("click", () => {
  const shouldOpen = elements.schedulePanel?.classList.contains("hidden") ?? false;

  if (shouldOpen) {
    renderSchedule(currentDateTime(), true);
  }

  setHidden(elements.schedulePanel, !shouldOpen);
  elements.scheduleToggle?.setAttribute("aria-expanded", String(shouldOpen));
  setText(elements.scheduleToggle, shouldOpen ? "Hide Schedule" : "Show Schedule");
});

elements.daySelector?.addEventListener("change", () => {
  renderSchedule(currentDateTime(), true);
});

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

updateClockToggleLabel();

function updateNotificationUI() {
  const unsupported = !notificationsSupported();
  const permission = notificationPermission();
  const granted = permission === "granted";

  setHidden(elements.notifToggle, unsupported);
  setHidden(elements.notifSection, unsupported);

  if (unsupported) {
    return;
  }

  if (elements.notifToggle) {
    elements.notifToggle.disabled = permission === "denied";
    elements.notifToggle.setAttribute("aria-pressed", String(granted && notifSettings.enabled));
  }

  setText(
    elements.notifToggle,
    permission === "denied"
      ? "Notifications blocked"
      : granted && notifSettings.enabled
        ? "Disable Notifications"
        : "Enable Notifications"
  );

  if (elements.notifHint) {
    let hint = "";

    if (permission === "denied") {
      hint = "Notifications only work in Safari; they are blocked on Chrome.";
    } else if (granted && notifSettings.enabled) {
      hint =
        "Notifications only work in Safari; they are blocked on Chrome. \n The tab must be active for notifications to pop up, but you may use another app while Safari is open in the background.";
    }

    setText(elements.notifHint, hint);
    setHidden(elements.notifHint, !hint);
  }

  setHidden(elements.notifOptions, !granted || !notifSettings.enabled);

  if (elements.notifPeriodEnd) {
    elements.notifPeriodEnd.checked = notifSettings.periodEnd;
  }

  if (elements.notifLunchEnd) {
    elements.notifLunchEnd.checked = notifSettings.lunchEnd;
  }

  if (elements.notifUpcoming) {
    elements.notifUpcoming.checked = notifSettings.upcoming;
  }
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
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        updateNotificationUI();
        return;
      }
    } catch {
      updateNotificationUI();
      return;
    }
  }

  notifSettings.enabled = true;
  saveNotifSettings();
  updateNotificationUI();
});

for (const [checkbox, settingKey] of [
  [elements.notifPeriodEnd, "periodEnd"],
  [elements.notifLunchEnd, "lunchEnd"],
  [elements.notifUpcoming, "upcoming"],
]) {
  checkbox?.addEventListener("change", () => {
    notifSettings[settingKey] = checkbox.checked;
    saveNotifSettings();
    updateNotificationUI();
  });
}

updateNotificationUI();

/* =========================================================
   Main update loop
   ========================================================= */

function updateEverything() {
  const now = currentDateTime();

  renderDayMessage(now);
  updateMainTracker(now);
  checkNotifications(now);

  if (elements.schedulePanel && !elements.schedulePanel.classList.contains("hidden")) {
    renderSchedule(now);
  }
}

let updateTimer;

function queueNextUpdate() {
  if (document.hidden) {
    updateTimer = undefined;
    return;
  }

  const delay = 1020 - (Date.now() % 1000);

  updateTimer = setTimeout(() => {
    updateEverything();
    queueNextUpdate();
  }, delay);
}

document.addEventListener("visibilitychange", () => {
  clearTimeout(updateTimer);

  if (document.hidden) {
    updateTimer = undefined;
    return;
  }

  updateEverything();
  queueNextUpdate();
});

window.addEventListener("focus", () => {
  if (!document.hidden) {
    updateEverything();
  }
});

updateEverything();
queueNextUpdate();

/* =========================================================
   Service worker / background notifications
   ========================================================= */

async function registerBackgroundNotifications() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");

    await navigator.serviceWorker.ready;
    await syncNotifSettingsToServiceWorker();

    if ("periodicSync" in registration) {
      try {
        await registration.periodicSync.register("vram-notifications", {
          minInterval: 60_000,
        });
      } catch {
        // Periodic Background Sync may be unavailable, blocked,
        // or limited to installed/engaged PWAs.
      }
    }
  } catch {
    // Service worker registration failed
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void registerBackgroundNotifications();
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    void syncNotifSettingsToServiceWorker();
  });
}
