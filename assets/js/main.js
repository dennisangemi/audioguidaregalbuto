document.addEventListener('DOMContentLoaded', function() {
    // Gestione delle trascrizioni - migliorata per accessibilità
    const toggleButtons = document.querySelectorAll('.toggle-transcript');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const transcriptContainer = document.getElementById(targetId);
            const toggleIcon = this.querySelector('.toggle-icon');
            
            // Toggle della classe expanded
            transcriptContainer.classList.toggle('expanded');
            toggleIcon.classList.toggle('rotate-icon');
            
            // Aggiorniamo ARIA attributes per l'accessibilità
            const isExpanded = transcriptContainer.classList.contains('expanded');
            this.setAttribute('aria-expanded', isExpanded);
            transcriptContainer.setAttribute('aria-hidden', !isExpanded);
            
            // Cambiamo il testo del pulsante in base allo stato
            const buttonText = this.querySelector('span');
            if (isExpanded) {
                buttonText.textContent = 'Nascondi trascrizione';
                // Focus sul contenitore della trascrizione per gli screen reader
                transcriptContainer.setAttribute('tabindex', '-1');
                transcriptContainer.focus();
            } else {
                buttonText.textContent = 'Mostra trascrizione completa';
                transcriptContainer.removeAttribute('tabindex');
            }
        });
    });
    
    // Funzionalità per la timeline scorrevole - migliorata per accessibilità
    const timelineWrapper = document.querySelector('.timeline-track-wrapper');
    const timelineTrack = document.querySelector('.timeline-track');
    const prevButton = document.querySelector('.timeline-control.prev');
    const nextButton = document.querySelector('.timeline-control.next');
    const timelineStops = document.querySelectorAll('.timeline-stop');
    
    if (timelineWrapper && timelineTrack && prevButton && nextButton) {
        // Imposta la prima tappa come attiva inizialmente
        if (timelineStops.length > 0) {
            timelineStops[0].classList.add('active');
            timelineStops[0].setAttribute('aria-current', 'location');
        }
        
        // Funzione per scorrere a sinistra
        prevButton.addEventListener('click', function() {
            timelineWrapper.scrollBy({
                left: -300,
                behavior: getScrollBehavior()
            });
        });
        
        // Funzione per scorrere a destra
        nextButton.addEventListener('click', function() {
            timelineWrapper.scrollBy({
                left: 300,
                behavior: getScrollBehavior()
            });
        });
        
        // Gestione click sulle tappe della timeline - migliorata per accessibilità
        timelineStops.forEach(stop => {
            stop.addEventListener('click', function() {
                // Rimuovi la classe active e aria-current da tutti gli elementi
                timelineStops.forEach(s => {
                    s.classList.remove('active');
                    s.removeAttribute('aria-current');
                });
                
                // Aggiungi la classe active e aria-current all'elemento cliccato
                this.classList.add('active');
                this.setAttribute('aria-current', 'location');
                
                // Ottieni il nome della location
                const locationName = this.querySelector('.timeline-stop-label').textContent;
                
                // Annuncia il cambio di posizione per gli screenreader
                announceToScreenReader(`Navigazione a ${locationName}`);
                
                // Scorri l'elemento al centro del viewport
                const stopRect = this.getBoundingClientRect();
                const wrapperRect = timelineWrapper.getBoundingClientRect();
                const centerPosition = stopRect.left - wrapperRect.left + (stopRect.width / 2) - (wrapperRect.width / 2);
                
                timelineWrapper.scrollBy({
                    left: centerPosition,
                    behavior: getScrollBehavior()
                });
                
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
                                // Rimuovere il tabindex dopo il focus per mantenere un DOM pulito
                                setTimeout(() => {
                                    heading.removeAttribute('tabindex');
                                }, 100);
                            }
                        }, 300);
                    }
                });
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
    
    // Gestione dell'autoplay per l'iframe di Spotify
    const setupSpotifyAutoplay = () => {
        const spotifyIframe = document.querySelector('.intro-player iframe');
        if (!spotifyIframe) return;
        
        // Variabile per tracciare se l'autoplay è già stato tentato
        let autoplayAttempted = false;
        
        // Funzione per tentare l'autoplay
        const attemptAutoplay = () => {
            if (autoplayAttempted) return;
            autoplayAttempted = true;
            
            try {
                // Se l'iframe ha già l'autoplay, assicuriamoci che lo utilizzi
                if (!spotifyIframe.src.includes('autoplay=1')) {
                    spotifyIframe.src = spotifyIframe.src.includes('?') 
                        ? `${spotifyIframe.src}&autoplay=1` 
                        : `${spotifyIframe.src}?autoplay=1`;
                }
                
                // Proviamo a usare l'API postMessage per dare il focus all'iframe
                spotifyIframe.contentWindow.postMessage('{"method":"play"}', '*');
                
                console.log('Autoplay attempt triggered');
            } catch (e) {
                console.warn('Autoplay attempt failed:', e);
            }
        };
        
        // Tentiamo l'autoplay dopo che l'iframe è caricato
        spotifyIframe.addEventListener('load', () => {
            // Su alcuni browser, l'autoplay potrebbe funzionare direttamente
            setTimeout(() => {
                console.log('Initial autoplay attempt after iframe load');
            }, 1000);
        });
        
        // Tentiamo l'autoplay alla prima interazione dell'utente con la pagina
        const userInteractionEvents = ['click', 'touchstart', 'keydown', 'scroll'];
        
        const handleFirstInteraction = () => {
            attemptAutoplay();
            // Rimuoviamo tutti i listener dopo il primo tentativo
            userInteractionEvents.forEach(event => {
                document.removeEventListener(event, handleFirstInteraction);
            });
        };
        
        // Aggiungiamo i listener per la prima interazione
        userInteractionEvents.forEach(event => {
            document.addEventListener(event, handleFirstInteraction);
        });
    };
    
    // Inizializziamo l'autoplay di Spotify
    setupSpotifyAutoplay();
});