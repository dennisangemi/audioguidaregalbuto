/**
 * Gestione della mappa interattiva dell'audioguida di Regalbuto
 */
const AudioGuideMap = (function() {
    // Oggetti principali
    let map = null;
    let markers = {};
    
    // Configurazione
    const config = {
        defaultView: [37.6471, 14.6364], // Coordinate di Regalbuto
        defaultZoom: 15,
        markerColors: {
            default: '#6b46c1', // Colore primario
            active: '#10b981',  // Colore accent
            highlight: '#3b82f6' // Colore secondario
        }
    };
    
    // Dati delle tappe (verranno caricati dinamicamente dal JSON)
    let tourStops = [];
    
    /**
     * Inizializza la mappa con i dati delle tappe
     * @param {string} containerId - ID del container della mappa
     * @param {boolean} isFullPage - Indica se è la versione pagina intera della mappa
     */
    function initMap(containerId, isFullPage = false) {
        // Verifica se il container della mappa esiste
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
            console.error('Container della mappa non trovato:', containerId);
            return;
        }
        
        // Aggiungi la classe specifica se è la pagina dedicata
        if (isFullPage) {
            mapContainer.classList.add('map-page-container');
        }
        
        // Inizializzazione della mappa Leaflet
        map = L.map(containerId, {
            zoomControl: false,
            attributionControl: false
        }).setView(config.defaultView, config.defaultZoom);
        
        // Aggiunta del layer di mappa base (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Aggiunta controllo zoom in un'altra posizione
        L.control.zoom({
            position: 'bottomright'
        }).addTo(map);
        
        // Carica i dati delle tappe
        loadTourStops().then(() => {
            // Crea i marker sulla mappa
            createMarkers();
            
            // Inizializza i controlli della mappa
            initMapControls(containerId, isFullPage);
            
            // Inizializza gli eventi specifici della pagina
            if (isFullPage) {
                initFullPageEvents();
            }
            
            // Imposta la vista iniziale
            resetMapView();
        });
    }
    
    /**
     * Carica i dati delle tappe dal JSON
     */
    async function loadTourStops() {
        try {
            const response = await fetch('assets/data/audioguide.json');
            const data = await response.json();
            
            // Processa i dati e crea l'array delle tappe con coordinate
            const stops = data.tour.staticData.stops;
            
            // Se ci sono dati, mappa le tappe con il loro nome e coordinate
            if (stops && stops.length > 0) {
                // Coordinate approssimative per le tappe di Regalbuto (potrebbero essere migliorate con coordinate reali)
                const coordinates = {
                    piazza: [37.6471, 14.6364],
                    comune: [37.6471, 14.6363],
                    chiesa_madre: [37.6472, 14.6364],
                    lombardi: [37.6475, 14.6367],
                    campione: [37.6476, 14.6368],
                    corso: [37.6474, 14.6366],
                    santa_maria: [37.6473, 14.6363],
                    piano: [37.6473, 14.6370],
                    villa: [37.6472, 14.6373],
                    lago: [37.6255, 14.5970]
                };
                
                // Titoli in italiano per le tappe
                const titlesIT = data.tour.content.it.stops.map(stop => stop.title);
                
                // Costruisci l'array delle tappe completo
                tourStops = stops.map((stop, index) => {
                    return {
                        id: stop.id,
                        title: titlesIT[index] || `Tappa ${index + 1}`,
                        coordinates: coordinates[stop.id] || config.defaultView,
                        icon: stop.icon || 'fa-map-marker-alt',
                        order: stop.order || index + 1,
                        url: stop.googleMapsUrl || '#',
                        imagePath: stop.imagePath || ''
                    };
                });
                console.log('Tappe caricate:', tourStops);
            } else {
                console.warn('Nessuna tappa trovata nel JSON');
                // Usa dati di fallback
                tourStops = getDefaultTourStops();
            }
        } catch (error) {
            console.error('Errore durante il caricamento del JSON:', error);
            // Usa dati di fallback
            tourStops = getDefaultTourStops();
        }
    }
    
    /**
     * Fornisce dati di fallback nel caso il JSON non sia disponibile
     */
    function getDefaultTourStops() {
        return [
            { id: "piazza", title: "Piazza della Repubblica", coordinates: [37.6471, 14.6364], icon: "fa-map-marker-alt", order: 1 },
            { id: "comune", title: "Palazzo Comunale", coordinates: [37.6471, 14.6363], icon: "fa-landmark", order: 2 },
            { id: "chiesa_madre", title: "Chiesa Madre di San Basilio", coordinates: [37.6472, 14.6364], icon: "fa-church", order: 3 },
            { id: "lombardi", title: "Monumento R. Lombardi", coordinates: [37.6475, 14.6367], icon: "fa-monument", order: 4 },
            { id: "campione", title: "Monumento G. Campione", coordinates: [37.6476, 14.6368], icon: "fa-monument", order: 5 },
            { id: "corso", title: "Corso G.F. Ingrassia", coordinates: [37.6474, 14.6366], icon: "fa-road", order: 6 },
            { id: "santa_maria", title: "Chiesa Santa Maria La Croce", coordinates: [37.6473, 14.6363], icon: "fa-place-of-worship", order: 7 },
            { id: "piano", title: "Piazza Vittorio Veneto", coordinates: [37.6473, 14.6370], icon: "fa-square", order: 8 },
            { id: "villa", title: "Villa Comunale", coordinates: [37.6472, 14.6373], icon: "fa-tree", order: 9 },
            { id: "lago", title: "Lago Pozzillo", coordinates: [37.6255, 14.5970], icon: "fa-water", order: 10 }
        ];
    }
    
    /**
     * Crea i marker sulla mappa
     */
    function createMarkers() {
        // Cancella i marker esistenti
        if (Object.keys(markers).length > 0) {
            Object.values(markers).forEach(marker => {
                map.removeLayer(marker);
            });
            markers = {};
        }
        
        // Crea e aggiungi i marker alla mappa
        tourStops.forEach(stop => {
            const marker = L.marker(stop.coordinates, {
                icon: createCustomIcon(stop.icon),
                alt: stop.title,
                stopId: stop.id
            }).addTo(map);
            
            // Crea il popup con informazioni sulla tappa
            const popupContent = `
                <div class="text-center">
                    <h4>${stop.title}</h4>
                    <p class="text-sm">Tappa ${stop.order}</p>
                    <div class="flex justify-center mt-2">
                        <a href="index.html#${stop.id}" class="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors">
                            Vai all'audio
                        </a>
                    </div>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            markers[stop.id] = marker;
        });
    }
    
    /**
     * Crea un'icona personalizzata per il marker
     * @param {string} icon - Nome dell'icona Font Awesome
     * @param {string} color - Colore del marker (opzionale)
     * @returns {L.divIcon} Icona personalizzata per Leaflet
     */
    function createCustomIcon(icon, color = config.markerColors.default) {
        return L.divIcon({
            html: `<div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg border-2" style="border-color: ${color};"><i class="fas ${icon}" style="color: ${color};"></i></div>`,
            className: 'custom-marker-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    }
    
    /**
     * Inizializza i controlli della mappa
     * @param {string} containerId - ID del container della mappa
     * @param {boolean} isFullPage - Indica se è la versione pagina intera della mappa
     */
    function initMapControls(containerId, isFullPage) {
        // Pulsante di reset
        const resetBtn = document.getElementById('map-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetMapView);
        }
        
        // Pulsante di espansione (solo nella versione non fullpage)
        const expandBtn = document.getElementById('map-expand');
        if (expandBtn && !isFullPage) {
            expandBtn.addEventListener('click', toggleMapSize);
        }
        
        // Pulsante di localizzazione
        const locateBtn = document.getElementById('map-locate-me');
        if (locateBtn) {
            locateBtn.addEventListener('click', locateUser);
        }
        
        // Pulsante modalità schermo intero
        const fullscreenBtn = document.getElementById('map-fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }
        
        // Gestione dei pulsanti della lista delle tappe
        document.querySelectorAll('.map-button').forEach(button => {
            button.addEventListener('click', function() {
                const stopId = this.getAttribute('data-stop-id');
                highlightMarker(stopId);
                
                // Feedback visivo sul pulsante cliccato
                document.querySelectorAll('.map-button').forEach(btn => {
                    btn.classList.remove('border-primary', 'text-primary', 'bg-primary/5');
                });
                this.classList.add('border-primary', 'text-primary', 'bg-primary/5');
            });
        });
    }
    
    /**
     * Inizializza gli eventi specifici per la pagina dedicata alla mappa
     */
    function initFullPageEvents() {
        // Se si è nella pagina dedicata, aggiungere eventi specifici
        
        // Esempio: seleziona un marker quando si clicca sulla lista laterale
        document.querySelectorAll('.map-sidebar-item').forEach(item => {
            item.addEventListener('click', function() {
                const stopId = this.getAttribute('data-stop-id');
                highlightMarker(stopId);
                
                // Aggiunge classe attiva all'elemento cliccato
                document.querySelectorAll('.map-sidebar-item').forEach(el => {
                    el.classList.remove('active');
                });
                this.classList.add('active');
            });
        });
    }
    
    /**
     * Evidenzia un marker sulla mappa
     * @param {string} stopId - ID della tappa da evidenziare
     */
    function highlightMarker(stopId) {
        // Ripristina tutti i marker allo stato normale
        Object.values(markers).forEach(marker => {
            const id = marker.options.stopId;
            const stopData = tourStops.find(stop => stop.id === id);
            if (stopData) {
                marker.setIcon(createCustomIcon(stopData.icon));
            }
        });
        
        // Evidenzia il marker selezionato
        if (stopId && markers[stopId]) {
            const stopData = tourStops.find(stop => stop.id === stopId);
            if (stopData) {
                markers[stopId].setIcon(createCustomIcon(stopData.icon, config.markerColors.highlight));
                markers[stopId].openPopup();
                
                // Centra la mappa sul marker selezionato
                map.setView(markers[stopId].getLatLng(), 17);
            }
        }
    }
    
    /**
     * Reimposta la vista della mappa per mostrare tutti i marker
     */
    function resetMapView() {
        Object.values(markers).forEach(marker => {
            marker.setIcon(createCustomIcon(tourStops.find(stop => stop.id === marker.options.stopId).icon));
            marker.closePopup();
        });
        
        // Adatta la vista per mostrare tutti i marker
        const coordinates = tourStops.map(stop => stop.coordinates);
        if (coordinates.length > 0) {
            const bounds = L.latLngBounds(coordinates);
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 16
            });
        }
    }
    
    /**
     * Espande o riduce la dimensione della mappa
     */
    function toggleMapSize() {
        const mapContainer = document.getElementById('tour-map-container');
        if (!mapContainer) return;
        
        const isExpanded = mapContainer.classList.toggle('expanded');
        const expandText = document.getElementById('map-expand-text');
        if (expandText) {
            expandText.textContent = isExpanded ? 'Riduci' : 'Espandi';
        }
        
        // Attendere che la transizione CSS sia completa prima di aggiornare la mappa
        setTimeout(() => {
            map.invalidateSize();
            resetMapView();
        }, 300);
    }
    
    /**
     * Localizza l'utente sulla mappa
     */
    function locateUser() {
        const locateBtn = document.getElementById('map-locate-me');
        
        // Verifica se il browser supporta la geolocalizzazione
        if ("geolocation" in navigator) {
            // Attiva l'indicatore di caricamento
            if (locateBtn) locateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            navigator.geolocation.getCurrentPosition(position => {
                // Centra la mappa sulla posizione dell'utente
                const userLatLng = [position.coords.latitude, position.coords.longitude];
                map.setView(userLatLng, 15);
                
                // Aggiungi un marker per la posizione dell'utente
                const userIcon = L.divIcon({
                    html: `<div class="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg"><i class="fas fa-user text-white"></i></div>`,
                    className: 'user-location-icon',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });
                
                // Rimuovi marker precedenti se esistono
                if (window.userLocationMarker) {
                    map.removeLayer(window.userLocationMarker);
                }
                
                // Aggiungi nuovo marker
                window.userLocationMarker = L.marker(userLatLng, { icon: userIcon })
                    .addTo(map)
                    .bindPopup('La tua posizione attuale')
                    .openPopup();
                
                // Ripristina l'icona del pulsante
                if (locateBtn) locateBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            }, error => {
                console.error('Errore durante la geolocalizzazione:', error);
                alert('Non è stato possibile ottenere la tua posizione. Verifica di aver concesso i permessi di geolocalizzazione.');
                if (locateBtn) locateBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
            });
        } else {
            alert('Il tuo browser non supporta la geolocalizzazione.');
        }
    }
    
    /**
     * Attiva/disattiva la modalità a schermo intero
     */
    function toggleFullscreen() {
        const mapSection = document.getElementById('tour-map') || document.querySelector('.map-page-wrapper');
        if (!mapSection) return;
        
        if (!document.fullscreenElement) {
            if (mapSection.requestFullscreen) {
                mapSection.requestFullscreen();
            } else if (mapSection.webkitRequestFullscreen) {
                mapSection.webkitRequestFullscreen();
            } else if (mapSection.msRequestFullscreen) {
                mapSection.msRequestFullscreen();
            }
            
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    // Espone le funzioni pubbliche
    return {
        init: initMap,
        highlightMarker: highlightMarker,
        resetView: resetMapView
    };
})();

// Inizializza la mappa quando il documento è pronto, se siamo nella pagina della mappa
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se siamo nella pagina della mappa dedicata
    const isMapPage = document.querySelector('.map-page-wrapper') !== null;
    
    if (isMapPage) {
        // Inizializza la mappa a tutta pagina
        AudioGuideMap.init('tour-map-container', true);
        
        // Controlla se c'è un parametro 'stop' nell'URL e evidenzia quel marker
        const urlParams = new URLSearchParams(window.location.search);
        const stopId = urlParams.get('stop');
        
        if (stopId) {
            // Aspetta un momento per permettere alla mappa di caricarsi completamente
            setTimeout(() => {
                AudioGuideMap.highlightMarker(stopId);
                
                // Evidenzia anche l'elemento nella sidebar
                const sidebarItem = document.querySelector(`.map-sidebar-item[data-stop-id="${stopId}"]`);
                if (sidebarItem) {
                    // Rimuovi la classe attiva da tutti gli elementi
                    document.querySelectorAll('.map-sidebar-item').forEach(item => {
                        item.classList.remove('active', 'bg-primary/5', 'border-primary');
                    });
                    
                    // Aggiungi classe attiva a questo elemento
                    sidebarItem.classList.add('active', 'bg-primary/5', 'border-primary');
                    
                    // Scorri fino all'elemento
                    sidebarItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }
    }
});