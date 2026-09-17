// ==========================================
// 1. GESTION DU DARK / LIGHT MODE
// ==========================================
const themeToggleBtn = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;
const themeIcon = themeToggleBtn.querySelector('i');

// Récupérer le thème sauvegardé ou utiliser 'dark' par défaut
const currentTheme = localStorage.getItem('theme') || 'dark';
htmlElement.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

themeToggleBtn.addEventListener('click', () => {
    let theme = htmlElement.getAttribute('data-theme');
    
    // Basculer entre Dark et Light
    if (theme === 'dark') {
        theme = 'light';
    } else {
        theme = 'dark';
    }
    
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
});

function updateThemeIcon(theme) {
    if (theme === 'light') {
        themeIcon.className = 'fa-solid fa-sun';
    } else {
        themeIcon.className = 'fa-solid fa-moon';
    }
}

// ==========================================
// 2. EFFET DE TYPING (Animation de texte)
// ==========================================
const typingElement = document.querySelector('.hero-text h2');
if (typingElement) {
    const phrases = [
        "Développeur Web Full-Stack (PHP / JS)",
        "Spécialiste WordPress & CMS",
        "Concepteur d'interfaces modernes"
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function typeEffect() {
        const currentPhrase = phrases[phraseIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typingSpeed = 2000; // Pause à la fin de la phrase
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = 500; // Pause avant d'écrire la phrase suivante
        }

        setTimeout(typeEffect, typingSpeed);
    }

    // Lancer l'animation une fois le document chargé
    document.addEventListener('DOMContentLoaded', typeEffect);
}

// ==========================================
// 3. NAVBAR STICKY & EFFET DE SCROLL
// ==========================================
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.boxShadow = 'none';
        navbar.style.backdropFilter = 'none';
    }
});

// ==========================================
// 4. ANIMATION DE SOUMISSION DU FORMULAIRE
// ==========================================
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Message de confirmation simple
        alert('Merci pour votre message Lamarana ! Je vous répondrai dans les plus brefs délais.');
        contactForm.reset();
    });
}