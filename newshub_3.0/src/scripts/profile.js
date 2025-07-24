const { stat } = require("original-fs");
const { use } = require("react");

function loadContentDynimically() {
    const user_id = sessionStorage.getItem("user_id");

    if (!user_id) {
      console.error("User ID not found");
      return;
    }

    fetch('http://localhost:3000/api/settings/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('user info:', data);
            const user_info = data.user_info[0];
            renderuserinto(user_info);
        } else {
            console.error('Error:', data.message);
        }
    })
    .catch(error => {
        alert('Error selecting user_info. Please try again.');
    });

    fetch('http://localhost:3000/api/settings/saved_Articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('user info:', data);
            const saved_articles = data.articles;
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
        body: JSON.stringify({ user_id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('user info:', data);
            const following_sources = data.sources;
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
        body: JSON.stringify({ user_id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('user info:', data);
            const articles_read = data.history;
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
        body: JSON.stringify({ user_id })
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

function rendersave(saved_articles){
    const statone = document.getElementById("saved-article");

    if (saved_articles.length > 0) {
        statone.innerHTML = saved_articles[0]["count(100)"];
    } else {
        statone.innerHTML = 0;
    }
}

function renderfollowing(following_sources){
    const stattwo = document.getElementById("following");

    if (following_sources.length > 0) {
        stattwo.innerHTML = following_sources[0]["count(100)"];
    } else {
        stattwo.innerHTML = 0;
    }
}

function renderarticlesRead(articles_read){
    const statthree = document.getElementById("articles");

    if (articles_read.length > 0) {
        statthree.innerHTML = articles_read[0]["count(*)"];
    } else {
        statthree.innerHTML = 0;
    }
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
    const user_id = sessionStorage.getItem("user_id");
    
    if (!user_id) {
        alert('Please log in to save preferences');
        return;
    }

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
            user_id: user_id,
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

function populateSettingsForm(user_info) {
    const displayNameInput = document.getElementById('display-name');
    const emailInput = document.getElementById('email');
    
    if (displayNameInput) {
        displayNameInput.value = user_info.utilisateur || '';
    }
    
    if (emailInput) {
        emailInput.value = user_info.email || '';
    }
}
function updateUserInfo(){
    const user_id = sessionStorage.getItem("user_id");
    
    if (!user_id) {
        alert('Please log in to update your information');
        return;
    }

    const name = document.getElementById('display-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!name || !email) {
        alert('Name and email are required');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }

    if (password && password.trim() !== '') {
        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match. Please make sure both password fields are identical.');
            return;
        }
    }

    const saveBtn = document.querySelector('.save-settings-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    const requestBody = {
        user_id: user_id,
        name: name,
        email: email
    };

    if (password && password.trim() !== '') {
        requestBody.password = password;
    }

    fetch('http://localhost:3000/api/settings/user-info-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Your information has been updated successfully!');
            
            document.getElementById('password').value = '';
            document.getElementById('confirm-password').value = '';
            
            document.getElementById('name-user').textContent = name;
            document.getElementById('email-user').textContent = email;
            
        } else {
            alert('Error updating information: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error updating information. Please try again.');
    })
    .finally(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    });
}

function disableAccount() {
    const user_id = sessionStorage.getItem("user_id");
    
    if (!user_id) {
        alert('Please log in to disable your account');
        return;
    }

    // Confirm action
    const confirmed = confirm('Are you sure you want to disable your account? This action cannot be undone and you will need to contact support to reactivate your account.');
    
    if (!confirmed) {
        return;
    }

    // Show loading
    const deleteBtn = document.querySelector('.danger-btn');
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Disabling...';
    deleteBtn.disabled = true;

    fetch('http://localhost:3000/api/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user_id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Your account has been disabled successfully. You will be logged out.');
            
            sessionStorage.removeItem("user_id");
            window.location.href = "../src/components/login.html";
            
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