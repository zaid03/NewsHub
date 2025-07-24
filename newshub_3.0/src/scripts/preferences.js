const cardData = [
    { id: 1, title: "General", Image: "../assets/preferences/generale.jpg"},
    { id: 2, title: "International", Image: "../assets/preferences/internationale.jpg"},
    { id: 3, title: "Local", Image: "../assets/preferences/locale.jpg"},
    { id: 4, title: "Politics", Image: "../assets/preferences/politique.jpg"},
    { id: 5, title: "Business & Business & Finance", Image: "../assets/preferences/economie.jpg"},
    { id: 6, title: "Tech & Innovation", Image: "../assets/preferences/technologie.jpg"},
    { id: 7, title: "Health", Image: "../assets/preferences/sante.jpg"},
    { id: 8, title: "Earth & Universe", Image: "../assets/preferences/Astronomie.jpg"},
    { id: 9, title: "Fashion", Image: "../assets/preferences/La_mode.jpg"},
    { id: 10, title: "Food", Image: "../assets/preferences/Nourriture.jpg"},
    { id: 11, title: "Travel", Image: "../assets/preferences/travel.jpg"},
    { id: 12, title: "Sports", Image: "../assets/preferences/Football.jpg"},
    { id: 12, title: "Gaming", Image: "../assets/preferences/Gaming.jpg"},
    { id: 13, title: "Real Estate", Image: "../assets/preferences/Logement.jpg"},
    { id: 14, title: "Middle East", Image: "../assets/preferences/Moyen-Orient.jpg"},
    { id: 15, title: "Africa", Image: "../assets/preferences/Afrique.jpg"},
    { id: 16, title: "EU", Image: "../assets/preferences/Ue.jpg"},
    { id: 17, title: "US", Image: "../assets/preferences/etat-unis.jpg"},
];

const cardContainer = document.getElementById('card-container');
const submitButton = document.getElementById('submit-selected');
const selectAllButton = document.getElementById('select-all');
const deselectAllButton = document.getElementById('deselect-all');
const selectionInfo = document.getElementById('selection-info');

function createCards() {
    cardData.forEach(item => {
        const cardCol = document.createElement('div');
        cardCol.className = 'col-md-4';
        
        cardCol.innerHTML = `
            <div class="card" data-id="${item.id}">
                <div class="card-body">
                    <h5 class="card-title text-center" style="color: #2c3e50;"> ${item.title}</h5>
                    <img src="${item.Image}" class="card-img-top w-100" style="height: 350px;">
                </div>
            </div>
        `;
        
        cardContainer.appendChild(cardCol);
    });
}

function toggleCardSelection(card) {
    card.classList.toggle('selected');
    updateSelectionInfo();
}

function updateSelectionInfo() {
    const selectedCards = document.querySelectorAll('.card.selected');
    if (selectedCards.length === 0) {
        selectionInfo.textContent = 'No category was elected';
    } else {
        selectionInfo.textContent = `${selectedCards.length}  categories selected`;
    }
}

function getSelectedCardtitles() {
    const selectedCards = document.querySelectorAll('.card.selected');
    return Array.from(selectedCards).map(card => card.dataset.title);
    
}

createCards();

document.addEventListener('click', function(event) {
    const card = event.target.closest('.card');
    if (card) {
        toggleCardSelection(card);
    }
});

selectAllButton.addEventListener('click', function() {
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('selected');
    });
    updateSelectionInfo();
});

deselectAllButton.addEventListener('click', function() {
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('selected');
    });
    updateSelectionInfo();
});

let finalUserId = new URLSearchParams(window.location.search).get('user_id');
console.log("Final User ID from URL:", finalUserId);

submitButton.addEventListener('click', async function () {

    if (!finalUserId) {
        console.error("User ID not found.");
        selectionInfo.textContent = "Connection error, Please try Reconnecting";
        selectionInfo.style.color = "red";
        return;
    }

    const selectedCards = document.querySelectorAll('.card.selected');
    const selectedTopics = Array.from(selectedCards).map(card => {
        const titleElement = card.querySelector('.card-title');
        return titleElement ? titleElement.textContent.trim() : null;
    }).filter(title => title !== null);

    if (selectedTopics.length === 0) {
        console.error("No topics selected.");
        selectionInfo.textContent = "Select atleast one category";
        selectionInfo.style.color = "red";
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/pref', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: finalUserId,
                preferences: selectedTopics,
            }),
        });

        const data = await response.json();
        console.log("Server response:", data);

        if (data.success) {
            console.log("Preferences saved successfully!");
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('navigate-to', './src/components/login.html');
        } else {
            selectionInfo.textContent = data.message || "Error";
            selectionInfo.style.color = "red";
        }
    } catch (error) {
        console.error("Error during preferences submission:", error);
        selectionInfo.textContent = "Server";
        selectionInfo.style.color = "red";
    }
});