/**
 * Utility di configurazione di AmplitudeJS per l'audio guida di Regalbuto
 */
const AudioPlayerManager = (function() {
    // Oggetto per tenere traccia dello stato di riproduzione
    const audioState = {
        currentPlayer: null,
        isPlaying: false,
        pausedPlayer: null,
        needsRestart: false
    };
    
    // Espone un metodo di inizializzazione che verrà chiamato da main.js dopo il caricamento dei dati
    function initialize(tourData) {
        if (!tourData || !tourData.tour) {
            console.error('Dati del tour non validi per l\'inizializzazione di Amplitude');
            return;
        }
        
        console.log('Inizializzazione di Amplitude con i dati dal JSON', tourData);
        
        // Configurazione di Amplitude basata sui dati JSON
        const config = {
            "songs": [
                {
                    "name": tourData.tour.introduction.title,
                    "artist": tourData.tour.introduction.author,
                    "url": tourData.tour.introduction.audioPath
                }
            ],
            "playlists": {
                "episodi": {
                    "songs": tourData.tour.stops.map(stop => ({
                        "name": stop.title,
                        "artist": stop.author,
                        "url": stop.audioPath
                    }))
                }
            },
            "volume": 75,
            "callbacks": {
                'initialized': function() {
                    // Inizializza i player dopo che Amplitude è pronto
                    initializePlayers();
                }
            }
        };
        
        // Inizializza Amplitude con la configurazione generata
        if (typeof Amplitude !== 'undefined') {
            try {
                Amplitude.init(config);
                console.log("AmplitudeJS inizializzato con successo");
            } catch (e) {
                console.error("Errore nell'inizializzazione di AmplitudeJS:", e);
            }
        } else {
            console.error('Libreria AmplitudeJS non trovata');
        }
    }
    
    /**
     * Inizializza tutti i player audio con gestione degli eventi personalizzata
     */
    function initializePlayers() {
        // Crea le visualizzazioni per i player
        setupWaveforms();
        
        // Rimuovi TUTTI gli event listener predefiniti di Amplitude dai pulsanti
        removeDefaultAmplitudeListeners();
        
        // Aggiungi i nostri event listener personalizzati
        setupCustomAudioControls();
        
        // Inizializza tutti i player in stato di pausa
        document.querySelectorAll('.amplitude-player').forEach(player => {
            player.classList.add('amplitude-paused');
            player.classList.remove('amplitude-playing');
        });
    }
    
    /**
     * Configura i controlli audio personalizzati
     */
    function setupCustomAudioControls() {
        // Gestisci il player principale
        const mainButton = document.querySelector('[data-amplitude-main-play-pause="true"]');
        if (mainButton) {
            setupPlayerButton(mainButton, null, null);
        }
        
        // Gestisci i player della playlist
        document.querySelectorAll('[data-amplitude-playlist]').forEach(button => {
            const playlist = button.getAttribute('data-amplitude-playlist');
            const songIndex = parseInt(button.getAttribute('data-amplitude-song-index'));
            setupPlayerButton(button, playlist, songIndex);
        });
    }
    
    /**
     * Configura un singolo pulsante player
     */
    function setupPlayerButton(button, playlist, index) {
        const playerContainer = button.closest('.amplitude-player');
        const playerId = playerContainer.id;
        
        button.addEventListener('click', function() {
            console.log(`Click su player: ${playerId}, stato corrente: isPlaying=${audioState.isPlaying}, currentPlayer=${audioState.currentPlayer}, pausedPlayer=${audioState.pausedPlayer}`);
            
            // Se questo player è attualmente in riproduzione
            if (audioState.currentPlayer === playerId && audioState.isPlaying) {
                // Metti in pausa la riproduzione
                Amplitude.pause();
                audioState.isPlaying = false;
                audioState.pausedPlayer = playerId; // Memorizza quale player è stato messo in pausa
                
                playerContainer.classList.remove('amplitude-playing');
                playerContainer.classList.add('amplitude-paused');
                console.log(`Player messo in pausa: ${playerId}`);
            } 
            // Se è lo stesso player che era stato messo in pausa
            else if (playerId === audioState.pausedPlayer) {
                // Riprendi la riproduzione da dove era stata interrotta
                Amplitude.play();
                audioState.isPlaying = true;
                audioState.currentPlayer = playerId;
                
                playerContainer.classList.add('amplitude-playing');
                playerContainer.classList.remove('amplitude-paused');
                console.log(`Player ripreso da pausa: ${playerId}`);
            }
            // Se è un player diverso o il primo avvio
            else {
                // Se un altro player è in riproduzione, fermalo prima
                if (audioState.isPlaying) {
                    Amplitude.pause();
                    // Trova il player precedente e resetta il suo stato visivo
                    if (audioState.currentPlayer) {
                        const prevPlayer = document.getElementById(audioState.currentPlayer);
                        if (prevPlayer) {
                            prevPlayer.classList.remove('amplitude-playing');
                            prevPlayer.classList.add('amplitude-paused');
                        }
                    }
                }
                
                // Avvia questo player dall'inizio
                if (playlist === null) {
                    // Player principale
                    Amplitude.stop(); // Ferma completamente prima di riavviare
                    setTimeout(() => {
                        Amplitude.play();
                    }, 50);
                } else {
                    // Player della playlist
                    Amplitude.stop(); // Ferma completamente prima di riavviare
                    setTimeout(() => {
                        Amplitude.playPlaylistSongAtIndex(index, playlist);
                    }, 50);
                }
                
                // Aggiorna lo stato
                audioState.currentPlayer = playerId;
                audioState.isPlaying = true;
                audioState.pausedPlayer = null; // Resetta il player in pausa
                
                playerContainer.classList.add('amplitude-playing');
                playerContainer.classList.remove('amplitude-paused');
                console.log(`Nuovo player avviato: ${playerId}`);
            }
        });
    }
    
    /**
     * Rimuove gli event listener predefiniti di Amplitude
     */
    function removeDefaultAmplitudeListeners() {
        document.querySelectorAll('.amplitude-play-pause').forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
    }
    
    /**
     * Configura le visualizzazioni delle onde audio
     */
    function setupWaveforms() {
        document.querySelectorAll('.amplitude-visualization').forEach(element => {
            if (element.id) {
                createSimpleWaveform(element.id);
            }
        });
    }
    
    /**
     * Crea una semplice visualizzazione a forma d'onda
     */
    function createSimpleWaveform(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth || 300;
        canvas.height = container.clientHeight || 80;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        // Crea una forma d'onda estetica
        const barCount = Math.floor(canvas.width / 5);
        const barWidth = 2;
        const gap = 3;
        
        for (let i = 0; i < barCount; i++) {
            let heightRatio = Math.sin((i / barCount) * Math.PI * 5) * 0.5 + 0.5;
            heightRatio = Math.min(Math.max(0.1, heightRatio + (Math.random() * 0.3 - 0.15)), 0.95);
            
            const height = heightRatio * canvas.height * 0.8;
            const x = i * (barWidth + gap);
            const y = (canvas.height - height) / 2;
            
            ctx.fillRect(x, y, barWidth, height);
        }
    }
    
    // Espone le funzioni necessarie come API pubblica
    return {
        initialize: initialize,
        getAudioState: function() { return audioState; }
    };
})();

// Ascoltiamo un evento personalizzato che sarà emesso da main.js quando i dati sono pronti
document.addEventListener('audioguideDataLoaded', function(event) {
    if (event.detail && event.detail.tourData) {
        AudioPlayerManager.initialize(event.detail.tourData);
    } else {
        console.error('Evento audioguideDataLoaded ricevuto senza dati validi');
    }
});
