let trending = [];
let currentPage = 0;
const itemsPerPage = 4;

document.addEventListener('DOMContentLoaded', () => {
    fetch(`http://localhost:3000/api/trending/bring`, {
        method: 'GET',
        headers: { 'content-type': 'application/json' },
        body: null
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            // console.log("Trending topics fetched successfully:", result.trending);
            trending = result.trending || [];
            renderTrendingTopics();

            setInterval(() => {
                currentPage = (currentPage + 1) % Math.ceil(trending.length / itemsPerPage);
                renderTrendingTopics();
            }, 5000);
        }
    })
    .catch(error => {
        console.error('Error fetching trending topics:', error);
    });

    new MiniRadioController();
    
    // Add debug function to window for testing
    window.testMiniPlayer = function() {
        const testRadioData = {
            name: "Test FM 99.5",
            genre: "Pop Music",
            url: "https://streaming.radio.co/sc1b0a7698/listen",
            isPlaying: true,
            volume: 75
        };
        
        sessionStorage.setItem('currentRadio', JSON.stringify(testRadioData));
        console.log('Test radio data saved to sessionStorage - mini player should appear');
    };
    
    window.clearTestRadio = function() {
        sessionStorage.removeItem('currentRadio');
        console.log('Radio data cleared from sessionStorage');
    };
});

