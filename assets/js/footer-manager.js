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
     * Design migliorato con Tailwind CSS
     */
    const footerTemplate = `
        <footer class="mt-24 py-12 border-t border-gray-200 bg-white" role="contentinfo">
            <div class="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12 max-w-7xl">
                <!-- Sezione principale -->
                <div class="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
                    <div class="flex flex-col items-center md:items-start md:max-w-lg">
                        <div class="flex items-center mb-4 text-primary-dark">
                            <i class="fas fa-compass text-2xl mr-3" aria-hidden="true"></i>
                            <span class="font-semibold text-xl">Audioguida di Regalbuto</span>
                        </div>
                        <p id="copyright-text" class="text-sm font-medium text-gray-700 text-center md:text-left mb-4 max-w-md">
                            <span data-i18n-key="footer-prefix">Un progetto di </span>
                            <span class="no-translate font-medium text-primary-dark">Regalbuto Inside</span>
                            <span data-i18n-key="footer-suffix"> concesso in </span>
                            <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.it" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary-dark underline transition-colors" data-i18n-key="footer-license">Licenza CC BY-SA 4.0</a>
                        </p>
                    </div>
                    
                    <div class="flex flex-col items-center md:items-end">
                        <div class="flex space-x-5 mb-4">
                            <a href="https://www.instagram.com/regalbuto_inside" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-primary transition-colors" aria-label="Instagram">
                                <i class="fab fa-instagram text-2xl" aria-hidden="true"></i>
                            </a>
                            <a href="https://www.tiktok.com/@regalbuto_inside" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-primary transition-colors" aria-label="TikTok">
                                <i class="fab fa-tiktok text-2xl" aria-hidden="true"></i>
                            </a>
                            <a href="https://open.spotify.com/show/66SgYPSDmusImpk80QtIPJ" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-primary transition-colors" aria-label="Spotify">
                                <i class="fab fa-spotify text-2xl" aria-hidden="true"></i>
                            </a>
                        </div>
                        <div class="flex items-center">
                            <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.it" target="_blank" rel="noopener noreferrer" aria-label="Licenza Creative Commons Attribution-ShareAlike 4.0" class="hover:opacity-90 transition-opacity">
                                <img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-sa.svg" alt="Licenza Creative Commons Attribution-ShareAlike 4.0" width="88" height="31" class="mr-2">
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Sezione contributori - Design migliorato -->
                <div class="mt-10 pt-8 border-t border-gray-100">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Contenuti -->
                        <div class="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all hover:shadow-md">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                    <i class="fas fa-edit text-primary"></i>
                                </div>
                                <h4 class="font-medium text-gray-800" data-i18n-key="content-creators">Contenuti</h4>
                            </div>
                            <div class="pl-1">
                                <p class="text-sm text-gray-600">
                                    <span class="text-gray-700">Chiara Adornetto</span>,
                                    <span class="text-gray-700">Alice Pulvirenti</span>,
                                    <span class="text-gray-700">Pia Valentina Surbando Licari</span>
                                    <span class="block mt-2 text-xs text-gray-500">Regalbuto Inside</span>
                                </p>
                            </div>
                        </div>
                        
                        <!-- Sviluppo web -->
                        <div class="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all hover:shadow-md">
                            <div class="flex items-center mb-3">
                                <div class="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mr-3">
                                    <i class="fas fa-code text-secondary"></i>
                                </div>
                                <h4 class="font-medium text-gray-800" data-i18n-key="development">Sviluppo Web</h4>
                            </div>
                            <div class="pl-1">
                                <p class="text-sm text-gray-600">
                                    <span class="text-gray-700">Dennis Angemi</span>
                                    <span class="block mt-2 text-xs text-gray-500">
                                        <a href="https://www.magnetico.cloud/" target="_blank" rel="noopener noreferrer" class="text-secondary hover:text-secondary-dark transition-colors flex items-center">
                                            <i class="fas fa-external-link-alt mr-1"></i>
                                            <span data-i18n-key="visit-magnetico">Magnetico Associazione Culturale</span>
                                        </a>
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Link e info licenza -->
                <div class="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between">
                    <div class="flex justify-center md:justify-start space-x-6 mb-5 md:mb-0">
                        <a href="fonti.html" class="text-gray-600 hover:text-primary transition-colors text-sm flex items-center" data-i18n-key="sources">
                            <i class="fas fa-book mr-1.5"></i> Fonti
                        </a>
                        <a href="https://github.com/regalbutoinside/audioguida/issues" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-primary transition-colors text-sm flex items-center" data-i18n-key="reports">
                            <i class="fas fa-bug mr-1.5"></i> Segnalazioni
                        </a>
                    </div>
                    
                    <div class="text-xs text-gray-500 md:text-right md:max-w-lg text-center">
                        <span data-i18n-key="license-explanation" class="italic">
                            Questa licenza richiede che i riutilizzatori diano credito al creatore e concedano in licenza il materiale modificato con termini identici.
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    `;

    /**
     * Inizializza il footer manager e inserisce il footer nella pagina
     */
    function initialize() {
        // Crea un container temporaneo per convertire la stringa HTML in elementi DOM
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = footerTemplate.trim();
        
        // Estrai il footer dal container temporaneo
        footerElement = tempContainer.firstChild;
        
        // Cerca un elemento placeholder per il footer
        const footerPlaceholder = document.getElementById('footer-placeholder');
        
        if (footerPlaceholder) {
            // Se esiste un placeholder, inserisci il footer al suo posto
            footerPlaceholder.parentNode.replaceChild(footerElement, footerPlaceholder);
            console.log('Footer inserito nel placeholder');
        } else {
            // Se non esiste un placeholder, aggiungi il footer alla fine del body come fallback
            document.body.appendChild(footerElement);
            console.log('Footer aggiunto alla fine del body (nessun placeholder trovato)');
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
                'footer-prefix': 'Un progetto di ',
                'footer-suffix': ' concesso in ',
                'footer-license': 'Licenza CC BY-SA 4.0',
                'contributors-heading': 'Contributori',
                'content-creators': 'Contenuti',
                'development': 'Sviluppo Web',
                'visit-magnetico': 'Magnetico Associazione Culturale',
                'sources': 'Fonti',
                'reports': 'Segnalazioni',
                'license-explanation': 'Questa licenza richiede che i riutilizzatori diano credito al creatore e concedano in licenza il materiale modificato con termini identici.'
            },
            'en': {
                'footer-prefix': 'A project by ',
                'footer-suffix': ' released under ',
                'footer-license': 'CC BY-SA 4.0 License',
                'contributors-heading': 'Contributors',
                'content-creators': 'Content',
                'development': 'Web Development',
                'visit-magnetico': 'Magnetico Cultural Association',
                'sources': 'Sources',
                'reports': 'Report Issues',
                'license-explanation': 'This license requires reusers to give credit to the creator and license derivative materials under identical terms.'
            },
            'es': {
                'footer-prefix': 'Un proyecto de ',
                'footer-suffix': ' bajo ',
                'footer-license': 'Licencia CC BY-SA 4.0',
                'contributors-heading': 'Colaboradores',
                'content-creators': 'Contenidos',
                'development': 'Desarrollo Web',
                'visit-magnetico': 'Magnetico Asociación Cultural',
                'sources': 'Fuentes',
                'reports': 'Informar Problemas',
                'license-explanation': 'Esta licencia requiere que los reutilizadores den crédito al creador y licencien el material modificado en términos idénticos.'
            },
            'de': {
                'footer-prefix': 'Ein Projekt von ',
                'footer-suffix': ' unter ',
                'footer-license': 'CC BY-SA 4.0 Lizenz',
                'contributors-heading': 'Mitwirkende',
                'content-creators': 'Inhalt',
                'development': 'Webentwicklung',
                'visit-magnetico': 'Magnetico Kulturverein',
                'sources': 'Quellen',
                'reports': 'Probleme Melden',
                'license-explanation': 'Diese Lizenz verlangt von den Wiederverwendern, den Urheber zu nennen und abgeleitetes Material unter identischen Bedingungen zu lizenzieren.'
            },
            'fr': {
                'footer-prefix': 'Un projet par ',
                'footer-suffix': ' sous ',
                'footer-license': 'Licence CC BY-SA 4.0',
                'contributors-heading': 'Contributeurs',
                'content-creators': 'Contenu',
                'development': 'Développement Web',
                'visit-magnetico': 'Magnetico Association Culturelle',
                'sources': 'Sources',
                'reports': 'Signaler des Problèmes',
                'license-explanation': 'Cette licence exige que les réutilisateurs créditent le créateur et accordent une licence aux matériaux dérivés selon des termes identiques.'
            }
        };

        // Aggiorna ogni elemento con attributo data-i18n-key nel footer
        footerElement.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            
            // Prima controlla se la traduzione è nelle uiTranslations di LanguageManager
            if (window.LanguageManager && window.LanguageManager.getUITranslation) {
                const translation = window.LanguageManager.getUITranslation(key);
                if (translation !== key) {
                    if (element.tagName === 'A' || element.tagName === 'SPAN') {
                        element.textContent = translation;
                    }
                    return; // Traduzione trovata in LanguageManager, salta il resto
                }
            }
            
            // Altrimenti controlla nelle traduzioni specifiche del footer
            if (footerTranslations[currentLang] && footerTranslations[currentLang][key]) {
                // Se è un elemento link o span, preserva gli attributi e aggiorna solo il testo
                if (element.tagName === 'A' || element.tagName === 'SPAN' || element.tagName === 'H4') {
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