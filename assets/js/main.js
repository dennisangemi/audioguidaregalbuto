document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Inizializzazione transcription manager');
    
    // Gestione migliorata delle trascrizioni
    const toggleButtons = document.querySelectorAll('.toggle-transcript');
    console.log(`Trovati ${toggleButtons.length} pulsanti di trascrizione`);
    
    // Mappa per associare ogni container di trascrizione al suo file
    const transcriptFiles = {
        'transcript-0': 'assets/transcription/it/0_intro.txt',
        'transcript-1': 'assets/transcription/it/1_piazza_repubblica.txt',
        'transcript-2': 'assets/transcription/it/2_palazzo_comunale.txt',
        'transcript-3': 'assets/transcription/it/2_palazzo_comunale.txt' // Aggiunto per compatibilità
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
                
                // Carica il file di trascrizione
                fetch(filePath)
                    .then(response => {
                        console.log(`Risposta ricevuta con stato: ${response.status}`);
                        if (!response.ok) {
                            throw new Error(`Errore nel caricamento (${response.status}: ${response.statusText})`);
                        }
                        return response.text();
                    })
                    .then(text => {
                        console.log(`Contenuto caricato (${text.length} caratteri)`);
                        
                        if (!text || text.trim().length === 0) {
                            throw new Error('Il file di trascrizione è vuoto');
                        }
                        
                        // Formatta il testo con paragrafi
                        let paragraphs;
                        if (text.includes('\n\n')) {
                            // Se ci sono paragrafi separati da doppi a capo
                            paragraphs = text.split(/\r?\n\r?\n/)
                                .filter(p => p.trim() !== '')
                                .map(p => `<p>${p.trim().replace(/\r?\n/g, '<br>')}</p>`)
                                .join('');
                        } else {
                            // Altrimenti dividi per singoli a capo
                            paragraphs = text.split(/\r?\n/)
                                .filter(p => p.trim() !== '')
                                .map(p => `<p>${p.trim()}</p>`)
                                .join('');
                        }
                        
                        contentDiv.innerHTML = paragraphs;
                        loadedTranscripts[targetId] = true;
                        
                        // Annuncia che il caricamento è completo per gli screen reader
                        announceToScreenReader('Trascrizione caricata');
                    })
                    .catch(error => {
                        console.error('Errore nel caricamento della trascrizione:', error);
                        
                        // Fallback: se il file non può essere caricato, mostro un testo statico per test
                        contentDiv.innerHTML = `
                            <p>Non è stato possibile caricare il file di trascrizione. Ecco un testo di esempio.</p>
                            <p>Questo è un paragrafo di esempio per mostrare che la trascrizione funziona correttamente.</p>
                            <p>Errore: ${error.message}</p>
                            <p>Percorso: ${filePath}</p>
                        `;
                        
                        // Comunque consideriamo caricato per evitare tentativi ripetuti
                        loadedTranscripts[targetId] = true;
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