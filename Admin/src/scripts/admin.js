
const API_BASE = 'http://localhost:4000';

// Load dashboard data
async function loadDashboardStats() {
    try {
        // Get total articles
        const articlesRes = await fetch(`${API_BASE}/admin/stats/articles`);
        const articlesData = await articlesRes.json();
        document.getElementById('total-articles').textContent = articlesData.count || 0;

        // Get total users
        const usersRes = await fetch(`${API_BASE}/admin/stats/users`);
        const usersData = await usersRes.json();
        document.getElementById('total-users').textContent = usersData.count || 0;

        // Get total views (from history)
        const viewsRes = await fetch(`${API_BASE}/admin/stats/views`);
        const viewsData = await viewsRes.json();
        document.getElementById('total-views').textContent = viewsData.count || 0;

        // Get total saved articles
        const savedRes = await fetch(`${API_BASE}/admin/stats/saved`);
        const savedData = await savedRes.json();
        document.getElementById('total-saved').textContent = savedData.count || 0;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Quick Actions
function refreshData() {
    console.log('Refreshing data...');
    loadDashboardStats();
}

function cleanOldArticles() {
    if (confirm('Are you sure you want to clean articles older than 15 days?')) {
        fetch(`${API_BASE}/admin/articles/clean`, {
            method: 'POST'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(`Cleaned ${data.deleted} old articles`);
                refreshData();
            }
        })
        .catch(error => console.error('Error cleaning articles:', error));
    }
}

function exportData() {
    alert('Export functionality coming soon!');
}

// Navigation
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    
    // Setup navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('href').substring(1);
            loadPage(page);
        });
    });
});

function loadPage(page) {
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current link
    document.querySelector(`a[href="#${page}"]`).classList.add('active');
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'articles': 'Article Management',
        'users': 'User Management',
        'analytics': 'Analytics',
        'settings': 'Settings'
    };
    
    document.getElementById('page-title').textContent = titles[page] || 'Dashboard';
    
    // Load page content
    switch(page) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'articles':
            loadArticlesPage();
            break;
        case 'users':
            loadUsersPage();
            break;
        case 'analytics':
            loadAnalyticsPage();
            break;
        case 'settings':
            loadSettingsPage();
            break;
    }
}

async function loadArticlesPage() {
    try {
        const response = await fetch(`${API_BASE}/admin/articles`);
        const data = await response.json();
        
        document.getElementById('main-content').innerHTML = `
            <div class="page-content">
                <h2>Article Management</h2>
                <div class="articles-grid">
                    ${data.articles.map(article => `
                        <div class="article-card">
                            <h3>${article.title}</h3>
                            <p>Published: ${new Date(article.published).toLocaleDateString()}</p>
                            <p>Trending: ${article.trending ? 'Yes' : 'No'}</p>
                            <button class="delete-btn" onclick="deleteArticle(${article.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading articles:', error);
    }
}

