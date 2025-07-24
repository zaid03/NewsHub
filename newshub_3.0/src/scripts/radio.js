// Global radio state management
window.globalRadioState = window.globalRadioState || {
    currentAudio: null,
    currentStation: null,
    isPlaying: false,
    volume: 50
};

class RadioPlayer {
    constructor() {
        this.currentAudio = window.globalRadioState.currentAudio;
        this.currentPlayButton = null;
        this.radioStations = [];
        this.currentStation = window.globalRadioState.currentStation;
        this.init();
    }

    async init() {
        try {
            await this.fetchRadioStations();
            this.renderRadioStations();
            this.restorePlayingState();
        } catch (error) {
            this.showError();
        }
    }

    restorePlayingState() {
        // Restore the playing state if there's currently playing audio
        if (window.globalRadioState.isPlaying && window.globalRadioState.currentStation) {
            const stationCard = document.querySelector(`[data-station-id="${window.globalRadioState.currentStation.id}"]`);
            if (stationCard) {
                const playButton = stationCard.querySelector('.play-btn');
                const playText = playButton.querySelector('.play-text');
                const volumeSlider = stationCard.querySelector('.volume-slider');
                
                // Update button state
                playButton.classList.add('playing');
                playText.innerHTML = '<i class="fa fa-stop"></i>';
                this.currentPlayButton = playButton;
                
                // Update volume slider
                if (volumeSlider) {
                    volumeSlider.value = window.globalRadioState.volume;
                    const volumeLabel = volumeSlider.nextElementSibling;
                    if (volumeLabel) {
                        volumeLabel.textContent = window.globalRadioState.volume + '%';
                    }
                }
            }
        }
    }

    async fetchRadioStations() {
        const response = await fetch('http://localhost:3000/api/radio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch radio stations');
        }

        const data = await response.json();
        
