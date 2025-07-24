// Simple history loader - just show the data
function loadHistoryArticles() {
    console.log("loadHistoryArticles function called");
    const user_id = sessionStorage.getItem("user_id");
    console.log("User ID from sessionStorage:", user_id);
    
    if (!user_id) {
        console.log("No user logged in");
        return;
    }

    console.log("Making fetch request to history API");
    fetch('http://localhost:3000/api/history/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id })
    })
    .then(res => {
        console.log("Response received:", res);
        return res.json();
    })
    .then(data => {
        console.log("Data received:", data);
        if (data.success) {
            console.log("Articles:", data.articles);
            renderHistoryArticles(data.articles);
        } else {
            console.error("Error loading history:", data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function searchHistoryArticles(searchTerm) {
    console.log("searchHistoryArticles function called with:", searchTerm);
    const user_id = sessionStorage.getItem("user_id");
    
    if (!user_id) {
        console.log("No user logged in");
        return;
    }

    if (!searchTerm || searchTerm.trim() === '') {
        // If empty search, load all articles
        loadHistoryArticles();
        return;
    }

    console.log("Making fetch request to history search API");
    fetch('http://localhost:3000/api/history/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: user_id,
            searchTerm: searchTerm.trim()
        })
    })
    .then(res => {
        console.log("Search response received:", res);
        return res.json();
    })
    .then(data => {
        console.log("Search data received:", data);
        if (data.success) {
            console.log("Search results:", data.results);
            renderHistoryArticles(data.results);
            // Show search feedback
            showSearchFeedback(data.results.length, data.searchTerm);
        } else {
            console.error("Error searching history:", data.message);
        }
    })
    .catch(error => {
        console.error('Search error:', error);
    });
}

// Show search feedback
function showSearchFeedback(resultCount, searchTerm) {
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
            <span class="results-text">results found for</span> 
            <span class="search-term">"${searchTerm}"</span>
            <button class="clear-search-btn" onclick="clearSearch()">
                <i class="fas fa-times"></i>
                Clear Search
            </button>
        </div>
    `;

    // Insert after history-filters
    const filtersDiv = document.querySelector('.history-filters');
    filtersDiv.insertAdjacentElement('afterend', feedback);
}

// Clear search function
function clearSearch() {
    const searchInput = document.querySelector('.search-input');
    searchInput.value = '';
    loadHistoryArticles();
    
    // Remove search feedback
    const feedback = document.querySelector('.search-feedback');
    if (feedback) {
        feedback.remove();
    }
}

//  Category filter function
function filterByCategory(category) {
    console.log("Filtering by category:", category);
    const user_id = sessionStorage.getItem("user_id");
    
    if (!user_id) {
        console.log("No user logged in");
        return;
    }

    if (category === 'all') {
        loadHistoryArticles();
        return;
    }

    // Use search API with category name
    searchHistoryArticles(category);
}

// Simple render function
function renderHistoryArticles(articles) {
    console.log("renderHistoryArticles called with:", articles);
    const container = document.querySelector(".history-articles");
    console.log("Container found:", container);
    
    container.innerHTML = ""; // Clear existing content

    if (articles.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No articles found</h3>
                <p>Try a different search term or check your reading history.</p>
            </div>
        `;
        return;
    }

    articles.forEach(article => {
        console.log("Rendering article:", article.title);
        const articleCard = document.createElement("div");
        articleCard.className = "history-article";
        
        articleCard.innerHTML = `
            <img src="${article.image || '../assets/default-news.jpg'}" alt="Article" class="article-image">
            <div class="article-content">
                <div class="article-meta">
                    <span class="article-source">${article.source || 'Unknown'}</span>
                    <span class="article-category">${article.category_name || 'General'}</span>
                    <div class="read-time">
                        <i class="fas fa-clock"></i>
                        <span>${article.read_at}</span>
                    </div>
                </div>
                <h3 class="article-title">${article.title}</h3>
                <p class="article-summary">${article.summary || 'No summary available'}</p>
                <div class="article-actions">
                    <button class="read-again-btn article-link" href="${article.link}">
                        <i class="fas fa-external-link-alt"></i>
                        Read Again
                    </button>
                    <div class="article-options">
                        <!-- <button class="option-btn" title="Share">
                            <i class="fas fa-share"></i>
                        </button>
                        <button class="option-btn" title="Bookmark">
                            <i class="fas fa-bookmark"></i>
                        </button> 
                        <button class="option-btn remove" title="Remove from history">
                            <i class="fas fa-trash"></i>
                        </button>-->
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(articleCard);
    });
    console.log("Finished rendering articles");
}

//  Setup search event listeners
function setupSearchListeners() {
    const searchInput = document.querySelector('.search-input');
    const categorySelect = document.querySelector('#category-filter');

    if (searchInput) {
        // Handle Enter key press
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                console.log("Enter pressed, searching for:", searchTerm);
                searchHistoryArticles(searchTerm);
            }
        });

        // Handle input changes (optional - search as you type)
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = this.value.trim();
                if (searchTerm.length >= 2 || searchTerm.length === 0) {
                    searchHistoryArticles(searchTerm);
                }
            }, 300); // Wait 300ms after user stops typing
        });
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', function(e) {
            const selectedCategory = this.value;
            console.log("Category changed to:", selectedCategory);
            filterByCategory(selectedCategory);
        });
    }
}

// Load when page loads
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, checking hash:", window.location.hash);
    if (window.location.hash === '#history') {
        console.log("History page detected, loading articles");
        loadHistoryArticles();
        setupSearchListeners(); 
    } else {
        console.log("Not history page, hash is:", window.location.hash);
    }
});

window.addEventListener('hashchange', () => {
    if (window.location.hash === '#history') {
        console.log("Hash changed to history, loading articles");
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            loadHistoryArticles();
            setupSearchListeners(); 
        }, 100);
    }
});