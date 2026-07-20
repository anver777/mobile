# 🌟 LifeOS — Personal Productivity Dashboard

Полнофункциональный неоновый трекер целей, финансов и заметок с PostgreSQL.

![Neon UI](https://img.shields.io/badge/UI-Neon%20Dark-ff2d6f)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle-336791)
![TypeScript](https://img.shields.io/badge/TypeScript-✓-3178c6)

## ✨ Возможности

### 🎯 Цели
- Постановка целей на день / неделю / месяц / год
- Отметка выполнения с анимацией
- Круговой индикатор прогресса
- Статистика по каждому периоду

### 💰 Финансы
- Учёт доходов и расходов
- 13 предустановленных категорий (еда, транспорт, зарплата и др.)
- Фильтрация по периодам: день / неделя / месяц / год / всё время
- Автоматическая разбивка по категориям с цветными индикаторами
- Баланс, доходы, расходы в реальном времени

### 📝 Заметки
- Создание заметок с 6 цветовыми темами
- Закрепление важных заметок
- Поиск по всем заметкам
- Компактное отображение в виде карточек

### 📊 Дашборд
- Общая статистика по всем разделам
- Баланс и баланс за текущий месяц
- Быстрые действия
- Превью последних заметок

## 🚀 Локальный запуск

```bash
# Установка зависимостей
npm install

# Создание базы данных (PostgreSQL)
# Настройте DATABASE_URL в .env
createdb lifeos
# Или используйте любой PostgreSQL-хостинг (Neon, Railway, Supabase)

# Применение схемы БД
npx drizzle-kit push

# Загрузка примеров данных (опционально)
psql postgresql://postgres:postgres@127.0.0.1:5432/lifeos < seed.sql

# Запуск dev-сервера
npm run dev
```

Откройте http://localhost:3000 🚀

## 🌐 Деплой на Netlify

### 1. Подготовьте PostgreSQL

Вам нужна внешняя PostgreSQL база (Netlify не предоставляет свою). Бесплатные варианты:
- **[Neon.tech](https://neon.tech)** — 0.5 ГБ бесплатно, Postgres 15
- **[Supabase](https://supabase.com)** — 500 МБ бесплатно
- **[Railway](https://railway.app)** — пробный период с $5

Создайте базу, скопируйте строку подключения вида:
```
postgresql://user:password@host:5432/dbname
```

### 2. Примените схему БД

Локально или через любую shell-среду:
```bash
DATABASE_URL="postgresql://..." npx drizzle-kit push
```

### 3. Деплой на Netlify

```bash
# Установите Netlify CLI
npm install -g netlify-cli

# Залейте код на GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/lifeos.git
git push -u origin main

# В Netlify: создайте новый сайт из Git
# Добавьте переменную окружения DATABASE_URL
# Настройте Build command: npm run build
# Publish directory: .next
# Netlify автоматически использует netlify.toml
```

### 4. Переменные окружения в Netlify

В Settings → Environment Variables добавьте:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

Готово! 🎉

## 🛠️ Технологии

- **Next.js 16** (App Router)
- **TypeScript** — строгая типизация
- **PostgreSQL** + **Drizzle ORM** — индексы для быстрого поиска
- **Tailwind CSS 4** — стили
- **Netlify** — деплой (с плагинами для Next.js)

## 📦 Структура

```
src/
├── app/
│   ├── api/           # API endpoints
│   │   ├── dashboard/
│   │   ├── goals/
│   │   ├── finance/
│   │   └── notes/
│   ├── page.tsx       # Главная страница (AppShell)
│   └── layout.tsx
├── components/        # React компоненты
│   ├── AppShell.tsx
│   ├── Dashboard.tsx
│   ├── GoalsSection.tsx
│   ├── FinanceSection.tsx
│   ├── NotesSection.tsx
│   └── ...
├── db/
│   └── schema.ts      # Drizzle схема БД
└── lib/
    ├── timeframes.ts  # Периоды (день/неделя/месяц/год)
    └── utils.ts       # Утилиты
```

## 🔐 Безопасность

- API-ключи и `DATABASE_URL` хранятся в переменных окружения (не в коде)
- `.env` добавлен в `.gitignore`
- Для production используйте сильные пароли БД

## 📄 Лицензия

MIT — используйте свободно.

---

Сделано с ❤️ для продуктивной жизни
