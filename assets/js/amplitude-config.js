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
        
        // Determina la lingua attualmente selezionata (default: italiano)
        const currentLang = 'it'; // In futuro può essere gestito dinamicamente in base alla selezione dell'utente
        
        // Ottieni i dati specifici della lingua
        const langData = tourData.tour.content[currentLang];
        if (!langData) {
            console.error(`Dati per la lingua "${currentLang}" non trovati`);
            return;
        }
        
        // Recupera i dati dell'introduzione dalla lingua corrente
        const introData = langData.introduction;
        if (!introData || !introData.audioPath) {
            console.error('Dati dell\'introduzione non validi o percorso audio mancante');
            return;
        }
        
        console.log('Percorso audio intro:', introData.audioPath);
        
        // Verifica e prepara correttamente i dati degli episodi della playlist
        let episodiSongs = [];
        if (Array.isArray(langData.stops)) {
            console.log(`Trovate ${langData.stops.length} tappe per il tour`);
            
            episodiSongs = langData.stops.map((stop, index) => {
                if (!stop.audioPath) {
                    console.warn(`Tappa ${index + 1} (${stop.title}) non ha un percorso audio valido`);
                }
                
                console.log(`Tappa ${index + 1}: ${stop.title} - Audio: ${stop.audioPath}`);
                
                return {
                    "name": stop.title || `Tappa ${index + 1}`,
                    "artist": "Audio guida di Regalbuto",
                    "url": stop.audioPath,
                    "visual_id": `episode-${index}`,
                    "index": index
                };
            }).filter(song => song.url); // Filtra episodi senza URL audio
        } else {
            console.error('Dati delle tappe non trovati o non validi nel JSON');
        }
        
        // Configurazione di Amplitude basata sui dati JSON
        const config = {
            "songs": [
                {
                    "name": langData.title || "Introduzione",
                    "artist": "Audio guida di Regalbuto",
                    "url": introData.audioPath // Usa direttamente il percorso specificato nel JSON: "assets/audio/it/0_intro.mp3"
                }
            ],
            "playlists": {
                "episodi": {
                    "songs": episodiSongs
                }
            },
            "volume": 75,
            "debug": true, // Abilita il debug per aiutare l'identificazione dei problemi
            "callbacks": {
                'initialized': function() {
                    console.log("AmplitudeJS ha completato l'inizializzazione");
                    
                    // Annuncio che Amplitude è pronto per altri componenti
                    document.dispatchEvent(new CustomEvent('amplitude-ready'));
                    
                    // Inizializza i player dopo che Amplitude è pronto
                    initializePlayers();
                    console.log("Percorso audio introduzione caricato:", introData.audioPath);
                },
                'play': function() {
                    console.log('Amplitude: Evento PLAY');
                },
                'pause': function() {
                    console.log('Amplitude: Evento PAUSE');
                },
                'timeupdate': function() {
                    // Aggiorna la UI per il player attivo
                }
            }
        };
        
        // Verifica se il file audio esiste realmente prima di inizializzare
        console.log('Verifico esistenza del file audio intro:', introData.audioPath);
        
        fetch(introData.audioPath, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    console.log(`File audio dell'intro trovato: ${introData.audioPath}`);
                } else {
                    console.warn(`File audio dell'intro non trovato: ${introData.audioPath}. Utilizzare comunque.`);
                }
                
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
            })
            .catch(error => {
                console.warn(`Errore nella verifica del file audio: ${error}. Tento comunque l'inizializzazione.`);
                
                // Inizializza comunque
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
            });
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
        
        console.log('Players inizializzati');
    }
    
    /**
     * Configura i controlli audio personalizzati
     */
    function setupCustomAudioControls() {
        // Gestisci il player principale
        const mainButton = document.querySelector('[data-amplitude-main-play-pause="true"]');
        if (mainButton) {
            console.log('Configuro il pulsante principale del player');
            setupPlayerButton(mainButton, null, null);
        } else {
            console.error('Pulsante principale non trovato');
        }
        
        // Gestisci i player della playlist
        document.querySelectorAll('.amplitude-play-pause[data-amplitude-playlist]').forEach(button => {
            const playlist = button.getAttribute('data-amplitude-playlist');
            const songIndex = parseInt(button.getAttribute('data-amplitude-song-index'));
            
            if (!isNaN(songIndex)) {
                console.log(`Configuro pulsante player: playlist=${playlist}, songIndex=${songIndex}`);
                setupPlayerButton(button, playlist, songIndex);
            } else {
                console.error(`Indice canzone non valido nel pulsante: ${button.outerHTML}`);
            }
        });
        
        console.log('Controlli audio configurati');
    }
    
    /**
     * Configura un singolo pulsante player
     */
    function setupPlayerButton(button, playlist, index) {
        const playerId = button.getAttribute('data-player-id') || 
                       (button.closest('.amplitude-player') ? button.closest('.amplitude-player').id : 'unknown-player');
        
        // Inizializza correttamente lo stato visivo (icona play visibile, icona pause nascosta)
        const playIcon = button.querySelector('.amplitude-play');
        const pauseIcon = button.querySelector('.amplitude-pause');
        
        if (playIcon && pauseIcon) {
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
        }
        
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Impedisci la propagazione dell'evento
            
            console.log(`Click su player: ${playerId}, stato corrente: isPlaying=${audioState.isPlaying}, currentPlayer=${audioState.currentPlayer}, pausedPlayer=${audioState.pausedPlayer}, playlist=${playlist}, index=${index}`);
            
            try {
                // Se questo player è attualmente in riproduzione
                if (audioState.currentPlayer === playerId && audioState.isPlaying) {
                    // Metti in pausa la riproduzione
                    Amplitude.pause();
                    audioState.isPlaying = false;
                    audioState.pausedPlayer = playerId; // Memorizza quale player è stato messo in pausa
                    
                    updatePlayerVisualState(button, false);
                    console.log(`Player messo in pausa: ${playerId}`);
                } 
                // Se è lo stesso player che era stato messo in pausa
                else if (playerId === audioState.pausedPlayer) {
                    // Riprendi la riproduzione da dove era stata interrotta
                    Amplitude.play();
                    audioState.isPlaying = true;
                    audioState.currentPlayer = playerId;
                    
                    updatePlayerVisualState(button, true);
                    console.log(`Player ripreso da pausa: ${playerId}`);
                }
                // Se è un player diverso o il primo avvio
                else {
                    // Se un altro player è in riproduzione, fermalo prima
                    if (audioState.isPlaying) {
                        Amplitude.pause();
                        
                        // Trova il player precedente e resetta il suo stato visivo
                        if (audioState.currentPlayer) {
                            const prevPlayerButton = document.querySelector(`[data-player-id="${audioState.currentPlayer}"]`);
                            if (prevPlayerButton) {
                                updatePlayerVisualState(prevPlayerButton, false);
                            }
                        }
                    }
                    
                    // Avvia questo player dall'inizio
                    if (playlist === null) {
                        // Player principale
                        console.log('Avvio player principale');
                        Amplitude.play();
                    } else {
                        // Player della playlist
                        console.log(`Avvio episodio: playlist=${playlist}, index=${index}`);
                        Amplitude.playPlaylistSongAtIndex(index, playlist);
                    }
                    
                    // Aggiorna lo stato
                    audioState.currentPlayer = playerId;
                    audioState.isPlaying = true;
                    audioState.pausedPlayer = null; // Resetta il player in pausa
                    
                    updatePlayerVisualState(button, true);
                    console.log(`Nuovo player avviato: ${playerId}`);
                }
            } catch (error) {
                console.error(`Errore nella gestione del player ${playerId}:`, error);
            }
        });
        
        console.log(`Pulsante player configurato: ${playerId}`);
    }
    
    /**
     * Aggiorna lo stato visivo del player
     */
    function updatePlayerVisualState(button, isPlaying) {
        const playerContainer = button.closest('.amplitude-player') || button.closest('.modern-audio-player');
        
        if (playerContainer) {
            if (isPlaying) {
                playerContainer.classList.add('amplitude-playing');
                playerContainer.classList.remove('amplitude-paused');
            } else {
                playerContainer.classList.remove('amplitude-playing');
                playerContainer.classList.add('amplitude-paused');
            }
        }
        
        // Aggiorna le icone all'interno del pulsante
        const playIcon = button.querySelector('.amplitude-play');
        const pauseIcon = button.querySelector('.amplitude-pause');
        
        if (playIcon && pauseIcon) {
            if (isPlaying) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'inline-block';
            } else {
                playIcon.style.display = 'inline-block';
                pauseIcon.style.display = 'none';
            }
            
            // Aggiorna classi CSS per supportare diversi stili
            if (isPlaying) {
                button.classList.add('playing');
                button.classList.remove('paused');
            } else {
                button.classList.remove('playing');
                button.classList.add('paused');
            }
        }
        
        // Forza un reflow del DOM per assicurarsi che le modifiche CSS vengano applicate immediatamente
        void button.offsetWidth;
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
     * Crea una visualizzazione a forma d'onda migliorata e più accattivante
     * Il design è più minimalista per il player dell'hero
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
        
        // Determina se questo è il player dell'hero
        const isHero = containerId === 'intro-visualization';
        
        // Ottieni la larghezza della viewport per adattare le onde audio in base alle dimensioni dello schermo
        const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const isMobile = viewportWidth <= 768;
        const isSmallMobile = viewportWidth <= 480;
        
        // Personalizzazione speciale per il player dell'hero
        if (isHero) {
            // Crea un effetto di onde sonore minimalista
            const drawHeroWaveform = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Gradiente più leggero e minimal per le onde
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
                ctx.fillStyle = gradient;
                
                const time = Date.now() * 0.001; // tempo in secondi per l'animazione
                
                // Adatta la densità delle onde in base alla dimensione dello schermo
                let barWidth = 3;
                let gap = isSmallMobile ? 12 : (isMobile ? 10 : 9);
                
                // Onde più distanziate su mobile per un design pulito
                const barCount = Math.floor(canvas.width / (barWidth + gap));
                
                for (let i = 0; i < barCount; i++) {
                    // Crea onde più semplici
                    const x = i * (barWidth + gap);
                    let amplitude = 0;
                    
                    // Usa meno onde sinusoidali per un aspetto più pulito
                    amplitude += Math.sin((i / barCount * 3) + time * 0.5) * 0.4;
                    amplitude += Math.sin((i / barCount * 1.5) + time * 0.3) * 0.2;
                    amplitude /= 0.6; // normalizza
                    
                    // Meno variazione casuale per un aspetto più ordinato
                    amplitude *= (0.9 + Math.sin(i * 0.1) * 0.1);
                    
                    // Limitare l'ampiezza
                    amplitude = Math.min(Math.max(0.15, amplitude + 0.5), 0.85);
                    
                    const height = amplitude * canvas.height * 0.75;
                    const y = (canvas.height - height) / 2;
                    
                    // Disegno delle barre con bordi completamente arrotondati per un aspetto più morbido
                    ctx.beginPath();
                    ctx.roundRect(x, y, barWidth, height, barWidth / 2);
                    ctx.fill();
                }
                
                // Continua l'animazione
                requestAnimationFrame(drawHeroWaveform);
            };
            
            // Avvia l'animazione solo per il player dell'hero
            drawHeroWaveform();
        } else {
            // Visualizzazione standard per gli altri player
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            
            // Crea una forma d'onda estetica standard
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
    }
    
    // Espone le funzioni necessarie come API pubblica
    return {
        initialize: initialize,
        getAudioState: function() { return audioState; },
        setupPlayerButton: setupPlayerButton, // Espone questa funzione per permettere di configurare nuovi pulsanti dinamicamente
        updatePlayerVisualState: updatePlayerVisualState // Espone questa funzione per aggiornare lo stato visivo
    };
})();

// Ascoltiamo un evento personalizzato che sarà emesso da main.js quando i dati sono pronti
document.addEventListener('audioguideDataLoaded', function(event) {
    console.log('Evento audioguideDataLoaded ricevuto');
    
    if (event.detail && event.detail.tourData) {
        AudioPlayerManager.initialize(event.detail.tourData);
    } else {
        console.error('Evento audioguideDataLoaded ricevuto senza dati validi');
    }
});
