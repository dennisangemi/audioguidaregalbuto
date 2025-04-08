/**
 * Configurazione di AmplitudeJS per l'audio guida di Regalbuto
 */
document.addEventListener('DOMContentLoaded', function() {
    // Configurazione delle tracce audio
    Amplitude.init({
        "songs": [
            {
                "name": "Introduzione a Regalbuto",
                "artist": "Audio guida di Regalbuto",
                "url": "assets/audio/introduzione.mp3", // Assicurati che questo file esista
                "cover_art_url": "assets/images/cover.jpg", // Opzionale
                "visualization": true
            }
        ],
        "playlists": {
            "episodi": {
                "title": "Episodi Audio Guida",
                "songs": [
                    {
                        "name": "Piazza della Repubblica",
                        "artist": "Audio guida di Regalbuto",
                        "url": "assets/audio/test1.mp3", // File audio specificato per Piazza della Repubblica
                        "cover_art_url": "assets/images/piazza.jpg", // Opzionale
                        "visualization": true
                    },
                    {
                        "name": "Palazzo Comunale",
                        "artist": "Audio guida di Regalbuto",
                        "url": "assets/audio/palazzo-comunale.mp3", // Assicurati che questo file esista
                        "cover_art_url": "assets/images/palazzo.jpg", // Opzionale
                        "visualization": true
                    },
                    {
                        "name": "Chiesa Madre S. Basilio",
                        "artist": "Audio guida di Regalbuto",
                        "url": "assets/audio/chiesa-madre.mp3", // Assicurati che questo file esista
                        "cover_art_url": "assets/images/chiesa.jpg", // Opzionale
                        "visualization": true
                    },
                    // Aggiungi qui altre tracce audio per le rimanenti tappe
                ]
            }
        },
        "callbacks": {
            // Callback per quando una canzone inizia a suonare
            'play': function() {
                const songIndex = Amplitude.getActiveSongIndex();
                const fromPlaylist = Amplitude.getActivePlaylist();
                
                // Annuncia allo screen reader che la traccia sta suonando
                announceToScreenReader(`Riproduzione di ${Amplitude.getActiveSongMetadata().name} iniziata`);
                
                // Gestisci la creazione della visualizzazione audio per la traccia corrente
                updateVisualization();
            },
            
            // Callback per quando una canzone viene messa in pausa
            'pause': function() {
                announceToScreenReader(`Riproduzione in pausa`);
            }
        },
        "volume": 75,
        "visualizations": [
            {
                "object": WaveSurfer,
                "params": {
                    "container": "#intro-visualization",
                    "waveColor": "rgba(255, 255, 255, 0.3)",
                    "progressColor": "rgba(255, 255, 255, 0.8)",
                    "height": 70,
                    "responsive": true,
                    "cursorWidth": 0,
                    "barWidth": 2,
                    "barGap": 3
                }
            },
            {
                "object": WaveSurfer,
                "params": {
                    "container": "#piazza-visualization",
                    "waveColor": "rgba(255, 255, 255, 0.3)",
                    "progressColor": "rgba(255, 255, 255, 0.8)",
                    "height": 70,
                    "responsive": true,
                    "cursorWidth": 0,
                    "barWidth": 2,
                    "barGap": 3
                }
            },
            {
                "object": WaveSurfer,
                "params": {
                    "container": "#palazzo-visualization",
                    "waveColor": "rgba(255, 255, 255, 0.3)",
                    "progressColor": "rgba(255, 255, 255, 0.8)",
                    "height": 70,
                    "responsive": true,
                    "cursorWidth": 0,
                    "barWidth": 2,
                    "barGap": 3
                }
            },
            {
                "object": WaveSurfer,
                "params": {
                    "container": "#chiesa-visualization",
                    "waveColor": "rgba(255, 255, 255, 0.3)",
                    "progressColor": "rgba(255, 255, 255, 0.8)",
                    "height": 70,
                    "responsive": true,
                    "cursorWidth": 0,
                    "barWidth": 2,
                    "barGap": 3
                }
            }
        ]
    });
    
    // Controlla che WaveSurfer sia disponibile prima di usarlo
    if (typeof WaveSurfer !== 'undefined') {
        // Inizializza le visualizzazioni una volta che l'audio è pronto
        setupVisualizations();
    }
    
    // Aggiungi miglioramenti per l'accessibilità
    enhanceAccessibility();
    
    // Quando un utente clicca su un punto della timeline, naviga alla traccia corrispondente
    const timelineStops = document.querySelectorAll('.timeline-stop');
    timelineStops.forEach((stop, index) => {
        stop.addEventListener('click', function() {
            // Se abbiamo una traccia corrispondente nella playlist
            if (index < Amplitude.getPlaylistSongs("episodi").length) {
                // Pausa qualsiasi traccia in riproduzione
                if (Amplitude.getPlayerState() === 'playing') {
                    Amplitude.pause();
                }
                
                // Vai alla traccia selezionata nella timeline
                Amplitude.playPlaylistSongAtIndex(index, "episodi");
                
                // Annuncia allo screen reader
                const locationName = this.querySelector('.timeline-stop-label').textContent.trim();
                announceToScreenReader(`Riproduzione di ${locationName} iniziata`);
            }
        });
    });
    
    // Funzione per impostare le visualizzazioni audio
    function setupVisualizations() {
        // Timeout per assicurarsi che gli elementi DOM siano pronti
        setTimeout(() => {
            // Configura le visualizzazioni per ogni traccia
            const visualizationContainers = document.querySelectorAll('.amplitude-visualization');
            visualizationContainers.forEach(container => {
                // Verifica che il container sia pronto
                if (!container.id || !document.getElementById(container.id)) return;
                
                // Crea oggetti per simulare le onde audio anche se non c'è audio caricato
                simulateWaveform(container.id);
            });
        }, 500);
    }
    
    // Funzione per simulare una forma d'onda
    function simulateWaveform(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Crea un canvas per simulare le onde audio
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        // Crea una forma d'onda casuale
        const barCount = Math.floor(canvas.width / 5); // 5px per barra
        const barWidth = 2;
        const gap = 3;
        
        for (let i = 0; i < barCount; i++) {
            const height = Math.random() * canvas.height * 0.8;
            const x = i * (barWidth + gap);
            const y = (canvas.height - height) / 2;
            
            ctx.fillRect(x, y, barWidth, height);
        }
    }
    
    // Funzione per aggiornare la visualizzazione quando cambia la traccia
    function updateVisualization() {
        // In un caso reale, qui aggiorneresti la visualizzazione dell'onda audio
        // Basandoti sulla traccia attuale
    }
    
    // Miglioramenti per l'accessibilità
    function enhanceAccessibility() {
        // Aggiungi ARIA attributes a tutti i controlli del player
        document.querySelectorAll('.amplitude-play-pause').forEach(button => {
            button.setAttribute('role', 'button');
            button.setAttribute('aria-label', 'Riproduci o metti in pausa l\'audio');
            button.setAttribute('tabindex', '0');
            
            // Supporto per tastiera
            button.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
        
        // Aggiungi accessibilità ai controlli del volume
        document.querySelectorAll('.amplitude-volume-slider').forEach(slider => {
            slider.setAttribute('aria-label', 'Controllo volume');
            slider.setAttribute('min', '0');
            slider.setAttribute('max', '100');
            slider.setAttribute('step', '1');
        });
        
        // Aggiungi accessibilità ai controlli della timeline
        document.querySelectorAll('.amplitude-song-slider').forEach(slider => {
            slider.setAttribute('aria-label', 'Posizione di riproduzione');
            slider.setAttribute('role', 'slider');
        });
    }
    
    // Funzione per annunciare messaggi agli screen reader (già presente in main.js)
    function announceToScreenReader(message) {
        let announcer = document.getElementById('sr-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'sr-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.classList.add('sr-only');
            document.body.appendChild(announcer);
        }
        
        announcer.textContent = message;
        setTimeout(() => {
            announcer.textContent = '';
        }, 3000);
    }
    
    // Gestione delle preferenze utente per riduzione movimento
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Riduci o disabilita animazioni per le visualizzazioni
        document.querySelectorAll('.amplitude-visualization').forEach(viz => {
            viz.style.display = 'none';
        });
    }
});
