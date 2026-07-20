-- Seed data for LifeOS
-- Usage: psql postgresql://user:pass@host:5432/dbname < seed.sql

-- Finance categories
INSERT INTO finance_categories (name, emoji, type, color, position) VALUES
('Зарплата', '💼', 'income', '#00ffa3', 1),
('Фриланс', '💻', 'income', '#00d4ff', 2),
('Подарки', '🎁', 'income', '#ff2d6f', 3),
('Инвестиции', '📈', 'income', '#b14dff', 4),
('Другое', '💰', 'income', '#ffb020', 5),
('Еда', '🍕', 'expense', '#ff6b35', 10),
('Транспорт', '🚗', 'expense', '#00d4ff', 11),
('Жильё', '🏠', 'expense', '#b14dff', 12),
('Развлечения', '🎮', 'expense', '#ff2d6f', 13),
('Здоровье', '💊', 'expense', '#00ffa3', 14),
('Одежда', '👕', 'expense', '#ffb020', 15),
('Подписки', '📱', 'expense', '#00d4ff', 16),
('Другое', '💸', 'expense', '#ff6b35', 17);

-- Example transactions
INSERT INTO transactions (type, amount, title, notes, category_id, occurred_on) VALUES
('income', 85000, 'Зарплата', 'Основная работа', 1, now() - interval '30 days'),
('income', 15000, 'Фриланс', 'Дизайн логотипа', 2, now() - interval '25 days'),
('expense', 3500, 'Продукты', 'Еда на неделю', 6, now() - interval '28 days'),
('expense', 1500, 'Кафе', 'Обед с коллегами', 6, now() - interval '20 days'),
('expense', 2000, 'Такси', 'Поездки за неделю', 7, now() - interval '18 days'),
('expense', 25000, 'Аренда', 'Квартира', 8, now() - interval '25 days'),
('expense', 5000, 'Кино', 'Выходные', 9, now() - interval '15 days'),
('expense', 1200, 'Аптека', 'Лекарства', 10, now() - interval '10 days'),
('income', 8000, 'Подарок', 'На день рождения', 3, now() - interval '7 days'),
('expense', 3000, 'Одежда', 'Новая рубашка', 11, now() - interval '5 days'),
('expense', 800, 'Spotify', 'Подписка', 12, now() - interval '3 days'),
('income', 20000, 'Инвестиции', 'Дивиденды', 4, now() - interval '2 days'),
('expense', 4500, 'Ресторан', 'Ужин', 6, now() - interval '1 day'),
('expense', 1000, 'Метро', 'Проездной', 7, now());

-- Example notes
INSERT INTO notes (title, content, color, pinned) VALUES
('Идеи для проекта', '1. Добавить графики доходов/расходов
2. Экспорт в CSV
3. Категории с иконками
4. Напоминания о целях', '#b14dff', true),
('Список покупок', '• Молоко
• Хлеб
• Яблоки
• Кофе
• Сыр', '#00ffa3', false),
('Книги к прочтению', '1. Атомные привычки
2. Думай медленно, решай быстро
3. Поток
4. Цифровой минимализм', '#00d4ff', false),
('Фильмы на выходные', 'Интерстеллар, Начало, Матрица', '#ff2d6f', false),
('Рецепт пасты', 'Макароны, томаты, базилик, чеснок, оливковое масло. Варить 10 минут, обжарить чеснок, добавить томаты...', '#ffb020', false),
('Планы на месяц', 'Завершить проект, сходить в спортзал 12 раз, прочитать 2 книги, выучить 100 слов', '#b14dff', true);
