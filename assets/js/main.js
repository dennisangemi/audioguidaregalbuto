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
        'transcript-3': 'stops.2',
        'transcript-4': 'stops.3',
        'transcript-5': 'stops.4',
        'transcript-6': 'stops.5',
        'transcript-7': 'stops.6',
        'transcript-8': 'stops.7',
        'transcript-9': 'stops.8',
        'transcript-10': 'stops.9'
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
        
        // Generiamo dinamicamente la timeline
        generateTimelineStops(langData.stops, tourData.tour.staticData?.stops);
        
        // Aggiorniamo il contenitore principale con gli episodi
        generateEpisodeCards(langData.stops, tourData.tour.staticData?.stops);
        
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
    
    // Funzione per generare la timeline dinamicamente
    function generateTimelineStops(stops, staticStops) {
        const timelineContainer = document.querySelector('.timeline-stops');
        if (!timelineContainer || !stops || !Array.isArray(stops)) {
            console.error('Container timeline o dati delle tappe non trovati');
            return;
        }
        
        // Svuota il contenitore attuale
        timelineContainer.innerHTML = '';
        
        // Crea elementi per ogni tappa
        stops.forEach((stop, index) => {
            if (!stop || !stop.id) return;
            
            // Cerca i dati statici per questa tappa
            const staticStop = staticStops?.find(s => s.id === stop.id) || {};
            
            // Determina l'icona da usare
            const icon = staticStop.icon || 'fa-map-marker-alt';
            const order = staticStop.order || (index + 1);
            
            // Converte ID con underscore in ID con trattino per il DOM
            const elementId = stop.id.replace(/_/g, '-');
            
            // Crea il pulsante della timeline
            const buttonEl = document.createElement('button');
            buttonEl.className = 'timeline-stop';
            buttonEl.setAttribute('aria-label', `Vai alla tappa: ${stop.title}`);
            buttonEl.dataset.targetId = elementId;
            
            buttonEl.innerHTML = `
                <div class="timeline-stop-icon" aria-hidden="true">
                    <i class="fas ${icon}" aria-hidden="true"></i>
                </div>
                <span class="timeline-stop-label">${stop.title}</span>
            `;
            
            // Aggiungi evento click per scrollare all'episodio
            buttonEl.addEventListener('click', function() {
                const targetElement = document.getElementById(elementId);
                if (targetElement) {
                    const headerHeight = document.getElementById('site-header').offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    
                    window.scrollTo({
                        top: targetPosition - headerHeight - 20,
                        behavior: 'smooth'
                    });
                }
            });
            
            timelineContainer.appendChild(buttonEl);
        });
        
        // Inizializza gli indicatori della timeline
        initializeTimelineIndicators(stops.length);
    }
    
    // Funzione per inizializzare gli indicatori della timeline
    function initializeTimelineIndicators(stopCount) {
        const indicatorsContainer = document.querySelector('.timeline-indicators');
        if (!indicatorsContainer) return;
        
        indicatorsContainer.innerHTML = '';
        
        // Crea un indicatore per ogni tappa
        for (let i = 0; i < stopCount; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'timeline-indicator';
            indicator.setAttribute('aria-hidden', 'true');
            indicatorsContainer.appendChild(indicator);
        }
        
        // Imposta il primo indicatore come attivo
        if (indicatorsContainer.firstChild) {
            indicatorsContainer.firstChild.classList.add('active');
        }
        
        // Aggiungi eventi ai controlli di navigazione
        const prevButton = document.querySelector('.timeline-control.prev');
        const nextButton = document.querySelector('.timeline-control.next');
        const timelineTrack = document.querySelector('.timeline-track');
        
        if (prevButton && nextButton && timelineTrack) {
            prevButton.addEventListener('click', () => {
                timelineTrack.scrollBy({ left: -300, behavior: 'smooth' });
            });
            
            nextButton.addEventListener('click', () => {
                timelineTrack.scrollBy({ left: 300, behavior: 'smooth' });
            });
        }
    }
    
    // Funzione per generare le card degli episodi dinamicamente con il nuovo design Tailwind
    function generateEpisodeCards(stops, staticStops) {
        const mainContainer = document.querySelector('main.space-y-12');
        if (!mainContainer || !stops || !Array.isArray(stops)) {
            console.error('Container principale o dati delle tappe non trovati');
            return;
        }
        
        // Svuota il contenitore attuale
        mainContainer.innerHTML = '';
        
        // Array di colori per alternare tra i vari stili
        const colorSchemes = [
            {
                gradientFrom: 'from-primary/80', 
                gradientVia: 'via-primary/40',
                badge: 'bg-primary/60',
                buttonBg: 'from-primary to-primary-light',
                buttonBorder: 'border-primary/20',
                buttonText: 'text-primary',
                buttonHover: 'hover:bg-primary/5',
                progressBg: 'from-primary to-secondary',
                borderColor: 'border-primary',
                hoverText: 'hover:text-primary',
                hoverBorder: 'hover:border-primary/20',
                hoverBg: 'hover:bg-primary/5'
            },
            {
                gradientFrom: 'from-primary/80', 
                gradientVia: 'via-secondary/30',
                badge: 'bg-primary/60',
                buttonBg: 'from-primary to-primary-light',
                buttonBorder: 'border-primary/20',
                buttonText: 'text-primary',
                buttonHover: 'hover:bg-primary/5',
                progressBg: 'from-primary to-secondary',
                borderColor: 'border-primary',
                hoverText: 'hover:text-primary',
                hoverBorder: 'hover:border-primary/20',
                hoverBg: 'hover:bg-primary/5'
            },
            {
                gradientFrom: 'from-secondary/80', 
                gradientVia: 'via-primary/40',
                badge: 'bg-secondary/60',
                buttonBg: 'from-secondary to-primary',
                buttonBorder: 'border-secondary/20',
                buttonText: 'text-secondary',
                buttonHover: 'hover:bg-secondary/5',
                progressBg: 'from-secondary to-primary',
                borderColor: 'border-secondary',
                hoverText: 'hover:text-secondary',
                hoverBorder: 'hover:border-secondary/20',
                hoverBg: 'hover:bg-secondary/5'
            },
            {
                gradientFrom: 'from-accent/80', 
                gradientVia: 'via-accent/30',
                badge: 'bg-accent/60',
                buttonBg: 'from-accent to-secondary',
                buttonBorder: 'border-accent/20',
                buttonText: 'text-accent',
                buttonHover: 'hover:bg-accent/5',
                progressBg: 'from-accent to-secondary',
                borderColor: 'border-accent',
                hoverText: 'hover:text-accent',
                hoverBorder: 'hover:border-accent/20',
                hoverBg: 'hover:bg-accent/5'
            },
            {
                gradientFrom: 'from-secondary/80', 
                gradientVia: 'via-accent/30',
                badge: 'bg-secondary/60',
                buttonBg: 'from-secondary to-accent',
                buttonBorder: 'border-secondary/20',
                buttonText: 'text-secondary',
                buttonHover: 'hover:bg-secondary/5',
                progressBg: 'from-secondary to-accent',
                borderColor: 'border-secondary',
                hoverText: 'hover:text-secondary',
                hoverBorder: 'hover:border-secondary/20',
                hoverBg: 'hover:bg-secondary/5'
            }
        ];
        
        // Crea card per ogni tappa
        stops.forEach((stop, index) => {
            if (!stop || !stop.id) return;
            
            // Cerca i dati statici per questa tappa
            const staticStop = staticStops?.find(s => s.id === stop.id) || {};
            
            // Determina l'immagine e il percorso del file audio
            const imagePath = staticStop.imagePath || stop.imagePath || 'assets/img/illustration-2.png';
            const audioPath = stop.audioPath || '#';
            
            // Recupera URL Google Maps dai dati statici
            const googleMapsUrl = staticStop?.googleMapsUrl || '';
            
            // Recupera durazione audio
            const duration = stop?.duration || '';
            
            // Scegli un schema di colori basato sull'indice (ciclico)
            const colorScheme = colorSchemes[index % colorSchemes.length];
            
            // Converti ID con underscore in ID con trattino per il DOM
            const elementId = stop.id.replace(/_/g, '-');
            
            // Crea l'elemento article con il nuovo design Tailwind
            const articleEl = document.createElement('article');
            articleEl.className = 'bg-white rounded-3xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border border-gray-100 transform hover:-translate-y-1';
            articleEl.id = elementId;
            articleEl.setAttribute('aria-labelledby', `title-${elementId}`);
            
            // Ordine della tappa (da dati statici oppure indice + 1)
            const order = staticStop.order || (index + 1);
            
            // Crea la struttura HTML per la card con il nuovo design Tailwind
            articleEl.innerHTML = `
                <div class="flex flex-col md:flex-row">
                    <div class="relative md:w-2/5 h-60 md:h-auto overflow-hidden">
                        <img src="${imagePath}" alt="${stop.title}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105">
                        <div class="absolute inset-0 bg-gradient-to-t ${colorScheme.gradientFrom} ${colorScheme.gradientVia} to-transparent opacity-80"></div>
                        
                        <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <div class="flex items-center justify-between mb-2">
                                <span class="inline-block px-3 py-1 ${colorScheme.badge} backdrop-blur-sm rounded-full text-xs font-medium">Tappa ${order}</span>
                                ${duration ? 
                                    `<span class="inline-flex items-center px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-xs font-medium">
                                        <i class="fas fa-clock mr-1.5"></i>${duration}
                                     </span>` 
                                    : ''}
                            </div>
                            <h2 id="title-${elementId}" class="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                                ${stop.title}
                            </h2>
                            <div class="h-1 w-16 bg-gradient-to-r from-white to-white/20 mt-3"></div>
                        </div>
                    </div>
                    
                    <div class="flex-1 p-6 md:p-8">
                        <div class="flex flex-wrap justify-between items-center mb-6">
                            <p class="text-gray-600 flex-grow mr-4">${stop.description || 'Nessuna descrizione disponibile'}</p>
                            ${googleMapsUrl ? 
                                `<a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" 
                                   class="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-${colorScheme.buttonText.replace('text-', '')}/10 ${colorScheme.buttonText} transition-colors" 
                                   aria-label="Visualizza su Google Maps">
                                    <i class="fas fa-map-marker-alt"></i>
                                </a>` 
                                : ''}
                        </div>
                        
                        <div class="bg-gradient-to-br from-primary-light/5 to-accent/5 rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div class="flex items-center gap-4 mb-4">
                                <button class="amplitude-play-pause w-14 h-14 rounded-full bg-gradient-to-br ${colorScheme.buttonBg} text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all" data-amplitude-playlist="episodi" data-amplitude-song-index="${index}" aria-label="Riproduci o metti in pausa">
                                    <i class="fa fa-play amplitude-play text-lg" aria-hidden="true"></i>
                                    <i class="fa fa-pause amplitude-pause text-lg" aria-hidden="true"></i>
                                </button>
                                
                                <div class="flex items-center gap-3">
                                    <div class="flex flex-col items-center">
                                        <button class="backward-15 w-10 h-10 rounded-full bg-white ${colorScheme.buttonText} border ${colorScheme.buttonBorder} flex items-center justify-center ${colorScheme.buttonHover} active:scale-95 transition-all mb-1 shadow-sm" data-amplitude-playlist="episodi" data-amplitude-song-index="${index}">
                                            <i class="fas fa-undo-alt text-sm"></i>
                                        </button>
                                        <span class="text-xs font-medium text-gray-500">-30s</span>
                                    </div>
                                    
                                    <div class="flex flex-col items-center">
                                        <button class="forward-15 w-10 h-10 rounded-full bg-white ${colorScheme.buttonText} border ${colorScheme.buttonBorder} flex items-center justify-center ${colorScheme.buttonHover} active:scale-95 transition-all mb-1 shadow-sm" data-amplitude-playlist="episodi" data-amplitude-song-index="${index}">
                                            <i class="fas fa-redo-alt text-sm"></i>
                                        </button>
                                        <span class="text-xs font-medium text-gray-500">+30s</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="player-progress-container relative h-2 bg-gray-200 rounded-full mb-2">
                                <div class="player-progress absolute top-0 left-0 h-full bg-gradient-to-r ${colorScheme.progressBg} rounded-full" style="width: 0%"></div>
                                <div class="player-progress-handle absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 rounded-full bg-white border-2 ${colorScheme.borderColor} shadow-md" style="left: 0%"></div>
                                <input type="range" class="amplitude-song-slider w-full absolute inset-0 opacity-0 cursor-pointer" data-amplitude-playlist="episodi" data-amplitude-song-index="${index}" min="0" max="100" step="0.1" value="0" aria-label="Posizione audio"/>
                            </div>
                            
                            <div class="flex justify-between text-xs font-medium text-gray-500">
                                <span class="amplitude-current-time" data-amplitude-playlist="episodi" data-amplitude-song-index="${index}">0:00</span>
                                <span class="amplitude-duration-time" data-amplitude-playlist="episodi" data-amplitude-song-index="${index}">0:00</span>
                            </div>
                        </div>
                        
                        <div class="mt-5 flex flex-col sm:flex-row gap-3">
                            <button class="toggle-transcript flex-grow py-3 px-4 bg-white border border-gray-200 rounded-xl text-gray-600 ${colorScheme.hoverText} ${colorScheme.hoverBorder} ${colorScheme.hoverBg} transition-all flex justify-center items-center space-x-2" data-target="transcript-${index + 1}" aria-expanded="false" aria-controls="transcript-${index + 1}">
                                <i class="fas fa-align-left mr-2"></i>
                                <span>Mostra trascrizione</span>
                                <i class="fas fa-chevron-down transcript-toggle-icon transition-transform ml-2" aria-hidden="true"></i>
                            </button>
                            
                            ${googleMapsUrl ? 
                                `<a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" 
                                   class="sm:flex-shrink-0 py-3 px-6 rounded-xl border ${colorScheme.buttonBorder} ${colorScheme.buttonText} ${colorScheme.buttonHover} transition-all flex justify-center items-center">
                                    <i class="fas fa-map-marker-alt mr-2"></i>
                                    <span>Indicazioni</span>
                                </a>` 
                                : ''}
                        </div>
                        
                        <div id="transcript-${index + 1}" class="hidden mt-4 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden" aria-hidden="true" role="region" aria-label="Trascrizione audio ${stop.title}">
                            <div class="p-5 space-y-4 text-gray-700">
                                <!-- Il contenuto verrà caricato dinamicamente dal file JSON -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            mainContainer.appendChild(articleEl);
        });
        
        // Riconfigura i gestori di eventi per le trascrizioni
        setupTranscriptToggles();
    }
        
    // Pre-inizializza tutti i contenitori di trascrizioni per evitare problemi di layout
    function setupTranscriptToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-transcript');
        
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
                        
                        // Accesso ai dati specifici per lingua
                        const langData = tourData.tour.content[currentLang];
                        if (!langData) {
                            contentDiv.innerHTML = '<p class="text-red-600">Dati per questa lingua non disponibili.</p>';
                            return;
                        }
                        
                        let transcription;
                        if (jsonPath === 'introduction') {
                            // Accesso all'introduzione dalla lingua corrente
                            transcription = langData.introduction && langData.introduction.transcription;
                        } else if (jsonPath.startsWith('stops.')) {
                            // Accesso alle tappe dalla lingua corrente
                            const index = parseInt(jsonPath.split('.')[1]);
                            if (langData.stops && Array.isArray(langData.stops) && index >= 0 && index < langData.stops.length) {
                                transcription = langData.stops[index].transcription;
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
                            if (langData.stops && index >= 0 && index < langData.stops.length) {
                                const stop = langData.stops[index];
                                
                                if (stop) {
                                    const titleEl = document.createElement('h3');
                                    titleEl.className = 'text-lg font-bold mb-3';
                                    titleEl.textContent = stop.title;
                                    contentDiv.prepend(titleEl);
                                }
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
    }
    
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
        const announcer = document.getElementById('sr-announcer') || (() => {
            const el = document.createElement('div');
            el.id = 'sr-announcer';
            el.setAttribute('aria-live', 'polite');
            el.classList.add('sr-only');
            document.body.appendChild(el);
            return el;
        })();
        
        announcer.textContent = message;
    }
});

// Implementazione dei controlli avanti/indietro di 15 secondi
document.addEventListener('DOMContentLoaded', function() {
    // Gestione dei pulsanti di avanzamento rapido (+15s) e riavvolgimento (-15s)
    function setupTimeControls() {
        const forwardButtons = document.querySelectorAll('.forward-15');
        const backwardButtons = document.querySelectorAll('.backward-15');
        
        console.log(`Trovati ${forwardButtons.length} pulsanti +15s e ${backwardButtons.length} pulsanti -15s`);
        
        // Avanti di 15 secondi
        forwardButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Impedisce che il click si propaghi al bottone play/pause
                
                const songIndex = this.getAttribute('data-amplitude-song-index');
                const playlist = this.getAttribute('data-amplitude-playlist');
                
                console.log(`Avanti +15s: playlist=${playlist}, song=${songIndex}`);
                
                try {
                    // Utilizziamo l'elemento audio HTML direttamente
                    const audioElement = Amplitude.getAudio();
                    if (audioElement) {
                        const currentTime = audioElement.currentTime;
                        const duration = audioElement.duration;
                        
                        console.log(`Posizione attuale: ${currentTime}s, durata: ${duration}s`);
                        
                        if (!isNaN(currentTime) && !isNaN(duration) && duration > 0) {
                            // Calcola la nuova posizione (avanti di 15 secondi, ma non oltre la durata)
                            const newPosition = Math.min(currentTime + 15, duration);
                            
                            console.log(`Nuova posizione: ${newPosition}s`);
                            
                            // Imposta la nuova posizione
                            audioElement.currentTime = newPosition;
                            
                            // Aggiunge una classe temporanea per feedback visivo
                            button.classList.add('clicked');
                            setTimeout(() => {
                                button.classList.remove('clicked');
                            }, 500);
                        } else {
                            console.warn('Impossibile determinare la durata o posizione corrente');
                        }
                    }
                } catch (error) {
                    console.error('Errore nell\'avanzamento di 15 secondi:', error);
                }
            });
        });
        
        // Indietro di 15 secondi
        backwardButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Impedisce che il click si propaghi al bottone play/pause
                
                const songIndex = this.getAttribute('data-amplitude-song-index');
                const playlist = this.getAttribute('data-amplitude-playlist');
                
                console.log(`Indietro -15s: playlist=${playlist}, song=${songIndex}`);
                
                try {
                    // Utilizziamo l'elemento audio HTML direttamente
                    const audioElement = Amplitude.getAudio();
                    if (audioElement) {
                        const currentTime = audioElement.currentTime;
                        const duration = audioElement.duration;
                        
                        console.log(`Posizione attuale: ${currentTime}s, durata: ${duration}s`);
                        
                        if (!isNaN(currentTime) && !isNaN(duration)) {
                            // Calcola la nuova posizione (indietro di 15 secondi, ma non sotto zero)
                            const newPosition = Math.max(currentTime - 15, 0);
                            
                            console.log(`Nuova posizione: ${newPosition}s`);
                            
                            // Imposta la nuova posizione
                            audioElement.currentTime = newPosition;
                            
                            // Aggiunge una classe temporanea per feedback visivo
                            button.classList.add('clicked');
                            setTimeout(() => {
                                button.classList.remove('clicked');
                            }, 500);
                        } else {
                            console.warn('Impossibile determinare la durata o posizione corrente');
                        }
                    }
                } catch (error) {
                    console.error('Errore nel riavvolgimento di 15 secondi:', error);
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
            
            // Aggiorna anche il valore dell'input range
            rangeInput.value = percentage;
        }
    }
    
    // Funzione per sincronizzare il progress bar con lo stato di Amplitude
    function setupProgressSync() {
        // Ascolta gli eventi di aggiornamento del tempo di Amplitude
        if (typeof Amplitude !== 'undefined') {
            Amplitude.bind('time_update', function() {
                try {
                    const currentPlaylist = Amplitude.getActivePlaylist();
                    if (currentPlaylist) {
                        const currentSong = Amplitude.getActiveIndexInPlaylist(currentPlaylist);
                        const percentage = Amplitude.getSongPlayedPercentage();
                        
                        if (currentSong !== null && !isNaN(percentage)) {
                            updateProgressUI(currentPlaylist, currentSong, percentage);
                        }
                    }
                } catch (error) {
                    console.error('Errore nell\'aggiornamento del progresso:', error);
                }
            });
        }
        
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
                    
                    if (playlist && songIndex !== null && typeof Amplitude !== 'undefined') {
                        try {
                            Amplitude.setPlaylistSongPlayedPercentage(playlist, songIndex, percentage);
                            updateProgressUI(playlist, songIndex, percentage);
                        } catch (error) {
                            console.error('Errore nell\'impostare la posizione dell\'audio:', error);
                        }
                    }
                });
                
                // Quando l'utente trascina lo slider
                slider.addEventListener('input', function() {
                    const percentage = this.value;
                    
                    if (progressBar && handle) {
                        progressBar.style.width = percentage + '%';
                        handle.style.left = percentage + '%';
                    }
                });
                
                // Quando l'utente rilascia lo slider
                slider.addEventListener('change', function() {
                    const percentage = this.value;
                    const playlist = this.getAttribute('data-amplitude-playlist');
                    const songIndex = this.getAttribute('data-amplitude-song-index');
                    
                    if (playlist && songIndex !== null && typeof Amplitude !== 'undefined') {
                        try {
                            Amplitude.setPlaylistSongPlayedPercentage(playlist, songIndex, percentage);
                        } catch (error) {
                            console.error('Errore nell\'impostare la posizione dell\'audio:', error);
                        }
                    }
                });
            }
        });
    }
    
    // Imposta un intervallo per aggiornare tutte le progress bar periodicamente (per sicurezza)
    function setupProgressInterval() {
        setInterval(function() {
            if (typeof Amplitude !== 'undefined') {
                try {
                    const currentPlaylist = Amplitude.getActivePlaylist();
                    
                    if (currentPlaylist) {
                        const currentSong = Amplitude.getActiveIndexInPlaylist(currentPlaylist);
                        const percentage = Amplitude.getSongPlayedPercentage();
                        
                        if (currentSong !== null && !isNaN(percentage)) {
                            updateProgressUI(currentPlaylist, currentSong, percentage);
                        }
                    }
                } catch (error) {
                    // Ignoriamo gli errori nel polling, è solo un backup
                }
            }
        }, 1000);
    }
    
    // Inizializza i controlli dopo che Amplitude è stato completamente caricato
    function initializeAudioControls() {
        console.log('Inizializzazione controlli audio...');
        setupTimeControls();
        setupProgressSync();
        setupProgressInterval();
    }
    
    // Verifica periodicamente se Amplitude è pronto
    // (Questo può essere necessario perché Amplitude potrebbe non essere caricato immediatamente)
    let amplitudeReadyCheck = setInterval(function() {
        if (typeof Amplitude !== 'undefined') {
            clearInterval(amplitudeReadyCheck);
            
            // Assicurati che siamo nel contesto principale e non in un iframe o altro
            if (window === window.top) {
                console.log('Amplitude rilevato, inizializzo i controlli');
                initializeAudioControls();
                
                // Emetti l'evento amplitude-ready per sicurezza
                if (!window.amplitudeReadyFired) {
                    document.dispatchEvent(new Event('amplitude-ready'));
                    window.amplitudeReadyFired = true;
                }
            }
        }
    }, 500);
    
    // Timeout di sicurezza
    setTimeout(function() {
        clearInterval(amplitudeReadyCheck);
        if (typeof Amplitude !== 'undefined' && !window.amplitudeReadyFired) {
            console.log('Timeout raggiunto, ma Amplitude è disponibile. Inizializzo i controlli.');
            initializeAudioControls();
            window.amplitudeReadyFired = true;
        }
    }, 10000);
});