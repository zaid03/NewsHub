document.addEventListener("DOMContentLoaded", () => {
  const headerPlaceholder = document.querySelector("header-placeholder");
  if (!window.location.hash) {
    window.location.hash = "#main";
  }
  if (headerPlaceholder) {
    fetch("./components/side-bar.html")
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        
        headerPlaceholder.innerHTML = html;
        // console.log("Sidebar loaded successfully");
        highlightActiveMenuItem();
        document.addEventListener("change", function(e) {
        if (e.target && e.target.id === "toggle-sidebar") {
          if (e.target.checked) {
            document.body.classList.add("sidebar-open");
            document.body.classList.remove("sidebar-collapsed");

          } else {
            document.body.classList.remove("sidebar-open");
            document.body.classList.add("sidebar-collapsed");
          }
        }
      });
        const nom_storage = sessionStorage.getItem("nom") || "Valeur non disponible";
        const gender_storage = sessionStorage.getItem("gender") || "Valeur non disponible";

        if ((!sessionStorage.getItem("user_id")) || (!sessionStorage.getItem("nom")))
            alert("no name and user id");   

        const gender = document.getElementById("gender");
        const nom= document.getElementById("nom");
        console.log("gender", sessionStorage.getItem("gender"));
        console.log("nom", sessionStorage.getItem("nom"));
        
        if (gender) {
            gender.innerHTML = gender_storage === "female"
            ? `<img src="./assets/avatar_female.svg" alt="Avatar">`
            : `<img src="./assets/avatar_male.svg" alt="Avatar">`;
        }

        if (nom) {
            nom.innerHTML = nom_storage;
        }

        const out = document.getElementById("out");
        if (out) {
          out.addEventListener("click", function (event) {
            event.preventDefault();
            localStorage.removeItem("user_id");
            window.location.href = "../src/components/login.html";
          });
        }

      })
      .catch(error => {
        console.error("Error loading sidebar:", error);
      });
  }

  const trendingPlaceholder = document.querySelector("trending-placeholder");
  if (trendingPlaceholder) {
    fetch("./components/trending-misc.html")
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        trendingPlaceholder.innerHTML = html;
        // console.log("Trending sidebar loaded successfully");
        setTimeout(setupArticleViewer, 0);
      })
      .catch(error => {
        console.error("Error loading trending sidebar:", error);
      });
  }

  function highlightActiveMenuItem() {
    const hash = window.location.hash || "#main";
    document.querySelectorAll('.menu-item').forEach(li => {
        const a = li.querySelector('a');
        if (a && a.getAttribute('href') === hash) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });

    document.querySelectorAll('.topics li').forEach(li => {
        const a = li.querySelector('a');
        if (a && a.getAttribute('href') === hash) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
  }
  window.addEventListener('hashchange', highlightActiveMenuItem);

  function loadContent() {
    const contentDiv = document.getElementById("content");
    let page = window.location.hash.replace('#', '') || 'main';
    contentDiv.classList.remove('category-news-page', 'categories-page');
    contentDiv.classList.remove('radio-page');


    let pagePath;
    if (page.startsWith('category=') || page.startsWith('source=')) {
      pagePath = './components/category_news.html';
    } else {
      pagePath = `./components/${page}.html`;
    }
    
    fetch(pagePath)
      .then(response => {
        if (!response.ok) throw new Error("Page not found");
        return response.text();
      })
      .then(html => {
        contentDiv.innerHTML = html;

        // controle the right side bar visibility
        const rightSidebar = document.querySelector(".right");
        if (
          page.startsWith('category=') ||
          page.startsWith('source=') ||
          page === "categories" ||
          page === "radio"
        ) {
          if (rightSidebar) rightSidebar.style.display = "none";
        } else {
          if (rightSidebar) rightSidebar.style.display = "";
        }
        if (page.startsWith('category=')) {
          contentDiv.classList.add('category-news-page');
          const category = decodeURIComponent(page.replace('category=', ''));
          selectCategory(category).then(() => {
            rendernewsbycategory();
            setTimeout(setupArticleViewer, 0);
        });
      } else if (page.startsWith('source=')) {
          contentDiv.classList.add('category-news-page');
          rendernewsbycategory();
          setTimeout(setupArticleViewer, 0);
      }
      else if (page === "categories") {
        contentDiv.classList.add('categories-page');
      } else if (page === "radio") {
        contentDiv.classList.add('radio-page');
        new RadioPlayer();
      }
      else  if (page === "main" && typeof loadMainNews === "function") {
          loadMainNews();
          setTimeout(setupArticleViewer, 0);

        }
      else if (page === "discover" && typeof loadSecondaryNews === "function") {
          loadSecondaryNews();
          setTimeout(setupArticleViewer, 0);
        }
      else if (page === "following" && typeof loadFollowingNews === "function") {
          loadFollowingNews();
          setTimeout(setupArticleViewer, 0);
        }
      else if (page === "categories" && typeof loadCategories === "function") {
          renderCategoryNews();
        }
      else if (page === "trending") {
        loadTrendingNews();
        console.log("calling the api to get trending news");
        setTimeout(setupArticleViewer, 0);
      }
      else if (page === "saved" && typeof loadSavedArticles === "function") {
        loadSavedArticles();
        setTimeout(setupArticleViewer, 0);
      }
      else if (page === "profile") {
        if (typeof loadContentDynimically === "function") {
        setTimeout(() => {
            loadContentDynimically();
        }, 100);
      }
    }else if (page === "profile") {
        if (typeof loadContentDynimically === "function") {
        setTimeout(() => {
            loadContentDynimically();
        }, 100);
      }
    }
    else if (page === "history" && typeof loadHistoryArticles === "function") {
      loadHistoryArticles();
      setTimeout(setupArticleViewer, 0);
    }
    }).catch(() => {
        contentDiv.innerHTML = "<h2>Page not found</h2>";
      });
  }
  loadContent();
  window.addEventListener("hashchange", loadContent);
  window.addEventListener("DOMContentLoaded", loadContent);


});