        if (data.success) {
            this.radioStations = data.radio;
        } else {
            throw new Error(data.message || 'Failed to load radio stations');
        }
    }

    renderRadioStations() {
        const loadingElement = document.getElementById('loading');
        const containerElement = document.getElementById('radio-container');
        
        loadingElement.style.display = 'none';
        
        if (this.radioStations.length === 0) {
            containerElement.innerHTML = '<p class="no-stations">No radio stations available.</p>';
            return;
        }

        containerElement.innerHTML = this.radioStations.map(station => 
            this.createRadioCard(station)
        ).join('');

        this.attachEventListeners();
    }

    createRadioCard(station) {
        const imagePath = `./assets/radios/${station.photo}`;
        return `
            <div class="radio-card" data-station-id="${station.id}">
                <div class="radio-header">
                    <img src="${imagePath}" alt="${station.name}" class="radio-photo" 
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="radio-photo error" style="display: none;">IMG</div>
                    <div class="radio-info">
                        <h3>${this.escapeHtml(station.name)}</h3>
                        <span class="radio-genre">${this.escapeHtml(station.genre)}</span>
                    </div>
                </div>
                <div class="radio-description">
                    ${this.escapeHtml(station.description)}
                </div>
                <div class="radio-controls">
                    <button class="play-btn" data-url="${station.link}" data-name="${this.escapeHtml(station.name)}">
                        <span class="play-text">
                            <i class="fa fa-play"></i>
                            <i class="fa fa-stop" style="display: none;"></i>
                            <i class="fa fa-spinner fa-spin" style="display: none;"></i>
                        </span>
                    </button>
                    <div class="volume-control">
                        <input type="range" min="0" max="100" value="50" class="volume-slider">
                        <span class="volume-label">50%</span>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Play button listeners
        document.querySelectorAll('.play-btn').forEach(button => {
            button.addEventListener('click', (e) => this.togglePlay(e));
        });

        // Volume control listeners
        document.querySelectorAll('.volume-slider').forEach(slider => {
            slider.addEventListener('input', (e) => this.updateVolume(e));
        });
    }

    togglePlay(event) {
        const button = event.currentTarget;
        const url = button.dataset.url;
        const name = button.dataset.name;
        const playText = button.querySelector('.play-text');
        const stationCard = button.closest('.radio-card');
        const stationId = stationCard.dataset.stationId;

        // Check if there's already audio playing (from global state)
        if (window.globalRadioState.isPlaying && window.globalRadioState.currentAudio) {
            if (window.globalRadioState.currentStation && window.globalRadioState.currentStation.id == stationId) {
                // Stop current audio (same station)
                this.stopAudio();
                return;
            } else {
                // Stop current and play new (different station)
                this.stopAudio();
            }
        }

        // Play new audio
        this.playAudio(url, button, name);
        
    }

    playAudio(url, button, name) {
        try {
            // Stop any existing audio first
            if (window.globalRadioState.currentAudio) {
                window.globalRadioState.currentAudio.pause();
                window.globalRadioState.currentAudio = null;
            }

            const newAudio = new Audio(url);
            window.globalRadioState.currentAudio = newAudio;
            this.currentAudio = newAudio;
            this.currentPlayButton = button;
            
            const playIcon = button.querySelector('.fa-play');
            const stopIcon = button.querySelector('.fa-stop');
            const spinnerIcon = button.querySelector('.fa-spinner');
            const volumeSlider = button.closest('.radio-card').querySelector('.volume-slider');
            const stationCard = button.closest('.radio-card');
            const stationId = stationCard.dataset.stationId;
            const station = this.radioStations.find(s => s.id == stationId);

            // Update global state
            window.globalRadioState.currentStation = station;
            window.globalRadioState.isPlaying = true;
            window.globalRadioState.volume = parseInt(volumeSlider.value);
            this.currentStation = station;

            // Update global controller with more complete station info
            if (window.globalRadioController) {
                window.globalRadioController.updateCurrentStation(station, true);
            }
            
            // Also update localStorage directly to ensure it's available immediately
            localStorage.setItem('currentRadioStation', JSON.stringify({
                station: station,
                isPlaying: true,
                volume: parseInt(volumeSlider.value)
            }));
            
            // Set initial volume
            newAudio.volume = volumeSlider.value / 100;
            
            // Update button state
            button.classList.add('playing');
            
            // Event listeners for audio
            newAudio.addEventListener('loadstart', () => {
                if (playIcon && stopIcon && spinnerIcon) {
                    playIcon.style.display = 'none';
                    stopIcon.style.display = 'none';
                    spinnerIcon.style.display = 'inline-block';
                }
            });
            
            newAudio.addEventListener('canplay', () => {
                if (playIcon && stopIcon && spinnerIcon) {
                    playIcon.style.display = 'none';
                    stopIcon.style.display = 'inline-block';
                    spinnerIcon.style.display = 'none';
                }
            });
            
            newAudio.addEventListener('error', (e) => {
                console.error('Audio error:', e);
                this.stopAudio();
                alert('Failed to load radio stream. Please try another station.');
            });
            
            newAudio.addEventListener('ended', () => {
                this.stopAudio();
            });
            
            // Start playing
            newAudio.play().catch(error => {
                console.error('Play error:', error);
                this.stopAudio();
                alert('Failed to play radio stream. Please try again.');
            });

            sessionStorage.setItem('currentRadio', JSON.stringify({
                name: station.name,
                genre: station.genre,
                url: url,
                isPlaying: true,
                volume: parseInt(volumeSlider.value)
            }));
            
        } catch (error) {
            console.error('Error creating audio:', error);
            this.stopAudio();
            alert('Failed to create audio player.');
        }
    }

    stopAudio() {
        console.log('stopAudio called'); // Debug log
        
        // Update global controller
        if (window.globalRadioController && window.globalRadioState.currentStation) {
            window.globalRadioController.updateCurrentStation(window.globalRadioState.currentStation, false);
        }
        
        // Stop the global audio
        if (window.globalRadioState.currentAudio) {
            window.globalRadioState.currentAudio.pause();
            window.globalRadioState.currentAudio.currentTime = 0;
            window.globalRadioState.currentAudio = null;
            console.log('Global audio stopped'); // Debug log
        }
        
        // Reset global state
        window.globalRadioState.isPlaying = false;
        window.globalRadioState.currentStation = null;
        
        // Reset local references
        this.currentAudio = null;
        this.currentStation = null;
        
        // Update UI - find and reset all playing buttons
        document.querySelectorAll('.play-btn.playing').forEach(button => {
            const playText = button.querySelector('.play-text');
            button.classList.remove('playing');
            
            if (playText) {
                playText.innerHTML = '<i class="fa fa-play"></i>';
                console.log('Button icon changed to play'); // Debug log
            }
        });
        
        this.currentPlayButton = null;
        
        // Update localStorage
        localStorage.removeItem('currentRadioStation');
        sessionStorage.removeItem('currentRadio');
    }

    updateVolume(event) {
        const slider = event.target;
        const volumeLabel = slider.nextElementSibling;
        const volume = slider.value;
        
        volumeLabel.textContent = volume + '%';
        
        // Update global state
        window.globalRadioState.volume = parseInt(volume);
        
        // Update current audio volume
        if (window.globalRadioState.currentAudio) {
            window.globalRadioState.currentAudio.volume = volume / 100;
        }
        
        // Also update local reference if it exists
        if (this.currentAudio) {
            this.currentAudio.volume = volume / 100;
        }
    }

    showError() {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        if (errorElement) {
            errorElement.style.display = 'block';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the radio player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the radio page (check if radio container exists)
    if (document.getElementById('radio-container')) {
        new RadioPlayer();
        // Initialize the polling system
        window.lastKnownRadioData = sessionStorage.getItem('currentRadio');
        console.log('Radio.js: Initialized polling system with:', window.lastKnownRadioData);
    }
});

// Cleanup function to prevent multiple audio instances
window.addEventListener('beforeunload', () => {
    // Audio will continue playing, but we ensure proper state management
    console.log('Page unloading, audio state preserved');
});

// Also add a visibility change handler to sync state when returning to the page
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page became visible again, sync the UI with global state
        setTimeout(() => {
            if (window.globalRadioState.isPlaying && window.globalRadioState.currentStation) {
                const stationCard = document.querySelector(`[data-station-id="${window.globalRadioState.currentStation.id}"]`);
                if (stationCard) {
                    const playButton = stationCard.querySelector('.play-btn');
                    const playText = playButton.querySelector('.play-text');
                    
                    if (playButton && !playButton.classList.contains('playing')) {
                        playButton.classList.add('playing');
                        if (playText) {
                            playText.innerHTML = '<i class="fa fa-stop"></i>';
                        }
                    }
                }
            }
        }, 100); // Small delay to ensure DOM is ready
    }
});

// Listen for sessionStorage changes from mini player
window.addEventListener('storage', (e) => {
    if (e.key === 'currentRadio') {
        console.log('Radio.js: Detected sessionStorage change from mini player');
        handleMiniPlayerCommand(e.newValue);
    }
});

// Also check for sessionStorage changes using polling (for same-tab changes)
setInterval(() => {
    const currentStorageData = sessionStorage.getItem('currentRadio');
    if (currentStorageData !== window.lastKnownRadioData) {
        // console.log('Radio.js: Detected sessionStorage change (same-tab)', 'New:', currentStorageData, 'Old:', window.lastKnownRadioData);
        handleMiniPlayerCommand(currentStorageData);
        window.lastKnownRadioData = currentStorageData;
    }
}, 500);

function handleMiniPlayerCommand(newValue) {
    // console.log('Radio.js: handleMiniPlayerCommand called with:', newValue);
    
    if (!document.getElementById('radio-container')) {
        // console.log('Radio.js: Not on radio page, ignoring command');
        return;
    }
    
    if (!newValue) {
        console.log('Radio.js: Stop command received from mini player');
        // Radio was stopped via mini player
        if (window.globalRadioState.currentAudio) {
            console.log('Radio.js: Stopping current audio');
            window.globalRadioState.currentAudio.pause();
            window.globalRadioState.currentAudio = null;
            window.globalRadioState.isPlaying = false;
            window.globalRadioState.currentStation = null;
            
            // Update UI
            const playingButton = document.querySelector('.play-btn.playing');
            if (playingButton) {
                console.log('Radio.js: Updating UI button state');
                playingButton.classList.remove('playing');
                const playText = playingButton.querySelector('.play-text');
                if (playText) {
                    playText.innerHTML = '<i class="fa fa-play"></i>';
                }
            }
        } else {
            console.log('Radio.js: No current audio to stop');
        }
        return;
    }
    
    try {
        const radioData = JSON.parse(newValue);
        
        // Handle volume changes
        if (window.globalRadioState.currentAudio && radioData.volume !== undefined) {
            window.globalRadioState.currentAudio.volume = radioData.volume / 100;
            window.globalRadioState.volume = radioData.volume;
            
            // Update volume slider on radio page
            const volumeSlider = document.querySelector('.volume-slider');
            if (volumeSlider) {
                volumeSlider.value = radioData.volume;
                const volumeLabel = volumeSlider.nextElementSibling;
                if (volumeLabel) {
                    volumeLabel.textContent = radioData.volume + '%';
                }
            }
        }
        
        // Handle play/pause changes
        if (window.globalRadioState.currentAudio) {
            if (radioData.isPlaying && window.globalRadioState.currentAudio.paused) {
                window.globalRadioState.currentAudio.play();
                window.globalRadioState.isPlaying = true;
            } else if (!radioData.isPlaying && !window.globalRadioState.currentAudio.paused) {
                window.globalRadioState.currentAudio.pause();
                window.globalRadioState.isPlaying = false;
            }
        }
        
    } catch (error) {
        console.error('Radio.js: Error parsing mini player command:', error);
    }
}