function renderTrendingTopics() {
    const trendingContainer = document.querySelector('.trending-topics');
    if (trendingContainer) {
        const existingItems = trendingContainer.querySelectorAll('li');
        existingItems.forEach(item => item.remove());    

        const startIndex = currentPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentItems = trending.slice(startIndex, endIndex);

        currentItems.forEach(topic => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<a href="${topic.link}" class="article-link">${topic.title}</a>`;
            trendingContainer.appendChild(listItem);
        });
    }

}

class MiniRadioController {
    constructor() {
        // console.log('MiniRadioController: Starting initialization');
        
        // Wait a bit for DOM to be ready, then try to find elements
        setTimeout(() => {
            this.findElements();
            if (this.miniPlayer && this.placeholder) {
                this.init();
            } else {
                console.error('MiniRadioController: Could not find required elements, retrying...');
                setTimeout(() => {
                    this.findElements();
                    if (this.miniPlayer && this.placeholder) {
                        this.init();
                    } else {
                        console.error('MiniRadioController: Still missing elements after retry');
                    }
                }, 1000);
            }
        }, 100);
    }
    
    findElements() {
        this.miniPlayer = document.getElementById('radio-mini-player');
        this.placeholder = document.getElementById('radio-placeholder');
        this.playBtn = document.getElementById('mini-play-btn');
        this.stopBtn = document.getElementById('mini-stop-btn');
        this.volumeSlider = document.getElementById('mini-volume-slider');
        this.volumeLabel = document.getElementById('mini-volume-label');
        this.stationName = document.getElementById('current-radio-name');
        this.stationGenre = document.getElementById('current-radio-genre');
        
        // Debug: Log which elements were found
        // console.log('MiniRadioController: Elements found:', {
        //     miniPlayer: !!this.miniPlayer,
        //     placeholder: !!this.placeholder,
        //     playBtn: !!this.playBtn,
        //     stopBtn: !!this.stopBtn,
        //     volumeSlider: !!this.volumeSlider,
        //     volumeLabel: !!this.volumeLabel,
        //     stationName: !!this.stationName,
        //     stationGenre: !!this.stationGenre
        // });
        
        this.currentRadioData = null;
        this.lastRadioData = null; // Track last played station
    }

    init() {
        this.attachEventListeners();
        this.checkRadioStatus();
        
        // Check every 1 second for radio updates
        setInterval(() => {
            this.checkRadioStatus();
        }, 1000);
    }

    attachEventListeners() {
        if (this.playBtn) this.playBtn.onclick = () => this.togglePlay();
        if (this.stopBtn) this.stopBtn.onclick = () => this.stopRadio();
        if (this.volumeSlider) this.volumeSlider.oninput = (e) => this.updateVolume(e);
    }

    checkRadioStatus() {
        const radioData = sessionStorage.getItem('currentRadio');
        if (radioData) {
            try {
                const radio = JSON.parse(radioData);
                if (radio.url) this.lastRadioData = radio;
                this.showMiniPlayer(radio);
            } catch (error) {
                sessionStorage.removeItem('currentRadio');
                this.showMiniPlayer({
                    name: 'No station playing',
                    genre: '-',
                    url: '',
                    isPlaying: false,
                    volume: 50
                });
            }
        } else {
            // If we have a last played station with a URL, allow play again
            if (this.lastRadioData && this.lastRadioData.url) {
                this.lastRadioData.isPlaying = false;
                this.showMiniPlayer(this.lastRadioData);
            } else {
                // No last station, show disabled play button
                this.showMiniPlayer({
                    name: 'No station playing',
                    genre: '-',
                    url: '',
                    isPlaying: false,
                    volume: 50
                });
                if (this.playBtn) this.playBtn.disabled = true;
            }
        }
    }

    showMiniPlayer(radio) {
        // console.log('MiniRadioController: Showing mini player with data:', radio);
        
        // Check each element individually
        if (!this.miniPlayer) {
            console.error('MiniRadioController: miniPlayer element not found - looking for #radio-mini-player');
            return;
        }
        if (!this.placeholder) {
            console.error('MiniRadioController: placeholder element not found - looking for #radio-placeholder');
            return;
        }
        
        // console.log('MiniRadioController: All required elements found, proceeding...');
        
        this.miniPlayer.style.display = 'block';
        this.placeholder.style.display = 'none';
        
        // Update station info
        if (this.stationName) this.stationName.textContent = radio.name || 'Unknown Station';
        if (this.stationGenre) this.stationGenre.textContent = radio.genre || 'Unknown Genre';
        if (this.volumeSlider) this.volumeSlider.value = radio.volume || 50;
        if (this.volumeLabel) this.volumeLabel.textContent = (radio.volume || 50) + '%';
        
        // DO NOT CREATE AUDIO HERE - just store the radio data for controls
        this.currentRadioData = radio;
        // Enable/disable play button based on URL
        if (this.playBtn) this.playBtn.disabled = !(radio.url && radio.url.length > 0);
        
        // Update button states based on sessionStorage data
        if (this.playBtn && this.stopBtn) {
            if (radio.isPlaying) {
                this.playBtn.style.display = 'none';
                this.stopBtn.style.display = 'inline-flex';
            } else {
                this.playBtn.style.display = 'inline-flex';
                this.stopBtn.style.display = 'none';
            }
        }
        
        // console.log('MiniRadioController: Mini player displayed successfully (display only, no audio created)');
    }

    hideMiniPlayer() {
        if (!this.miniPlayer || !this.placeholder) return;
        
        this.miniPlayer.style.display = 'none';
        this.placeholder.style.display = 'block';
        
        // Clear radio data reference
        this.currentRadioData = null;
    }

    togglePlay() {
        console.log('MiniRadioController: Play/Pause button clicked');
        // Use lastRadioData if currentRadioData is missing or has no URL
        let radioData = this.currentRadioData;
        if (!radioData || !radioData.url) radioData = this.lastRadioData;
        if (!radioData || !radioData.url) return; // Nothing to play
        // If no audio, create and play
        if (!window.globalRadioState || !window.globalRadioState.currentAudio) {
            const newAudio = new Audio(radioData.url);
            window.globalRadioState = window.globalRadioState || {};
            window.globalRadioState.currentAudio = newAudio;
            window.globalRadioState.isPlaying = true;
            newAudio.volume = (radioData.volume || 50) / 100;
            newAudio.play().then(() => {
                if (this.playBtn) {
                    this.playBtn.style.display = 'none';
                    const playIcon = this.playBtn.querySelector('i');
                    if (playIcon) {
                        playIcon.classList.remove('fa-play');
                        playIcon.classList.add('fa-stop');
                    }
                }
                if (this.stopBtn) this.stopBtn.style.display = 'inline-flex';
                radioData.isPlaying = true;
                sessionStorage.setItem('currentRadio', JSON.stringify(radioData));
                this.lastRadioData = radioData;
            }).catch(error => {
                console.error('MiniRadioController: Error restarting audio:', error);
            });
            return;
        }
        // Normal play/pause control for existing audio
        if (window.globalRadioState.currentAudio.paused) {
            window.globalRadioState.currentAudio.play();
            window.globalRadioState.isPlaying = true;
            if (this.playBtn) {
                this.playBtn.style.display = 'none';
                const playIcon = this.playBtn.querySelector('i');
                if (playIcon) {
                    playIcon.classList.remove('fa-play');
                    playIcon.classList.add('fa-stop');
                }
            }
            if (this.stopBtn) this.stopBtn.style.display = 'inline-flex';
            if (radioData) {
                radioData.isPlaying = true;
                sessionStorage.setItem('currentRadio', JSON.stringify(radioData));
                this.lastRadioData = radioData;
            }
        } else {
            window.globalRadioState.currentAudio.pause();
            window.globalRadioState.isPlaying = false;
            if (this.playBtn) {
                this.playBtn.style.display = 'inline-flex';
                const playIcon = this.playBtn.querySelector('i');
                if (playIcon) {
                    playIcon.classList.remove('fa-stop');
                    playIcon.classList.add('fa-play');
                }
            }
            if (this.stopBtn) this.stopBtn.style.display = 'none';
            if (radioData) {
                radioData.isPlaying = false;
                sessionStorage.setItem('currentRadio', JSON.stringify(radioData));
                this.lastRadioData = radioData;
            }
        }
    }

    stopRadio() {
        console.log('MiniRadioController: Stop button clicked');
        // Directly stop the global audio - simple and direct
        if (window.globalRadioState && window.globalRadioState.currentAudio) {
            console.log('MiniRadioController: Stopping global audio directly');
            window.globalRadioState.currentAudio.pause();
            window.globalRadioState.currentAudio = null;
            window.globalRadioState.isPlaying = false;
            window.globalRadioState.currentStation = null;
        }
        // Clear sessionStorage
        sessionStorage.removeItem('currentRadio');
        console.log('MiniRadioController: Audio stopped and sessionStorage cleared');
        // Change button to play state
        if (this.playBtn) {
            this.playBtn.style.display = 'inline-flex';
            // Change icon to play
            const playIcon = this.playBtn.querySelector('i');
            if (playIcon) {
                playIcon.classList.remove('fa-pause', 'fa-stop');
                playIcon.classList.add('fa-play');
            }
        }
        if (this.stopBtn) this.stopBtn.style.display = 'none';
        // Update current radio data
        if (this.currentRadioData) {
            this.currentRadioData.isPlaying = false;
        }
        // Don't hide mini player - keep it visible so user can restart
        console.log('MiniRadioController: Stop button now shows play button');
    }

    updateVolume(event) {
        const volume = event.target.value;
        if (this.volumeLabel) this.volumeLabel.textContent = volume + '%';
        
        console.log('MiniRadioController: Volume changed to', volume);
        
        // Directly update the global audio volume - simple and direct
        if (window.globalRadioState && window.globalRadioState.currentAudio) {
            window.globalRadioState.currentAudio.volume = volume / 100;
            window.globalRadioState.volume = parseInt(volume);
            console.log('MiniRadioController: Global audio volume updated');
        }
        
        // Update sessionStorage
        if (this.currentRadioData) {
            this.currentRadioData.volume = parseInt(volume);
            sessionStorage.setItem('currentRadio', JSON.stringify(this.currentRadioData));
        }
    }
}