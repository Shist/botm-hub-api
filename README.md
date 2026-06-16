# ⚙️ BOTM Hub API

🇬🇧 **English** | [🇷🇺 Русский](#-русский)

A lightweight serverless backend for the [**BOTM Hub**](https://github.com/Shist/botm-hub) project, deployed on the Vercel platform.
The main purpose of the API is to act as a proxy server between the client application and the official **osu! API v2**. This securely hides the `CLIENT_SECRET` from the client side and bypasses browser CORS restrictions.

## 🚀 Tech Stack

- **Environment:** Node.js, TypeScript
- **Platform:** Vercel Serverless Functions
- **Integration:** osu! API v2 (OAuth 2.0 Client Credentials Grant)

## 📁 Project Structure

- `api/match.ts` — endpoint for fetching multiplayer lobby data. Validates `match_id`, fetches the authorization token, and uses while-loop pagination to bypass the default 100-events limit, returning the full chronological history of the match.

## 🛠 Local Development Setup

To run serverless functions locally, the Vercel CLI is used.

1. Install dependencies (types for Vercel):
   ```bash
   npm install
   ```
2. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```
3. Create an `.env` file in the project root and specify your osu! OAuth credentials:
   ```env
   OSU_CLIENT_ID=your_osu_client_id
   OSU_CLIENT_SECRET=your_osu_client_secret
   ```
4. Start the local server:
   ```bash
   vercel dev
   ```
5. The endpoint will be available at `http://localhost:3000/api/match?id=...`

---

## 🇷🇺 Русский

Легковесный serverless-бэкенд для проекта [**BOTM Hub**](https://github.com/Shist/botm-hub), задеплоенный на платформе Vercel.
Основная задача API — выступать в роли прокси-сервера между клиентским приложением и официальным **osu! API v2**. Это позволяет надежно скрывать `CLIENT_SECRET` от клиентской части и обходить ограничения CORS браузера.

## 🚀 Технологический стек

- **Окружение:** Node.js, TypeScript
- **Платформа:** Vercel Serverless Functions
- **Интеграция:** osu! API v2 (OAuth 2.0 Client Credentials Grant)

## 📁 Структура проекта

- `api/match.ts` — эндпоинт для получения данных о мультиплеерном лобби. Валидирует `match_id`, получает токен авторизации и использует while-loop пагинацию для обхода лимита в 100 событий, возвращая полную хронологическую историю матча.

## 🛠 Запуск для локальной разработки

Для запуска serverless-функций локально используется Vercel CLI.

1. Установите зависимости (типы для Vercel):
   ```bash
   npm install
   ```
2. Установите Vercel CLI (если еще не установлен):
   ```bash
   npm i -g vercel
   ```
3. Создайте файл `.env` в корне проекта и укажите ваши данные osu! OAuth:
   ```env
   OSU_CLIENT_ID=your_osu_client_id
   OSU_CLIENT_SECRET=your_osu_client_secret
   ```
4. Запустите локальный сервер:
   ```bash
   vercel dev
   ```
5. Эндпоинт будет доступен по адресу `http://localhost:3000/api/match?id=...`
