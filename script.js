/* ============================================================
   RAMWATCH
   Simple standalone school schedule tracker
   ============================================================ */


/* ============================================================
   CONFIGURATION
   ============================================================ */

/*
  Regular weekly pattern:

  Monday    = Blue
  Tuesday   = White
  Wednesday = RAM
  Thursday  = Blue
  Friday    = White
*/

const WEEK_PATTERN = {
  1: "Blue",
  2: "White",
  3: "RAM",
  4: "Blue",
  5: "White"
};


/*
  Individual dates that do not follow the normal pattern.

  Format:
  "YYYY-MM-DD": "Blue"
  "YYYY-MM-DD": "White"
  "YYYY-MM-DD": "RAM"
  "YYYY-MM-DD": "ER White"
*/

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
  "2026-10-22": "ER White",

  "2026-10-19": "Blue",
  "2026-10-20": "White",
  "2026-10-21": "Blue"
};


/*
  Dates where there is no school.
*/

const NO_SCHOOL_DATES = new Set([
  "2026-09-07"
]);


/* ============================================================
   SCHEDULE DATA
   ============================================================ */

const SCHEDULES = {

  Blue: [
    {
      id: "p1",
      name: "1st Period",
      start: "07:30",
      end: "09:00"
    },
    {
      id: "passing1",
      name: "Passing Period",
      start: "09:00",
      end: "09:05"
    },
    {
      id: "home",
      name: "Home Lab",
      start: "09:05",
      end: "09:25"
    },
    {
      id: "passing2",
      name: "Passing Period",
      start: "09:25",
      end: "09:30"
    },
    {
      id: "seminar1",
      name: "Seminar L1",
      start: "09:30",
      end: "09:50"
    },
    {
      id: "passing3",
      name: "Passing Period",
      start: "09:50",
      end: "09:55"
    },
    {
      id: "seminar2",
      name: "Seminar L2",
      start: "09:55",
      end: "10:40"
    },
    {
      id: "passing4",
      name: "Passing Period",
      start: "10:40",
      end: "10:45"
    },
    {
      id: "p5",
      name: "5th Period",
      start: "10:45",
      end: "12:55"
    },
    {
      id: "passing5",
      name: "Passing Period",
      start: "12:55",
      end: "13:00"
    },
    {
      id: "p7",
      name: "7th Period",
      start: "13:00",
      end: "14:30"
    }
  ],


  White: [
    {
      id: "p2",
      name: "2nd Period",
      start: "07:30",
      end: "09:00"
    },
    {
      id: "passing1",
      name: "Passing Period",
      start: "09:00",
      end: "09:05"
    },
    {
      id: "p4",
      name: "4th Period",
      start: "09:05",
      end: "10:40"
    },
    {
      id: "passing2",
      name: "Passing Period",
      start: "10:40",
      end: "10:45"
    },
    {
      id: "p6",
      name: "6th Period",
      start: "10:45",
      end: "12:55"
    },
    {
      id: "passing3",
      name: "Passing Period",
      start: "12:55",
      end: "13:00"
    },
    {
      id: "p8",
      name: "8th Period",
      start: "13:00",
      end: "14:30"
    }
  ],


  RAM: [
    {
      id: "p1",
      name: "1st Period",
      start: "07:30",
      end: "08:20"
    },
    {
      id: "passing1",
      name: "Passing Period",
      start: "08:20",
      end: "08:25"
    },
    {
      id: "p2",
      name: "2nd Period",
      start: "08:25",
      end: "09:15"
    },
    {
      id: "passing2",
      name: "Passing Period",
      start: "09:15",
      end: "09:20"
    },
    {
      id: "p4",
      name: "4th Period",
      start: "09:20",
      end: "10:10"
    },
    {
      id: "passing3",
      name: "Passing Period",
      start: "10:10",
      end: "10:15"
    },
    {
      id: "p5",
      name: "5th Period",
      start: "10:15",
      end: "11:05"
    },
    {
      id: "passing4",
      name: "Passing Period",
      start: "11:05",
      end: "11:10"
    },
    {
      id: "p6",
      name: "6th Period",
      start: "11:10",
      end: "12:40"
    },
    {
      id: "passing5",
      name: "Passing Period",
      start: "12:40",
      end: "12:45"
    },
    {
      id: "p7",
      name: "7th Period",
      start: "12:45",
      end: "13:35"
    },
    {
      id: "passing6",
      name: "Passing Period",
      start: "13:35",
      end: "13:40"
    },
    {
      id: "p8",
      name: "8th Period",
      start: "13:40",
      end: "14:30"
    }
  ],


  "ER White": [
    {
      id: "p2",
      name: "2nd Period",
      start: "07:30",
      end: "08:40"
    },
    {
      id: "p4",
      name: "4th Period",
      start: "08:40",
      end: "09:45"
    },
    {
      id: "p6",
      name: "6th Period",
      start: "09:45",
      end: "10:45"
    },
    {
      id: "passing1",
      name: "Passing Period",
      start: "10:45",
      end: "10:50"
    },
    {
      id: "p8",
      name: "8th Period",
      start: "10:50",
      end: "12:00"
    }
  ]

};