// Function to handle opening the article in the webview
function setupArticleViewer() {
  const container = document.getElementById("main-news-container");
  const trendingContainer = document.querySelector(".trending-topics");
  const webviewContainer = document.getElementById("webview-container");
  const trendingPageContainer = document.querySelector(".trending-container");
  const articleViewer = document.getElementById("article-viewer");
  const backBtn = document.getElementById("back-to-news");
  const sideicon = document.querySelector(".toggle-button");
  const savedContainer = document.getElementById("saved-articles");
  const historyContainer = document.querySelector(".history-articles");

  if (!webviewContainer || !articleViewer || !backBtn) return;

  // Listen for main news container clicks
  if (container) {
    container.addEventListener("click", handleArticleClick);
  }
  
  // Listen for trending sidebar clicks
  if (trendingContainer) {
    trendingContainer.addEventListener("click", handleArticleClick);
  }

  if (trendingPageContainer) {
    trendingPageContainer.addEventListener("click", handleArticleClick);
  }

  if (savedContainer) {
    savedContainer.addEventListener("click", handleArticleClick);
  }

  if (historyContainer) {
    historyContainer.addEventListener("click", handleArticleClick);
  }

  function handleArticleClick(e) {
    const target = e.target;
    let url = null;
    
    // Handle trending buttons
    if (target.classList.contains("trending-read-btn")) {
      url = target.getAttribute("href");
    }
    // Handle regular links
    else if (target.classList.contains("title") || target.classList.contains("article-link") || 
        (target.tagName === "A" && target.getAttribute("href"))) {
      url = target.getAttribute("href");
    }
    // Handle read article buttons
    else if (target.classList.contains("read-btn")) {
      url = target.getAttribute("href");
    }
    // Handle title clicks (make titles clickable)
    else if (target.classList.contains("saved-card-title")) {
      url = target.getAttribute("href");
    }
    else if (target.classList.contains("read-again-btn")) {
      url = target.getAttribute("href");
    }
    
    if (url) {
      e.preventDefault();
      console.log("Opening article:", url);
      webviewContainer.style.display = "block";
      articleViewer.setAttribute("src", url);
      const center = document.querySelector(".center");
      const left = document.querySelector(".left");
      
      if (sideicon) sideicon.style.visibility = "hidden";
      if (center) center.style.display = "none";
      if (left) left.style.display = "none";
      document.body.classList.add("webview-open");
      document.body.classList.add("sidebar-collapsed");
    }
  }

  backBtn.addEventListener("click", function() {
    console.log("click")
    webviewContainer.style.display = "none";
    articleViewer.setAttribute("src", "");
    const center = document.querySelector(".center");
    const left = document.querySelector(".left");
    if (center) center.style.display = "";
    if (left) left.style.display = "";
    document.body.classList.remove("webview-open");
    document.body.classList.remove("sidebar-collapsed");
    if (sideicon) sideicon.style.visibility = "visible";
  });
}

// document.addEventListener('mousemove', (e) => {
//     const cards = document.querySelectorAll('.category-card, .news-card');
//     const mouseX = e.clientX / window.innerWidth;
//     const mouseY = e.clientY / window.innerHeight;

//     cards.forEach((card, index) => {
//         const speed = (index % 3 + 1) * 0.5;
//         const x = (mouseX - 0.5) * speed;
//         const y = (mouseY - 0.5) * speed;
        
//         card.style.transform += ` translate3d(${x}px, ${y}px, 0)`;
//     });
// });

// function handleCategoryClick(category, el, event) {
//   if (event) event.preventDefault();
//   el.style.transform = 'scale(0.95)';
//   setTimeout(() => {
//     el.style.transform = '';
//     window.location.hash = `category=${encodeURIComponent(category)}`;
//   }, 150);
// }

// document.addEventListener('keydown', function(e) {
//   if (e.key === 'Enter' && e.target.classList.contains('category-card')) {
//     e.target.click();
//   }
// });

// window.addEventListener('hashchange', function() {
//   const hash = window.location.hash;
//   if (hash.startsWith('#category=')) {
//     const category = decodeURIComponent(hash.replace('#category=', ''));
//     selectCategory(category);
//   }
// });

// Optionally, load category if hash is present on page load
// document.addEventListener('DOMContentLoaded', function() {
//   const hash = window.location.hash;
//   if (hash.startsWith('#category=')) {
//     const category = decodeURIComponent(hash.replace('#category=', ''));
//     selectCategory(category);
//   }
// });

// const { ipcMain } = require('electron');

// ipcMain.on('navigate-to', (event, path) => {
//     // Get the sender window and load the new file
//     const webContents = event.sender;
//     webContents.loadFile(path);
// });