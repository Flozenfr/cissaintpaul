document.addEventListener('DOMContentLoaded', () => {

    // --- SCRIPT POUR L'ANIMATION DES BRAISES ---
    const embersContainer = document.querySelector('.background-embers');
    if (embersContainer) {
        const numberOfEmbers = 50; // Ajustez la densité des particules
        for (let i = 0; i < numberOfEmbers; i++) {
            const ember = document.createElement('div');
            ember.className = 'ember';
            
            const size = Math.random() * 5 + 2; // Taille entre 2px et 7px
            ember.style.width = `${size}px`;
            ember.style.height = `${size}px`;
            ember.style.left = `${Math.random() * 100}%`;
            
            const duration = Math.random() * 15 + 10; // Durée d'animation entre 10s et 25s
            ember.style.animationDuration = `${duration}s`;
            
            const delay = Math.random() * 15; // Délai d'apparition jusqu'à 15s
            ember.style.animationDelay = `${delay}s`;
            
            embersContainer.appendChild(ember);
        }
    }

    // --- SCRIPT POUR L'APPARITION DES CARTES AU DÉFILEMENT ---
    const teamCards = document.querySelectorAll('.team-card');
    
    const observerOptions = {
        root: null, // observe par rapport au viewport
        threshold: 0.1 // se déclenche quand 10% de la carte est visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Ajoute la classe pour déclencher l'animation CSS
                entry.target.classList.add('is-visible');
                // Cesse d'observer l'élément une fois qu'il a été animé
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    teamCards.forEach(card => {
        observer.observe(card);
    });

});