async function loadUsersPage() {
    try {
        const response = await fetch(`${API_BASE}/admin/users`);
        const data = await response.json();
        
        document.getElementById('main-content').innerHTML = `
            <div class="page-content">
                <h2>User Management</h2>
                <div class="users-grid">
                    ${data.users.map(user => `
                        <div class="user-card">
                            <h3>${user.utilisateur}</h3>
                            <p>Email: ${user.email}</p>
                            <p>Gender: ${user.gender}</p>
                            <p>Status: ${user.disabled ? 'Disabled' : 'Active'}</p>
                            <button class="delete-btn" onclick="deleteUser(${user.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadAnalyticsPage() {
    document.getElementById('main-content').innerHTML = `
        <div class="page-content">
            <h2>Analytics Dashboard</h2>
            
            <!-- Topics Analytics -->
            <div class="analytics-section">
                <h3><i class="fas fa-hashtag"></i> Most Followed Topics</h3>
                <div class="topics-grid" id="topics-container">
                    <div class="loading-card">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading topics...</p>
                    </div>
                </div>
            </div>
            
            <!-- Radio Analytics -->
            <div class="analytics-section">
                <h3><i class="fas fa-radio"></i> Radio Statistics</h3>
                <div class="radio-stats" id="radio-container">
                    <div class="loading-card">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading radio data...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load both analytics data
    await Promise.all([
        loadTopicsAnalytics(),
        loadRadioAnalytics()
    ]);
}

async function loadTopicsAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/admin/analytics/topics`);
        const data = await response.json();
        
        const topicsContainer = document.getElementById('topics-container');
        
        if (data.success && data.topTopics.length > 0) {
            topicsContainer.innerHTML = data.topTopics.map(topic => `
                <div class="topic-card rank-${topic.rank}">
                    <div class="topic-rank">#${topic.rank}</div>
                    <div class="topic-info">
                        <h4>${topic.topic}</h4>
                        <p class="followers-count">${topic.followers} followers</p>
                        <span class="position-badge">${topic.position}</span>
                    </div>
                    <div class="topic-icon">
                        <i class="fas ${topic.rank === 1 ? 'fa-crown' : topic.rank === 2 ? 'fa-medal' : 'fa-award'}"></i>
                    </div>
                </div>
            `).join('');
        } else {
            topicsContainer.innerHTML = `
                <div class="no-data-card">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No topics data available</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading topics analytics:', error);
        document.getElementById('topics-container').innerHTML = `
            <div class="error-card">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading topics data</p>
            </div>
        `;
    }
}

async function loadRadioAnalytics() {
    try {
        console.log('Fetching radio analytics...');
        const response = await fetch(`${API_BASE}/admin/analytics/radio`);
        const data = await response.json();
        
        console.log('Radio API Response:', data);
        console.log('Genre breakdown:', data.genreBreakdown);
        
        const radioContainer = document.getElementById('radio-container');
        
        if (data.success && data.totalRadios > 0) {
            radioContainer.innerHTML = `
                <div class="radio-overview">
                    <div class="radio-stat-card total">
                        <div class="radio-icon">
                            <i class="fas fa-radio"></i>
                        </div>
                        <div class="radio-info">
                            <h3>${data.totalRadios}</h3>
                            <p>Total Radios</p>
                        </div>
                    </div>
                    
                    <div class="radio-stat-card music">
                        <div class="radio-icon">
                            <i class="fas fa-music"></i>
                        </div>
                        <div class="radio-info">
                            <h3>${data.musicRadios}</h3>
                            <p>Music Radios</p>
                        </div>
                    </div>
                    
                    <div class="radio-stat-card news">
                        <div class="radio-icon">
                            <i class="fas fa-newspaper"></i>
                        </div>
                        <div class="radio-info">
                            <h3>${data.newsRadios}</h3>
                            <p>News Radios</p>
                        </div>
                    </div>
                </div>
                
                <div class="radio-breakdown">
                    <h4>Genre Distribution</h4>
                    <div class="breakdown-bars">
                        <div class="breakdown-item">
                            <span class="genre-label">Music</span>
                            <div class="progress-bar">
                                <div class="progress-fill music-fill" style="width: ${data.totalRadios > 0 ? (data.musicRadios / data.totalRadios * 100) : 0}%"></div>
                            </div>
                            <span class="percentage">${data.totalRadios > 0 ? Math.round(data.musicRadios / data.totalRadios * 100) : 0}%</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="genre-label">News</span>
                            <div class="progress-bar">
                                <div class="progress-fill news-fill" style="width: ${data.totalRadios > 0 ? (data.newsRadios / data.totalRadios * 100) : 0}%"></div>
                            </div>
                            <span class="percentage">${data.totalRadios > 0 ? Math.round(data.newsRadios / data.totalRadios * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            radioContainer.innerHTML = `
                <div class="no-data-card">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No radio data available</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading radio analytics:', error);
        document.getElementById('radio-container').innerHTML = `
            <div class="error-card">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading radio data</p>
            </div>
        `;
    }
}

function loadSettingsPage() {
    document.getElementById('main-content').innerHTML = `
        <div class="page-content">
            <h2>Settings</h2>
            <p>Configure admin settings</p>
            <!-- Settings content will go here -->
        </div>
    `;
}

function cleanOldArticles() {
    if (confirm('Are you sure you want to clean articles older than 15 days?')) {
        fetch(`${API_BASE}/admin/articles/clean`, {
            method: 'POST'
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                alert(`Cleaned ${data.deleted} old articles`);
                refreshData();
            } else {
                alert('Failed to clean articles');
            }
        })
        .catch(error => {
            console.error('Error cleaning articles:', error);
            alert('Error cleaning articles. Check console for details.');
        });
    }
}

async function deleteArticle(id) {
    if (confirm('Are you sure you want to delete this article?')) {
        try {
            const response = await fetch(`${API_BASE}/admin/articles/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                alert('Article deleted successfully');
                loadArticlesPage(); // Reload the page
            }
        } catch (error) {
            console.error('Error deleting article:', error);
        }
    }
}

async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const response = await fetch(`${API_BASE}/admin/users/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                alert('User deleted successfully');
                loadUsersPage(); // Reload the page
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }
}