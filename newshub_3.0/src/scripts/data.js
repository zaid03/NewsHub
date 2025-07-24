const { json } = require("body-parser");

let allNews = [];
let displayedCount = 0;
const PAGE_SIZE = 20;

function trackTrendingClick(title) {
    fetch('http://localhost:3000/api/trending/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('Trending updated for:', title);
        } else {
            console.log('Error updating trending:', data.message);
        }
    })
    .catch(error => {
        console.error('Error tracking trending:', error);
    });
}

function trackReadingHistory(article) {
    const user_id = sessionStorage.getItem("user_id");
    
    console.log('=== HISTORY TRACKING DEBUG ===');
    console.log('Raw user_id from sessionStorage:', user_id);
    console.log('user_id type:', typeof user_id);
    console.log('user_id is null?', user_id === null);
    console.log('user_id is empty string?', user_id === '');
    console.log('All sessionStorage items:', Object.entries(sessionStorage));
    console.log('Article being tracked:', article);
    console.log('================================');
    
    if (!user_id) {
        console.log('No user logged in, skipping history tracking');
        return;
    }

    fetch('http://localhost:3000/api/history/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: user_id,
            category_name: article.category_name || '',
            title: article.title || '',
            link: article.link || '',
            source: article.source || '',
            image: article.image || '',
            published: article.published || '',
            summary: article.summary || ''
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('Article added to history:', article.title);
        } else {
            console.log('Error adding to history:', data.message);
        }
    })
    .catch(error => {
        console.error('Error tracking reading history:', error);
    });
}

