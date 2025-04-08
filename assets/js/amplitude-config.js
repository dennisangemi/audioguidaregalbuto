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
     * Crea una visualizzazione a forma d'onda migliorata e più accattivante
     * Il design è più avanzato per il player dell'hero
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
        
        // Personalizzazione speciale per il player dell'hero
        if (isHero) {
            // Crea un effetto di onde sonore dinamico e più moderno
            const drawHeroWaveform = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Gradiente per le onde
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
                ctx.fillStyle = gradient;
                
                const time = Date.now() * 0.001; // tempo in secondi per l'animazione
                const barCount = Math.floor(canvas.width / 3);
                const barWidth = 2;
                const gap = 1;
                
                for (let i = 0; i < barCount; i++) {
                    // Crea onde con effetto sinusoide multiplo
                    const x = i * (barWidth + gap);
                    let amplitude = 0;
                    
                    // Somma di più onde sinusoidali con frequenze diverse
                    amplitude += Math.sin((i / barCount * 5) + time) * 0.3;
                    amplitude += Math.sin((i / barCount * 3) + time * 0.7) * 0.2;
                    amplitude += Math.sin((i / barCount * 7) + time * 1.3) * 0.1;
                    amplitude /= 0.6; // normalizza
                    
                    // Aggiungi variazione casuale ma uniforme
                    amplitude *= (0.8 + Math.sin(i * 0.2) * 0.2);
                    
                    // Limitare l'ampiezza
                    amplitude = Math.min(Math.max(0.2, amplitude + 0.5), 0.9);
                    
                    const height = amplitude * canvas.height * 0.8;
                    const y = (canvas.height - height) / 2;
                    
                    // Disegno delle barre con bordi arrotondati
                    ctx.beginPath();
                    ctx.roundRect(x, y, barWidth, height, 1);
                    ctx.fill();
                }
                
                // Continua l'animazione
                requestAnimationFrame(drawHeroWaveform);
            };
            
            // Avvia l'animazione solo per il player dell'hero
            drawHeroWaveform();
            
            // Aggiunta di effetto particellare in background
            addBackgroundParticles(canvas, ctx);
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
    
    /**
     * Aggiunge effetto particellare al background del player hero
     */
    function addBackgroundParticles(canvas, ctx) {
        const particles = [];
        const particleCount = 30;
        
        // Crea particelle
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
        
        // Funzione di animazione
        const animateParticles = () => {
            // Overlay semitrasparente per creare effetto trail
            ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Disegna e aggiorna ogni particella
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fill();
                
                // Aggiorna posizione
                p.x += p.speedX;
                p.y += p.speedY;
                
                // Bounce sulle pareti
                if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
                if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
            });
            
            requestAnimationFrame(animateParticles);
        };
        
        // Avvia animazione
        animateParticles();
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
