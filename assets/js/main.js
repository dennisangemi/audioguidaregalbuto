document.addEventListener('DOMContentLoaded', function() {
    // Gestione migliorata delle trascrizioni
    const toggleButtons = document.querySelectorAll('.toggle-transcript');
    
    // Pre-inizializza tutti i contenitori di trascrizioni per evitare problemi di layout
    document.querySelectorAll('.transcript-container').forEach(container => {
        // Assicuriamo che tutti i contenitori partano nascosti
        container.classList.remove('expanded');
        container.setAttribute('aria-hidden', 'true');
    });
    
    toggleButtons.forEach(button => {
        // Verifica iniziale dello stato
        const targetId = button.getAttribute('data-target');
        const transcriptContainer = document.getElementById(targetId);
        
        // Se la trascrizione è già espansa (raro, ma possibile dopo reload)
        if (transcriptContainer && transcriptContainer.classList.contains('expanded')) {
            updateButtonState(button, true);
        }
        
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const transcriptContainer = document.getElementById(targetId);
            
            // Verifica che l'elemento target esista
            if (!transcriptContainer) {
                console.error('Target transcript container not found:', targetId);
                return;
            }
            
            // Determina il nuovo stato (opposto dello stato corrente)
            const willExpand = !transcriptContainer.classList.contains('expanded');
            
            // Toggle della classe expanded
            transcriptContainer.classList.toggle('expanded');
            
            // Aggiorna lo stato ARIA e l'aspetto del pulsante
            updateButtonState(this, willExpand);
            transcriptContainer.setAttribute('aria-hidden', !willExpand);
            
            // Focus e accessibilità
            if (willExpand) {
                // Aggiungiamo un breve ritardo prima del focus per dare tempo all'animazione
                setTimeout(() => {
                    transcriptContainer.setAttribute('tabindex', '-1');
                    transcriptContainer.focus();
                    
                    // Aggiunta di un feedback audio molto sottile per screenreader
                    announceToScreenReader('Trascrizione espansa');
                }, 300);
            } else {
                transcriptContainer.removeAttribute('tabindex');
            }
            
            // Feedback visivo con un flash sottile del bordo
            if (willExpand) {
                const originalBorderColor = window.getComputedStyle(transcriptContainer).borderColor;
                transcriptContainer.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                
                setTimeout(() => {
                    transcriptContainer.style.borderColor = originalBorderColor;
                }, 600);
            }
        });
    });
    
    // Funzione per aggiornare lo stato visivo del pulsante
    function updateButtonState(button, isExpanded) {
        const toggleIcon = button.querySelector('.toggle-icon');
        const buttonText = button.querySelector('span');
        
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
    
    // Funzionalità per la timeline scorrevole - migliorata per accessibilità
    const timelineWrapper = document.querySelector('.timeline-track-wrapper');
    const timelineTrack = document.querySelector('.timeline-track');
    const prevButton = document.querySelector('.timeline-control.prev');
    const nextButton = document.querySelector('.timeline-control.next');
    const animationControlButton = document.querySelector('.animation-control');
    const timelineStops = document.querySelectorAll('.timeline-stop');
    const timelineIndicatorsContainer = document.querySelector('.timeline-indicators');
    
    if (timelineWrapper && timelineTrack && prevButton && nextButton && animationControlButton) {
        // Variabile per gestire lo stato di autoplay e il suo intervallo
        let autoplayActive = true; // ATTIVO per default
        let autoplayInterval;
        let currentStopIndex = 0;
        const AUTOPLAY_INTERVAL = 4000; // 4 secondi tra ogni transizione
        
        // Creiamo i pallini indicatori in base al numero di fermate
        if (timelineIndicatorsContainer && timelineStops.length > 0) {
            timelineStops.forEach((_, index) => {
                const indicator = document.createElement('div');
                indicator.classList.add('timeline-indicator');
                if (index === 0) indicator.classList.add('active');
                indicator.setAttribute('data-index', index);
                
                // Event listener per cliccare sul pallino
                indicator.addEventListener('click', () => {
                    goToStop(index);
                });
                
                timelineIndicatorsContainer.appendChild(indicator);
            });
        }
        
        // Funzione per interrompere l'animazione
        function stopAnimation() {
            clearInterval(autoplayInterval);
            autoplayActive = false;
            const controlIcon = animationControlButton.querySelector('.control-icon i');
            const controlText = animationControlButton.querySelector('.control-text');
            
            controlIcon.className = 'fas fa-play';
            controlText.textContent = "Riprendi animazione";
            animationControlButton.setAttribute('aria-label', 'Riprendi animazione automatica');
            announceToScreenReader('Animazione interrotta');
        }
        
        // Funzione per avviare l'animazione
        function startAnimation() {
            autoplayActive = true;
            const controlIcon = animationControlButton.querySelector('.control-icon i');
            const controlText = animationControlButton.querySelector('.control-text');
            
            controlIcon.className = 'fas fa-pause';
            controlText.textContent = "Interrompi animazione";
            animationControlButton.setAttribute('aria-label', 'Interrompi animazione automatica');
            announceToScreenReader('Animazione avviata');
            
            autoplayInterval = setInterval(() => {
                // Passa al prossimo elemento
                currentStopIndex = (currentStopIndex + 1) % timelineStops.length;
                goToStop(currentStopIndex);
            }, AUTOPLAY_INTERVAL);
        }
        
        // Funzione per andare a una specifica fermata
        function goToStop(index) {
            if (index >= 0 && index < timelineStops.length) {
                // Rimuovi le classi active/highlighted da tutti
                timelineStops.forEach(stop => {
                    stop.classList.remove('active', 'highlighted');
                    stop.removeAttribute('aria-current');
                });
                
                // Aggiorna l'indice corrente
                currentStopIndex = index;
                const targetStop = timelineStops[index];
                
                // Attiva la fermata selezionata
                targetStop.classList.add('active', 'highlighted');
                targetStop.setAttribute('aria-current', 'location');
                
                // Aggiorna i pallini indicatori
                const indicators = document.querySelectorAll('.timeline-indicator');
                indicators.forEach((indicator, i) => {
                    if (i === index) {
                        indicator.classList.add('active');
                    } else {
                        indicator.classList.remove('active');
                    }
                });
                
                // Scorri l'elemento nel centro della vista
                const stopRect = targetStop.getBoundingClientRect();
                const wrapperRect = timelineWrapper.getBoundingClientRect();
                const centerPosition = targetStop.offsetLeft - (wrapperRect.width / 2) + (stopRect.width / 2);
                
                timelineWrapper.scrollTo({
                    left: centerPosition,
                    behavior: getScrollBehavior()
                });
                
                // Se è attivo l'autoplay, resetta l'intervallo per evitare sovrapposizioni
                if (autoplayActive) {
                    clearInterval(autoplayInterval);
                    autoplayInterval = setInterval(() => {
                        currentStopIndex = (currentStopIndex + 1) % timelineStops.length;
                        goToStop(currentStopIndex);
                    }, AUTOPLAY_INTERVAL);
                }
                
                // Trova l'episodio corrispondente e scorri ad esso
                const episodeCards = document.querySelectorAll('.episode-card');
                episodeCards.forEach(card => {
                    const cardTitle = card.querySelector('h2').textContent.trim();
                    if (cardTitle.includes(locationName)) {
                        setTimeout(() => {
                            card.scrollIntoView({ 
                                behavior: getScrollBehavior(), 
                                block: 'center' 
                            });
                            card.classList.add('highlight-card');
                            setTimeout(() => {
                                card.classList.remove('highlight-card');
                            }, 2000);
                            
                            // Focus al contenuto per accessibilità
                            const heading = card.querySelector('h2');
                            if (heading) {
                                heading.setAttribute('tabindex', '-1');
                                heading.focus();
                                // Rimuovere il tabindex dopo il focus
                                setTimeout(() => {
                                    heading.removeAttribute('tabindex');
                                }, 100);
                            }
                            
                            // Riprodurre l'audio corrispondente se AmplitudeJS è disponibile
                            if (typeof Amplitude !== 'undefined') {
                                // Pausa qualsiasi traccia in riproduzione
                                if (Amplitude.getPlayerState() === 'playing') {
                                    Amplitude.pause();
                                }
                                
                                // Avvia la riproduzione della traccia corrispondente
                                if (index < Amplitude.getPlaylistSongs("episodi").length) {
                                    Amplitude.playPlaylistSongAtIndex(index, "episodi");
                                }
                            }
                        }, 300);
                    }
                });
            }
        }
        
        // Toggles the animation state
        animationControlButton.addEventListener('click', function() {
            if (autoplayActive) {
                stopAnimation();
            } else {
                startAnimation();
            }
        });
        
        // Ferma l'autoplay quando l'utente scorre manualmente
        timelineWrapper.addEventListener('scroll', () => {
            if (autoplayActive) {
                stopAnimation();
            }
        });
        
        // Ferma l'autoplay quando l'utente usa i controlli di navigazione
        prevButton.addEventListener('click', () => {
            if (autoplayActive) stopAnimation();
            
            currentStopIndex = Math.max(0, currentStopIndex - 1);
            goToStop(currentStopIndex);
        });
        
        nextButton.addEventListener('click', () => {
            if (autoplayActive) stopAnimation();
            
            currentStopIndex = Math.min(timelineStops.length - 1, currentStopIndex + 1);
            goToStop(currentStopIndex);
        });
        
        // Ferma l'autoplay quando l'utente clicca su una tappa
        timelineStops.forEach((stop, index) => {
            stop.addEventListener('click', function() {
                if (autoplayActive) stopAnimation();
                goToStop(index);
                
                // Ottieni il nome della location
                const locationName = this.querySelector('.timeline-stop-label').textContent;
                
                // Annuncia il cambio di posizione per gli screenreader
                announceToScreenReader(`Navigazione a ${locationName}`);
                
                // Trova l'episodio corrispondente e scorri ad esso
                const episodeCards = document.querySelectorAll('.episode-card');
                episodeCards.forEach(card => {
                    const cardTitle = card.querySelector('h2').textContent.trim();
                    if (cardTitle.includes(locationName)) {
                        setTimeout(() => {
                            card.scrollIntoView({ 
                                behavior: getScrollBehavior(), 
                                block: 'center' 
                            });
                            card.classList.add('highlight-card');
                            setTimeout(() => {
                                card.classList.remove('highlight-card');
                            }, 2000);
                            
                            // Focus al contenuto per accessibilità
                            const heading = card.querySelector('h2');
                            if (heading) {
                                heading.setAttribute('tabindex', '-1');
                                heading.focus();
                                // Rimuovere il tabindex dopo il focus
                                setTimeout(() => {
                                    heading.removeAttribute('tabindex');
                                }, 100);
                            }
                            
                            // Riprodurre l'audio corrispondente se AmplitudeJS è disponibile
                            if (typeof Amplitude !== 'undefined') {
                                // Pausa qualsiasi traccia in riproduzione
                                if (Amplitude.getPlayerState() === 'playing') {
                                    Amplitude.pause();
                                }
                                
                                // Avvia la riproduzione della traccia corrispondente
                                if (index < Amplitude.getPlaylistSongs("episodi").length) {
                                    Amplitude.playPlaylistSongAtIndex(index, "episodi");
                                }
                            }
                        }, 300);
                    }
                });
                
                // Supporto per la navigazione da tastiera
                stop.addEventListener('keydown', function(e) {
                    // Navigazione con freccia sinistra/destra
                    if (e.key === 'ArrowRight' && this.nextElementSibling) {
                        this.nextElementSibling.focus();
                    } else if (e.key === 'ArrowLeft' && this.previousElementSibling) {
                        this.previousElementSibling.focus();
                    }
                });
            });
        });
        
        // Aggiunta della navigazione da tastiera per il wrapper della timeline
        timelineWrapper.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                this.scrollBy({
                    left: -100,
                    behavior: getScrollBehavior()
                });
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                this.scrollBy({
                    left: 100,
                    behavior: getScrollBehavior()
                });
                e.preventDefault();
            }
        });
        
        // Rispetta la preferenza di riduzione movimento
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Disabilita l'autoplay per chi preferisce ridurre il movimento
            clearInterval(autoplayInterval);
            autoplayActive = false;
            
            const controlIcon = animationControlButton.querySelector('.control-icon i');
            const controlText = animationControlButton.querySelector('.control-text');
            
            controlIcon.className = 'fas fa-ban';
            controlText.textContent = "Animazione disabilitata";
            
            animationControlButton.disabled = true;
            animationControlButton.style.opacity = '0.5';
            animationControlButton.setAttribute('aria-disabled', 'true');
        } else {
            // Avvia l'animazione automatica all'apertura della pagina
            startAnimation();
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
    
    // Gestione dei pulsanti delle location
    const locationButtons = document.querySelectorAll('.tour-location');
    locationButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Qui potrebbe essere implementata la logica per la navigazione tra episodi
            const locationName = this.textContent;
            console.log(`Navigazione a: ${locationName}`);
            
            // Trova il corrispondente articolo e porta il focus ad esso
            // Implementazione da aggiungere quando avremo tutti gli episodi
        });
    });
});