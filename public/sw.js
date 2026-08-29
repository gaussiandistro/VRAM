const SCHEDULES = {
  Blue: [
    ["1st Period", "07:30", "09:00"],
    ["5th Period", "10:45", "12:55"],
    ["7th Period", "13:00", "14:30"],
  ],
  White: [
    ["2nd Period", "07:30", "09:00"],
    ["4th Period", "09:05", "10:40"],
    ["6th Period", "10:45", "12:55"],
    ["8th Period", "13:00", "14:30"],
  ],
  RAM: [
    ["1st Period", "07:30", "08:20"],
    ["2nd Period", "08:25", "09:15"],
    ["4th Period", "09:20", "10:10"],
    ["5th Period", "10:15", "11:05"],
    ["6th Period", "11:10", "12:40"],
    ["7th Period", "12:45", "13:35"],
    ["8th Period", "13:40", "14:30"],
  ],
};

const WEEK_PATTERN = { 1: "Blue", 2: "White", 3: "RAM", 4: "Blue", 5: "White" };
const UPCOMING_SECONDS = 120;

function secondsIntoDay(date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

function getDayType(date) {
  return WEEK_PATTERN[date.getDay()] || null;
}

function getTransitions(dayType) {
  return SCHEDULES[dayType].flatMap(([name, start, end]) => {
    const toSeconds = (value) => {
      const [hours, minutes] = value.split(":").map(Number);
      return hours * 3600 + minutes * 60;
    };
    return [
      { seconds: toSeconds(start), title: "School starting", body: `${name} starts now.` },
      { seconds: toSeconds(end), title: "Period ended", body: `${name} ended.` },
    ];
  });
}

async function checkBackgroundNotifications() {
  const now = new Date();
  const dayType = getDayType(now);
  const settings = await self.registration.getNotifications({ tag: "vram-background" });

  if (!dayType || settings.length) return;

  const nowSeconds = secondsIntoDay(now);
  const transition = getTransitions(dayType).find(
    (item) => item.seconds - nowSeconds > 0 && item.seconds - nowSeconds <= UPCOMING_SECONDS
  );

  if (transition) {
    await self.registration.showNotification(transition.title, {
      body: transition.body,
      tag: "vram-background",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });
  }
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "vram-notifications") {
    event.waitUntil(checkBackgroundNotifications());
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
