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
    let dataLoaded = false;
    const loadedIds = {};
    
    // Precarica il file JSON con tutte le informazioni dell'audioguida
    fetch('assets/data/audioguide-data.json')
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
        if (!tourData || !tourData.tour) return;
        
        // Aggiorna titolo e descrizione dell'introduzione
        document.querySelectorAll('.amplitude-track-title[data-amplitude-main-song-info="true"]').forEach(el => {
            el.textContent = tourData.tour.introduction.title;
        });
        
        document.querySelectorAll('.amplitude-track-author[data-amplitude-main-song-info="true"]').forEach(el => {
            el.textContent = tourData.tour.introduction.author;
        });
        
        // Aggiorna le informazioni per ogni fermata del tour
        tourData.tour.stops.forEach((stop, index) => {
            const articleId = stop.id;
            const article = document.getElementById(articleId);
            
            if (article) {
                // Aggiorna titolo e descrizione
                const titleEl = article.querySelector(`#title-${articleId}`);
                const descEl = article.querySelector('.text-gray-600');
                const iconEl = article.querySelector('.episode-icon i');
                
                if (titleEl) titleEl.textContent = stop.title;
                if (descEl) descEl.textContent = stop.description;
                if (iconEl && stop.icon) {
                    iconEl.className = '';
                    iconEl.classList.add('fas', stop.icon);
                }
                
                // Aggiorna le informazioni nel player
                const trackTitleEl = article.querySelector(`.amplitude-track-title[data-amplitude-playlist="episodi"][data-amplitude-song-index="${index}"]`);
                const trackAuthorEl = article.querySelector(`.amplitude-track-author[data-amplitude-playlist="episodi"][data-amplitude-song-index="${index}"]`);
                
                if (trackTitleEl) trackTitleEl.textContent = stop.title;
                if (trackAuthorEl) trackAuthorEl.textContent = stop.author;
            }
        });
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