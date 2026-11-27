const { stat } = require("original-fs");
const { use } = require("react");

function loadContentDynimically() {
    fetch('http://localhost:3000/api/settings/saved_Articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(data => {
    
        if (data.success) {
            console.log('user info:', data);
            const saved_articles = data.article_count;
            rendersave(saved_articles);
        } else {
            console.error('Error:', data.message);
        }
    })
    .catch(error => {
        alert('Error selecting user stat for articles saved. Please try again.');
    });

    fetch('http://localhost:3000/api/settings/following_sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const following_sources = data.source_count;
            renderfollowing(following_sources);
        } else {
            console.error('Error:', data.message);
        }
    })
    .catch(error => {
        alert('Error selecting following sources. Please try again.');
    });

    fetch('http://localhost:3000/api/settings/articles_read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('user info:', data);
            const articles_read = data.article_count;
            renderarticlesRead(articles_read);
        } else {
            console.error('Error:', data.message);
        }
    })
    .catch(error => {
        alert('Error selecting articles read sources. Please try again.');
    });

    fetch('http://localhost:3000/api/settings/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('user info:', data);
            const categories = data.history;
            renderfollowedbuttons(categories);
        } else {
            console.error('Error:', data.message);
        }
    })
    .catch(error => {
        alert('Error selecting articles read sources. Please try again.');
    });

    initializeProfileTabs();
}


function renderuserinto(user_info){
    const image = document.getElementById("image-user");
    const name = document.getElementById("name-user");
    const email = document.getElementById("email-user");

    name.innerHTML = user_info.utilisateur;
    email.innerHTML = user_info.email;

    if (user_info.gender === 'female'){
        image.innerHTML = '<img src="./assets/avatar_female.svg" alt="Profile Picture" class="avatar-img">';
    }

    if (user_info.gender === 'male'){
        image.innerHTML = '<img src="./assets/avatar_male.svg" alt="Profile Picture" class="avatar-img">';
    }

    populateSettingsForm(user_info);
}

function rendersave(saved_articles) {
    const statone = document.getElementById("saved-article");
    statone.innerHTML = saved_articles;
}

function renderfollowing(following_sources) {
    const stattwo = document.getElementById("following");
    stattwo.innerHTML = following_sources;
}

function renderarticlesRead(articles_read) {
    const statthree = document.getElementById("articles");
    statthree.innerHTML = articles_read;
}

function renderfollowedbuttons(categories){
    const userPreferences = categories[0].preferences.split(', ');
    console.log(userPreferences);
    const buttons = document.getElementsByClassName("test");

    for (let i = 0; i < buttons.length; i++) {
        const buttonText = buttons[i].textContent.trim();
        console.log('Checking button:', buttonText);
        
        if (userPreferences.includes(buttonText)) {
            console.log('Match found for:', buttonText);
            buttons[i].closest('.category-tag').classList.add('selected');
        }
    }
}

function savePreferences() {
    const selectedButtons = document.querySelectorAll('.category-tag.selected .test');
    const selectedCategories = [];
    
    selectedButtons.forEach(button => {
        selectedCategories.push(button.textContent.trim());
    });

    console.log('Selected categories:', selectedCategories);

    if (selectedCategories.length === 0) {
        alert('Please select at least one category');
        return;
    }

    // Send to API
    fetch('http://localhost:3000/api/settings/preferences-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            preferences: selectedCategories
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(`${selectedCategories.length} categories saved successfully!`);
        } else {
            alert('Error saving preferences: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving preferences. Please try again.');
    });
}

function toggleCategory(button) {
    button.classList.toggle('selected');
    console.log('Category toggled:', button.textContent.trim());
}

function initializeProfileTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function disableAccount() {
    const confirmed = confirm('Continuing will delete all your settings and data including preferences, saved items and history');
    
    if (!confirmed) {
        return;
    }

    const deleteBtn = document.querySelector('.danger-btn');
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Disabling...';
    deleteBtn.disabled = true;

    fetch('http://localhost:3000/api/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Your account has been disabled successfully. The app will close');
            
            window.close();
            
        } else {
            alert('Error disabling account: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error disabling account. Please try again.');
    })
    .finally(() => {
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
    });
}