function renderNewsChunk() {
  const container = document.getElementById("main-news-container");
  const nextChunk = allNews.slice(displayedCount, displayedCount + PAGE_SIZE);
  
  nextChunk.forEach(article => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-image">
        <img src="${article.image || './assets/default-news.jpg'}" alt="news image">
        <div class="follow-card-topic" onclick="selectsource('${article.source || 'Source'}')">${article.source || 'Source'}</div>
        <div class="card-actions">
          <button class="follow-btn">
            <i class="fa fa-plus"></i>
          </button>
          <button class="save-btn" title="Save article">
            <i class="far fa-bookmark"></i>
          </button>
        </div>
      </div>
      <div class="card-content">
        <div class="card-meta">
        </div>
        <a class="title" href="${article.link}" target="_blank" onclick="trackTrendingClick('${article.title.replace(/'/g, "\\'")}'); trackReadingHistory(${JSON.stringify(article).replace(/"/g, '&quot;')}); return true;">${article.title}</a>
        <div class="card-details">
          <span class="category" onclick="selectCategory('${article.category_name || ''}')">${article.category_name || ''}</span>
          <span class="date">${article.published ? new Date(article.published).toLocaleDateString() : ''}</span>
        </div>
        <p class="summary">${article.summary}</p>
      </div>
    `;
    container.appendChild(card);

    const btn = card.querySelector('.follow-btn');
    btn.addEventListener('click', function() {
      const user_id = sessionStorage.getItem("user_id");
      if (!user_id) {
        console.error("User ID not found in sessionStorage.");
        return;
      }

      if (btn.classList.contains('following')) {
        btn.classList.remove('following');
        btn.innerHTML = '<i class="fa fa-plus"></i>';
        
        fetch(`http://localhost:3000/api/unfollow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id, topics: [article.source] })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('Unfollowed successfully:', article.source);
          } else {
            console.error('Error unfollowing:', data.message);
          }
        });
      } else {
        btn.classList.add('following');
        btn.innerHTML = '<i class="fa fa-minus"></i>';
        
        fetch(`http://localhost:3000/api/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id, topics: [article.source] })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('Followed successfully:', article.source);
          } else {
            console.error('Error following:', data.message);
          }
        });
      }
    });

    const saveBtn = card.querySelector('.save-btn');
    saveBtn.addEventListener('click', function() {
      const user_id = sessionStorage.getItem("user_id");
      if (!user_id) {
        console.error("User ID not found in sessionStorage.");
        return;
      }

      if (saveBtn.classList.contains('saved')) {
        // Remove from saved
        saveBtn.classList.remove('saved');
        saveBtn.innerHTML = '<i class="far fa-bookmark"></i>'; // Empty bookmark for unsaved
        
        fetch('http://localhost:3000/api/saved/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: user_id, 
            link: article.link 
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('Article removed from saved');
          } else {
            console.error('Error removing article:', data.message);
          }
        });
      } else {
        // Add to saved
        saveBtn.classList.add('saved');
        saveBtn.innerHTML = '<i class="fas fa-bookmark"></i>'; // Filled bookmark for saved
        
        fetch('http://localhost:3000/api/saved/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: user_id,
            category_name: article.category_name,
            title: article.title,
            link: article.link,
            source: article.source,
            image: article.image,
            published: article.published,
            summary: article.summary
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('Article saved successfully');
          } else {
            console.error('Error saving article:', data.message);
          }
        });
      }
    });
  });

  displayedCount += nextChunk.length;
}

function loadMainNews() {
  const user_id = sessionStorage.getItem("user_id");
  if (!user_id) {
    console.error("User ID not found in sessionStorage.");
    return;
  }

  fetch(`http://localhost:3000/api/news/preferences?user_id=${user_id}`)
    .then(res => res.json())
    .then(data => {
      allNews = data.news || [];
      displayedCount = 0;
      document.getElementById("main-news-container").innerHTML = "";
      renderNewsChunk();
      updateFollowButtons();
      updateSaveButtons();
      setTimeout(setupMainSearchListeners, 100);
    });
}

function loadSecondaryNews(){
  const user_id = sessionStorage.getItem("user_id");
  if (!user_id) {
    console.error("User ID not found in sessionStorage.");
    return;
  }

  fetch(`http://localhost:3000/api/news/nonpreferences?user_id=${user_id}`)
    .then(res => res.json())
    .then(data => {
      allNews = data.news || [];
      displayedCount = 0;
      document.getElementById("main-news-container").innerHTML = "";
      renderNewsChunk();
      updateFollowButtons();
      updateSaveButtons();
      setTimeout(setupMainSearchListeners, 100);
    });
}

function updateFollowButtons() {
  const user_id = sessionStorage.getItem("user_id");
  if (!user_id) return;

  fetch(`http://localhost:3000/api/followed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id })
  })
    .then(res => res.json())
    .then(data => {
      console.log("API Response:", data);
      if (data.success && Array.isArray(data.followedTopics)) {
        const followedSet = new Set(data.followedTopics.map(row => row.topics));
        console.log("Followed topics:", followedSet); 
        
        document.querySelectorAll('.follow-btn').forEach(btn => {
          const card = btn.closest('.card, .cat-card, .follow-card');
          if (!card) return;
          
          let topicElem = card.querySelector('.follow-card-topic') || 
                         card.querySelector('.cat-card-topic') || 
                         card.querySelector('.card-topic');
          
          if (!topicElem) {
            console.log("No topic element found in card"); 
            return;
          }
          
          let topic = topicElem.textContent.trim();
          console.log("Checking topic:", topic);
          
          if (followedSet.has(topic)) {
            console.log("Topic is followed, updating button");
            btn.classList.add('following');
            btn.innerHTML = '<i class="fa fa-minus"></i>';
          } else {
            console.log("Topic is not followed, keeping default"); 
            btn.classList.remove('following');
            btn.innerHTML = '<i class="fa fa-plus"></i>';
          }
        });
      } else {
        console.error("API returned error or invalid data:", data);
      }
    })
    .catch(error => {
      console.error('Error checking followed topics:', error);
    });
}

// window.addEventListener("scroll", () => {
//   const container = document.getElementById("main-news-container");
//   if (!container) return;
//   if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
//     // If not all news are displayed, load more
//     if (displayedCount < allNews.length) {
//       renderNewsChunk();
//       updateFollowButtons();
//     }
//   }
// });

function loadFollowingNews() {
  console.log("Loading following news...");
  const user_id = sessionStorage.getItem("user_id");
  if (!user_id) {
    document.getElementById("main-news-container").innerHTML = "<p>Please log in to see your followed news.</p>";
    return;
  }

  fetch('http://localhost:3000/api/news/following', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id })
  })
    .then(res => res.json())
    .then(data => {
      allNews = data.news || [];
      displayedCount = 0;
      document.getElementById("main-news-container").innerHTML = "";
      renderFollowingNewsChunk();
      updateFollowButtons();
      updateSaveButtons();
      setTimeout(setupArticleViewer, 0);
      setTimeout(setupMainSearchListeners, 100);
    });
}

function renderFollowingNewsChunk() {
  const container = document.getElementById("main-news-container");
  const nextChunk = allNews.slice(displayedCount, displayedCount + PAGE_SIZE);
  
  nextChunk.forEach(article => {
    const card = document.createElement("div");
    card.className = "follow-card";
    card.innerHTML = `
      <div class="follow-card-header">
        <img src="${article.image || './assets/default-news.jpg'}" alt="news image" class="follow-card-img">
        <div class="follow-card-topic" onclick="selectsource('${article.source || 'Source'}')">${article.source || 'Source'}</div>
        <div class="card-actions">
              <button class="follow-btn">
                <i class="fa fa-plus"></i>
              </button>
              <button class="save-btn" title="Save article">
                <i class="far fa-bookmark"></i>
              </button>
        </div>
      </div>
      <div class="follow-card-body">
        <a class="follow-card-title article-link" href="${article.link}" target="_blank" onclick="trackTrendingClick('${article.title.replace(/'/g, "\\'")}'); trackReadingHistory(${JSON.stringify(article).replace(/"/g, '&quot;')}); return true;">${article.title}</a>
        <div class="follow-card-meta">
          <span class="follow-card-source" onclick="selectCategory('${article.category_name || ''}')"> ${article.category_name || ''}</span>
          <span class="follow-card-date">${article.published ? new Date(article.published).toLocaleDateString() : ''}</span>
        </div>
        <p class="follow-card-summary">${article.summary}</p>
      </div>
    `;
    container.appendChild(card);

    const btn = card.querySelector('.follow-btn');
    btn.addEventListener('click', function() {
      const user_id = sessionStorage.getItem("user_id");
      if (!user_id) {
        console.error("User ID not found in sessionStorage.");
        return;
      }

      if (btn.classList.contains('following')) {
        btn.classList.remove('following');
        btn.innerHTML = '<i class="fa fa-plus"></i>';
        fetch('http://localhost:3000/api/unfollow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id, topics: [article.source] })
        });
      } else {
        btn.classList.add('following');
        btn.innerHTML = '<i class="fa fa-minus"></i>';
        fetch('http://localhost:3000/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id, topics: [article.source] })
        });
      }
    });

    const saveBtn = card.querySelector('.save-btn');
    saveBtn.addEventListener('click', function() {
      const user_id = sessionStorage.getItem("user_id");
      if (!user_id) {
        console.error("User ID not found in sessionStorage.");
        return;
      }

      if (saveBtn.classList.contains('saved')) {
        saveBtn.classList.remove('saved');
        saveBtn.innerHTML = '<i class="far fa-bookmark"></i>';
        
        fetch('http://localhost:3000/api/saved/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: user_id, 
            link: article.link 
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('Article removed from saved');
          } else {
            console.error('Error removing article:', data.message);
          }
        });
      } else {
        saveBtn.classList.add('saved');
        saveBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
        
        fetch('http://localhost:3000/api/saved/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: user_id,
            category_name: article.category_name,
            title: article.title,
            link: article.link,
            source: article.source,
            image: article.image,
            published: article.published,
            summary: article.summary
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('Article saved successfully');
          } else {
            console.error('Error saving article:', data.message);
          }
        });
      }
    });
  });

  displayedCount += nextChunk.length;
}

window.addEventListener("scroll", () => {
  const container = document.getElementById("main-news-container");
  if (!container) return;
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
    if (displayedCount < allNews.length) {
      const hash = window.location.hash.replace('#', '') || 'main';
      if (hash === 'following') {
        renderFollowingNewsChunk();
      } else if (hash === 'discover') {
        renderNewsChunk();
      } else if (hash === 'main') {
        renderNewsChunk();
      } else if (hash.startsWith('category=') || hash.startsWith('source=')) {
        renderCategoryNewsChunk();
      }
      updateFollowButtons();
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes('following.html')) {
    loadFollowingNews();
  } else {
    loadMainNews();
  }
});

function selectCategory(category) {
  return fetch('http://localhost:3000/api/categories', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Category news:', data.categories);
        sessionStorage.setItem("selectedCategory", JSON.stringify(data.categories));
        window.location.hash = `#category=${encodeURIComponent(category)}`;
        updateSaveButtons();
      } else {
        alert(data.message || 'No news found for this category.');
      }
    })
    .catch(err => {
      console.error('Error fetching category news:', err);
      alert('Failed to load category news.');
    });
}

function renderCategoryNewsChunk() {
  const container = document.getElementById("main-news-container");
  const nextChunk = allNews.slice(displayedCount, displayedCount + PAGE_SIZE);
  
  nextChunk.forEach(article => {
    const card = document.createElement("div");
    card.className = "cat-card";
    card.innerHTML = `
      <div class="cat-card-header">
        <img src="${article.image || './assets/default-news.jpg'}" alt="news image" class="follow-card-img">
        <div class="follow-card-topic" onclick="selectsource('${article.source || 'Source'}')">${article.source || 'Source'}</div>
        <div class="card-actions">
              <button class="follow-btn">
                <i class="fa fa-plus"></i>
              </button>
              <button class="save-btn" title="Save article">
                <i class="far fa-bookmark"></i>
              </button>
          </div>
      </div>
      <div class="cat-card-body">
        <a class="cat-card-title article-link" href="${article.link}" target="_blank" onclick="trackTrendingClick('${article.title.replace(/'/g, "\\'")}'); trackReadingHistory(${JSON.stringify(article).replace(/"/g, '&quot;')}); return true;">${article.title}</a>
        <div class="follow-card-meta">
          <span class="cat-card-source" onclick="selectCategory('${article.category_name || ''}')"> ${article.category_name || ''}</span>
          <span class="cat-card-date">${article.published ? new Date(article.published).toLocaleDateString() : ''}</span>
        </div>
        <p class="cat-card-summary">${article.summary}</p>
      </div>
    `;
    container.appendChild(card);

    const btn = card.querySelector('.follow-btn');
    btn.addEventListener('click', function() {
      const user_id = sessionStorage.getItem("user_id");
      if (!user_id) {
        console.error("User ID not found in sessionStorage.");
        return;
      }

      if (btn.classList.contains('following')) {
        btn.classList.remove('following');
        btn.innerHTML = '<i class="fa fa-plus"></i>';
        
        fetch('http://localhost:3000/api/unfollow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id, topics: [article.source] })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('Unfollowed successfully:', article.source);
          } else {
            console.error('Error unfollowing:', data.message);
          }
        })
        .catch(error => {
          console.error('Error unfollowing:', error);
        });
      } else {
        btn.classList.add('following');
        btn.innerHTML = '<i class="fa fa-minus"></i>';
        
        fetch('http://localhost:3000/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id, topics: [article.source] })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('Followed successfully:', article.source);
          } else {
            console.error('Error following:', data.message);
          }
        })
        .catch(error => {
          console.error('Error following:', error);
        });
      }
    });

    const saveBtn = card.querySelector('.save-btn');
    saveBtn.addEventListener('click', function() {
      const user_id = sessionStorage.getItem("user_id");
      if (!user_id) {
        console.error("User ID not found in sessionStorage.");
        return;
      }

      if (saveBtn.classList.contains('saved')) {
        // Remove from saved
        saveBtn.classList.remove('saved');
        saveBtn.innerHTML = '<i class="far fa-bookmark"></i>';
        
        fetch('http://localhost:3000/api/saved/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: user_id, 
            link: article.link 
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('Article removed from saved');
          } else {
            console.error('Error removing article:', data.message);
          }
        });
      } else {
        // Add to saved
        saveBtn.classList.add('saved');
        saveBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
        
        fetch('http://localhost:3000/api/saved/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: user_id,
            category_name: article.category_name,
            title: article.title,
            link: article.link,
            source: article.source,
            image: article.image,
            published: article.published,
            summary: article.summary
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('Article saved successfully');
          } else {
            console.error('Error saving article:', data.message);
          }
        });
      }
    });
  });

  displayedCount += nextChunk.length;
}

