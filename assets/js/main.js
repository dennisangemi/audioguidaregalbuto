document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Inizializzazione transcription manager');
    
    // Gestione migliorata delle trascrizioni
    const toggleButtons = document.querySelectorAll('.toggle-transcript');
    console.log(`Trovati ${toggleButtons.length} pulsanti di trascrizione`);
    
    // Mappa ID -> chiave del JSON
    const transcriptMap = {
        'transcript-0': 'introduction',
        'transcript-1': 'stops.0', 
        'transcript-2': 'stops.1',
        'transcript-3': 'stops.2'
    };
    
    // Variabili per tenere traccia dei dati e dello stato di caricamento
    let tourData = null;
    let currentLang = 'it'; // Lingua predefinita
    let dataLoaded = false;
    const loadedIds = {};
    
    // Precarica il file JSON con tutte le informazioni dell'audioguida
    fetch('assets/data/audioguide.json')
        .then(response => {
            console.log(`Risposta ricevuta con stato: ${response.status} per il file dell'audioguida`);
            if (!response.ok) {
                throw new Error(`Errore nel caricamento (${response.status}: ${response.statusText})`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Dati dell\'audioguida caricati correttamente', data);
            tourData = data;
            dataLoaded = true;
            
            // Quando i dati sono caricati, inizializziamo anche l'interfaccia
            initializeInterface();
            
            // Notifica ad amplitude-config.js che i dati sono pronti
            const audioguideDataEvent = new CustomEvent('audioguideDataLoaded', {
                detail: { tourData: data }
            });
            document.dispatchEvent(audioguideDataEvent);
        })
        .catch(error => {
            console.error('Errore nel caricamento dei dati dell\'audioguida:', error);
        });
    
    // Funzione per popolare l'interfaccia con i dati dal JSON
    function initializeInterface() {
        if (!tourData || !tourData.tour || !tourData.tour.content || !tourData.tour.content[currentLang]) {
            console.error('Dati non validi o struttura JSON non corretta');
            return;
        }
        
        // Accediamo ai dati della lingua corretta
        const langData = tourData.tour.content[currentLang];
        const introData = langData.introduction;
        
        // Aggiorna titolo e descrizione dell'introduzione
        document.querySelectorAll('.amplitude-track-title[data-amplitude-main-song-info="true"]').forEach(el => {
            el.textContent = langData.title || 'Introduzione';
        });
        
        document.querySelectorAll('.amplitude-track-author[data-amplitude-main-song-info="true"]').forEach(el => {
            el.textContent = 'Audio guida di Regalbuto';
        });
        
        // Aggiorna le informazioni per ogni fermata del tour
        if (langData.stops && Array.isArray(langData.stops)) {
            langData.stops.forEach((stop, index) => {
                if (!stop || !stop.id) return;
                
                // Converti l'ID con underscore in ID con trattino per il DOM
                const articleId = stop.id.replace('_', '-');
                const article = document.getElementById(articleId);
                
                if (article) {
                    // Aggiorna titolo e descrizione
                    const titleEl = article.querySelector(`#title-${articleId}`);
                    const descEl = article.querySelector('.text-gray-600');
                    
                    if (titleEl) titleEl.textContent = stop.title;
                    if (descEl) descEl.textContent = stop.description;
                    
                    // Aggiorna icona se disponibile tramite staticData
                    const iconEl = article.querySelector('.episode-icon i');
                    if (iconEl && tourData.tour.staticData && tourData.tour.staticData.stops) {
                        const staticStop = tourData.tour.staticData.stops.find(s => s.id === stop.id);
                        if (staticStop && staticStop.icon) {
                            iconEl.className = '';
                            iconEl.classList.add('fas', staticStop.icon);
                        }
                    }
                    
                    // Aggiorna le informazioni nel player
                    const trackTitleEl = article.querySelector(`.amplitude-track-title[data-amplitude-playlist="episodi"][data-amplitude-song-index="${index}"]`);
                    const trackAuthorEl = article.querySelector(`.amplitude-track-author[data-amplitude-playlist="episodi"][data-amplitude-song-index="${index}"]`);
                    
                    if (trackTitleEl) trackTitleEl.textContent = stop.title;
                    if (trackAuthorEl) trackAuthorEl.textContent = 'Audio guida di Regalbuto';
                }
            });
        }
        
        // Aggiorna il contenuto della trascrizione dell'introduzione
        const introTranscriptEl = document.getElementById('transcript-0');
        if (introTranscriptEl && introData && introData.transcription) {
            const contentDiv = introTranscriptEl.querySelector('.text-gray-700');
            if (contentDiv && introData.transcription.paragraphs) {
                contentDiv.innerHTML = introData.transcription.paragraphs
                    .map(p => `<p>${p}</p>`)
                    .join('');
            }
        }
    }
        
    // Pre-inizializza tutti i contenitori di trascrizioni per evitare problemi di layout
    document.querySelectorAll('.transcript-container').forEach(container => {
        container.classList.remove('expanded');
        container.setAttribute('aria-hidden', 'true');
        
        container.style.display = 'none';
        container.style.opacity = '0';
    });
    
    toggleButtons.forEach(button => {
        const targetId = button.getAttribute('data-target');
        const transcriptContainer = document.getElementById(targetId);
        
        console.log(`Inizializzazione pulsante per ${targetId}: ${transcriptContainer ? 'container trovato' : 'container NON trovato'}`);
        
        if (transcriptContainer && transcriptContainer.classList.contains('expanded')) {
            updateButtonState(button, true);
            transcriptContainer.style.display = 'block';
            transcriptContainer.style.opacity = '1';
        }
        
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const transcriptContainer = document.getElementById(targetId);
            
            console.log(`Click sul pulsante trascrizione per ${targetId}`);
            
            if (!transcriptContainer) {
                console.error('Target transcript container not found:', targetId);
                return;
            }
            
            const willExpand = !transcriptContainer.classList.contains('expanded');
            console.log(`Stato trascrizione: ${willExpand ? 'espandere' : 'contrarre'}`);
            
            transcriptContainer.classList.toggle('expanded');
            
            if (willExpand) {
                transcriptContainer.style.display = 'block';
                
                setTimeout(() => {
                    transcriptContainer.style.opacity = '1';
                    transcriptContainer.style.maxHeight = '500px';
                    transcriptContainer.style.padding = '1.25rem';
                }, 10); 
                
                console.log(`Espansione di ${targetId} - display: ${transcriptContainer.style.display}`);
            } else {
                transcriptContainer.style.opacity = '0';
                transcriptContainer.style.maxHeight = '0';
                transcriptContainer.style.padding = '0';
                
                setTimeout(() => {
                    transcriptContainer.style.display = 'none';
                }, 500);
                
                console.log(`Contrazione di ${targetId}`);
            }
            
            updateButtonState(this, willExpand);
            transcriptContainer.setAttribute('aria-hidden', !willExpand);
            
            if (willExpand && !loadedIds[targetId]) {
                const jsonPath = transcriptMap[targetId];
                
                console.log(`Tentativo di recuperare contenuto per il percorso: ${jsonPath}`);
                
                if (!jsonPath) {
                    console.error(`Nessuna trascrizione mappata per l'ID: ${targetId}`);
                    return;
                }
                
                const contentDiv = transcriptContainer.querySelector('.space-y-4');
                if (!contentDiv) {
                    console.error(`Contenitore del contenuto (.space-y-4) non trovato in: ${targetId}`);
                    return;
                }
                
                contentDiv.innerHTML = '<p class="text-center"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Caricamento trascrizione...</p>';
                
                function renderTranscription() {
                    if (!dataLoaded || !tourData || !tourData.tour) {
                        contentDiv.innerHTML = '<p class="text-red-600">I dati dell\'audioguida non sono disponibili.</p>';
                        return;
                    }
                    
                    let transcription;
                    if (jsonPath === 'introduction') {
                        transcription = tourData.tour.introduction.transcription;
                    } else if (jsonPath.startsWith('stops.')) {
                        const index = parseInt(jsonPath.split('.')[1]);
                        if (index >= 0 && index < tourData.tour.stops.length) {
                            transcription = tourData.tour.stops[index].transcription;
                        }
                    }
                    
                    if (!transcription || !transcription.paragraphs || transcription.paragraphs.length === 0) {
                        contentDiv.innerHTML = '<p class="text-red-600">Trascrizione non trovata o formato errato.</p>';
                        return;
                    }
                    
                    const paragraphs = transcription.paragraphs
                        .map(p => `<p>${p}</p>`)
                        .join('');
                    
                    contentDiv.innerHTML = paragraphs;
                    
                    if (jsonPath.startsWith('stops.')) {
                        const index = parseInt(jsonPath.split('.')[1]);
                        const stop = tourData.tour.stops[index];
                        
                        if (stop) {
                            const titleEl = document.createElement('h3');
                            titleEl.className = 'text-lg font-bold mb-3';
                            titleEl.textContent = stop.title;
                            contentDiv.prepend(titleEl);
                            
                            const footerEl = document.createElement('div');
                            footerEl.className = 'mt-4 pt-3 border-t border-gray-200 text-sm text-gray-500';
                            
                            if (stop.duration) {
                                const durationEl = document.createElement('p');
                                durationEl.innerHTML = `<i class="fas fa-clock mr-2"></i>Durata: ${stop.duration}`;
                                footerEl.appendChild(durationEl);
                            }
                            
                            if (stop.googleMapsUrl) {
                                const mapLinkEl = document.createElement('p');
                                mapLinkEl.className = 'mt-1';
                                mapLinkEl.innerHTML = `<i class="fas fa-map-marker-alt mr-2"></i><a href="${stop.googleMapsUrl}" target="_blank" class="text-blue-600 hover:underline">Visualizza su Google Maps</a>`;
                                footerEl.appendChild(mapLinkEl);
                            }
                            
                            contentDiv.appendChild(footerEl);
                        }
                    }
                    
                    loadedIds[targetId] = true;
                    
                    announceToScreenReader('Trascrizione caricata');
                }
                
                if (dataLoaded) {
                    renderTranscription();
                } else {
                    const checkInterval = setInterval(() => {
                        if (dataLoaded) {
                            clearInterval(checkInterval);
                            renderTranscription();
                        }
                    }, 100);
                    
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        if (!dataLoaded) {
                            contentDiv.innerHTML = '<p class="text-red-600">Timeout nel caricamento dei dati.</p>';
                        }
                    }, 5000);
                }
            }
        });
    });
    
    function updateButtonState(button, isExpanded) {
        const toggleIcon = button.querySelector('.toggle-icon');
        const buttonText = button.querySelector('span');
        
        console.log(`Aggiornamento stato pulsante: ${isExpanded ? 'espanso' : 'contratto'}`);
        
        button.setAttribute('aria-expanded', isExpanded);
        
        if (toggleIcon) {
            if (isExpanded) {
                toggleIcon.classList.add('rotate-icon');
            } else {
                toggleIcon.classList.remove('rotate-icon');
            }
        }
        
        if (buttonText) {
            buttonText.textContent = isExpanded ? 'Nascondi trascrizione' : 'Mostra trascrizione completa';
        }
    }
    
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
});

