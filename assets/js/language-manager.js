/**
 * Language Manager - Sistema di gestione multilingua per l'audioguida di Regalbuto
 */
const LanguageManager = (function() {
    // Elenco delle lingue supportate
    const supportedLanguages = ['it', 'en', 'es', 'de', 'fr'];
    
    // Lingua predefinita
    const defaultLanguage = 'it';
    
    // Mappa delle traduzioni UI che non sono nel file JSON
    const uiTranslations = {
        'it': {
            'tourButton': 'Inizia il tour',
            'showTranscription': 'Mostra trascrizione',
            'hideTranscription': 'Nascondi trascrizione',
            'locations': 'Tappe',
            'history': 'Storia',
            'map': 'Mappa',
            'locationNumber': 'Tappa',
            'locationOnMaps': 'Posizione su Maps',
            'skipToContent': 'Salta al contenuto principale',
            'footer': '2025 Audio guida di Regalbuto. Un progetto di',
            'findOutStops': 'Scopri le tappe',
            'discoverStops': 'Scopri tutte le tappe',
            'scrollToStops': 'Scorri verso le tappe del tour'
        },
        'en': {
            'tourButton': 'Start the tour',
            'showTranscription': 'Show transcription',
            'hideTranscription': 'Hide transcription',
            'locations': 'Stops',
            'history': 'History',
            'map': 'Map',
            'locationNumber': 'Stop',
            'locationOnMaps': 'View on Maps',
            'skipToContent': 'Skip to main content',
            'footer': '2025 Regalbuto Audio Guide. A project by',
            'findOutStops': 'Discover the stops',
            'discoverStops': 'Discover all stops',
            'scrollToStops': 'Scroll to tour stops'
        },
        'es': {
            'tourButton': 'Iniciar el tour',
            'showTranscription': 'Mostrar transcripción',
            'hideTranscription': 'Ocultar transcripción',
            'locations': 'Paradas',
            'history': 'Historia',
            'map': 'Mapa',
            'locationNumber': 'Parada',
            'locationOnMaps': 'Ver en Maps',
            'skipToContent': 'Saltar al contenido principal',
            'footer': '2025 Guía de Audio de Regalbuto. Un proyecto de',
            'findOutStops': 'Descubre las paradas',
            'discoverStops': 'Descubre todas las paradas',
            'scrollToStops': 'Desplázate a las paradas del tour'
        },
        'de': {
            'tourButton': 'Tour starten',
            'showTranscription': 'Transkription anzeigen',
            'hideTranscription': 'Transkription ausblenden',
            'locations': 'Stationen',
            'history': 'Geschichte',
            'map': 'Karte',
            'locationNumber': 'Station',
            'locationOnMaps': 'Auf Maps anzeigen',
            'skipToContent': 'Zum Hauptinhalt springen',
            'footer': '2025 Audioguide von Regalbuto. Ein Projekt von',
            'findOutStops': 'Entdecke die Stationen',
            'discoverStops': 'Entdecke alle Stationen',
            'scrollToStops': 'Zu den Tour-Stationen scrollen'
        },
        'fr': {
            'tourButton': 'Commencer la visite',
            'showTranscription': 'Afficher la transcription',
            'hideTranscription': 'Masquer la transcription',
            'locations': 'Étapes',
            'history': 'Histoire',
            'map': 'Carte',
            'locationNumber': 'Étape',
            'locationOnMaps': 'Voir sur Maps',
            'skipToContent': 'Passer au contenu principal',
            'footer': '2025 Guide audio de Regalbuto. Un projet de',
            'findOutStops': 'Découvrez les étapes',
            'discoverStops': 'Découvrez toutes les étapes',
            'scrollToStops': 'Défiler vers les étapes de la visite'
        }
    };
    
    // Lingua corrente (impostata dal localStorage o dal default)
    let currentLang = localStorage.getItem('preferredLanguage') || defaultLanguage;
    
    // Riferimento ai dati del tour
    let tourData = null;
    
    /**
     * Inizializza il gestore della lingua
     * @param {Object} data - I dati JSON dell'audioguida
     */
    function initialize(data) {
        tourData = data;
        
        // Verifica che la lingua salvata sia supportata
        if (!supportedLanguages.includes(currentLang)) {
            currentLang = defaultLanguage;
            localStorage.setItem('preferredLanguage', currentLang);
        }
        
        // Imposta l'attributo lang nell'HTML anche all'inizializzazione
        document.documentElement.setAttribute('lang', currentLang);
        
        // Imposta la lingua corrente nell'interfaccia
        setLanguageInUI();
        
        // Configurazione dei pulsanti di selezione lingua
        setupLanguageSelectors();
        
        console.log(`Language Manager inizializzato con lingua: ${currentLang}`);
        
        // Emetti un evento per informare che la lingua è stata impostata
        document.dispatchEvent(new CustomEvent('languageSet', {
            detail: { language: currentLang }
        }));
    }
    
    /**
     * Configura i selettori della lingua (desktop e mobile)
     */
    function setupLanguageSelectors() {
        // Selettore lingua desktop
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const lang = this.getAttribute('data-lang');
                changeLanguage(lang);
            });
        });
        
        // Selettore lingua mobile
        document.querySelectorAll('.language-option-mobile').forEach(option => {
            option.addEventListener('click', function() {
                const lang = this.getAttribute('data-lang');
                changeLanguage(lang);
                
                // Rimuovi selezione precedente
                document.querySelectorAll('.language-option-mobile').forEach(opt => 
                    opt.classList.remove('border-primary', 'bg-primary/10'));
                
                // Evidenzia opzione selezionata
                this.classList.add('border-primary', 'bg-primary/10');
                
                // Chiudi il menu mobile quando si seleziona una lingua
                const mobileMenu = document.getElementById('mobile-menu');
                const mobileMenuButton = document.getElementById('mobile-menu-button');
                
                if (mobileMenu && mobileMenu.classList.contains('open')) {
                    mobileMenu.classList.remove('open');
                    mobileMenu.setAttribute('aria-hidden', 'true');
                    if (mobileMenuButton) {
                        mobileMenuButton.setAttribute('aria-expanded', 'false');
                        mobileMenuButton.classList.remove('menu-open');
                    }
                    document.body.classList.remove('overflow-hidden');
                }
            });
        });
        
        // Imposta la lingua corrente nei selettori
        highlightCurrentLanguage();
    }
    
    /**
     * Evidenzia la lingua corrente nei selettori
     */
    function highlightCurrentLanguage() {
        // Selettore desktop
        document.querySelector('.current-language').textContent = getLanguageDisplayName(currentLang);
        
        // Selettore mobile
        document.querySelectorAll('.language-option-mobile').forEach(option => {
            const lang = option.getAttribute('data-lang');
            if (lang === currentLang) {
                option.classList.add('border-primary', 'bg-primary/10');
            } else {
                option.classList.remove('border-primary', 'bg-primary/10');
            }
        });
    }
    
    /**
     * Ottiene il nome visualizzato di una lingua
     */
    function getLanguageDisplayName(code) {
        const names = {
            'it': 'Italiano',
            'en': 'English',
            'es': 'Español',
            'de': 'Deutsch',
            'fr': 'Français'
        };
        return names[code] || code;
    }
    
    /**
     * Cambia la lingua corrente e aggiorna l'interfaccia
     * @param {string} lang - Il codice della lingua
     */
    function changeLanguage(lang) {
        if (!supportedLanguages.includes(lang) || lang === currentLang) {
            return; // Lingua non supportata o già attiva
        }
        
        // Salva la nuova lingua
        currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        
        console.log(`Lingua cambiata a: ${lang}`);
        
        // Aggiorna l'attributo lang dell'HTML
        document.documentElement.setAttribute('lang', lang);
        
        // Aggiorna l'interfaccia
        setLanguageInUI();
        
        // Evidenzia la lingua corrente nei selettori
        highlightCurrentLanguage();
        
        // Emetti un evento per informare altri componenti del cambio di lingua
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));
    }
    
    /**
     * Imposta la lingua nell'interfaccia utente
     */
    function setLanguageInUI() {
        if (!tourData || !tourData.tour || !tourData.tour.content[currentLang]) {
            console.error(`Dati della lingua ${currentLang} non disponibili`);
            return;
        }
        
        // Aggiorna gli elementi UI hardcoded
        updateUIText();
        
        // Se la pagina è stata già inizializzata, ricarica i contenuti
        if (document.querySelector('.timeline-stops')) {
            // Questo evento verrà gestito da main.js per ricaricare i contenuti
            document.dispatchEvent(new CustomEvent('reloadContent', {
                detail: { language: currentLang }
            }));
        }
    }
    
    /**
     * Aggiorna i testi dell'interfaccia con le traduzioni
     */
    function updateUIText() {
        const translations = uiTranslations[currentLang];
        if (!translations) return;
        
        // Pulsanti "Inizia il tour"
        document.querySelectorAll('.tour-button').forEach(button => {
            const icon = button.querySelector('i');
            button.innerHTML = '';
            if (icon) button.appendChild(icon);
            button.innerHTML += ` ${translations.tourButton}`;
        });
        
        // Link di navigazione
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === '#tour-timeline') {
                link.textContent = translations.locations;
            } else if (href === '#') {
                link.textContent = translations.history;
            } else if (href === 'mappa.html') {
                link.textContent = translations.map;
            }
        });
        
        // Scopri le tappe
        const findOutStops = document.querySelector('[aria-label="Scorri verso le tappe del tour"]');
        if (findOutStops) {
            const span = findOutStops.querySelector('span');
            if (span) span.textContent = translations.findOutStops;
            findOutStops.setAttribute('aria-label', translations.scrollToStops);
        }
        
        // Link scopri tutte le tappe
        const discoverAllStops = document.querySelector('[href="#tour-timeline"].group');
        if (discoverAllStops) {
            const span = discoverAllStops.querySelector('span') || discoverAllStops;
            span.textContent = translations.discoverStops;
        }
        
        // Skip link accessibilità
        const skipLink = document.querySelector('.skip-to-content');
        if (skipLink) skipLink.textContent = translations.skipToContent;
        
        // Footer
        const footer = document.querySelector('footer p');
        if (footer) {
            const link = footer.querySelector('a');
            const linkText = link ? link.textContent : 'Regalbuto Inside';
            footer.innerHTML = `${translations.footer} <a href="#" class="footer-link">${linkText}</a>.`;
        }
    }
    
    /**
     * Ottiene la lingua corrente
     */
    function getCurrentLanguage() {
        return currentLang;
    }
    
    /**
     * Traduce un testo specifico dell'UI
     */
    function getUITranslation(key) {
        const translations = uiTranslations[currentLang];
        return translations && translations[key] ? translations[key] : key;
    }
    
    // API pubblica
    return {
        initialize,
        changeLanguage,
        getCurrentLanguage,
        getUITranslation,
        supportedLanguages
    };
})();

// Esposizione globale per l'uso in altri file
window.LanguageManager = LanguageManager;