function rendernewsbycategory() {
  const container = document.getElementById("main-news-container");
  container.innerHTML = "";
  const welcome = document.createElement("h1");
  const hash = window.location.hash.replace('#', '');
  console.log("Hash:", hash);
  let selected; 
  let news;
  let headerText;
  if (hash.startsWith('category=')) {
    selected = sessionStorage.getItem("selectedCategory");
    if (selected) {
      news = JSON.parse(selected);
      headerText = news[0]?.category_name ? `${news[0].category_name} News` : "Category News";
      welcome.textContent = headerText;
      container.appendChild(welcome);
    }
    
  } else if (hash.startsWith('source=')) {
    selected = sessionStorage.getItem("selectedSource");
    if (selected) {
      news = JSON.parse(selected);
      headerText = news[0]?.source ? `${news[0].source}'s News` : "Source News";
      welcome.textContent = headerText; 
      container.appendChild(welcome);
    }
    
  }

  if (!selected) {
    document.getElementById("main-news-container").innerHTML = "<p>No category or source selected.</p>";
    return;
  }
  console.log("Selected data:", selected);
  news = JSON.parse(selected);
  if (!Array.isArray(news) || news.length === 0) {
    document.getElementById("main-news-container").innerHTML = "<p>No news found for this category or source.</p>";
    return;
  }

  allNews = news;
  displayedCount = 0;
  renderCategoryNewsChunk();
  updateFollowButtons();
  updateSaveButtons();
}

