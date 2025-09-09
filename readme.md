
# 📰 NewsHub

<p align="center">
    <img src="newshub_3.0/src/assets/newshub.png" alt="NewsHub Logo" width="120"/>
</p>

<p align="center">
    <b>Personalized News & Radio Desktop App</b><br>
    Stay up-to-date with news, blogs, and articles from multiple sources, all in one customizable Electron interface.
</p>

<p align="center">
    <img src="https://img.shields.io/badge/Electron-23.x-blue?logo=electron"/>
    <img src="https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js"/>
    <img src="https://img.shields.io/badge/MySQL-8.x-blue?logo=mysql"/>
    <img src="https://img.shields.io/badge/License-MIT-yellow"/>
</p>

---

## 🚀 Features

- **Personalized content** based on user preferences
- **Sidebar navigation** with dynamic highlights
- **Category filters** and source selection
- **Trending news** and most-read articles
- **Customizable profile** and settings
- **Integrated radio** for music and news
- **Modern, responsive UI**
- **Fast content loading** and smooth animations

---

## � Project Structure

```text
news-hub/
│
├── src/
│   ├── assets/        # Images, SVGs, icons
│   ├── backend/       # Express API, DB connection, backend logic
│   ├── components/    # HTML UI components
│   ├── py/            # Python scripts for RSS/news scraping
│   ├── scripts/       # JS for UI, content, and animation
│   ├── styles/        # CSS stylesheets
│   └── index.html     # Main HTML container
├── main.js            # Electron entry point
├── package.json       # Project metadata & dependencies
├── README.md
└── .gitignore
```

---

## ⚙️ Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL Server](https://www.mysql.com/)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```sh
git clone https://github.com/zaid03/NewsHub.git
cd NewsHub
```

### 2. Backend Setup

1. Update your MySQL DB credentials in `src/backend/db.js`.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the backend server:
   ```sh
   node src/backend/server.js
   ```

### 3. Frontend/Electron App

```sh
npm start
```

---

## 🛠️ Technologies Used

- [Electron](https://www.electronjs.org/)
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MySQL](https://www.mysql.com/)
- HTML5, CSS3, JavaScript (ES6+)

---

## ✍️ Author

**Zaid Terguy**<br>
📍 Tetouan, Morocco<br>
🚀 Passionate about full-stack development and user-centered apps

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

© 2025 Zaid Terguy

---

## 📬 Contact

For questions or feedback, open an issue or contact [terguyzaid@gmail.com](mailto:terguyzaid@gmail.com).