/* ============================================================
   LUNCH DATA
   ============================================================ */

const LUNCHES = {

  Blue: [
    {
      id: "A",
      name: "A Lunch",
      start: "10:45",
      end: "11:15"
    },
    {
      id: "B",
      name: "B Lunch",
      start: "11:35",
      end: "12:05"
    },
    {
      id: "C",
      name: "C Lunch",
      start: "12:25",
      end: "12:55"
    }
  ],


  White: [
    {
      id: "A",
      name: "A Lunch",
      start: "10:45",
      end: "11:15"
    },
    {
      id: "B",
      name: "B Lunch",
      start: "11:35",
      end: "12:05"
    },
    {
      id: "C",
      name: "C Lunch",
      start: "12:25",
      end: "12:55"
    }
  ],


  RAM: [
    {
      id: "A",
      name: "A Lunch",
      start: "11:10",
      end: "11:35"
    },
    {
      id: "B",
      name: "B Lunch",
      start: "11:40",
      end: "12:10"
    },
    {
      id: "C",
      name: "C Lunch",
      start: "12:15",
      end: "12:40"
    }
  ]

};


/* ============================================================
   DOM
   ============================================================ */

const dayMessage = document.getElementById("dayMessage");

const currentPeriodElement =
  document.getElementById("currentPeriod");

const countdownElement =
  document.getElementById("countdown");

const progressRing =
  document.getElementById("progressRing");

const progressPercent =
  document.getElementById("progressPercent");

const periodTimes =
  document.getElementById("periodTimes");

const lunchSection =
  document.getElementById("lunchSection");

const scheduleToggle =
  document.getElementById("scheduleToggle");

const schedulePanel =
  document.getElementById("schedulePanel");

const scheduleList =
  document.getElementById("scheduleList");

const scheduleTitle =
  document.getElementById("scheduleTitle");

const daySelector =
  document.getElementById("daySelector");


/* ============================================================
   DATE / TIME HELPERS
   ============================================================ */

