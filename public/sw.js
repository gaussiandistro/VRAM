/* 
   VRAM service worker

   so like chrome periodic background sync is every 60 seconds
   but not always 60s and it's not always the start of each minute
   so therefore it's not going to be super reliable but it will work
    */

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
  
  const DEFAULT_SETTINGS = {
    enabled: false,
    periodEnd: true,
    lunchEnd: true,
    upcoming: true,
  };
  
  const UPCOMING_SECONDS = 120;
  const STALE_SECONDS = 60;
  

  
  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  
  function secondsIntoDay(date) {
    return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  }
  
  function getDayType(date) {
    const key = dateKey(date);
  
    if (NO_SCHOOL_DATES.has(key)) {
      return null;
    }
  
    const dayType = DAY_EXCEPTIONS[key] || WEEK_PATTERN[date.getDay()];
    return SCHEDULES[dayType] ? dayType : null;
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
        // Match main.js behavior and avoid duplicate period/lunch alerts
        // at the exact same second.
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
  

  
  const DB_NAME = "vram-service-worker";
  const STORE_NAME = "state";
  
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
  
      request.onupgradeneeded = () => {
        const db = request.result;
  
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
  
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async function readState(key, fallback) {
    try {
      const db = await openDatabase();
  
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
  
        request.onsuccess = () => resolve(request.result ?? fallback);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return fallback;
    }
  }
  
  async function writeState(key, value) {
    try {
      const db = await openDatabase();
  
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
  
        store.put(value, key);
  
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch {
      // Storage unavailable
    }
  }
  
  async function getSettings() {
    return {
      ...DEFAULT_SETTINGS,
      ...(await readState("notification-settings", {})),
    };
  }
  
  async function alreadySent(key) {
    const sent = await readState("sent-notifications", {});
    return Boolean(sent[key]);
  }
  
  async function markSent(key) {
    const sent = await readState("sent-notifications", {});
    sent[key] = Date.now();
  
    // Keep only recent records.
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
  
    for (const [savedKey, timestamp] of Object.entries(sent)) {
      if (timestamp < cutoff) {
        delete sent[savedKey];
      }
    }
  
    await writeState("sent-notifications", sent);
  }
  

  
  self.addEventListener("message", (event) => {
    const data = event.data;
  
    if (!data || typeof data !== "object") {
      return;
    }
  
    if (data.type === "VRAM_NOTIFICATION_SETTINGS") {
      const settings = {
        enabled: Boolean(data.settings?.enabled),
        periodEnd: Boolean(data.settings?.periodEnd),
        lunchEnd: Boolean(data.settings?.lunchEnd),
        upcoming: Boolean(data.settings?.upcoming),
      };
  
      event.waitUntil(writeState("notification-settings", settings));
      return;
    }
  
    if (data.type === "VRAM_MARK_NOTIFICATION" && typeof data.key === "string") {
      event.waitUntil(markSent(data.key));
    }
  });
  

  
  function notificationTag(day, kind, dayType, seconds) {
    return `vram-${day}-${kind}-${dayType}-${seconds}`;
  }
  
  async function hasVisibleVramWindow() {
    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
  
    return clients.some((client) => client.visibilityState === "visible");
  }
  
  async function sendNotification(title, body, tag) {
    await self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });
  }
  
  async function checkBackgroundNotifications() {
    const settings = await getSettings();
  
    if (!settings.enabled) {
      return;
    }
  

    if (await hasVisibleVramWindow()) {
      return;
    }
  
    const now = new Date();
    const dayType = getDayType(now);
  
    if (!dayType) {
      return;
    }
  
    const day = dateKey(now);
    const nowSeconds = secondsIntoDay(now);
    const transitions = NOTIF_TRANSITIONS[dayType] || [];
  
    for (const transition of transitions) {
      const transitionKey = `${dayType}:${transition.type}:${transition.seconds}`;
      const secondsLeft = transition.seconds - nowSeconds;
  
      if (
        settings.upcoming &&
        secondsLeft > 0 &&
        secondsLeft <= UPCOMING_SECONDS
      ) {
        const key = `${day}:upcoming:${transitionKey}`;
  
        if (!(await alreadySent(key))) {
          await sendNotification(
            transition.title,
            transition.soon,
            notificationTag(day, "upcoming", dayType, transition.seconds)
          );
          await markSent(key);
        }
      }
  
      if (secondsLeft <= 0 && secondsLeft >= -STALE_SECONDS) {
        const allowed =
          transition.type === "lunch" ? settings.lunchEnd : settings.periodEnd;
  
        if (!allowed) {
          continue;
        }
  
        const key = `${day}:end:${transitionKey}`;
  
        if (!(await alreadySent(key))) {
          await sendNotification(
            transition.title,
            transition.body,
            notificationTag(day, "end", dayType, transition.seconds)
          );
          await markSent(key);
        }
      }
    }
  }
  

  
  self.addEventListener("install", () => {
    self.skipWaiting();
  });
  
  self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
  });
  

  
  self.addEventListener("periodicsync", (event) => {
    if (event.tag === "vram-notifications") {
      event.waitUntil(checkBackgroundNotifications());
    }
  });
  

  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
  
    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clients) => {
          for (const client of clients) {
            if ("focus" in client) {
              return client.focus();
            }
          }
  
          return self.clients.openWindow("/");
        })
    );
  });
  