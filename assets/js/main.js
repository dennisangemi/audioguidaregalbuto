document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Inizializzazione transcription manager');
    
    // Gestione migliorata delle trascrizioni
    const toggleButtons = document.querySelectorAll('.toggle-transcript');
    console.log(`Trovati ${toggleButtons.length} pulsanti di trascrizione`);
    
    // Mappa per associare ogni container di trascrizione al suo file JSON
    const transcriptFiles = {
        'transcript-0': 'assets/transcription/it/0_intro.json',
        'transcript-1': 'assets/transcription/it/1_piazza_repubblica.json',
        'transcript-2': 'assets/transcription/it/2_palazzo_comunale.json',
        'transcript-3': 'assets/transcription/it/2_palazzo_comunale.json' // Aggiunto per compatibilità
    };
    
    // Flag per tenere traccia dei file già caricati
    const loadedTranscripts = {};
    
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
            if (willExpand && !loadedTranscripts[targetId]) {
                // Ottieni il percorso del file
                const filePath = transcriptFiles[targetId];
                
                console.log(`Tentativo di caricare contenuto da: ${filePath}`);
                
                if (!filePath) {
                    console.error(`Nessun file di trascrizione mappato per l'ID: ${targetId}`);
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
                
                // Carica il file di trascrizione JSON
                fetch(filePath)
                    .then(response => {
                        console.log(`Risposta ricevuta con stato: ${response.status} per ${filePath}`);
                        if (!response.ok) {
                            throw new Error(`Errore nel caricamento (${response.status}: ${response.statusText})`);
                        }
                        return response.json(); // Modificato da .text() a .json()
                    })
                    .then(data => {
                        console.log(`Contenuto JSON caricato da ${filePath}`, data);
                        
                        if (!data || !data.paragraphs || data.paragraphs.length === 0) {
                            throw new Error('Il file di trascrizione non contiene testo o è in formato errato');
                        }
                        
                        // Genera i paragrafi HTML dal JSON
                        const paragraphs = data.paragraphs
                            .map(p => `<p>${p}</p>`)
                            .join('');
                        
                        contentDiv.innerHTML = paragraphs;
                        
                        // Se nel JSON sono presenti metadati, possiamo mostrarli
                        if (data.metadata) {
                            if (data.metadata.title) {
                                const titleEl = document.createElement('h3');
                                titleEl.className = 'text-lg font-bold mb-3';
                                titleEl.textContent = data.metadata.title;
                                contentDiv.prepend(titleEl);
                            }
                            
                            if (data.metadata.duration) {
                                const durationNote = document.createElement('p');
                                durationNote.className = 'text-sm text-gray-500 mt-4';
                                durationNote.textContent = `Durata: ${data.metadata.duration}`;
                                contentDiv.appendChild(durationNote);
                            }
                        }
                        
                        loadedTranscripts[targetId] = true;
                        
                        // Annuncia che il caricamento è completo per gli screen reader
                        announceToScreenReader('Trascrizione caricata');
                    })
                    .catch(error => {
                        console.error(`Errore nel caricamento della trascrizione JSON da ${filePath}:`, error);
                        
                        // Fallback per piazza repubblica se il caricamento fallisce
                        if (targetId === 'transcript-1') {
                            console.log('Utilizzo contenuto fallback per Piazza Repubblica');
                            const fallbackContent = `
                                <p>Benvenuti a Piazza della Repubblica, il cuore pulsante di Regalbuto.</p>
                                <p>Questa storica piazza rappresenta il centro sociale e culturale della città, con la sua caratteristica pavimentazione in pietra locale che risale all'inizio del XX secolo.</p>
                                <p>Intorno alla piazza si possono ammirare diversi edifici storici che raccontano la storia di Regalbuto.</p>
                                <p>La piazza è stata testimone di numerosi eventi storici nel corso dei secoli.</p>
                                <p>Prendetevi qualche minuto per osservare la vita che anima questo spazio.</p>
                            `;
                            contentDiv.innerHTML = fallbackContent;
                            loadedTranscripts[targetId] = true;
                        } else {
                            contentDiv.innerHTML = `<p class="text-red-600">Impossibile caricare la trascrizione: ${error.message}</p>
                                                   <p>Percorso: ${filePath}</p>`;
                        }
                    });
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
    
    // Funzione per rispettare preferenze di riduzione movimento
    function getScrollBehavior() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
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