function dateKey(date) {
  const year = date.getFullYear();

  const month =
    String(date.getMonth() + 1).padStart(2, "0");

  const day =
    String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function timeToDate(time, referenceDate = new Date()) {
  const [hours, minutes] =
    time.split(":").map(Number);

  const result =
    new Date(referenceDate);

  result.setHours(
    hours,
    minutes,
    0,
    0
  );

  return result;
}


function formatTime12(time) {
  const [hoursString, minutes] =
    time.split(":");

  const hours =
    Number(hoursString);

  const displayHour =
    hours % 12 || 12;

  return `${displayHour}:${minutes}`;
}


function formatDuration(milliseconds) {
  milliseconds =
    Math.max(0, milliseconds);

  const totalSeconds =
    Math.floor(milliseconds / 1000);

  const hours =
    Math.floor(totalSeconds / 3600);

  const minutes =
    Math.floor((totalSeconds % 3600) / 60);

  const seconds =
    totalSeconds % 60;

  return [
    hours,
    minutes,
    seconds
  ]
    .map(value =>
      String(value).padStart(2, "0")
    )
    .join(":");
}


function formatShortDuration(milliseconds) {
  milliseconds =
    Math.max(0, milliseconds);

  const totalSeconds =
    Math.floor(milliseconds / 1000);

  const minutes =
    Math.floor(totalSeconds / 60);

  const seconds =
    totalSeconds % 60;

  return (
    String(minutes).padStart(2, "0")
    + ":"
    + String(seconds).padStart(2, "0")
  );
}


/* ============================================================
   SCHOOL DAY LOGIC
   ============================================================ */

function isNoSchool(date) {
  const key =
    dateKey(date);

  if (NO_SCHOOL_DATES.has(key)) {
    return true;
  }

  const day =
    date.getDay();

  return day === 0 || day === 6;
}


function getDayType(date) {
  const key =
    dateKey(date);

  if (NO_SCHOOL_DATES.has(key)) {
    return null;
  }

  if (DAY_EXCEPTIONS[key]) {
    return DAY_EXCEPTIONS[key];
  }

  return WEEK_PATTERN[date.getDay()] || null;
}


function getNextSchoolDay(date) {
  const next =
    new Date(date);

  do {
    next.setDate(
      next.getDate() + 1
    );
  } while (
    isNoSchool(next)
    || !getDayType(next)
  );

  return next;
}


function getDisplayDayInfo() {
  const now =
    new Date();

  const todayType =
    getDayType(now);

  if (todayType) {
    const schedule =
      SCHEDULES[todayType];

    const lastPeriod =
      schedule[schedule.length - 1];

    const end =
      timeToDate(lastPeriod.end, now);

    if (now < end) {
      return {
        date: now,
        type: todayType,
        relation: "today"
      };
    }
  }

  const next =
    getNextSchoolDay(now);

  return {
    date: next,
    type: getDayType(next),
    relation: "next"
  };
}


/* ============================================================
   PERIOD LOGIC
   ============================================================ */

function getCurrentPeriod(dayType) {
  const schedule =
    SCHEDULES[dayType];

  if (!schedule) {
    return null;
  }

  const now =
    new Date();

  for (const period of schedule) {
    const start =
      timeToDate(period.start, now);

    const end =
      timeToDate(period.end, now);

    if (
      now >= start
      && now < end
    ) {
      return {
        ...period,
        startDate: start,
        endDate: end
      };
    }
  }

  return null;
}


function getNextPeriod(dayType) {
  const schedule =
    SCHEDULES[dayType];

  if (!schedule) {
    return null;
  }

  const now =
    new Date();

  for (const period of schedule) {
    const start =
      timeToDate(period.start, now);

    if (start > now) {
      return {
        ...period,
        startDate: start
      };
    }
  }

  return null;
}


/* ============================================================
   DAY MESSAGE
   ============================================================ */

function renderDayMessage() {
  const info =
    getDisplayDayInfo();

  dayMessage.className = "";

  if (!info.type) {
    dayMessage.textContent =
      "No school.";

    return;
  }

  const article =
    info.type === "ER White"
      ? "an"
      : "a";

  if (info.relation === "today") {
    dayMessage.innerHTML =
      `Today is ${article} <span>${info.type}</span> Day.`;
  } else {
    const weekday =
      info.date.toLocaleDateString(
        "en-US",
        {
          weekday: "long"
        }
      );

    dayMessage.innerHTML =
      `${weekday} will be ${article} <span>${info.type}</span> Day.`;
  }

  const span =
    dayMessage.querySelector("span");

  if (!span) {
    return;
  }

  if (info.type === "Blue") {
    span.className =
      "day-blue";
  } else if (info.type === "White") {
    span.className =
      "day-white";
  } else if (info.type === "RAM") {
    span.className =
      "day-ram";
  } else if (info.type === "ER White") {
    span.className =
      "day-white";
  }
}


/* ============================================================
   MAIN TIMER
   ============================================================ */

function updateMainTracker() {
  const now =
    new Date();

  const todayType =
    getDayType(now);

  if (!todayType) {
    currentPeriodElement.textContent =
      "No school today";

    countdownElement.textContent =
      "--:--:--";

    periodTimes.textContent =
      "";

    setProgress(0);

    lunchSection.classList.add("hidden");

    return;
  }

  const current =
    getCurrentPeriod(todayType);

  if (!current) {
    const first =
      SCHEDULES[todayType][0];

    const firstStart =
      timeToDate(first.start, now);

    if (now < firstStart) {
      currentPeriodElement.textContent =
        "School starts in";

      countdownElement.textContent =
        formatDuration(
          firstStart - now
        );

      periodTimes.textContent =
        formatTime12(first.start);

      setProgress(0);
    } else {
      const next =
        getNextPeriod(todayType);

      if (next) {
        currentPeriodElement.textContent =
          `${next.name} starts in`;

        countdownElement.textContent =
          formatDuration(
            next.startDate - now
          );

        periodTimes.textContent =
          formatTime12(next.start);
      } else {
        currentPeriodElement.textContent =
          "School is over";

        countdownElement.textContent =
          "00:00:00";

        periodTimes.textContent =
          "";

        setProgress(1);
      }
    }

    lunchSection.classList.add("hidden");

    return;
  }

  currentPeriodElement.textContent =
    current.name;

  const totalTime =
    current.endDate - current.startDate;

  const elapsed =
    now - current.startDate;

  const remaining =
    current.endDate - now;

  countdownElement.textContent =
    formatDuration(remaining);

  periodTimes.textContent =
    `${formatTime12(current.start)} – ${formatTime12(current.end)}`;

  setProgress(
    elapsed / totalTime
  );

  updateLunch(todayType, current);
}


/* ============================================================
   PROGRESS
   ============================================================ */

function setProgress(progress) {
  progress =
    Math.max(
      0,
      Math.min(1, progress)
    );

  const degrees =
    progress * 360;

  progressRing.style.setProperty(
    "--progress",
    `${degrees}deg`
  );

  progressPercent.textContent =
    `${Math.round(progress * 100)}%`;
}


/* ============================================================
   LUNCH TRACKER
   ============================================================ */

function updateLunch(dayType, currentPeriod) {
  const lunches =
    LUNCHES[dayType];

  if (!lunches) {
    lunchSection.classList.add("hidden");
    return;
  }

  const lunchHost =
    (
      dayType === "Blue"
      && currentPeriod.id === "p5"
    )
    ||
    (
      dayType === "White"
      && currentPeriod.id === "p6"
    )
    ||
    (
      dayType === "RAM"
      && currentPeriod.id === "p6"
    );

  if (!lunchHost) {
    lunchSection.classList.add(
      "hidden"
    );

    return;
  }

  lunchSection.classList.remove(
    "hidden"
  );

  const now =
    new Date();

  lunches.forEach(lunch => {
    const start =
      timeToDate(lunch.start, now);

    const end =
      timeToDate(lunch.end, now);

    const timer =
      document.getElementById(
        `lunch${lunch.id}Timer`
      );

    const status =
      document.getElementById(
        `lunch${lunch.id}Status`
      );

    if (now < start) {
      timer.textContent =
        formatShortDuration(
          start - now
        );

      status.textContent =
        "until lunch";
    }

    else if (now < end) {
      timer.textContent =
        formatShortDuration(
          end - now
        );

      status.textContent =
        "remaining";
    }

    else {
      timer.textContent =
        "00:00";

      status.textContent =
        "finished";
    }
  });
}


/* ============================================================
   SCHEDULE DISPLAY
   ============================================================ */

function selectedScheduleType() {
  if (
    daySelector.value !== "auto"
  ) {
    return daySelector.value;
  }

  return getDisplayDayInfo().type;
}


function renderSchedule() {
  const dayType =
    selectedScheduleType();

  scheduleList.innerHTML = "";

  if (!dayType) {
    scheduleTitle.textContent =
      "No Schedule";

    return;
  }

  const schedule =
    SCHEDULES[dayType];

  if (!schedule) {
    scheduleTitle.textContent =
      "No Schedule";

    return;
  }

  scheduleTitle.textContent =
    `${dayType} Day Schedule`;

  const lunches =
    LUNCHES[dayType] || [];

  const current =
    getCurrentPeriod(dayType);

  const displayItems = [
    ...schedule.map(item => ({
      ...item,
      isLunch: false
    })),

    ...lunches.map(item => ({
      ...item,
      isLunch: true
    }))
  ];

  displayItems.sort((a, b) => {
    return (
      timeToDate(a.start)
      -
      timeToDate(b.start)
    );
  });

  displayItems.forEach(item => {
    const row =
      document.createElement("div");

    row.className =
      "schedule-row";

    if (item.isLunch) {
      row.classList.add(
        "lunch-row"
      );
    }

    if (
      current
      && current.id === item.id
      && !item.isLunch
    ) {
      row.classList.add(
        "current"
      );
    }

    const name =
      document.createElement("span");

    name.textContent =
      item.name;

    const time =
      document.createElement("span");

    time.className =
      "schedule-time";

    time.textContent =
      `${formatTime12(item.start)} – ${formatTime12(item.end)}`;

    row.appendChild(name);

    row.appendChild(time);

    scheduleList.appendChild(row);
  });
}


/* ============================================================
   UI EVENTS
   ============================================================ */

scheduleToggle.addEventListener(
  "click",
  () => {
    const hidden =
      schedulePanel.classList.contains(
        "hidden"
      );

    if (hidden) {
      renderSchedule();

      schedulePanel.classList.remove(
        "hidden"
      );

      scheduleToggle.textContent =
        "Hide Schedule";
    } else {
      schedulePanel.classList.add(
        "hidden"
      );

      scheduleToggle.textContent =
        "Show Schedule";
    }
  }
);


daySelector.addEventListener(
  "change",
  renderSchedule
);


/* ============================================================
   START
   ============================================================ */

function updateEverything() {
  renderDayMessage();

  updateMainTracker();

  if (
    !schedulePanel.classList.contains(
      "hidden"
    )
  ) {
    renderSchedule();
  }
}


updateEverything();

setInterval(
  updateEverything,
  1000
);
