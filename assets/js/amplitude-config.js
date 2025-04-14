/**
 * Utility di configurazione di AmplitudeJS per l'audio guida di Regalbuto
 */
const AudioPlayerManager = (function() {
    // Oggetto per tenere traccia dello stato di riproduzione
    const audioState = {
        currentPlayer: null,
        isPlaying: false,
        pausedPlayer: null,
        needsRestart: false,
        currentSong: null,
        currentPlaylist: null
    };
    
    // Lingua corrente
    let currentLang = localStorage.getItem('preferredLanguage') || 'it';
    
    // Espone un metodo di inizializzazione che verrà chiamato da main.js dopo il caricamento dei dati
    function initialize(tourData) {
        if (!tourData || !tourData.tour) {
            console.error('Dati del tour non validi per l\'inizializzazione di Amplitude');
            return;
        }
        
        console.log('Inizializzazione di Amplitude con i dati dal JSON', tourData);
        
        // Usa la lingua corrente dalla memorizzazione locale o dal language manager 
        if (window.LanguageManager) {
            currentLang = window.LanguageManager.getCurrentLanguage();
        }
        
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
            
        // Ascolta per i cambi di lingua
        document.addEventListener('audioLanguageChanged', function(event) {
            if (event.detail && event.detail.language && event.detail.tourData) {
                updateAudioLanguage(event.detail.language, event.detail.tourData);
            }
        });
    }
    
    /**
     * Aggiorna i file audio quando cambia la lingua
     */
    function updateAudioLanguage(lang, tourData) {
        console.log(`Aggiornamento lingua audio a: ${lang}`);
        currentLang = lang;
        
        if (!tourData || !tourData.tour || !tourData.tour.content || !tourData.tour.content[lang]) {
            console.error(`Dati per la lingua ${lang} non disponibili`);
            return;
        }
        
        // Recupera i dati della nuova lingua
        const langData = tourData.tour.content[lang];
        const introData = langData.introduction;
        
        if (!introData || !introData.audioPath) {
            console.error('Dati dell\'introduzione non validi o percorso audio mancante');
            return;
        }
        
        // RESET COMPLETO 1: Pausa qualsiasi riproduzione in corso
        try {
            Amplitude.pause();
        } catch(e) {
            console.warn("Errore durante la pausa dell'audio:", e);
        }
        
        // RESET COMPLETO 2: Reset dello stato del player
        audioState.isPlaying = false;
        audioState.pausedPlayer = null;
        
        // Memorizza i percorsi originali degli audio per ripristinarli dopo
        const originalPaths = {
            intro: introData.audioPath, // Store the correct original intro path
            stops: []
        };
        
        if (Array.isArray(langData.stops)) {
            langData.stops.forEach(stop => {
                if (stop && stop.audioPath) {
                    originalPaths.stops.push(stop.audioPath);
                } else {
                    originalPaths.stops.push(null);
                }
            });
        }
        
        console.log("Percorsi audio originali memorizzati:", originalPaths);
        
        // RICARICAMENTO RADICALE: Reinizializza completamente Amplitude con i nuovi audio
        try {
            console.log("Inizio reinizializzazione completa di Amplitude...");
            
            // 1. Prepara i nuovi dati per la reinizializzazione
            let episodiSongs = [];
            if (Array.isArray(langData.stops)) {
                episodiSongs = langData.stops.map((stop, index) => {
                    // Aggiungi un parametro nocache per forzare il ricaricamento
                    const audioPath = stop.audioPath ? 
                        stop.audioPath + (stop.audioPath.includes('?') ? '&' : '?') + 'nocache=' + Date.now() + index : 
                        null;
                    
                    console.log(`Preparando tappa ${index + 1}: ${stop.title} - Audio: ${audioPath}`);
                    
                    return {
                        "name": stop.title || `Tappa ${index + 1}`,
                        "artist": "Audio guida di Regalbuto",
                        "url": audioPath, // Use path with nocache for re-init
                        "visual_id": `episode-${index}`,
                        "index": index
                    };
                }).filter(song => song.url);
            }
            
            // 2. Configurazione aggiornata con i nuovi percorsi audio
            // Ensure the intro path also gets nocache for re-init
            const introAudioPath = introData.audioPath + (introData.audioPath.includes('?') ? '&' : '?') + 'nocache=' + Date.now();
            console.log(`Preparando intro con audio: ${introAudioPath}`);
            
            const config = {
                "songs": [
                    {
                        "name": langData.title || "Introduzione",
                        "artist": "Audio guida di Regalbuto",
                        "url": introAudioPath // Use intro path with nocache for re-init
                    }
                ],
                "playlists": {
                    "episodi": {
                        "songs": episodiSongs
                    }
                },
                "volume": 75,
                "debug": true
            };
            
            // 3. Reinizializza Amplitude con i nuovi dati
            if (typeof Amplitude !== 'undefined') {
                // Prima fermiamo e rimuoviamo l'audio corrente
                try {
                    const audioElement = Amplitude.getAudio();
                    if (audioElement) {
                        audioElement.pause();
                        audioElement.currentTime = 0;
                        audioElement.src = '';
                        audioElement.load();
                    }
                    
                    console.log("Audio element resettato");
                } catch(e) {
                    console.warn("Errore nel reset dell'elemento audio:", e);
                }
                
                // Distruggi l'istanza di Amplitude se possibile
                if (typeof Amplitude.destroy === 'function') {
                    try {
                        Amplitude.destroy();
                        console.log("Istanza Amplitude distrutta");
                    } catch(e) {
                        console.warn("Errore nella distruzione dell'istanza Amplitude (potrebbe non essere supportato):", e);
                    }
                }
                
                // Piccolo ritardo per assicurarsi che tutto sia pulito prima di reinizializzare
                setTimeout(() => {
                    try {
                        Amplitude.init(config);
                        console.log("Amplitude reinizializzato con successo con i nuovi audio");
                        
                        // Reinizializza tutti i player dopo il reset completo
                        initializePlayers(); // This will re-run setupCustomAudioControls
                        console.log("Player audio reinizializzati");
                        
                        // Ripristina i percorsi originali nella configurazione *running* instance
                        // per evitare l'accumulo di parametri nocache
                        const currentSongs = Amplitude.getSongs();
                        if (currentSongs && currentSongs.length > 0) {
                            currentSongs[0].url = originalPaths.intro; // Restore original intro path
                            console.log(`Ripristinato URL intro originale: ${originalPaths.intro}`);
                        }
                        
                        const currentPlaylists = Amplitude.getConfig().playlists;
                        if (currentPlaylists &&
                            currentPlaylists.episodi &&
                            Array.isArray(currentPlaylists.episodi.songs)) {
                            
                            const playlistSongs = currentPlaylists.episodi.songs;
                            
                            for (let i = 0; i < playlistSongs.length; i++) {
                                if (i < originalPaths.stops.length && originalPaths.stops[i]) {
                                    playlistSongs[i].url = originalPaths.stops[i]; // Restore original stop path
                                }
                            }
                            console.log("Ripristinati URL tappe originali.");
                        }
                        
                        // Emetti evento di aggiornamento completato
                        document.dispatchEvent(new CustomEvent('audioFilesUpdated', {
                            detail: { language: lang }
                        }));
                        
                        console.log("Aggiornamento lingua audio completato con successo");
                    } catch(e) {
                        console.error("Errore nella reinizializzazione di Amplitude:", e);
                    }
                }, 300);
            } else {
                console.error('Libreria AmplitudeJS non trovata durante il tentativo di reinizializzazione');
            }
        } catch (error) {
            console.error('Errore generale nell\'aggiornamento della lingua audio:', error);
        }
    }
    
    /**
     * Funzione handler separata per gestire il click sui pulsanti player
     * Estratta per evitare duplicazioni e rendere più facile il debug
     */
    function handlePlayerClick(e) {
        e.stopPropagation(); // Impedisci la propagazione dell'evento
        
        const button = this;
        const playerId = button.getAttribute('data-player-id');
        const playlist = button.getAttribute('data-amplitude-playlist');
        // Use nullish coalescing for index in case the attribute is missing (main player)
        const index = parseInt(button.getAttribute('data-amplitude-song-index') ?? '-1');
        
        console.log(`Click su player: ${playerId}, stato corrente: isPlaying=${audioState.isPlaying}, currentPlayer=${audioState.currentPlayer}, pausedPlayer=${audioState.pausedPlayer}, playlist=${playlist}, index=${index}`);
        
        try {
            // --- CASO 1: Player corrente in riproduzione viene cliccato (PAUSA) ---
            if (audioState.currentPlayer === playerId && audioState.isPlaying) {
                Amplitude.pause();
                audioState.isPlaying = false;
                audioState.pausedPlayer = playerId; // Memorizza quale player è stato messo in pausa
                updatePlayerVisualState(button, false);
                console.log(`Player messo in pausa: ${playerId}`);
            }
            // --- CASO 2: Player messo in pausa viene cliccato (RIPRENDI) ---
            // Verifica se è lo stesso player E se l'indice/playlist corrisponde a quello in pausa
            else if (playerId === audioState.pausedPlayer &&
                     ((playlist === null && audioState.currentPlaylist === null) || // Intro player
                      (playlist === audioState.currentPlaylist && index === audioState.currentSong))) // Playlist player
            {
                Amplitude.play();
                audioState.isPlaying = true;
                audioState.currentPlayer = playerId;
                audioState.pausedPlayer = null; // Non è più in pausa
                updatePlayerVisualState(button, true);
                console.log(`Player ripreso da pausa: ${playerId}`);
            }
            // --- CASO 3: Nuovo player viene cliccato (AVVIO) ---
            else {
                // Se un altro player è attivo (in play o in pausa), fermalo e resetta la sua UI
                if (audioState.isPlaying || audioState.pausedPlayer) {
                    Amplitude.pause();
                    if (audioState.currentPlayer) {
                        const prevPlayerButton = document.querySelector(`[data-player-id="${audioState.currentPlayer}"]`);
                        if (prevPlayerButton) {
                            updatePlayerVisualState(prevPlayerButton, false);
                        }
                    }
                    // Reset completo dell'audio precedente se necessario
                    try {
                        // Non resettare currentTime qui, potrebbe interrompere la ripresa
                        // Amplitude.getAudio().currentTime = 0;
                    } catch(e) {
                        console.warn('Impossibile resettare la posizione audio', e);
                    }
                }
                
                // Avvia questo player dall'inizio
                if (playlist === null) {
                    // --- Player Principale (Introduzione) ---
                    console.log('Avvio player principale (Introduzione)');
                    // Assicurati di suonare SEMPRE la canzone all'indice 0
                    Amplitude.playSongAtIndex(0);
                    audioState.currentPlaylist = null;
                    audioState.currentSong = null; // Indice 0 della lista principale, non playlist
                } else {
                    // --- Player della Playlist ---
                    console.log(`Avvio episodio: playlist=${playlist}, index=${index}`);
                    const success = playPlaylistSongWithFallback(index, playlist);
                    
                    if (success) {
                        audioState.currentPlaylist = playlist;
                        audioState.currentSong = index;
                    } else {
                        console.error(`Impossibile riprodurre la tappa ${index + 1}`);
                        alert('Si è verificato un problema con la riproduzione dell\'audio. Prova a ricaricare la pagina.');
                        return; // Esci se la riproduzione fallisce
                    }
                }
                
                // Aggiorna lo stato globale
                audioState.currentPlayer = playerId;
                audioState.isPlaying = true;
                audioState.pausedPlayer = null; // Resetta il player in pausa
                
                updatePlayerVisualState(button, true);
                console.log(`Nuovo player avviato: ${playerId}`);
            }
        } catch (error) {
            console.error(`Errore nella gestione del player ${playerId}:`, error);
        }
    }
    
    /**
     * Funzione specializzata per riprodurre una canzone della playlist
     * con un meccanismo di fallback robusto
     */
    function playPlaylistSongWithFallback(index, playlist) {
        console.log(`Tentativo di riproduzione robusto: playlist=${playlist}, index=${index}`);
        
        // Verifica che la playlist e l'indice siano validi
        if (!Amplitude.getConfig().playlists || 
            !Amplitude.getConfig().playlists[playlist] || 
            !Amplitude.getConfig().playlists[playlist].songs || 
            index >= Amplitude.getConfig().playlists[playlist].songs.length) {
            console.error('Playlist o indice non validi');
            return false;
        }
        
        // Ottieni i dati della canzone dalla configurazione *corrente* di Amplitude
        const song = Amplitude.getConfig().playlists[playlist].songs[index];
        if (!song || !song.url) {
            console.error('Canzone non valida o URL mancante');
            return false;
        }
        
        // Non aggiungere nocache qui, dovrebbe essere già stato gestito durante l'init/update
        const songUrl = song.url;
        console.log(`Riproduzione canzone: ${song.name}, URL: ${songUrl}`);
        
        try {
            // Metodo standard di Amplitude
            Amplitude.playPlaylistSongAtIndex(index, playlist);
            console.log('Riproduzione avviata tramite metodo standard');
            return true;
        } catch (e) {
            console.warn('Fallimento del metodo standard, provo con il fallback (potrebbe non essere necessario):', e);
            
            // Fallback: Manipolazione diretta dell'elemento audio (meno ideale)
            const audioElement = Amplitude.getAudio();
            if (audioElement) {
                audioElement.pause();
                audioElement.src = songUrl; // Usa l'URL corretto dalla config
                audioElement.load();
                console.log(`File audio caricato con URL: ${songUrl}`);
                
                setTimeout(() => {
                    const playPromise = audioElement.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log('Riproduzione avviata con successo tramite fallback');
                            // Tentativo di aggiornare il contesto interno di Amplitude
                            try {
                                // Questo potrebbe non essere affidabile o necessario
                                // Amplitude.setActivePlaylist(playlist);
                                // Amplitude.setActiveIndex(index);
                            } catch (err) {
                                console.warn('Impossibile aggiornare il contesto di Amplitude via fallback:', err);
                            }
                        }).catch(err => {
                            console.error('Errore durante la riproduzione via fallback:', err);
                        });
                    }
                }, 300);
                return true; // Ritorna true anche se il fallback potrebbe fallire async
            }
        }
        
        console.error('Impossibile avviare la riproduzione con entrambi i metodi.');
        return false;
    }
    
    /**
     * Reset completo dello stato visuale di tutti i player audio
     * Assicura che tutti i pulsanti siano in stato "pausa" dopo un cambio lingua
     * e riconfigura gli event listener per assicurarsi che funzionino dopo il cambio lingua
     */
    function resetAllPlayerButtonStates() {
        console.log('Reset dello stato di tutti i player audio e riconfigurazione dei controlli');
        
        // Reset dello stato audio interno
        audioState.isPlaying = false;
        audioState.pausedPlayer = null;
        
        // Reset del player principale
        const mainButton = document.querySelector('[data-amplitude-main-play-pause="true"]');
        if (mainButton) {
            updatePlayerVisualState(mainButton, false);
            // Riconfigura il pulsante principale
            setupPlayerButton(mainButton, null, null);
            console.log('Pulsante principale riconfigurato');
        }
        
        // Reset e riconfigurazione di tutti i player della playlist
        document.querySelectorAll('.amplitude-play-pause[data-amplitude-playlist]').forEach(button => {
            updatePlayerVisualState(button, false);
            
            // Riconfigura ogni pulsante con i propri event listener
            const playlist = button.getAttribute('data-amplitude-playlist');
            const songIndex = parseInt(button.getAttribute('data-amplitude-song-index'));
            
            if (!isNaN(songIndex)) {
                // Rimuovi eventuali event listener precedenti sostituendo l'elemento
                const newButton = button.cloneNode(true);
                if (button.parentNode) {
                    button.parentNode.replaceChild(newButton, button);
                    
                    // Riconfigura il nuovo pulsante
                    setupPlayerButton(newButton, playlist, songIndex);
                    console.log(`Pulsante per playlist=${playlist}, index=${songIndex} riconfigurato`);
                }
            }
        });
        
        // Reset di tutti i contenitori player
        document.querySelectorAll('.amplitude-player, .modern-audio-player').forEach(player => {
            player.classList.remove('amplitude-playing');
            player.classList.add('amplitude-paused');
        });
        
        console.log('Reset e riconfigurazione dei player audio completati');
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
        // Assegna un ID univoco al pulsante se non ne ha già uno
        // Questo è cruciale per il corretto funzionamento dopo il cambio di lingua
        let playerId = button.getAttribute('data-player-id');
        if (!playerId) {
            if (playlist === null) {
                playerId = 'main-player';
            } else {
                playerId = `playlist-${playlist}-song-${index}`;
            }
            button.setAttribute('data-player-id', playerId);
            console.log(`Assegnato ID player: ${playerId}`);
        }
        
        // Inizializza correttamente lo stato visivo (icona play visibile, icona pause nascosta)
        const playIcon = button.querySelector('.amplitude-play');
        const pauseIcon = button.querySelector('.amplitude-pause');
        
        if (playIcon && pauseIcon) {
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
        }
        
        // Rimuovi eventuali vecchi event listener
        button.removeEventListener('click', handlePlayerClick);
        
        // Aggiungi l'event listener con riferimento diretto alla funzione
        button.addEventListener('click', handlePlayerClick);
        
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
        updatePlayerVisualState: updatePlayerVisualState, // Espone questa funzione per aggiornare lo stato visivo
        updateAudioLanguage: updateAudioLanguage // Espone la funzione per aggiornare la lingua dell'audio
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

// Ascoltiamo l'evento di cambio lingua per aggiornare i file audio
document.addEventListener('audioLanguageChanged', function(event) {
    console.log('Evento audioLanguageChanged ricevuto');
    
    if (event.detail && event.detail.language && event.detail.tourData) {
        AudioPlayerManager.updateAudioLanguage(event.detail.language, event.detail.tourData);
    } else {
        console.error('Evento audioLanguageChanged ricevuto senza dati validi');
    }
});
