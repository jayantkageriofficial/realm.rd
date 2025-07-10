<!--
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://jayantkageri.in/>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 -->

<p align="center">
  <a href="https://nextjs.org">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_dark_background.png">
      <img src="https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_light_background.png" height="128">
    </picture>
    <h1 align="center">Next.js</h1>
  </a>
</p>

❤️‍🔥 This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## 🧠 Description

**REALM.RD** is a minimal, self-hostable platform designed to **log daily thoughts**, **capture notes**, and **track expenses** — all under one unified interface.

Whether you're jotting down a private entry, scribbling plans, or managing your daily budget, REALM.RD provides the tools you need to do it quickly, securely, and without distractions.

> 🗒️ _Daily Diary_ · 🧾 _Notekeeping_ · 💸 _Book of Expenditure_

## 🚀 Getting Started

🏃‍♀️ First, install dependencies and run the development server:

```bash
pnpm install
pnpm dev
```

👉 Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 📖 Learn More

📚 To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

👀 You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome! 💻

## 💡 Features

- 📓 **Daily Diary** — Timestamped daily logs, markdown-ready.
- 📝 **Notekeeping** — Lightweight, structured note management.
- 💸 **Book of Expenditure** — Simple budget tracking and ledger-style records.
- 🔐 **JWT Authentication** — Private access to your notes and logs.
- 🧠 **Encrypted Drafts** — libsodium-based encryption.
- 📊 **Export to Excel** — Save the expense entries as `.xlsx`.
- 🛎️ **Telegram Notifications** _(optional)_ — Instant alerts via bot integration.
- 🧱 **Fully Modular Design** — Easily extensible and componentized.

## 🗺️ Environment Variables

🌟 This Next.js project requires some necessary environment variables to run. These variables are stored in a 📁 `.env` file at the root of the project or the 🖥️ machine's Environment Variables.📝 Below is a list of all the environment variables required by the project along with their descriptions:

- 🌐 `NEXT_PUBLIC_DOMAIN` (**required**): This variable specifies the domain name of the website and is used for generating absolute URLs (e.g., `https://realm.example.com`).

- 🔐 `JWT_SECRET` (**required**): This is a secret string that is used to sign the JWT tokens. Changing this value will revoke all existing sessions.

- 🍪 `SESSION_DURATION` (_optional_): This variable specifies the duration of the session in minutes. The default value is `15`.

- 💾 `MONGODB_URI` (**required**): This variable specifies the URI to the MongoDB database.

- 🗃️ `REDIS_URI` (**required**): This variable specifies the URI to the Redis database.

- 🤖 `TG_BOT_TOKEN` (_optional_): This variable specifies the Telegram Bot Token, which is used for sending alerts.

- 💬 `TG_CHAT_ID` (_optional_): This variable specifies the Telegram Chat ID, which is used for sending alerts.

## ⚡ Technologies Used

- 🟢 [Node.js](https://nodejs.org/en/)
- 🔵 [TypeScript](https://www.typescriptlang.org/)
- ⚛️ [Next.js](https://nextjs.org/)
- 🎨 [Tailwind CSS](https://tailwindcss.com/)
- 🍃 [MongoDB](https://www.mongodb.com/)
- 🧱 [Mongoose](https://mongoosejs.com/)
- 🗄️ [Redis](https://redis.io/)
- 🔒 [JWT](https://jwt.io/)
- 🔐 [Argon2](https://www.npmjs.com/package/argon2)
- 🧠 [Libsodium](https://github.com/jedisct1/libsodium.js)
- 💾 [SheetJS](https://www.npmjs.com/package/sheetjs-style)
- 🔥 [CodeMirror](https://codemirror.net/)
- 📚 [MDX Editor](https://github.com/mdx-editor/editor)
- 📊 [Mantine React Table](https://www.mantine-react-table.com/)
- 🧩 [React Use](https://github.com/streamich/react-use)
- 🍃 [Nano ID](https://github.com/ai/nanoid)
- 🧷 [Proper Lockfile](https://www.npmjs.com/package/proper-lockfile)
- ☕ [React Hot Toast](https://react-hot-toast.com/)
- 📤 [Telegram Bot API](https://core.telegram.org/bots/api)
- 📦 [PNPM](https://pnpm.io/)

## 📜 License

- 📝 Copyright (C) 2025 [Jayant Hegde Kageri](https://jayantkageri.in)
- 🔏 Licensed under the Terms and Conditions of [GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)](/COPYING.txt)

[<img alt="GNU AGPL-3.0-or-later" src="https://upload.wikimedia.org/wikipedia/commons/0/06/AGPLv3_Logo.svg" height="90" />](/COPYING.txt)
