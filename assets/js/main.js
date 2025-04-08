document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Inizializzazione transcription manager');
    
    // Gestione migliorata delle trascrizioni
    const toggleButtons = document.querySelectorAll('.toggle-transcript');
    console.log(`Trovati ${toggleButtons.length} pulsanti di trascrizione`);
    
    // Mappa ID -> chiave del JSON
    const transcriptMap = {
        'transcript-0': 'intro',
        'transcript-1': 'piazza_repubblica', 
        'transcript-2': 'palazzo_comunale',
        'transcript-3': 'chiesa_madre'
    };
    
    // Variabili per tenere traccia dei dati e dello stato di caricamento
    let transcriptData = null;
    let dataLoaded = false;
    const loadedIds = {};
    
    // Precarica il file JSON con tutte le trascrizioni
    fetch('assets/data/trascrizioni.json')
        .then(response => {
            console.log(`Risposta ricevuta con stato: ${response.status} per il file principale delle trascrizioni`);
            if (!response.ok) {
                throw new Error(`Errore nel caricamento (${response.status}: ${response.statusText})`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Dati delle trascrizioni caricati correttamente', data);
            transcriptData = data;
            dataLoaded = true;
        })
        .catch(error => {
            console.error('Errore nel caricamento delle trascrizioni:', error);
        });
        
    // Pre-inizializza tutti i contenitori di trascrizioni per evitare problemi di layout
    document.querySelectorAll('.transcript-container').forEach(container => {
        // Assicuriamo che tutti i contenitori partano nascosti
        container.classList.remove('expanded');
        container.setAttribute('aria-hidden', 'true');
        
        // Impostiamo esplicitamente gli stili invece di affidarci solo alle classi
        container.style.display = 'none';
        container.style.opacity = '0';
    });
    
    toggleButtons.forEach(button => {
        // Verifica iniziale dello stato
        const targetId = button.getAttribute('data-target');
        const transcriptContainer = document.getElementById(targetId);
        
        console.log(`Inizializzazione pulsante per ${targetId}: ${transcriptContainer ? 'container trovato' : 'container NON trovato'}`);
        
        // Se la trascrizione è già espansa (raro, ma possibile dopo reload)
        if (transcriptContainer && transcriptContainer.classList.contains('expanded')) {
            updateButtonState(button, true);
            transcriptContainer.style.display = 'block';
            transcriptContainer.style.opacity = '1';
        }
        
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const transcriptContainer = document.getElementById(targetId);
            
            console.log(`Click sul pulsante trascrizione per ${targetId}`);
            
            // Verifica che l'elemento target esista
            if (!transcriptContainer) {
                console.error('Target transcript container not found:', targetId);
                return;
            }
            
            // Determina il nuovo stato (opposto dello stato corrente)
            const willExpand = !transcriptContainer.classList.contains('expanded');
            console.log(`Stato trascrizione: ${willExpand ? 'espandere' : 'contrarre'}`);
            
            // Toggle della classe expanded
            transcriptContainer.classList.toggle('expanded');
            
            // Imposta esplicitamente lo stile di visualizzazione - questo è il cambiamento principale
            if (willExpand) {
                // Impostiamo display:block prima di tutto per assicurare che l'elemento sia presente
                transcriptContainer.style.display = 'block';
                
                // Diamo al browser un momento per riconoscere l'elemento nel DOM
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
                
                // Nascondiamo l'elemento dopo che la transizione è completa
                setTimeout(() => {
                    transcriptContainer.style.display = 'none';
                }, 500);
                
                console.log(`Contrazione di ${targetId}`);
            }
            
            // Aggiorna lo stato ARIA e l'aspetto del pulsante
            updateButtonState(this, willExpand);
            transcriptContainer.setAttribute('aria-hidden', !willExpand);
            
            // Se stiamo espandendo e non abbiamo ancora caricato il contenuto
            if (willExpand && !loadedIds[targetId]) {
                // Ottieni la chiave corrispondente
                const transcriptKey = transcriptMap[targetId];
                
                console.log(`Tentativo di recuperare contenuto per la chiave: ${transcriptKey}`);
                
                if (!transcriptKey) {
                    console.error(`Nessuna trascrizione mappata per l'ID: ${targetId}`);
                    return;
                }
                
                // Trova il contenitore del contenuto
                const contentDiv = transcriptContainer.querySelector('.space-y-4');
                if (!contentDiv) {
                    console.error(`Contenitore del contenuto (.space-y-4) non trovato in: ${targetId}`);
                    return;
                }
                
                // Mostra indicatore di caricamento
                contentDiv.innerHTML = '<p class="text-center"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Caricamento trascrizione...</p>';
                
                // Funzione di rendering della trascrizione
                function renderTranscription() {
                    if (!dataLoaded || !transcriptData || !transcriptData.transcriptions) {
                        contentDiv.innerHTML = '<p class="text-red-600">I dati delle trascrizioni non sono disponibili.</p>';
                        return;
                    }
                    
                    const transcription = transcriptData.transcriptions[transcriptKey];
                    
                    if (!transcription || !transcription.paragraphs || transcription.paragraphs.length === 0) {
                        contentDiv.innerHTML = '<p class="text-red-600">Trascrizione non trovata o formato errato.</p>';
                        return;
                    }
                    
                    // Genera i paragrafi HTML dal JSON
                    const paragraphs = transcription.paragraphs
                        .map(p => `<p>${p}</p>`)
                        .join('');
                    
                    contentDiv.innerHTML = paragraphs;
                    
                    // Se sono presenti metadati, li mostriamo
                    if (transcription.metadata) {
                        if (transcription.metadata.title) {
                            const titleEl = document.createElement('h3');
                            titleEl.className = 'text-lg font-bold mb-3';
                            titleEl.textContent = transcription.metadata.title;
                            contentDiv.prepend(titleEl);
                        }
                        
                        if (transcription.metadata.duration) {
                            const durationNote = document.createElement('p');
                            durationNote.className = 'text-sm text-gray-500 mt-4';
                            durationNote.textContent = `Durata: ${transcription.metadata.duration}`;
                            contentDiv.appendChild(durationNote);
                        }
                    }
                    
                    loadedIds[targetId] = true;
                    
                    // Annuncia che il caricamento è completo per gli screen reader
                    announceToScreenReader('Trascrizione caricata');
                }
                
                // Se i dati sono già caricati, mostra subito la trascrizione
                if (dataLoaded) {
                    renderTranscription();
                } else {
                    // Altrimenti aspetta il caricamento
                    const checkInterval = setInterval(() => {
                        if (dataLoaded) {
                            clearInterval(checkInterval);
                            renderTranscription();
                        }
                    }, 100);
                    
                    // Timeout di sicurezza dopo 5 secondi
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
    
    // Funzione per aggiornare lo stato visivo del pulsante
    function updateButtonState(button, isExpanded) {
        const toggleIcon = button.querySelector('.toggle-icon');
        const buttonText = button.querySelector('span');
        
        console.log(`Aggiornamento stato pulsante: ${isExpanded ? 'espanso' : 'contratto'}`);
        
        // Aggiorna l'attributo ARIA
        button.setAttribute('aria-expanded', isExpanded);
        
        // Aggiorna l'icona se presente
        if (toggleIcon) {
            if (isExpanded) {
                toggleIcon.classList.add('rotate-icon');
            } else {
                toggleIcon.classList.remove('rotate-icon');
            }
        }
        
        // Aggiorna il testo se presente
        if (buttonText) {
            buttonText.textContent = isExpanded ? 'Nascondi trascrizione' : 'Mostra trascrizione completa';
        }
    }
    
    // Funzione per annunciare messaggi agli screen reader
    function announceToScreenReader(message) {
        // Cerca un live region esistente o ne crea uno nuovo
        let announcer = document.getElementById('sr-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'sr-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.classList.add('sr-only');
            document.body.appendChild(announcer);
        }
        
        // Imposta il messaggio e lo ripulisce dopo un po'
        announcer.textContent = message;
        setTimeout(() => {
            announcer.textContent = '';
        }, 3000);
    }
});