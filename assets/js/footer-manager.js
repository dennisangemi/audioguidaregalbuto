/**
 * Footer Manager - Sistema per la gestione modulare del footer dell'audioguida di Regalbuto
 * Questo script inserisce il footer in tutte le pagine e gestisce la traduzione dei contenuti
 */
const FooterManager = (function() {
    // Riferimento all'elemento del footer che verrà creato
    let footerElement = null;

    /**
     * Template HTML del footer con supporto multilingua
     * Utilizza attributi data-i18n-key per la traduzione automatica
     */
    const footerTemplate = `
        <footer class="mt-24 py-10 border-t border-gray-200 bg-white" role="contentinfo">
            <div class="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12 max-w-7xl">
                <div class="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
                    <div class="flex flex-col items-center md:items-start">
                        <div class="flex items-center mb-3 text-primary-dark">
                            <i class="fas fa-compass text-xl mr-2" aria-hidden="true"></i>
                            <span class="font-semibold text-lg">Audioguida di Regalbuto</span>
                        </div>
                        <p id="copyright-text" class="text-sm font-medium text-gray-700 text-center md:text-left mb-4 max-w-md">
                            <span data-i18n-key="footer-prefix">Un progetto di </span>
                            <span class="no-translate">Regalbuto Inside</span>
                            <span data-i18n-key="footer-suffix"> concesso in </span>
                            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary-dark underline" data-i18n-key="footer-license">Licenza CC BY-SA 4.0</a>
                        </p>
                    </div>
                    
                    <div class="flex flex-col items-center md:items-end">
                        <div class="flex space-x-4 mb-3">
                            <a href="https://www.instagram.com/regalbuto_inside" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-primary transition-colors" aria-label="Instagram">
                                <i class="fab fa-instagram text-xl" aria-hidden="true"></i>
                            </a>
                            <a href="https://www.tiktok.com/@regalbuto_inside" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-primary transition-colors" aria-label="TikTok">
                                <i class="fab fa-tiktok text-xl" aria-hidden="true"></i>
                            </a>
                            <a href="https://open.spotify.com/show/66SgYPSDmusImpk80QtIPJ" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-primary transition-colors" aria-label="Spotify">
                                <i class="fab fa-spotify text-xl" aria-hidden="true"></i>
                            </a>
                        </div>
                        <div class="flex items-center">
                            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" aria-label="Licenza Creative Commons Attribution-ShareAlike 4.0">
                                <img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-sa.svg" alt="Licenza Creative Commons Attribution-ShareAlike 4.0" width="88" height="31" class="mr-2">
                            </a>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between">
                    <div class="mb-4 md:mb-0 text-center md:text-left text-sm text-gray-600">
                        <span data-i18n-key="contributors-prefix">Hanno contribuito: </span>
                        <span class="font-medium">Chiara Adornetto, Alice Pulvirenti, Pia Valentina Surbando Licari</span>
                        <span data-i18n-key="contributors-content"> per i contenuti; </span>
                        <span class="font-medium">Dennis Angemi</span>
                        <span data-i18n-key="contributors-dev"> per lo sviluppo web.</span>
                    </div>
                    <div class="flex justify-center md:justify-end">
                        <a href="fonti.html" class="text-gray-600 hover:text-primary transition-colors mr-4 text-sm" data-i18n-key="sources">Fonti</a>
                        <a href="https://github.com/regalbutoinside/audioguida/issues" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-primary transition-colors text-sm" data-i18n-key="reports">Segnalazioni</a>
                    </div>
                </div>
                
                <div class="mt-4 text-xs text-gray-500 max-w-3xl text-center mx-auto" data-i18n-key="license-explanation">
                    Questa licenza richiede che i riutilizzatori 1. diano credito al creatore; 2. concedano in licenza il materiale modificato con termini identici. Consente ai riutilizzatori di distribuire, remixare, adattare e sviluppare il materiale in qualsiasi mezzo o formato.
                </div>
            </div>
        </footer>
    `;

    /**
     * Inizializza il footer manager e inserisce il footer nella pagina
     */
    function initialize() {
        // Aggiungi il footer alla fine del corpo della pagina
        if (!document.querySelector('footer[role="contentinfo"]')) {
            // Crea un container temporaneo per convertire la stringa HTML in elementi DOM
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = footerTemplate.trim();
            
            // Estrai il footer dal container temporaneo
            footerElement = tempContainer.firstChild;
            
            // Aggiungi il footer alla fine del body
            document.body.appendChild(footerElement);
            
            console.log('Footer aggiunto dinamicamente');
        } else {
            // Il footer è già presente nel DOM
            footerElement = document.querySelector('footer[role="contentinfo"]');
            console.log('Footer esistente trovato nel DOM');
        }

        // Aggiungi listener per gli eventi di lingua
        setupLanguageListeners();

        // Aggiorna immediatamente i testi in base alla lingua corrente
        updateFooterLanguage();
    }

    /**
     * Configura i listener per gli eventi di cambio lingua
     */
    function setupLanguageListeners() {
        // Ascolta l'evento languageChanged emesso dal LanguageManager
        document.addEventListener('languageChanged', function(event) {
            if (event.detail && event.detail.language) {
                updateFooterLanguage(event.detail.language);
            }
        });

        // Ascolta anche l'evento iniziale languageSet
        document.addEventListener('languageSet', function(event) {
            if (event.detail && event.detail.language) {
                updateFooterLanguage(event.detail.language);
            }
        });
    }

    /**
     * Aggiorna tutti i testi del footer in base alla lingua corrente
     * @param {string} [lang] - Codice lingua (opzionale, altrimenti usa la lingua corrente del LanguageManager)
     */
    function updateFooterLanguage(lang) {
        // Se non è fornita una lingua specifica, usa quella corrente del LanguageManager
        const currentLang = lang || (window.LanguageManager ? window.LanguageManager.getCurrentLanguage() : 'it');
        
        if (!footerElement) return;

        // Traduzioni specifiche per il footer che non sono incluse nel language-manager
        const footerTranslations = {
            'it': {
                'contributors-prefix': 'Hanno contribuito: ',
                'contributors-content': ' per i contenuti; ',
                'contributors-dev': ' per lo sviluppo web.',
                'sources': 'Fonti',
                'reports': 'Segnalazioni',
                'license-explanation': 'Questa licenza richiede che i riutilizzatori 1. diano credito al creatore; 2. concedano in licenza il materiale modificato con termini identici. Consente ai riutilizzatori di distribuire, remixare, adattare e sviluppare il materiale in qualsiasi mezzo o formato.'
            },
            'en': {
                'contributors-prefix': 'Contributors: ',
                'contributors-content': ' for contents; ',
                'contributors-dev': ' for web development.',
                'sources': 'Sources',
                'reports': 'Report Issues',
                'license-explanation': 'This license requires reusers to 1. give credit to the creator; 2. license derivative materials under identical terms. It allows reusers to distribute, remix, adapt, and build upon the material in any medium or format.'
            },
            'es': {
                'contributors-prefix': 'Colaboradores: ',
                'contributors-content': ' para los contenidos; ',
                'contributors-dev': ' para el desarrollo web.',
                'sources': 'Fuentes',
                'reports': 'Informar Problemas',
                'license-explanation': 'Esta licencia requiere que los reutilizadores 1. den crédito al creador; 2. licencien el material modificado en términos idénticos. Permite a los reutilizadores distribuir, remezclar, adaptar y construir sobre el material en cualquier medio o formato.'
            },
            'de': {
                'contributors-prefix': 'Mitwirkende: ',
                'contributors-content': ' für Inhalte; ',
                'contributors-dev': ' für Webentwicklung.',
                'sources': 'Quellen',
                'reports': 'Probleme Melden',
                'license-explanation': 'Diese Lizenz verlangt von den Wiederverwendern 1. Nennung des Urhebers; 2. Lizenzierung abgeleiteter Materialien unter identischen Bedingungen. Sie erlaubt die Verbreitung, Remixen, Anpassen und Aufbauen auf dem Material in jedem Medium oder Format.'
            },
            'fr': {
                'contributors-prefix': 'Contributeurs: ',
                'contributors-content': ' pour les contenus; ',
                'contributors-dev': ' pour le développement web.',
                'sources': 'Sources',
                'reports': 'Signaler des Problèmes',
                'license-explanation': 'Cette licence exige que les réutilisateurs 1. créditent le créateur; 2. licencent les dérivés dans des termes identiques. Elle permet aux réutilisateurs de distribuer, remixer, adapter et développer le contenu dans tout média ou format.'
            }
        };

        // Aggiorna ogni elemento con attributo data-i18n-key nel footer
        footerElement.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            
            // Prima controlla se la traduzione è nelle uiTranslations di LanguageManager
            if (window.LanguageManager && window.LanguageManager.getUITranslation) {
                const translation = window.LanguageManager.getUITranslation(key);
                if (translation !== key) {
                    element.textContent = translation;
                    return; // Traduzione trovata in LanguageManager, salta il resto
                }
            }
            
            // Altrimenti controlla nelle traduzioni specifiche del footer
            if (footerTranslations[currentLang] && footerTranslations[currentLang][key]) {
                // Se è un elemento link, preserva gli attributi
                if (element.tagName === 'A') {
                    element.textContent = footerTranslations[currentLang][key];
                } else {
                    element.textContent = footerTranslations[currentLang][key];
                }
            }
        });

        // Aggiorna il link alla licenza per puntare alla versione nella lingua corrente
        const licenseLink = footerElement.querySelector('a[href*="creativecommons.org"]');
        if (licenseLink) {
            const ccLangMapping = {
                'it': 'deed.it',
                'en': 'deed.en',
                'es': 'deed.es',
                'de': 'deed.de',
                'fr': 'deed.fr'
            };
            
            // Aggiorna l'URL con la parte specifica della lingua
            const baseUrl = 'https://creativecommons.org/licenses/by-sa/4.0/';
            licenseLink.href = baseUrl + (ccLangMapping[currentLang] || 'deed.it');
        }
    }

    // Esponi l'API pubblica
    return {
        initialize,
        updateFooterLanguage
    };
})();

// Inizializza il footer quando il DOM è completamente caricato
document.addEventListener('DOMContentLoaded', function() {
    FooterManager.initialize();
});