function goBack(){
  window.history.back();
}

function selectsource(source) {
  return fetch('http://localhost:3000/api/source', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source })
  })
    .then(res => res.json())
    .then(data => {
      console.log('API response:', data);
      if (data.success) {
        console.log('Source news:', data.source);
        sessionStorage.setItem("selectedSource", JSON.stringify(data.source));
        window.location.hash = `#source=${encodeURIComponent(source)}`;
      } else {
        alert(data.message || 'No news found for this source.');
      }
    })
    .catch(err => {
      console.error('Error fetching source news:', err);
      alert('Failed to load source news.');
    });
}


// trending cards data
function loadTrendingNews() {
  fetch(`http://localhost:3000/api/trending-now`)
    .then(res => res.json())
    .then(data => {
      const trending = data.trending || [];
      renderTrendingNews(trending);
      updateSaveButtons();
    });
}

function renderTrendingNews(trending) {
  // Hero section
  const heroSection = document.getElementById("trending-hero-section");
  heroSection.innerHTML = "";
  if (trending[0]) {
    const hero = trending[0];
    heroSection.innerHTML = `
      <div class="trending-hero">
        <div class="trending-rank-badge">#1</div>
        <img src="${hero.image}">
        <div class="trending-hero-content">
          <h2 class="trending-hero-title">${hero.title}</h2>
          <div class="trending-card-meta">
            <span class="news-category" onclick="selectCategory('${hero.category_name || ''}')">${hero.category_name}</span>
            <span class="news-time">${hero.published}</span>
          </div>
          <p class="trending-hero-summary">${hero.summary}</p>
          <a class="trending-read-btn" href="${hero.link}" target="_blank" onclick="trackTrendingClick('${hero.title.replace(/'/g, "\\'")}'); trackReadingHistory(${JSON.stringify(hero).replace(/"/g, '&quot;')}); return true;">Read More</a>
        </div>
      </div>
    `;
  }

  const grid = document.getElementById("trending-grid");
  grid.innerHTML = "";
  // #2 and #3
  [1, 2].forEach(i => {
    if (trending[i]) {
      const article = trending[i];
      const card = document.createElement("div");
      card.className = "trending-card-wrapper";
      card.innerHTML = `
        <div class="trending-card">
          <div class="trending-rank-badge">#${i+1}</div>
          <div class="trending-card-meta">
            <span class="news-category" onclick="selectCategory('${article.category_name || ''}')">${article.category_name}</span>
            <span class="news-time">${article.published}</span>
          </div>
          <h3 class="trending-card-title">${article.title}</h3>
          <p class="trending-card-summary">${article.summary}</p>
          <a class="trending-read-btn" href="${article.link}" target="_blank" onclick="trackTrendingClick('${article.title.replace(/'/g, "\\'")}'); trackReadingHistory(${JSON.stringify(article).replace(/"/g, '&quot;')}); return true;">Read More</a>
        </div>
      `;
      grid.appendChild(card);
    }
  });
  // The rest (no badge or with #4, #5, ...)
  for (let i = 3; i < trending.length; i++) {
    const article = trending[i];
    const card = document.createElement("div");
    card.className = "trending-card-wrapper";
    card.innerHTML = `
      <div class="trending-card">
        <div class="trending-card-meta">
          <span class="news-category" onclick="selectCategory('${article.category_name || ''}')">${article.category_name}</span>
          <span class="news-time">${article.published}</span>
        </div>
        <h3 class="trending-card-title">${article.title}</h3>
        <p class="trending-card-summary">${article.summary}</p>
        <a class="trending-read-btn" href="${article.link}" target="_blank" onclick="trackTrendingClick('${article.title.replace(/'/g, "\\'")}'); trackReadingHistory(${JSON.stringify(article).replace(/"/g, '&quot;')}); return true;">Read More</a>
      </div>
    `;
    grid.appendChild(card);
  }
}

