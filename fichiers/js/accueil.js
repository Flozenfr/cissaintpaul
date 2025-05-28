document.addEventListener('DOMContentLoaded', () => {

    // --- SCRIPT POUR L'ANIMATION DES BRAISES ---
    const embersContainer = document.querySelector('.background-embers');
    if (embersContainer) {
        const numberOfEmbers = 50;
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
    const observerOptions = { root: null, threshold: 0.1 };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    teamCards.forEach(card => { observer.observe(card); });


    // --- NOUVEAU : SCRIPT POUR LE JET D'EAU ---
    const waterStreams = document.querySelectorAll('.water-stream');

    // Fonction pour créer une particule dans un jet donné
    const emitParticle = (stream) => {
        const particle = document.createElement('div');
        particle.className = 'water-particle';
        stream.appendChild(particle);

        const size = Math.random() * 8 + 4; // Taille variable
        const duration = Math.random() * 0.5 + 0.4; // Durée de vie variable
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`; // Position horizontale aléatoire
        particle.style.animationDuration = `${duration}s`;
        
        // Supprimer la particule du DOM à la fin de son animation pour la performance
        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    };

    // Lancer un intervalle pour générer des particules en continu pour chaque jet
    if (waterStreams.length > 0) {
        setInterval(() => {
            waterStreams.forEach(stream => {
                emitParticle(stream);
            });
        }, 30); // Créer une particule toutes les 30ms
    }
});
