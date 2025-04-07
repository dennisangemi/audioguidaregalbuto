document.addEventListener('DOMContentLoaded', function() {
    // Selezioniamo tutti i pulsanti per mostrare/nascondere le trascrizioni
    const toggleButtons = document.querySelectorAll('.toggle-transcript');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Otteniamo l'ID della trascrizione associata
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
            } else {
                buttonText.textContent = 'Mostra trascrizione completa';
            }
        });
    });
    
    // Funzionalità per la timeline scorrevole - migliorata
    const timelineWrapper = document.querySelector('.timeline-track-wrapper');
    const timelineTrack = document.querySelector('.timeline-track');
    const prevButton = document.querySelector('.timeline-control.prev');
    const nextButton = document.querySelector('.timeline-control.next');
    const timelineStops = document.querySelectorAll('.timeline-stop');
    const scrollIndicator = document.querySelector('.timeline-scroll-indicator');
    
    // Se gli elementi esistono nella pagina
    if (timelineWrapper && timelineTrack && prevButton && nextButton) {
        // Mostra l'indicatore di scroll inizialmente
        if (scrollIndicator) {
            setTimeout(() => {
                scrollIndicator.classList.add('visible');
                
                // Nascondi l'indicatore dopo alcuni secondi
                setTimeout(() => {
                    scrollIndicator.classList.remove('visible');
                }, 3000);
            }, 1000);
        }
        
        // Imposta la prima tappa come attiva inizialmente
        if (timelineStops.length > 0) {
            timelineStops[0].classList.add('active');
        }
        
        // Funzione per scorrere a sinistra
        prevButton.addEventListener('click', function() {
            timelineWrapper.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
            
            if (scrollIndicator) scrollIndicator.classList.remove('visible');
        });
        
        // Funzione per scorrere a destra
        nextButton.addEventListener('click', function() {
            timelineWrapper.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
            
            if (scrollIndicator) scrollIndicator.classList.remove('visible');
        });
        
        // Gestione scroll per effetti UI
        timelineWrapper.addEventListener('scroll', function() {
            // Effetti durante lo scroll se necessari
        });
        
        // Gestione click sulle tappe della timeline - migliorata
        timelineStops.forEach(stop => {
            stop.addEventListener('click', function() {
                // Rimuovi la classe active da tutti gli elementi
                timelineStops.forEach(s => s.classList.remove('active'));
                
                // Aggiungi la classe active all'elemento cliccato
                this.classList.add('active');
                
                // Ottieni il nome della location
                const locationName = this.querySelector('.timeline-stop-label').textContent;
                
                // Scorri l'elemento al centro del viewport
                const stopRect = this.getBoundingClientRect();
                const wrapperRect = timelineWrapper.getBoundingClientRect();
                const centerPosition = stopRect.left - wrapperRect.left + (stopRect.width / 2) - (wrapperRect.width / 2);
                
                timelineWrapper.scrollBy({
                    left: centerPosition,
                    behavior: 'smooth'
                });
                
                // Trova l'episodio corrispondente e scorri ad esso
                const episodeCards = document.querySelectorAll('.episode-card');
                episodeCards.forEach(card => {
                    const cardTitle = card.querySelector('h2').textContent.trim();
                    if (cardTitle.includes(locationName)) {
                        setTimeout(() => {
                            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            card.classList.add('highlight-card');
                            setTimeout(() => {
                                card.classList.remove('highlight-card');
                            }, 2000);
                        }, 300);
                    }
                });
            });
        });
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