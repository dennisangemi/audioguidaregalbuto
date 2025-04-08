/**
 * Configurazione di AmplitudeJS per l'audio guida di Regalbuto
 */
document.addEventListener('DOMContentLoaded', function() {
    // Oggetto per tenere traccia dello stato di riproduzione
    const audioState = {
        currentPlayer: null,
        isPlaying: false,
        pausedPlayer: null,       // Memorizza quale player è stato messo in pausa
        needsRestart: false       // Indica se occorre riavviare dall'inizio o riprendere
    };
    
    // Configurazione base di Amplitude
    Amplitude.init({
        "songs": [
            {
                "name": "Introduzione a Regalbuto",
                "artist": "Audio guida di Regalbuto",
                "url": "assets/audio/test1.mp3"
            }
        ],
        "playlists": {
            "episodi": {
                "songs": [
                    {
                        "name": "Piazza della Repubblica",
                        "artist": "Audio guida di Regalbuto",
                        "url": "assets/audio/test1.mp3"
                    },
                    {
                        "name": "Palazzo Comunale",
                        "artist": "Audio guida di Regalbuto",
                        "url": "assets/audio/test1.mp3"
                    },
                    {
                        "name": "Chiesa Madre S. Basilio",
                        "artist": "Audio guida di Regalbuto", 
                        "url": "assets/audio/test1.mp3"
                    }
                ]
            }
        },
        "volume": 75,
        "callbacks": {
            'initialized': function() {
                // Inizializza i player dopo che Amplitude è pronto
                initializePlayers();
            }
        }
    });
    
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
    
    // Aggiungi eventi per gestire i cambi di stato da controlli esterni (es. timeline)
    document.querySelectorAll('.timeline-stop').forEach((stop, index) => {
        stop.addEventListener('click', function() {
            if (index < Amplitude.getPlaylistSongs("episodi").length) {
                // Prima ferma qualsiasi riproduzione in corso
                if (audioState.isPlaying) {
                    // Resetta lo stato visivo del player precedente
                    if (audioState.currentPlayer) {
                        const prevPlayer = document.getElementById(audioState.currentPlayer);
                        if (prevPlayer) {
                            prevPlayer.classList.remove('amplitude-playing');
                            prevPlayer.classList.add('amplitude-paused');
                        }
                    }
                    
                    Amplitude.pause();
                }
                
                audioState.pausedPlayer = null; // Resetta il player in pausa
                
                // Avvia la traccia selezionata
                setTimeout(() => {
                    Amplitude.playPlaylistSongAtIndex(index, "episodi");
                    
                    // Aggiorna lo stato
                    const targetPlayer = document.querySelector(`[data-amplitude-playlist="episodi"][data-amplitude-song-index="${index}"]`);
                    if (targetPlayer) {
                        const playerContainer = targetPlayer.closest('.amplitude-player');
                        audioState.currentPlayer = playerContainer.id;
                        audioState.isPlaying = true;
                        
                        // Aggiorna l'UI
                        playerContainer.classList.add('amplitude-playing');
                        playerContainer.classList.remove('amplitude-paused');
                    }
                }, 50);
            }
        });
    });
    
    // Gestisci il completamento della riproduzione
    Amplitude.events.on('ended', function() {
        console.log('Riproduzione completata');
        // Reimposta lo stato dopo che la traccia è terminata
        if (audioState.currentPlayer) {
            const currentPlayerElement = document.getElementById(audioState.currentPlayer);
            if (currentPlayerElement) {
                currentPlayerElement.classList.remove('amplitude-playing');
                currentPlayerElement.classList.add('amplitude-paused');
            }
        }
        audioState.isPlaying = false;
        audioState.pausedPlayer = null; // La traccia è finita, quindi non c'è più un player in pausa
    });
});
