document.addEventListener('DOMContentLoaded', () => {

    // --- SCRIPT POUR L'ANIMATION DES BRAISES ---
    const embersContainer = document.querySelector('.background-embers');
    if (embersContainer) {
        const numberOfEmbers = 50; // Ajustez la densité des particules
        for (let i = 0; i < numberOfEmbers; i++) {
            const ember = document.createElement('div');
            ember.className = 'ember';
            
            const size = Math.random() * 5 + 2;
            ember.style.width = `${size}px`;
            ember.style.height = `${size}px`;
            ember.style.left = `${Math.random() * 100}%`;
            
            const duration = Math.random() * 15 + 10;
            ember.style.animationDuration = `${duration}s`;
            
            const delay = Math.random() * 15;
            ember.style.animationDelay = `${delay}s`;
            
            embersContainer.appendChild(ember);
        }
    }

    // --- SCRIPT POUR L'APPARITION DES CARTES AU DÉFILEMENT ---
    const teamCards = document.querySelectorAll('.team-card');
    
    const observerOptions = {
        root: null,
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    teamCards.forEach(card => {
        observer.observe(card);
    });

});