// Implementazione dei controlli avanti/indietro di 15 secondi
document.addEventListener('DOMContentLoaded', function() {
    // Gestione dei pulsanti di avanzamento rapido (+15s) e riavvolgimento (-15s)
    function setupTimeControls() {
        const forwardButtons = document.querySelectorAll('.forward-15');
        const backwardButtons = document.querySelectorAll('.backward-15');
        
        // Avanti di 15 secondi
        forwardButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Impedisce che il click si propaghi al bottone play/pause
                
                const songIndex = this.getAttribute('data-amplitude-song-index');
                const playlist = this.getAttribute('data-amplitude-playlist');
                
                // Ottieni la posizione attuale in secondi
                let currentSeconds = 0;
                
                if (playlist) {
                    currentSeconds = Amplitude.getPlaylistSongPlayedSeconds(playlist, songIndex);
                    const duration = Amplitude.getPlaylistSongDuration(playlist, songIndex);
                    
                    // Calcola la nuova posizione (avanti di 15 secondi, ma non oltre la durata)
                    const newPosition = Math.min(currentSeconds + 15, duration);
                    
                    // Imposta la nuova posizione
                    Amplitude.setPlaylistSongPlayedPercentage(playlist, songIndex, (newPosition / duration) * 100);
                    
                    // Aggiorna la posizione visiva del cursore
                    updateProgressUI(playlist, songIndex, (newPosition / duration) * 100);
                }
            });
        });
        
        // Indietro di 15 secondi
        backwardButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Impedisce che il click si propaghi al bottone play/pause
                
                const songIndex = this.getAttribute('data-amplitude-song-index');
                const playlist = this.getAttribute('data-amplitude-playlist');
                
                // Ottieni la posizione attuale in secondi
                let currentSeconds = 0;
                
                if (playlist) {
                    currentSeconds = Amplitude.getPlaylistSongPlayedSeconds(playlist, songIndex);
                    const duration = Amplitude.getPlaylistSongDuration(playlist, songIndex);
                    
                    // Calcola la nuova posizione (indietro di 15 secondi, ma non sotto zero)
                    const newPosition = Math.max(currentSeconds - 15, 0);
                    
                    // Imposta la nuova posizione
                    Amplitude.setPlaylistSongPlayedPercentage(playlist, songIndex, (newPosition / duration) * 100);
                    
                    // Aggiorna la posizione visiva del cursore
                    updateProgressUI(playlist, songIndex, (newPosition / duration) * 100);
                }
            });
        });
    }
    
    // Funzione per aggiornare l'interfaccia utente della progress bar
    function updateProgressUI(playlist, songIndex, percentage) {
        // Trova il container della progress bar relativo a questo specifico player
        const selector = `.player-progress-container input[data-amplitude-playlist="${playlist}"][data-amplitude-song-index="${songIndex}"]`;
        const rangeInput = document.querySelector(selector);
        
        if (rangeInput) {
            const container = rangeInput.closest('.player-progress-container');
            const progressBar = container.querySelector('.player-progress');
            const handle = container.querySelector('.player-progress-handle');
            
            // Aggiorna la larghezza della barra di avanzamento
            progressBar.style.width = percentage + '%';
            
            // Aggiorna la posizione del cursore
            handle.style.left = percentage + '%';
        }
    }
    
    // Funzione per sincronizzare il progress bar con lo stato di Amplitude
    function setupProgressSync() {
        // Ascolta gli eventi di aggiornamento del tempo di Amplitude
        Amplitude.bind('time_update', function() {
            const currentPlaylist = Amplitude.getActivePlaylist();
            if (currentPlaylist) {
                const currentSong = Amplitude.getActiveIndexInPlaylist(currentPlaylist);
                const percentage = Amplitude.getSongPlayedPercentage();
                
                updateProgressUI(currentPlaylist, currentSong, percentage);
            }
        });
        
        // Configura gli slider per essere interattivi
        document.querySelectorAll('.player-progress-container').forEach(container => {
            const slider = container.querySelector('input[type="range"]');
            const progressBar = container.querySelector('.player-progress');
            const handle = container.querySelector('.player-progress-handle');
            
            if (slider) {
                // Quando l'utente clicca o tocca la barra di avanzamento
                container.addEventListener('click', function(e) {
                    if (e.target === slider) return; // Gestiamo già questa interazione tramite l'input range
                    
                    const rect = container.getBoundingClientRect();
                    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                    
                    const playlist = slider.getAttribute('data-amplitude-playlist');
                    const songIndex = slider.getAttribute('data-amplitude-song-index');
                    
                    if (playlist && songIndex !== null) {
                        Amplitude.setPlaylistSongPlayedPercentage(playlist, songIndex, percentage);
                        updateProgressUI(playlist, songIndex, percentage);
                    }
                });
                
                // Quando l'utente trascina lo slider
                slider.addEventListener('input', function() {
                    const percentage = this.value;
                    const playlist = this.getAttribute('data-amplitude-playlist');
                    const songIndex = this.getAttribute('data-amplitude-song-index');
                    
                    progressBar.style.width = percentage + '%';
                    handle.style.left = percentage + '%';
                });
                
                // Quando l'utente rilascia lo slider
                slider.addEventListener('change', function() {
                    const percentage = this.value;
                    const playlist = this.getAttribute('data-amplitude-playlist');
                    const songIndex = this.getAttribute('data-amplitude-song-index');
                    
                    if (playlist && songIndex !== null) {
                        Amplitude.setPlaylistSongPlayedPercentage(playlist, songIndex, percentage);
                    }
                });
            }
        });
    }
    
    // Imposta un intervallo per aggiornare tutte le progress bar periodicamente (per sicurezza)
    function setupProgressInterval() {
        setInterval(function() {
            const currentPlaylist = Amplitude.getActivePlaylist();
            
            if (currentPlaylist) {
                const currentSong = Amplitude.getActiveIndexInPlaylist(currentPlaylist);
                const percentage = Amplitude.getSongPlayedPercentage();
                
                updateProgressUI(currentPlaylist, currentSong, percentage);
            }
        }, 1000);
    }
    
    // Inizializza i controlli dopo che Amplitude è stato completamente caricato
    document.addEventListener('amplitude-ready', function() {
        console.log('Amplitude pronto, inizializzo i controlli avanzati');
        setupTimeControls();
        setupProgressSync();
        setupProgressInterval();
    });
    
    // Emettere un evento personalizzato quando Amplitude è pronto
    if (typeof Amplitude !== 'undefined') {
        document.dispatchEvent(new Event('amplitude-ready'));
    } else {
        // Attendere che Amplitude sia disponibile e poi emettere l'evento
        let checkAmplitude = setInterval(function() {
            if (typeof Amplitude !== 'undefined') {
                clearInterval(checkAmplitude);
                document.dispatchEvent(new Event('amplitude-ready'));
            }
        }, 100);
        
        // Timeout di sicurezza
        setTimeout(function() {
            clearInterval(checkAmplitude);
        }, 10000);
    }
});