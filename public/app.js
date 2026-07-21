/* =========================================================
   NEON//FINANCE — Vanilla JavaScript app
   Zero dependencies. Stores data in localStorage.
   ========================================================= */
(function () {
  "use strict";

  // ---------- constants ----------
  var STORAGE_KEY = "neon-finance-v2";
  var SETTINGS_KEY = "neon-finance-settings-v2";
  var INCOME_CATEGORIES = ["Зарплата", "Фриланс", "Инвестиции", "Подарок", "Возврат", "Прочее"];
  var CATEGORY_COLOR = {
    "Зарплата": "cyan", "Фриланс": "lime", "Инвестиции": "magenta",
    "Подарок": "amber", "Возврат": "violet", "Прочее": "red"
  };
  var COLOR_HEX = {
    cyan: "#00f0ff", magenta: "#ff00d4", lime: "#a6ff00",
    amber: "#ffb000", red: "#ff2a5f", violet: "#8a2be2"
  };
  var COLOR_OPTS = ["cyan", "magenta", "lime", "amber", "violet", "red"];
  var CURRENCIES = ["₽", "$", "€", "₸", "₴"];
  var MONTHS_RU = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

  // ---------- state ----------
  var state = {
    tab: "incomes",
    data: null,
    settings: { name: "", currency: "₽" },
    filters: {
      incomeQuery: "", incomeCat: "all", incomePeriod: "all",
      noteQuery: ""
    }
  };

  // ---------- helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === "class") e.className = attrs[k];
        else if (k === "html") e.innerHTML = attrs[k];
        else if (k === "text") e.textContent = attrs[k];
        else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === "data") { for (var d in attrs[k]) e.dataset[d] = attrs[k][d]; }
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      children.forEach(function (c) {
        if (c == null) return;
        e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return e;
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function nowISO() { return new Date().toISOString(); }
  function fmtMoney(v) {
    var n = isFinite(v) ? v : 0;
    var rounded = Math.round(n * 100) / 100;
    var str = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(rounded);
    return str + " " + (state.settings.currency || "₽");
  }
  function fmtDate(iso) {
    if (!iso) return "—";
    var parts = String(iso).slice(0, 10).split("-");
    if (parts.length === 3) return parts[2] + "." + parts[1] + "." + parts[0];
    return iso;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function nextId(list) { return list.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0) + 1; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]; }); }

  // ---------- SVG icons (inline) ----------
  var ICO = {
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-8 0v13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pencil: '<svg viewBox="0 0 24 24"><path d="M4 20h4L20 8l-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M9 3h6v6l3 4H6l3-4z M12 13v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    coins: '<svg viewBox="0 0 24 24"><ellipse cx="9" cy="7" rx="6" ry="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="15" cy="15" rx="6" ry="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 9h18M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    tag: '<svg viewBox="0 0 24 24"><path d="M20 12l-8 8-9-9V3h8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M6 3h9l5 5v13H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    income: '<svg viewBox="0 0 24 24"><path d="M4 17l6-6 4 4 6-8M14 7h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10m5 10V4m5 16v-8m5 8V8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    pie: '<svg viewBox="0 0 24 24"><path d="M12 3v9h9a9 9 0 1 1-9-9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.9 6 6.6.6-5 4.6 1.5 6.5-6-3.5-6 3.5 1.5-6.5-5-4.6 6.6-.6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    hash: '<svg viewBox="0 0 24 24"><path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 3v14m0 0l-5-5m5 5l5-5M4 21h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 21V7m0 0l-5 5m5-5l5 5M4 3h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trend: '<svg viewBox="0 0 24 24"><path d="M4 17l6-6 4 4 6-8M14 7h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // ---------- storage ----------
  function seed() {
    var today = todayISO();
    var prev = new Date(); prev.setMonth(prev.getMonth() - 1);
    var prevISO = prev.toISOString().slice(0, 10);
    return {
      incomes: [
        { id: 1, amount: 120000, source: "Зарплата за месяц", category: "Зарплата", note: "Основная работа", date: today },
        { id: 2, amount: 35000, source: "Фриланс-проект", category: "Фриланс", note: "Лендинг для клиента", date: today },
        { id: 3, amount: 90000, source: "Прошлая зарплата", category: "Зарплата", note: "", date: prevISO }
      ],
      goals: [
        { id: 1, title: "Новый ноутбук", target: 150000, current: 55000, deadline: "", color: "cyan" },
        { id: 2, title: "Отпуск в Турции", target: 200000, current: 80000, deadline: "", color: "magenta" },
        { id: 3, title: "Финансовая подушка", target: 500000, current: 210000, deadline: "", color: "lime" }
      ],
      notes: [
        { id: 1, title: "Идея: неоновый трекер", content: "Добавить экспорт и офлайн-режим.", color: "magenta", pinned: true, createdAt: nowISO() },
        { id: 2, title: "План на месяц", content: "Закрыть 2 заказа и отложить 40k.", color: "amber", pinned: false, createdAt: nowISO() }
      ]
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && Array.isArray(d.incomes)) return d;
      }
    } catch (e) {}
    var s = seed();
    save(s);
    return s;
  }
  function save(d) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) {}
  }
  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s) return { name: s.name || "", currency: s.currency || "₽" };
      }
    } catch (e) {}
    return { name: "", currency: "₽" };
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) {}
  }

  // ---------- toast ----------
  var toastTimer;
  function toast(msg, kind) {
    var t = $("#toast");
    t.className = "toast" + (kind ? " " + kind : "");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2400);
  }

  // ---------- modal ----------
  function openModal(title, body, accent) {
    var m = $("#modal");
    $("#modal-title").textContent = title;
    var panel = m.querySelector(".modal-panel");
    panel.dataset.c = accent || "cyan";
    panel.style.setProperty("--neon", COLOR_HEX[accent || "cyan"]);
    var b = $("#modal-body");
    b.innerHTML = "";
    b.appendChild(body);
    m.hidden = false;
  }
  function closeModal() { $("#modal").hidden = true; }

  // ---------- computations ----------
  function totalIncome() {
    return state.data.incomes.reduce(function (s, i) { return s + Number(i.amount); }, 0);
  }
  function goalsProgress() {
    var t = state.data.goals.reduce(function (s, g) { return s + Number(g.target); }, 0);
    var c = state.data.goals.reduce(function (s, g) { return s + Number(g.current); }, 0);
    return t > 0 ? clamp((c / t) * 100, 0, 100) : 0;
  }

  // ---------- filters ----------
  function filteredIncomes() {
    var list = state.data.incomes;
    var q = state.filters.incomeQuery.trim().toLowerCase();
    var cat = state.filters.incomeCat;
    var p = state.filters.incomePeriod;
    var now = new Date();
    var ym = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    var lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var lym = lm.getFullYear() + "-" + String(lm.getMonth() + 1).padStart(2, "0");
    return list.filter(function (i) {
      if (cat !== "all" && i.category !== cat) return false;
      if (p === "month" && String(i.date).indexOf(ym) !== 0) return false;
      if (p === "last" && String(i.date).indexOf(lym) !== 0) return false;
      if (q && !(String(i.source).toLowerCase().indexOf(q) !== -1 || String(i.note || "").toLowerCase().indexOf(q) !== -1)) return false;
      return true;
    });
  }
  function sortedNotes() {
    var q = state.filters.noteQuery.trim().toLowerCase();
    var arr = state.data.notes.filter(function (n) {
      if (!q) return true;
      return n.title.toLowerCase().indexOf(q) !== -1 || (n.content || "").toLowerCase().indexOf(q) !== -1;
    });
    return arr.sort(function (a, b) {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
  }

  // ---------- render: header stats ----------
  function renderHeader() {
    $("#today-date").textContent = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
    $("#hero-greet").textContent = state.settings.name ? "Привет, " + state.settings.name : "Привет, оператор";
    $("#stat-income").textContent = fmtMoney(totalIncome());
    $("#stat-goals").textContent = Math.round(goalsProgress()) + "%";
    $("#stat-notes").textContent = String(state.data.notes.length);
  }

  function renderTabs() {
    $$(".seg,.dock-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.nav === state.tab);
    });
  }

  // ---------- render: INCOMES ----------
  function renderIncomes() {
    var main = $("#main");
    main.innerHTML = "";

    var head = el("div", { class: "section-head" }, [
      el("div", {}, [
        el("h2", { class: "section-title" }, [
          el("small", { text: "// TRANSACTIONS" }),
          document.createTextNode("Доходы")
        ])
      ]),
      (function () {
        var b = el("button", { class: "btn solid", "data-c": "lime" }, []);
        b.innerHTML = ICO.plus + '<span>Доход</span>';
        b.addEventListener("click", function () { openIncomeForm(); });
        return b;
      })()
    ]);
    main.appendChild(head);

    // toolbar
    var bar = el("div", { class: "toolbar" });
    var s = el("div", { class: "search" });
    s.innerHTML = ICO.search;
    var si = el("input", { type: "text", placeholder: "Поиск по источнику или заметке…", value: state.filters.incomeQuery });
    si.addEventListener("input", function (e) { state.filters.incomeQuery = e.target.value; renderIncomes(); si.focus(); });
    s.appendChild(si);
    bar.appendChild(s);
    main.appendChild(bar);

    var periods = [["all","Все"], ["month","Этот месяц"], ["last","Прошлый"]];
    var pr = el("div", { class: "chip-row" });
    periods.forEach(function (p) {
      var c = el("button", { class: "chip" + (state.filters.incomePeriod === p[0] ? " active" : ""), "data-c": "cyan", text: p[1] });
      c.addEventListener("click", function () { state.filters.incomePeriod = p[0]; renderIncomes(); });
      pr.appendChild(c);
    });
    main.appendChild(pr);

    var presentCats = INCOME_CATEGORIES.filter(function (c) {
      return state.data.incomes.some(function (i) { return i.category === c; });
    });
    if (presentCats.length) {
      var cr = el("div", { class: "chip-row" });
      var all = el("button", { class: "chip" + (state.filters.incomeCat === "all" ? " active" : ""), "data-c": "magenta", text: "Все категории" });
      all.addEventListener("click", function () { state.filters.incomeCat = "all"; renderIncomes(); });
      cr.appendChild(all);
      presentCats.forEach(function (c) {
        var b = el("button", { class: "chip" + (state.filters.incomeCat === c ? " active" : ""), "data-c": CATEGORY_COLOR[c] || "cyan" });
        b.innerHTML = ICO.tag + '<span>' + esc(c) + '</span>';
        b.addEventListener("click", function () { state.filters.incomeCat = c; renderIncomes(); });
        cr.appendChild(b);
      });
      main.appendChild(cr);
    }

    var list = filteredIncomes();
    var sum = list.reduce(function (s, i) { return s + Number(i.amount); }, 0);
    main.appendChild(el("p", { class: "mono muted", style: "margin:12px 0", text: "// Показано: " + list.length + " · сумма " + fmtMoney(sum) }));

    if (list.length === 0) {
      main.appendChild(emptyState(ICO.income, state.data.incomes.length === 0 ? "Доходов пока нет" : "Ничего не найдено", state.data.incomes.length === 0 ? "Добавьте первый доход, чтобы начать." : "Измените фильтры или поиск."));
      return;
    }

    var container = el("div", { class: "list" });
    list.forEach(function (inc) {
      var c = CATEGORY_COLOR[inc.category] || "cyan";
      var card = el("div", { class: "card", "data-c": c });
      var row = el("div", { class: "card-row" });
      var ico = el("div", { class: "card-ico", html: ICO.income });
      var main2 = el("div", { class: "card-main" });
      var headR = el("div", { class: "card-head" }, [
        el("h4", { class: "card-title", text: inc.source }),
        el("span", { class: "card-amount", text: fmtMoney(Number(inc.amount)) })
      ]);
      var meta = el("div", { class: "card-meta" });
      var t1 = el("span", { class: "tag", "data-c": c }); t1.innerHTML = ICO.tag + '<span>' + esc(inc.category) + '</span>'; meta.appendChild(t1);
      var t2 = el("span", { class: "tag", "data-c": "magenta" }); t2.innerHTML = ICO.calendar + '<span>' + esc(fmtDate(inc.date)) + '</span>'; meta.appendChild(t2);
      if (inc.note) {
        var t3 = el("span", { class: "tag", "data-c": "amber" }); t3.innerHTML = ICO.note + '<span>' + esc(inc.note) + '</span>'; meta.appendChild(t3);
      }
      main2.appendChild(headR);
      main2.appendChild(meta);
      var actions = el("div", { class: "card-actions" });
      var del = el("button", { class: "act danger", title: "Удалить", "aria-label": "Удалить" });
      del.innerHTML = ICO.trash;
      del.addEventListener("click", function () {
        if (!confirm("Удалить запись «" + inc.source + "»?")) return;
        state.data.incomes = state.data.incomes.filter(function (x) { return x.id !== inc.id; });
        save(state.data); render(); toast("Доход удалён", "ok");
      });
      actions.appendChild(del);
      row.appendChild(ico); row.appendChild(main2); row.appendChild(actions);
      card.appendChild(row);
      container.appendChild(card);
    });
    main.appendChild(container);
  }

  function openIncomeForm() {
    var form = el("form", { class: "form" });
    form.innerHTML = ''
      + '<div class="field"><label>Сумма (' + state.settings.currency + ')</label><input class="input" name="amount" type="number" inputmode="decimal" step="0.01" min="0" required placeholder="10000"></div>'
      + '<div class="field"><label>Источник</label><input class="input" name="source" type="text" maxlength="60" required placeholder="Зарплата за месяц"></div>'
      + '<div class="field"><label>Категория</label><select class="select" name="category">' + INCOME_CATEGORIES.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join("") + '</select></div>'
      + '<div class="field"><label>Дата</label><input class="input" name="date" type="date" value="' + todayISO() + '"></div>'
      + '<div class="field"><label>Заметка</label><textarea class="textarea" name="note" maxlength="240" placeholder="Комментарий"></textarea></div>'
      + '<button type="submit" class="btn solid block" data-c="lime">Добавить доход</button>';
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var amount = Number(fd.get("amount"));
      var source = String(fd.get("source") || "").trim();
      if (!isFinite(amount) || amount <= 0) return toast("Сумма должна быть > 0", "err");
      if (!source) return toast("Укажите источник", "err");
      state.data.incomes.unshift({
        id: nextId(state.data.incomes),
        amount: amount, source: source,
        category: String(fd.get("category") || "Прочее"),
        note: String(fd.get("note") || "").trim(),
        date: String(fd.get("date") || todayISO())
      });
      save(state.data);
      closeModal();
      render();
      toast("Доход добавлен", "ok");
    });
    openModal("НОВЫЙ ДОХОД", form, "lime");
  }

  // ---------- render: GOALS ----------
  function renderGoals() {
    var main = $("#main");
    main.innerHTML = "";
    var done = state.data.goals.filter(function (g) { return Number(g.current) >= Number(g.target); }).length;
    var saved = state.data.goals.reduce(function (s, g) { return s + Number(g.current); }, 0);

    var head = el("div", { class: "section-head", "data-c": "magenta" }, [
      el("div", {}, [
        el("h2", { class: "section-title" }, [
          el("small", { text: "// OBJECTIVES" }),
          document.createTextNode("Цели: " + done + " / " + state.data.goals.length)
        ]),
        el("p", { class: "mono muted", style: "margin:4px 0 0", text: "// Накоплено: " + fmtMoney(saved) })
      ]),
      (function () {
        var b = el("button", { class: "btn solid", "data-c": "magenta" });
        b.innerHTML = ICO.plus + '<span>Цель</span>';
        b.addEventListener("click", function () { openGoalForm(null); });
        return b;
      })()
    ]);
    main.appendChild(head);

    if (state.data.goals.length === 0) {
      main.appendChild(emptyState(ICO.target, "Целей пока нет", "Создайте финансовую цель и отслеживайте прогресс."));
      return;
    }

    var list = el("div", { class: "list" });
    state.data.goals.forEach(function (g) {
      var pct = clamp((Number(g.current) / Number(g.target)) * 100, 0, 100);
      var isDone = Number(g.current) >= Number(g.target);
      var left = Math.max(0, Number(g.target) - Number(g.current));
      var card = el("div", { class: "card", "data-c": g.color || "magenta" });
      var row = el("div", { class: "card-row" });
      var ico = el("div", { class: "card-ico", html: ICO.target });
      var m = el("div", { class: "card-main" });
      var hd = el("div", { class: "card-head" }, [
        el("h4", { class: "card-title", text: g.title }),
        (function () {
          var actions = el("div", { class: "card-actions" });
          var edit = el("button", { class: "act", title: "Редактировать" }); edit.innerHTML = ICO.pencil;
          edit.addEventListener("click", function () { openGoalForm(g); });
          var del = el("button", { class: "act danger", title: "Удалить" }); del.innerHTML = ICO.trash;
          del.addEventListener("click", function () {
            if (!confirm("Удалить цель «" + g.title + "»?")) return;
            state.data.goals = state.data.goals.filter(function (x) { return x.id !== g.id; });
            save(state.data); render(); toast("Цель удалена", "ok");
          });
          actions.appendChild(edit); actions.appendChild(del);
          return actions;
        })()
      ]);
      var prow = el("div", { class: "progress-row" }, [
        el("span", { class: "progress-cur", text: fmtMoney(Number(g.current)) }),
        el("span", { class: "progress-target", text: "из " + fmtMoney(Number(g.target)) })
      ]);
      var prog = el("div", { class: "progress" });
      var bar = el("span"); bar.style.width = pct + "%"; prog.appendChild(bar);
      var meta = el("div", { class: "progress-meta" });
      var stat = el("span", { class: "tag", "data-c": isDone ? "lime" : "magenta" });
      stat.innerHTML = isDone
        ? (ICO.check + '<span>Цель достигнута</span>')
        : ('<span>' + Math.round(pct) + '% · осталось ' + esc(fmtMoney(left)) + '</span>');
      meta.appendChild(stat);
      var right = el("div", { style: "display:flex;gap:6px;flex-wrap:wrap" });
      if (g.deadline) {
        var dl = el("span", { class: "tag", "data-c": "amber" });
        dl.innerHTML = ICO.calendar + '<span>' + esc(fmtDate(g.deadline)) + '</span>';
        right.appendChild(dl);
      }
      var addBtn = el("button", { class: "btn small", "data-c": "lime" });
      addBtn.innerHTML = ICO.coins + '<span>Пополнить</span>';
      addBtn.addEventListener("click", function () { openAmount(g, "add"); });
      var subBtn = el("button", { class: "btn small", "data-c": "red", title: "Снять" });
      subBtn.innerHTML = ICO.minus;
      subBtn.addEventListener("click", function () { openAmount(g, "sub"); });
      right.appendChild(addBtn); right.appendChild(subBtn);
      meta.appendChild(right);

      m.appendChild(hd); m.appendChild(prow); m.appendChild(prog); m.appendChild(meta);
      row.appendChild(ico); row.appendChild(m);
      card.appendChild(row);
      list.appendChild(card);
    });
    main.appendChild(list);
  }

  function openGoalForm(g) {
    var form = el("form", { class: "form" });
    form.innerHTML = ''
      + '<div class="field"><label>Название цели</label><input class="input" name="title" type="text" maxlength="60" required placeholder="Новый ноутбук" value="' + esc(g ? g.title : "") + '"></div>'
      + '<div class="grid-2">'
      + '<div class="field"><label>Цель (' + state.settings.currency + ')</label><input class="input" name="target" type="number" inputmode="decimal" step="0.01" min="0" required placeholder="100000" value="' + (g ? g.target : "") + '"></div>'
      + '<div class="field"><label>Накоплено</label><input class="input" name="current" type="number" inputmode="decimal" step="0.01" min="0" placeholder="0" value="' + (g ? g.current : "") + '"></div>'
      + '</div>'
      + '<div class="field"><label>Срок</label><input class="input" name="deadline" type="date" value="' + esc(g && g.deadline ? g.deadline : "") + '"></div>'
      + '<div class="field"><label>Цвет</label><div class="color-picker" id="cp"></div></div>'
      + '<button type="submit" class="btn solid block" data-c="magenta">' + (g ? "Сохранить" : "Создать цель") + '</button>';
    var picked = g ? g.color : "magenta";
    var cp = $("#cp", form); if (cp) cp.appendChild(colorPicker(picked, function (c) { picked = c; }));
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var title = String(fd.get("title") || "").trim();
      var target = Number(fd.get("target"));
      var current = Number(fd.get("current") || 0);
      if (!title) return toast("Укажите название", "err");
      if (!isFinite(target) || target <= 0) return toast("Цель должна быть > 0", "err");
      if (g) {
        Object.assign(g, { title: title, target: target, current: current, deadline: String(fd.get("deadline") || ""), color: picked });
      } else {
        state.data.goals.unshift({ id: nextId(state.data.goals), title: title, target: target, current: current, deadline: String(fd.get("deadline") || ""), color: picked });
      }
      save(state.data); closeModal(); render();
      toast(g ? "Цель обновлена" : "Цель создана", "ok");
    });
    openModal(g ? "РЕДАКТИРОВАТЬ ЦЕЛЬ" : "НОВАЯ ЦЕЛЬ", form, "magenta");
  }

  function openAmount(g, mode) {
    var isAdd = mode === "add";
    var accent = isAdd ? "lime" : "red";
    var form = el("form", { class: "form" });
    form.innerHTML = ''
      + '<p class="mono muted" style="margin:0 0 12px">// Цель: ' + esc(g.title) + '</p>'
      + '<div class="field"><label>Сумма (' + state.settings.currency + ')</label><input class="input" name="amount" type="number" inputmode="decimal" step="0.01" min="0" required autofocus placeholder="5000"></div>'
      + '<button type="submit" class="btn solid block" data-c="' + accent + '">' + (isAdd ? "Пополнить" : "Снять") + '</button>';
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = Number(new FormData(form).get("amount"));
      if (!isFinite(v) || v <= 0) return toast("Введите сумму > 0", "err");
      g.current = isAdd ? Number(g.current) + v : Math.max(0, Number(g.current) - v);
      save(state.data); closeModal(); render();
      toast(isAdd ? "Цель пополнена" : "Средства сняты", "ok");
    });
    openModal(isAdd ? "ПОПОЛНИТЬ ЦЕЛЬ" : "СНЯТЬ С ЦЕЛИ", form, accent);
  }

  // ---------- render: NOTES ----------
  function renderNotes() {
    var main = $("#main");
    main.innerHTML = "";
    var head = el("div", { class: "section-head", "data-c": "lime" }, [
      el("div", {}, [
        el("h2", { class: "section-title" }, [
          el("small", { text: "// MEMORY BANK" }),
          document.createTextNode("Заметок: " + state.data.notes.length)
        ])
      ]),
      (function () {
        var b = el("button", { class: "btn solid", "data-c": "lime" });
        b.innerHTML = ICO.plus + '<span>Заметка</span>';
        b.addEventListener("click", function () { openNoteForm(null); });
        return b;
      })()
    ]);
    main.appendChild(head);

    var bar = el("div", { class: "toolbar" });
    var s = el("div", { class: "search" });
    s.innerHTML = ICO.search;
    var si = el("input", { type: "text", placeholder: "Поиск по заметкам…", value: state.filters.noteQuery });
    si.addEventListener("input", function (e) { state.filters.noteQuery = e.target.value; renderNotes(); si.focus(); });
    s.appendChild(si);
    bar.appendChild(s);
    main.appendChild(bar);

    var list = sortedNotes();
    if (state.data.notes.length === 0) {
      main.appendChild(emptyState(ICO.note, "Заметок пока нет", "Записывайте идеи, планы и мысли в неоновом стиле."));
      return;
    }
    if (list.length === 0) {
      main.appendChild(emptyState(ICO.search, "Ничего не найдено", "Измените поисковый запрос."));
      return;
    }

    var grid = el("div", { class: "list notes-grid" });
    list.forEach(function (n) {
      var card = el("div", { class: "card", "data-c": n.color || "lime", style: "display:flex;flex-direction:column" });
      var hd = el("div", { class: "card-head" }, [
        el("h4", { class: "card-title", text: n.title, style: "white-space:normal" }),
        (function () {
          var a = el("div", { class: "card-actions" });
          var pin = el("button", { class: "act" + (n.pinned ? " active" : ""), title: "Закрепить" }); pin.innerHTML = ICO.pin;
          pin.addEventListener("click", function () { n.pinned = !n.pinned; save(state.data); renderNotes(); });
          var edit = el("button", { class: "act", title: "Редактировать" }); edit.innerHTML = ICO.pencil;
          edit.addEventListener("click", function () { openNoteForm(n); });
          var del = el("button", { class: "act danger", title: "Удалить" }); del.innerHTML = ICO.trash;
          del.addEventListener("click", function () {
            if (!confirm("Удалить заметку?")) return;
            state.data.notes = state.data.notes.filter(function (x) { return x.id !== n.id; });
            save(state.data); renderNotes(); toast("Заметка удалена", "ok");
          });
          a.appendChild(pin); a.appendChild(edit); a.appendChild(del);
          return a;
        })()
      ]);
      card.appendChild(hd);
      if (n.content) card.appendChild(el("p", { class: "note-text", text: n.content }));
      card.appendChild(el("p", { class: "note-date", text: "// " + fmtDate(n.createdAt || todayISO()) }));
      grid.appendChild(card);
    });
    main.appendChild(grid);
  }

  function openNoteForm(n) {
    var form = el("form", { class: "form" });
    form.innerHTML = ''
      + '<div class="field"><label>Заголовок</label><input class="input" name="title" type="text" maxlength="80" required placeholder="Идея, план, мысль" value="' + esc(n ? n.title : "") + '"></div>'
      + '<div class="field"><label>Текст</label><textarea class="textarea" name="content" maxlength="1200" placeholder="Опишите подробнее…">' + esc(n ? n.content : "") + '</textarea></div>'
      + '<div class="field"><label>Цвет</label><div class="color-picker" id="cp"></div></div>'
      + '<label class="checkbox" style="margin-bottom:14px"><input type="checkbox" name="pinned" ' + (n && n.pinned ? "checked" : "") + '><span>Закрепить сверху</span></label>'
      + '<button type="submit" class="btn solid block" data-c="lime">' + (n ? "Сохранить" : "Создать заметку") + '</button>';
    var picked = n ? n.color : "lime";
    var cp = $("#cp", form); if (cp) cp.appendChild(colorPicker(picked, function (c) { picked = c; }));
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var title = String(fd.get("title") || "").trim();
      if (!title) return toast("Укажите заголовок", "err");
      var payload = { title: title, content: String(fd.get("content") || ""), color: picked, pinned: !!fd.get("pinned") };
      if (n) Object.assign(n, payload);
      else state.data.notes.unshift(Object.assign({ id: nextId(state.data.notes), createdAt: nowISO() }, payload));
      save(state.data); closeModal(); render();
      toast(n ? "Заметка обновлена" : "Заметка создана", "ok");
    });
    openModal(n ? "РЕДАКТИРОВАТЬ ЗАМЕТКУ" : "НОВАЯ ЗАМЕТКА", form, picked);
  }

  // ---------- render: ANALYTICS ----------
  function renderAnalytics() {
    var main = $("#main");
    main.innerHTML = "";
    main.appendChild(el("div", { class: "section-head" }, [
      el("h2", { class: "section-title" }, [
        el("small", { text: "// DATA STREAM" }),
        document.createTextNode("Аналитика доходов")
      ])
    ]));

    var inc = state.data.incomes;
    var total = inc.reduce(function (s, i) { return s + Number(i.amount); }, 0);
    var monthsSet = {};
    inc.forEach(function (i) { monthsSet[String(i.date).slice(0, 7)] = true; });
    var monthsCount = Object.keys(monthsSet).length || 1;
    var avg = total / monthsCount;

    // per-month series
    var mmap = {};
    inc.forEach(function (i) {
      var k = String(i.date).slice(0, 7);
      mmap[k] = (mmap[k] || 0) + Number(i.amount);
    });
    var series = Object.keys(mmap).sort().map(function (k) {
      var parts = k.split("-");
      return { key: k, label: MONTHS_RU[Number(parts[1]) - 1] + " " + parts[0].slice(2), total: mmap[k] };
    });
    var best = series.reduce(function (b, p) { return p.total > b.total ? p : b; }, { label: "—", total: 0 });
    var maxMonth = series.reduce(function (m, p) { return Math.max(m, p.total); }, 1);

    // category breakdown
    var cmap = {};
    inc.forEach(function (i) { cmap[i.category] = (cmap[i.category] || 0) + Number(i.amount); });
    var totalCat = Object.keys(cmap).reduce(function (s, k) { return s + cmap[k]; }, 0) || 1;
    var breakdown = Object.keys(cmap).map(function (k) {
      return { category: k, total: cmap[k], pct: Math.round((cmap[k] / totalCat) * 100), color: COLOR_HEX[CATEGORY_COLOR[k] || "cyan"] };
    }).sort(function (a, b) { return b.total - a.total; });

    // mini cards
    var mini = el("div", { class: "mini-grid" });
    [
      { c: "lime", ico: ICO.trend, lbl: "// TOTAL", val: fmtMoney(total) },
      { c: "cyan", ico: ICO.chart, lbl: "// AVG / MONTH", val: fmtMoney(avg) },
      { c: "magenta", ico: ICO.star, lbl: "// BEST MONTH", val: best.label, sub: fmtMoney(best.total) },
      { c: "amber", ico: ICO.hash, lbl: "// ENTRIES", val: String(inc.length) }
    ].forEach(function (m) {
      var d = el("div", { class: "mini", "data-c": m.c });
      d.innerHTML = '<div class="mini-ico">' + m.ico + '</div>'
        + '<div class="mini-lbl">' + esc(m.lbl) + '</div>'
        + '<div class="mini-val">' + esc(m.val) + '</div>'
        + (m.sub ? '<div class="mini-sub">' + esc(m.sub) + '</div>' : '');
      mini.appendChild(d);
    });
    main.appendChild(mini);

    // breakdown panel
    var p1 = el("div", { class: "panel", "data-c": "cyan" });
    p1.innerHTML = '<h3>' + ICO.pie + '<span>Распределение по категориям</span></h3>';
    if (breakdown.length === 0) {
      p1.appendChild(el("p", { class: "muted", text: "Нет данных о доходах." }));
    } else {
      breakdown.forEach(function (b) {
        var row = el("div", { class: "bar-row" });
        row.innerHTML = '<div class="bar-label"><span>' + esc(b.category) + '</span><span>' + esc(fmtMoney(b.total)) + ' · ' + b.pct + '%</span></div>'
          + '<div class="progress"><span style="width:' + b.pct + '%;background:linear-gradient(90deg, ' + b.color + '55, ' + b.color + ');box-shadow:0 0 12px ' + b.color + '"></span></div>';
        p1.appendChild(row);
      });
    }
    main.appendChild(p1);

    // monthly chart
    var p2 = el("div", { class: "panel", "data-c": "magenta" });
    p2.innerHTML = '<h3>' + ICO.chart + '<span>Динамика по месяцам</span></h3>';
    if (series.length === 0) {
      p2.appendChild(el("p", { class: "muted", text: "Нет данных о доходах." }));
    } else {
      var chart = el("div", { class: "chart" });
      series.forEach(function (s) {
        var col = el("div", { class: "chart-col" });
        col.innerHTML = '<span class="chart-val">' + esc(fmtMoney(s.total)) + '</span>'
          + '<div class="chart-bar" style="height:' + ((s.total / maxMonth) * 100) + '%" title="' + esc(s.label + ": " + fmtMoney(s.total)) + '"></div>'
          + '<span class="chart-lbl">' + esc(s.label) + '</span>';
        chart.appendChild(col);
      });
      p2.appendChild(chart);
    }
    main.appendChild(p2);
  }

  // ---------- helpers: empty state + color picker ----------
  function emptyState(icoHtml, title, hint) {
    var e = el("div", { class: "empty" });
    e.innerHTML = icoHtml + '<h4>' + esc(title) + '</h4><p>' + esc(hint) + '</p>';
    return e;
  }
  function colorPicker(initial, cb) {
    var wrap = el("div", { class: "color-picker" });
    var current = initial;
    COLOR_OPTS.forEach(function (c) {
      var b = el("button", { type: "button", "data-c": c, class: "color-swatch" + (c === current ? " active" : ""), title: c });
      b.addEventListener("click", function () {
        current = c; cb(c);
        $$(".color-swatch", wrap).forEach(function (x) { x.classList.toggle("active", x.dataset.c === c); });
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  // ---------- SETTINGS ----------
  function openSettings() {
    var form = el("div");
    form.innerHTML = ''
      + '<div class="field"><label>Ваше имя</label><input class="input" id="s-name" type="text" maxlength="40" placeholder="Например, Алекс" value="' + esc(state.settings.name) + '"></div>'
      + '<div class="field"><label>Валюта</label><div class="chip-row" id="s-cur"></div></div>'
      + '<div class="field"><label>Данные</label>'
      +   '<div class="chip-row" style="gap:8px;flex-wrap:wrap">'
      +     '<button class="btn small" data-c="lime" id="s-export">' + ICO.download + '<span>Экспорт</span></button>'
      +     '<button class="btn small" data-c="cyan" id="s-import">' + ICO.upload + '<span>Импорт</span></button>'
      +     '<button class="btn small" data-c="red" id="s-reset">' + ICO.trash + '<span>Сбросить всё</span></button>'
      +   '</div>'
      + '</div>'
      + '<p class="mono muted" style="margin:14px 0 0;font-size:11px">// Данные хранятся локально в браузере (localStorage). Экспортируйте JSON для переноса.</p>';
    var cur = $("#s-cur", form);
    CURRENCIES.forEach(function (c) {
      var b = el("button", { class: "chip" + (state.settings.currency === c ? " active" : ""), "data-c": "cyan", text: c });
      b.addEventListener("click", function () {
        state.settings.currency = c; saveSettings();
        $$(".chip", cur).forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        render();
      });
      cur.appendChild(b);
    });
    $("#s-name", form).addEventListener("input", function (e) {
      state.settings.name = e.target.value; saveSettings(); renderHeader();
    });
    $("#s-export", form).addEventListener("click", function (e) { e.preventDefault(); doExport(); });
    $("#s-import", form).addEventListener("click", function (e) { e.preventDefault(); $("#import-file").click(); });
    $("#s-reset", form).addEventListener("click", function (e) {
      e.preventDefault();
      if (!confirm("Удалить ВСЕ данные? Это необратимо.")) return;
      state.data = { incomes: [], goals: [], notes: [] };
      save(state.data); closeModal(); render(); toast("Все данные удалены", "ok");
    });
    openModal("НАСТРОЙКИ", form, "cyan");
  }

  // ---------- IMPORT/EXPORT ----------
  function doExport() {
    var payload = Object.assign({ app: "neon-finance", version: 2, exportedAt: nowISO() }, state.data);
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "neon-finance-" + todayISO() + ".json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Экспортировано", "ok");
  }
  function doImport(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var d = JSON.parse(String(reader.result));
        if (!d || !Array.isArray(d.incomes)) throw new Error("Неверный файл");
        if (!confirm("Импортировать данные? Они будут добавлены к существующим.")) return;
        var baseI = state.data.incomes.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0);
        var baseG = state.data.goals.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0);
        var baseN = state.data.notes.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0);
        (d.incomes || []).forEach(function (x) { state.data.incomes.unshift(Object.assign({}, x, { id: ++baseI })); });
        (d.goals || []).forEach(function (x) { state.data.goals.unshift(Object.assign({}, x, { id: ++baseG })); });
        (d.notes || []).forEach(function (x) { state.data.notes.unshift(Object.assign({}, x, { id: ++baseN, createdAt: x.createdAt || nowISO() })); });
        save(state.data); closeModal(); render(); toast("Импорт завершён", "ok");
      } catch (err) { toast("Ошибка: " + err.message, "err"); }
    };
    reader.readAsText(file);
  }

  // ---------- main render ----------
  function render() {
    renderHeader();
    renderTabs();
    if (state.tab === "incomes") renderIncomes();
    else if (state.tab === "goals") renderGoals();
    else if (state.tab === "notes") renderNotes();
    else if (state.tab === "analytics") renderAnalytics();
  }

  // ---------- events ----------
  function bindNav() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-nav]");
      if (t) { state.tab = t.dataset.nav; render(); }
    });
    document.addEventListener("click", function (e) {
      if (e.target.matches("[data-close], [data-close] *")) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("#modal").hidden) closeModal();
    });
  }

  // ---------- init ----------
  function init() {
    state.data = load();
    state.settings = loadSettings();

    $("#btn-export").addEventListener("click", doExport);
    $("#btn-import").addEventListener("click", function () { $("#import-file").click(); });
    $("#btn-settings").addEventListener("click", openSettings);
    $("#import-file").addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0];
      if (f) doImport(f);
      e.target.value = "";
    });

    bindNav();
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
