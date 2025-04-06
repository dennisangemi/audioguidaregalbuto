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
