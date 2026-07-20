export type Period = "day" | "week" | "month" | "year" | "all";

export interface PeriodRange {
  from: Date;
  to: Date;
  label: string;
}

const WEEKDAYS = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

const WEEKDAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

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

const MONTHS_FULL = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPeriodSubtitle(value: Period, now = new Date()): string {
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
      const weekNo = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
      return `${weekNo}-я неделя ${now.getFullYear()}`;
    }
    case "month": {
      return `${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()}`;
    }
    case "year":
      return `${now.getFullYear()} год`;
    case "all":
      return "За всё время";
  }
}

export function getPeriodRange(value: Period, now = new Date()): PeriodRange {
  let from: Date;
  let to: Date = new Date(now);
  to.setHours(23, 59, 59, 999);

  switch (value) {
    case "day": {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      from.setHours(0, 0, 0, 0);
      break;
    }
    case "week": {
      const dayNr = (now.getDay() + 6) % 7;
      from = new Date(now);
      from.setDate(now.getDate() - dayNr);
      from.setHours(0, 0, 0, 0);
      break;
    }
    case "month": {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      from.setHours(0, 0, 0, 0);
      break;
    }
    case "year": {
      from = new Date(now.getFullYear(), 0, 1);
      from.setHours(0, 0, 0, 0);
      break;
    }
    case "all": {
      from = new Date(2000, 0, 1);
      break;
    }
  }

  return { from, to, label: formatPeriodSubtitle(value, now) };
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatWeekday(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return WEEKDAYS_SHORT[d.getDay()];
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Group items by day, returning items in descending day order */
export function groupByDay<T extends { occurredOn: Date | string }>(items: T[]): { date: Date; items: T[] }[] {
  const map = new Map<string, { date: Date; items: T[] }>();
  for (const item of items) {
    const d = typeof item.occurredOn === "string" ? new Date(item.occurredOn) : item.occurredOn;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const bucket = map.get(key) ?? { date: d, items: [] };
    bucket.items.push(item);
    map.set(key, bucket);
  }
  return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
}