//function to check for saved articles
function updateSaveButtons() {
  const user_id = sessionStorage.getItem("user_id");
  if (!user_id) {
    console.log("No user_id found in sessionStorage");
    return;
  }

  console.log("Fetching saved articles for user:", user_id);

  fetch(`http://localhost:3000/api/saved/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id })
  })
    .then(res => res.json())
    .then(data => {
      console.log("API Response:", data);
      if (data.success) {
        const savedLinks = data.saved.map(article => article.link);
      
        document.querySelectorAll('.save-btn').forEach(btn => {
          const card = btn.closest('.card, .cat-card, .follow-card');
          if (!card) return;
          
          const titleElement = card.querySelector('.title, .cat-card-title, .follow-card-title');
          if (!titleElement) return;
          
          const articleLink = titleElement.getAttribute('href');

          if (savedLinks.includes(articleLink)) {
            btn.classList.add('saved');
            btn.innerHTML = '<i class="fas fa-bookmark"></i>'; // Filled bookmark
          } else {
            btn.classList.remove('saved');
            btn.innerHTML = '<i class="far fa-bookmark"></i>'; // Empty bookmark
          }
        });
      }
    })
    .catch(error => {
      console.error('Error checking saved articles:', error);
    });
}

// Load saved articles for the current user
function loadSavedArticles() {
    console.log("Loading saved articles...");
    const user_id = sessionStorage.getItem("user_id");
    
    if (!user_id) {
        document.getElementById("saved-articles").innerHTML = "<p>Please log in to see your saved articles.</p>";
        return;
    }

    fetch('http://localhost:3000/api/saved/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log("Saved articles:", data.saved);
            renderSavedArticles(data.saved);
            updateArticleCount(data.saved.length);
            setTimeout(setupSavedSearchListeners, 100);
        } else {
            console.error("Error loading saved articles:", data.message);
            showEmptyState();
        }
    })
    .catch(error => {
        console.error('Error loading saved articles:', error);
        showEmptyState();
    });
}

// Render saved articles dynamically
function renderSavedArticles(articles) {
    const container = document.getElementById("saved-articles");
    const emptyState = document.querySelector(".empty-state");
    
    if (!articles || articles.length === 0) {
      const searchFeedback = document.querySelector('.search-feedback');
        if (searchFeedback) {
            // Show no results message for search
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No saved articles found</h3>
                    <p>Try a different search term or check your saved articles.</p>
                </div>
            `;
        } else {
            // Show regular empty state
            showEmptyState();
        }
        return;
    }

    // Hide empty state and show grid
    if (emptyState) emptyState.style.display = "none";
    container.innerHTML = "";

    articles.forEach(article => {
        const articleCard = document.createElement("article");
        articleCard.className = "saved-card";
        articleCard.setAttribute("data-category", article.category_name || "general");
        
        // Format date
        const savedDate = article.saved_at ? new Date(article.saved_at).toLocaleDateString() : "Unknown date";
        const publishedDate = article.published ? new Date(article.published).toLocaleDateString() : "Unknown date";
        
        articleCard.innerHTML = `
            <div class="saved-card-header">
                <div class="saved-card-meta">
                    <span class="saved-category" onclick="selectCategory('${article.category_name || ''}')">${article.category_name || 'General'}</span>
                    <span class="saved-date">${savedDate}</span>
                </div>
                <button class="remove-btn" title="Remove from saved" onclick="removeSavedArticle('${article.link}', this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="saved-card-content">
                <img src="${article.image || './assets/default-news.jpg'}" alt="Article" class="saved-card-image">
                <div class="saved-card-text">
                    <a class="saved-card-title title" href="${article.link}">${article.title}</a>
                    <p class="saved-card-summary">${article.summary || 'No summary available...'}</p>
                    <div class="saved-card-footer">
                        <span class="saved-source" onclick="selectsource('${article.source || 'Source'}')">${article.source || 'Unknown Source'}</span>
                        <button class="read-btn article-link" href="${article.link}" target="_blank">Read Article</button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(articleCard);
    });
}

// Show empty state when no articles
function showEmptyState() {
    const container = document.getElementById("saved-articles");
    const emptyState = document.querySelector(".empty-state");
    
    container.innerHTML = "";
    
    if (emptyState) {
        emptyState.style.display = "block";
    }
}

// Update article count in header
function updateArticleCount(count) {
    const countElement = document.querySelector(".articles-count");
    if (countElement) {
        countElement.textContent = `${count} article${count !== 1 ? 's' : ''} saved`;
    }
}

// Remove article from saved
function removeSavedArticle(link, buttonElement) {
    const user_id = sessionStorage.getItem("user_id");
    
    if (!user_id) {
        console.error("User ID not found");
        return;
    }

    // Show loading state
    const originalText = buttonElement.innerHTML;
    buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    buttonElement.disabled = true;

    fetch('http://localhost:3000/api/saved/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: user_id, 
            link: link 
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('Article removed successfully');
            // Remove the card from DOM with animation
            const card = buttonElement.closest('.saved-card');
            card.style.transform = 'translateX(100%)';
            card.style.opacity = '0';
            setTimeout(() => {
                card.remove();
                // Reload to update count
                loadSavedArticles();
            }, 300);
        } else {
            console.error('Error removing article:', data.message);
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
            alert('Error removing article: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error removing article:', error);
        buttonElement.innerHTML = originalText;
        buttonElement.disabled = false;
        alert('Error removing article. Please try again.');
    });
}

// Clear all saved articles
function clearAllSavedArticles() {
    const user_id = sessionStorage.getItem("user_id");
    console.log("mf is clicked");
    
    if (!user_id) {
      console.error("User ID not found");
      return;
    }

    if (!confirm("Are you sure you want to remove all saved articles? This action cannot be undone.")) {
        return;
    }

    fetch('http://localhost:3000/api/saved/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('All articles cleared successfully');
            showEmptyState();
            updateArticleCount(0);
        } else {
            console.error('Error clearing articles:', data.message);
            alert('Error clearing articles: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error clearing articles:', error);
        alert('Error clearing articles. Please try again.');
    });
}

function searchSavedArticles(searchTerm) {
    console.log("🔍 searchSavedArticles called with:", searchTerm);
    const user_id = sessionStorage.getItem("user_id");
    
    if (!user_id) {
        document.getElementById("saved-articles").innerHTML = "<p>Please log in to see your saved articles.</p>";
        return;
    }

    if (!searchTerm || searchTerm.trim() === '') {
        loadSavedArticles();
        return;
    }

    fetch('http://localhost:3000/api/saved/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: user_id,
            searchTerm: searchTerm.trim()
        })
    })
    .then(res => {
        console.log("📥 Search response received:", res);
        return res.json();
    })
    .then(data => {
        if (data.success) {
            console.log("✅ Search results:", data.results);
            renderSavedArticles(data.results);
            updateArticleCount(data.results.length);
            showSearchFeedback(data.results.length, data.searchTerm);
        } else {
            console.error("❌ Error searching saved articles:", data.message);
        }
    })
    .catch(error => {
        console.error('🚨 Search error:', error);
    });
}

// Show search feedback for saved articles
function showSearchFeedback(resultCount, searchTerm) {
    console.log("📝 Showing search feedback:", resultCount, searchTerm);
    
    // Remove any existing feedback
    const existingFeedback = document.querySelector('.search-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = 'search-feedback';
    feedback.innerHTML = `
        <div class="search-results-info">
            <span class="results-count">${resultCount}</span> 
            <span class="results-text">saved articles found for</span> 
            <span class="search-term">"${searchTerm}"</span>
            <button class="clear-search-btn" onclick="clearSavedSearch()">
                <i class="fas fa-times"></i>
                Clear Search
            </button>
        </div>
    `;

    // Insert after saved-filters
    const filtersDiv = document.querySelector('.saved-filters');
    if (filtersDiv) {
        filtersDiv.insertAdjacentElement('afterend', feedback);
        console.log("✅ Search feedback added");
    } else {
        console.log("❌ Could not find .saved-filters");
    }
}

// Clear search function for saved articles
function clearSavedSearch() {
    console.log("🧹 Clearing saved search");
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    loadSavedArticles();
    
    // Remove search feedback
    const feedback = document.querySelector('.search-feedback');
    if (feedback) {
        feedback.remove();
    }
}

// Setup search event listeners for saved page
function setupSavedSearchListeners() {
    console.log("🎧 Setting up saved search listeners");
    const searchInput = document.querySelector('.search-input');

    if (searchInput) {
        console.log("✅ Search input found, adding listeners");
        
        // Handle Enter key press
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                console.log("⌨️ Enter pressed, searching for:", searchTerm);
                searchSavedArticles(searchTerm);
            }
        });

        // Handle input changes (search as you type)
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = this.value.trim();
                if (searchTerm.length >= 2 || searchTerm.length === 0) {
                    console.log("⚡ Auto-searching for:", searchTerm);
                    searchSavedArticles(searchTerm);
                }
            }, 500); // Wait 500ms after user stops typing
        });
        
        console.log("✅ Saved search listeners added successfully");
    } else {
        console.error("❌ Could not find .search-input!");
    }
}

function searchGeneralNews(searchTerm) {
    console.log("🔍 searchGeneralNews called with:", searchTerm);
    
    if (!searchTerm || searchTerm.trim() === '') {
        console.log("🔄 Empty search, loading original content");
        // Load original content based on current page
        const hash = window.location.hash.replace('#', '') || 'main';
        if (hash === 'main') {
            loadMainNews();
        } else if (hash === 'discover') {
            loadSecondaryNews();
        } else if (hash === 'following') {
            loadFollowingNews();
        }
        return;
    }

    console.log("🌐 Making fetch request to general search API");
    fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            searchTerm: searchTerm.trim()
        })
    })
    .then(res => {
        console.log("📥 Search response received:", res);
        return res.json();
    })
    .then(data => {
        console.log("📊 Search data received:", data);
        if (data.success) {
            console.log("✅ Search results:", data.results);
            
            // Update global news array and reset count
            allNews = data.results;
            displayedCount = 0;
            
            // Clear container and render search results
            document.getElementById("main-news-container").innerHTML = "";
            
            // Show search feedback
            showMainSearchFeedback(data.results.length, data.searchTerm);
            
            // Render based on current page
            const hash = window.location.hash.replace('#', '') || 'main';
            if (hash === 'following') {
                renderFollowingNewsChunk();
            } else {
                renderNewsChunk(); // For main and discover pages
            }
            
            updateFollowButtons();
            updateSaveButtons();
        } else {
            console.error("❌ Error searching news:", data.message);
        }
    })
    .catch(error => {
        console.error('🚨 Search error:', error);
    });
}

// Show search feedback for main pages
function showMainSearchFeedback(resultCount, searchTerm) {
    console.log("📝 Showing main search feedback:", resultCount, searchTerm);
    
    // Remove any existing feedback
    const existingFeedback = document.querySelector('.main-search-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = 'main-search-feedback';
    feedback.innerHTML = `
        <div class="search-results-info">
            <span class="results-count">${resultCount}</span> 
            <span class="results-text">articles found for</span> 
            <span class="search-term">"${searchTerm}"</span>
            <button class="clear-search-btn" onclick="clearMainSearch()">
                <i class="fas fa-times"></i>
                Clear Search
            </button>
        </div>
    `;

    // Insert after search nav
    const searchNav = document.querySelector('.search');
    if (searchNav) {
        searchNav.insertAdjacentElement('afterend', feedback);
        console.log("✅ Main search feedback added");
    } else {
        console.log("❌ Could not find .search nav");
    }
}

// Clear search function for main pages
function clearMainSearch() {
    console.log("🧹 Clearing main search");
    const searchInput = document.querySelector('.main-search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Load original content based on current page
    const hash = window.location.hash.replace('#', '') || 'main';
    if (hash === 'main') {
        loadMainNews();
    } else if (hash === 'discover') {
        loadSecondaryNews();
    } else if (hash === 'following') {
        loadFollowingNews();
    }
    
    // Remove search feedback
    const feedback = document.querySelector('.main-search-feedback');
    if (feedback) {
        feedback.remove();
    }
}

// Setup search event listeners for main pages
function setupMainSearchListeners() {
    console.log("🎧 Setting up main search listeners");
    const searchInput = document.querySelector('.main-search-input');

    if (searchInput) {
        console.log("✅ Main search input found, adding listeners");
        
        // Remove any existing listeners to prevent duplicates
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        // Handle Enter key press
        newSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                console.log("⌨️ Enter pressed, searching for:", searchTerm);
                searchGeneralNews(searchTerm);
            }
        });

        // Handle input changes (search as you type)
        let searchTimeout;
        newSearchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = this.value.trim();
                if (searchTerm.length >= 2 || searchTerm.length === 0) {
                    console.log("⚡ Auto-searching for:", searchTerm);
                    searchGeneralNews(searchTerm);
                }
            }, 500); // Wait 500ms after user stops typing
        });
        
        console.log("✅ Main search listeners added successfully");
    } else {
        console.error("❌ Could not find .main-search-input!");
    }
}