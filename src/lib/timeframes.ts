export type TimeframeValue = "day" | "week" | "month" | "year";

export interface TimeframeConfig {
  value: TimeframeValue;
  label: string;
  icon: string;
  /** main neon hex color */
  accent: string;
  /** comma-separated rgb values, used for rgba() glow shadows */
  glowRgb: string;
}

export const TIMEFRAMES: TimeframeConfig[] = [
  {
    value: "day",
    label: "День",
    icon: "☀️",
    accent: "#ff2d6f",
    glowRgb: "255,45,111",
  },
  {
    value: "week",
    label: "Неделя",
    icon: "🗓️",
    accent: "#ffb020",
    glowRgb: "255,176,32",
  },
  {
    value: "month",
    label: "Месяц",
    icon: "📆",
    accent: "#b14dff",
    glowRgb: "177,77,255",
  },
  {
    value: "year",
    label: "Год",
    icon: "🏆",
    accent: "#00ffa3",
    glowRgb: "0,255,163",
  },
];

export const TIMEFRAME_MAP: Record<TimeframeValue, TimeframeConfig> =
  TIMEFRAMES.reduce(
    (acc, tf) => {
      acc[tf.value] = tf;
      return acc;
    },
    {} as Record<TimeframeValue, TimeframeConfig>
  );

const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const WEEKDAYS = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

/** Returns a human-friendly subtitle describing the current period. */
export function periodSubtitle(value: TimeframeValue, now = new Date()): string {
  switch (value) {
    case "day": {
      const wd = WEEKDAYS[now.getDay()];
      return `${wd}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
    }
    case "week": {
      const target = new Date(now.valueOf());
      const dayNr = (now.getDay() + 6) % 7;
      target.setDate(now.getDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
      }
      const weekNo =
        1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
      return `${weekNo}-я неделя ${now.getFullYear()}`;
    }
    case "month": {
      const cap =
        MONTHS[now.getMonth()].charAt(0).toUpperCase() +
        MONTHS[now.getMonth()].slice(1);
      return `${cap} ${now.getFullYear()}`;
    }
    case "year":
      return `${now.getFullYear()} год`;
  }
}
