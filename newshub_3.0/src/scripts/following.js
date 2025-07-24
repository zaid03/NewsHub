// // let allNews = [];
// // let displayedCount = 0;
// // const PAGE_SIZE = 20;

// document.addEventListener("DOMContentLoaded", () => {
//   const user_id = sessionStorage.getItem("user_id");
//   const container = document.getElementById("main-news-container");
//   if (!user_id) {
//     container.innerHTML = "<p>Please log in to see your followed news.</p>";
//     return;
//   }

//   fetch('http://localhost:3000/api/news/following', {
//     method: 'POST',
//     headers: {'Content-Type': 'application/json'},
//     body: JSON.stringify({ user_id })
//   })
//     .then(res => res.json())
//     .then(data => {
//       if (!data.success || !Array.isArray(data.news) || data.news.length === 0) {
//         container.innerHTML = "<p>No news found for your followed topics.</p>";
//         return;
//       }
//       allNews = data.news;
//       displayedCount = 0;
//       container.innerHTML = "";
//       renderNewsChunk();
//     });
// });

// function renderNewsChunk() {
//   const container = document.getElementById("main-news-container");
//   const nextChunk = allNews.slice(displayedCount, displayedCount + PAGE_SIZE);
//   nextChunk.forEach(article => {
//     const card = document.createElement("div");
//     card.className = "follow-card";
//     card.innerHTML = `
//       <div class="follow-card-header">
//         <img src="${article.image || './assets/default-news.jpg'}" alt="news image" class="follow-card-img">
//         <div class="follow-card-topic">${article.category_name || ''}</div>
//         <button class="follow-btn following">
//           <i class="fa fa-check"></i>
//         </button>
//       </div>
//       <div class="follow-card-body">
//         <a class="follow-card-title" href="${article.link}" target="_blank">${article.title}</a>
//         <div class="follow-card-meta">
//           <span class="follow-card-source">${article.source || 'Source'}</span>
//           <span class="follow-card-date">${article.published ? new Date(article.published).toLocaleDateString() : ''}</span>
//         </div>
//         <p class="follow-card-summary">${article.summary}</p>
//       </div>
//     `;
//     container.appendChild(card);

//     const btn = card.querySelector('.follow-btn');
//     btn.addEventListener('click', function() {
//       if (btn.classList.contains('following')) {
//         btn.classList.remove('following');
//         btn.innerHTML = '<i class="fa fa-plus"></i>';
//         fetch('http://localhost:3000/api/unfollow', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ user_id: sessionStorage.getItem("user_id"), topics: [article.source] })
//         });
//       } else {
//         btn.classList.add('following');
//         btn.innerHTML = '<i class="fa fa-check"></i>';
//         fetch('http://localhost:3000/api/follow', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ user_id: sessionStorage.getItem("user_id"), topics: [article.source] })
//         });
//       }
//     });
//   });
//   displayedCount += nextChunk.length;
// }

// window.addEventListener("scroll", () => {
//   const container = document.getElementById("main-news-container");
//   if (!container) return;
//   if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
//     if (displayedCount < allNews.length) {
//       renderNewsChunk();
//     }
//   }
// });