// localStorage-based "database" for the Vite standalone version.
const KEY = "neon-finance-vite-v1";

function uid(list) {
  return list.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
}

function seed() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    incomes: [
      { id: 1, amount: 120000, source: "Зарплата за март", category: "Зарплата", note: "Основная работа", date: today },
      { id: 2, amount: 35000, source: "Фриланс-проект", category: "Фриланс", note: "Лендинг для клиента", date: today },
    ],
    goals: [
      { id: 1, title: "Новый ноутбук", targetAmount: 150000, currentAmount: 55000, deadline: "", color: "cyan" },
      { id: 2, title: "Отпуск в Турции", targetAmount: 200000, currentAmount: 80000, deadline: "", color: "pink" },
      { id: 3, title: "Фин. подушка", targetAmount: 500000, currentAmount: 210000, deadline: "", color: "green" },
    ],
    notes: [
      { id: 1, title: "Идея: неоновый трекер", content: "Добавить экспорт и тёмную/светлую темы.", color: "violet", pinned: false, createdAt: new Date().toISOString() },
      { id: 2, title: "План на апрель", content: "Закрыть 2 заказа и отложить 40k в подушку.", color: "amber", pinned: false, createdAt: new Date().toISOString() },
    ],
  };
}

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Array.isArray(d.incomes)) return d;
  } catch (e) {}
  const s = seed();
  save(s);
  return s;
}

export function save(d) {
  localStorage.setItem(KEY, JSON.stringify(d));
}

/* ---- Incomes ---- */
export function addIncome(d) {
  const data = load();
  data.incomes.unshift({ id: uid(data.incomes), ...d });
  save(data);
  return data;
}
export function deleteIncome(id) {
  const data = load();
  data.incomes = data.incomes.filter((x) => x.id !== id);
  save(data);
  return data;
}

/* ---- Goals ---- */
export function addGoal(d) {
  const data = load();
  data.goals.unshift({ id: uid(data.goals), ...d });
  save(data);
  return data;
}
export function updateGoal(id, patch) {
  const data = load();
  data.goals = data.goals.map((g) => (g.id === id ? { ...g, ...patch } : g));
  save(data);
  return data;
}
export function deleteGoal(id) {
  const data = load();
  data.goals = data.goals.filter((x) => x.id !== id);
  save(data);
  return data;
}

/* ---- Notes ---- */
export function addNote(d) {
  const data = load();
  data.notes.unshift({ id: uid(data.notes), createdAt: new Date().toISOString(), ...d });
  save(data);
  return data;
}
export function updateNote(id, patch) {
  const data = load();
  data.notes = data.notes.map((n) => (n.id === id ? { ...n, ...patch } : n));
  save(data);
  return data;
}
export function deleteNote(id) {
  const data = load();
  data.notes = data.notes.filter((x) => x.id !== id);
  save(data);
  return data;
}

/* ---- Import / Export ---- */
export function exportData(data) {
  const payload = { app: "neon-finance", version: 1, exportedAt: new Date().toISOString(), ...data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neon-finance-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.incomes)) throw new Error("Неверный файл");
  const merged = load();
  const maxId = (list) => list.reduce((m, x) => Math.max(m, x.id || 0), 0);
  let base = maxId(merged.incomes);
  data.incomes.forEach((i) => merged.incomes.unshift({ ...i, id: ++base }));
  base = maxId(merged.goals);
  (data.goals || []).forEach((g) => merged.goals.unshift({ ...g, id: ++base }));
  base = maxId(merged.notes);
  (data.notes || []).forEach((n) => merged.notes.unshift({ ...n, id: ++base, createdAt: n.createdAt || new Date().toISOString() }));
  save(merged);
  return merged;
}

export function resetAll() {
  const empty = { incomes: [], goals: [], notes: [] };
  save(empty);
  return empty;
}
