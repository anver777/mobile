-- ============================================================
-- LifeOS · стартовые данные
-- Применение схемы:  npx drizzle-kit push
-- Посев:             psql $DATABASE_URL -f seed.sql
-- Даты считаются от CURRENT_DATE, чтобы демо всегда было «живым».
-- Скрипт идемпотентен: повторный запуск данные не дублирует.
-- ============================================================

INSERT INTO categories (id, name, icon, color, type) VALUES
  (1,  'Еда',         '🍔', '#ffb020', 'expense'),
  (2,  'Жильё',       '🏠', '#ff2ec4', 'expense'),
  (3,  'Транспорт',   '🚗', '#00e5ff', 'expense'),
  (4,  'Развлечения', '🎮', '#9d6bff', 'expense'),
  (5,  'Здоровье',    '💊', '#ff5470', 'expense'),
  (6,  'Покупки',     '🛍️', '#38bdf8', 'expense'),
  (7,  'Обучение',    '📚', '#b8ff2e', 'expense'),
  (8,  'Зарплата',    '💼', '#b8ff2e', 'income'),
  (9,  'Фриланс',     '💻', '#00e5ff', 'income'),
  (10, 'Инвестиции',  '📈', '#ffd166', 'income')
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (id, category_id, amount, type, note, date) VALUES
  -- доходы
  (1,  8,  88000.00, 'income',  'Зарплата за месяц',      CURRENT_DATE - 35),
  (2,  9,  24500.00, 'income',  'Проект для клиента',     CURRENT_DATE - 21),
  (3,  10,  6200.00, 'income',  'Дивиденды',              CURRENT_DATE - 12),
  (4,  8,  88000.00, 'income',  'Зарплата',               CURRENT_DATE - 5),
  (5,  9,   9800.00, 'income',  'Консультация',           CURRENT_DATE - 2),
  -- прошлый месяц (расходы)
  (6,  2,  32000.00, 'expense', 'Аренда',                 CURRENT_DATE - 55),
  (7,  1,   3800.00, 'expense', 'Продукты на неделю',     CURRENT_DATE - 40),
  (8,  4,   2100.00, 'expense', 'Кино + попкорн',         CURRENT_DATE - 45),
  (9,  3,    900.00, 'expense', 'Такси',                  CURRENT_DATE - 38),
  (10, 6,   5600.00, 'expense', 'Кроссовки',              CURRENT_DATE - 42),
  -- текущий месяц (расходы)
  (11, 2,  32000.00, 'expense', 'Аренда квартиры',        CURRENT_DATE - 25),
  (12, 1,   2450.00, 'expense', 'Супермаркет',            CURRENT_DATE - 1),
  (13, 1,   1180.00, 'expense', 'Кофе и снеки',           CURRENT_DATE - 4),
  (14, 1,   3260.00, 'expense', 'Продукты',               CURRENT_DATE - 8),
  (15, 1,   1540.00, 'expense', 'Доставка еды',           CURRENT_DATE - 13),
  (16, 1,   2890.00, 'expense', 'Рынок',                  CURRENT_DATE - 19),
  (17, 3,    650.00, 'expense', 'Метро',                  CURRENT_DATE - 2),
  (18, 3,    450.00, 'expense', 'Каршеринг',              CURRENT_DATE - 9),
  (19, 3,   1200.00, 'expense', 'Такси ночью',            CURRENT_DATE - 16),
  (20, 4,   1990.00, 'expense', 'Подписки на сервисы',    CURRENT_DATE - 3),
  (21, 4,   2400.00, 'expense', 'Концерт',                CURRENT_DATE - 11),
  (22, 5,   3500.00, 'expense', 'Витамины и аптека',      CURRENT_DATE - 6),
  (23, 6,   8990.00, 'expense', 'Наушники',               CURRENT_DATE - 7),
  (24, 7,   4900.00, 'expense', 'Курс по TypeScript',     CURRENT_DATE - 14)
ON CONFLICT (id) DO NOTHING;

INSERT INTO goals (id, title, description, category, color, progress, due_date, completed) VALUES
  (1, 'Пробежать полумарафон',  'Тренировки 3 раза в неделю, контроль пульса, длинные пробежки по воскресеньям.', 'Спорт',    '#ff2ec4', 62,  CURRENT_DATE + 45,  false),
  (2, 'Закрыть курс TypeScript','Осталось 4 модуля и финальный проект. По вечерам, 1 час в день.',                 'Обучение', '#00e5ff', 78,  CURRENT_DATE + 20,  false),
  (3, 'Подушка безопасности',   'Накопить 300 000 ₽ на отдельном счёте. Откладывать 20% с каждого дохода.',        'Финансы',  '#b8ff2e', 41,  CURRENT_DATE + 90,  false),
  (4, 'Английский до B2',       'Разговорные клубы по средам, сериалы в оригинале, 20 новых слов в неделю.',       'Обучение', '#9d6bff', 35,  CURRENT_DATE + 120, false),
  (5, 'Режим подъёма в 6:30',   'Без телефона за час до сна, стакан воды сразу после подъёма.',                     'Здоровье', '#ffb020', 88,  CURRENT_DATE + 10,  false),
  (6, 'Запустить пет-проект',   'MVP трекера привычек: Next.js + Postgres, деплой на Netlify.',                    'Карьера',  '#38bdf8', 15,  CURRENT_DATE + 60,  false),
  (7, '10 000 шагов ежедневно', 'Месяц без пропусков — челлендж выполнен.',                                         'Здоровье', '#b8ff2e', 100, CURRENT_DATE - 3,   true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO notes (id, title, content, color, pinned) VALUES
  (1, 'Идеи на выходные', '• Сходить на выставку неона в Гараже
• Вело-маршрут по набережной, ~25 км
• Позвать Лёху на рамен
• Досмотреть «Основание»', '#00e5ff', true),
  (2, 'Книги к прочтению', '1. «Атомные привычки» — Джеймс Клир
2. «Хочу к Теодору Драйзеру»
3. «Думай медленно… решай быстро»
4. «Проект Аве Мария»', '#9d6bff', false),
  (3, 'Идеи подарков', 'Маме — робот-пылесос
Ане — плед с подогревом
Себе — механическую клавиатуру 👀', '#ff2ec4', false),
  (4, 'План тренировки · ПН', 'Разминка 10 мин
Присед 4×12
Жим лёжа 4×8
Тяга в наклоне 3×10
Планка 3×60 сек', '#b8ff2e', false),
  (5, 'Цитата дня', '«Мы — это то, что мы делаем постоянно. Совершенство — не действие, а привычка» — Аристотель', '#ffb020', true),
  (6, 'Итоги созвона', 'Перенести дедлайн спринта на пятницу. Дизайн новых карточек готов на 80%. Бэклогом занимается Ира.', '#38bdf8', false)
ON CONFLICT (id) DO NOTHING;

-- Синхронизация серийных счётчиков, чтобы новые записи не конфликтовали с сидом
SELECT setval(pg_get_serial_sequence('categories', 'id'),    COALESCE((SELECT MAX(id) FROM categories), 1));
SELECT setval(pg_get_serial_sequence('transactions', 'id'),  COALESCE((SELECT MAX(id) FROM transactions), 1));
SELECT setval(pg_get_serial_sequence('goals', 'id'),         COALESCE((SELECT MAX(id) FROM goals), 1));
SELECT setval(pg_get_serial_sequence('notes', 'id'),         COALESCE((SELECT MAX(id) FROM notes), 1));
