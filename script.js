// ==========================================
// 0. CONFIGURATION : remplace par tes infos
// ==========================================
const CONFIG = {
    email: '',      // ex : 'contact@lama-dev.com'
    github: 'https://github.com/lamabah811-web',
    linkedin: 'https://www.linkedin.com/in/lamarana-bah-02088441b',
    whatsapp: 'https://wa.me/221706464785?text=' + encodeURIComponent('Bonjour Lamarana, je viens de voir votre portfolio !')
};

const root = document.documentElement;
root.classList.add('js');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;

// Liens sociaux et email
document.querySelectorAll('[data-social]').forEach((link) => {
    const url = CONFIG[link.dataset.social];
    if (url) {
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
    }
});

const emailLink = document.querySelector('[data-contact="email"]');
if (emailLink && CONFIG.email) {
    emailLink.href = `mailto:${CONFIG.email}`;
    emailLink.querySelector('.ci-email').textContent = CONFIG.email;
} else if (emailLink) {
    emailLink.remove();
}

document.getElementById('year').textContent = new Date().getFullYear();

// ==========================================
// 1. LOADER
// ==========================================
const loader = document.querySelector('.loader');
document.body.classList.add('loading');

function hideLoader() {
    loader.classList.add('hidden');
    document.body.classList.remove('loading');
}

window.addEventListener('load', () => setTimeout(hideLoader, prefersReducedMotion ? 0 : 500));
setTimeout(hideLoader, 3000); // Sécurité si une ressource externe tarde

// ==========================================
// 2. GESTION DU DARK / LIGHT MODE
// ==========================================
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('i');

function getSavedTheme() {
    try {
        return localStorage.getItem('theme');
    } catch (e) {
        return null;
    }
}

function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeIcon.className = theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#f7f7fb' : '#07070c';
}

applyTheme(getSavedTheme() || 'dark');

themeToggleBtn.addEventListener('click', () => {
    const theme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try {
        localStorage.setItem('theme', theme);
    } catch (e) {}
});

// ==========================================
// 3. EFFET DE TYPING (Animation de texte)
// ==========================================
const typingElement = document.querySelector('.typing');
if (typingElement && !prefersReducedMotion) {
    const phrases = [
        "Développeur Web Full-Stack (PHP / JS)",
        "Spécialiste WordPress & CMS",
        "Concepteur d'interfaces modernes"
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeEffect() {
        const currentPhrase = phrases[phraseIndex];
        let typingSpeed;

        if (isDeleting) {
            charIndex--;
            typingSpeed = 35;
        } else {
            charIndex++;
            typingSpeed = 70;
        }
        typingElement.textContent = currentPhrase.substring(0, charIndex);

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typingSpeed = 2200; // Pause à la fin de la phrase
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = 400; // Pause avant d'écrire la phrase suivante
        }

        setTimeout(typeEffect, typingSpeed);
    }

    typingElement.textContent = '';
    setTimeout(typeEffect, 1200);
}

// ==========================================
// 4. NAVBAR : SCROLL, MASQUAGE, LIEN ACTIF
// ==========================================
const navbar = document.querySelector('.navbar');
const progressBar = document.querySelector('.scroll-progress');
const backToTop = document.querySelector('.back-to-top');
let lastScrollY = window.scrollY;
let ticking = false;

function onScroll() {
    const y = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    navbar.classList.toggle('scrolled', y > 30);
    // Masque la navbar en descendant, la réaffiche en remontant
    navbar.classList.toggle('hide', y > lastScrollY && y > 400 && !document.body.classList.contains('menu-open'));
    backToTop.classList.toggle('show', y > 600);
    progressBar.style.transform = `scaleX(${maxScroll > 0 ? y / maxScroll : 0})`;

    lastScrollY = y;
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
    }
}, { passive: true });
onScroll();

backToTop.addEventListener('click', () => window.scrollTo({ top: 0 }));

// Lien actif selon la section visible
const navLinks = document.querySelectorAll('.nav-link');
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
    });
}, { rootMargin: '-45% 0px -50% 0px' });

document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

// ==========================================
// 5. MENU MOBILE (BURGER)
// ==========================================
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');

function toggleMenu(open) {
    burger.classList.toggle('open', open);
    nav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
}

burger.addEventListener('click', () => toggleMenu(!nav.classList.contains('open')));
navLinks.forEach((link) => link.addEventListener('click', () => toggleMenu(false)));
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleMenu(false);
});

// ==========================================
// 6. APPARITION AU SCROLL, COMPTEURS & BARRES
// ==========================================
function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();

    function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('visible');

        el.querySelectorAll('[data-count]').forEach(animateCounter);
        if (el.matches('[data-count]')) animateCounter(el);

        el.querySelectorAll('.bar').forEach((bar) => {
            bar.querySelector('.bar-track span').style.width = `${bar.dataset.level}%`;
        });

        observer.unobserve(el);
    });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// ==========================================
// 7. BANDEAU DÉFILANT (boucle infinie)
// ==========================================
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
    marqueeTrack.innerHTML += marqueeTrack.innerHTML;
}

// ==========================================
// 8. EFFETS SOURIS : HALO, SPOTLIGHT, TILT 3D, MAGNÉTIQUE
// ==========================================
if (!isTouch && !prefersReducedMotion) {
    // Halo lumineux qui suit la souris
    window.addEventListener('pointermove', (e) => {
        root.style.setProperty('--mx', `${e.clientX}px`);
        root.style.setProperty('--my', `${e.clientY}px`);
    }, { passive: true });

    // Spotlight à l'intérieur des cartes
    document.querySelectorAll('.spotlight').forEach((card) => {
        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--y', `${e.clientY - rect.top}px`);
        });
    });

    // Inclinaison 3D
    document.querySelectorAll('.tilt').forEach((card) => {
        const strength = card.classList.contains('photo-card') ? 10 : 6;
        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(900px) rotateX(${-py * strength}deg) rotateY(${px * strength}deg)`;
        });
        card.addEventListener('pointerleave', () => {
            card.style.transform = '';
        });
    });

    // Boutons magnétiques
    document.querySelectorAll('.magnetic').forEach((btn) => {
        btn.addEventListener('pointermove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.25}px)`;
        });
        btn.addEventListener('pointerleave', () => {
            btn.style.transform = '';
        });
    });
}

// ==========================================
// 9. FILTRES DES PROJETS
// ==========================================
const filterButtons = document.querySelectorAll('.filter');
const projectCards = document.querySelectorAll('.project-card');

filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        projectCards.forEach((card) => {
            const match = filter === 'all' || card.dataset.category === filter;
            card.classList.toggle('is-hidden', !match);
            if (match) card.classList.add('visible');
        });
    });
});

// ==========================================
// 10. FORMULAIRE DE CONTACT
// ==========================================
const toast = document.querySelector('.toast');
let toastTimer;

function showToast(message, isError = false) {
    const icon = document.createElement('i');
    icon.className = `fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}`;
    toast.replaceChildren(icon, message);
    toast.classList.toggle('error', isError);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let valid = true;
        contactForm.querySelectorAll('[required]').forEach((input) => {
            const ok = input.checkValidity() && input.value.trim() !== '';
            input.parentElement.classList.toggle('invalid', !ok);
            if (!ok) valid = false;
        });

        if (!valid) {
            showToast('Merci de remplir correctement tous les champs requis.', true);
            return;
        }

        const data = new FormData(contactForm);
        if (CONFIG.email) {
            // Ouvre la messagerie du visiteur avec le message pré-rempli
            const subject = data.get('subject') || `Nouveau message de ${data.get('name')}`;
            const body = `${data.get('message')}\n\n${data.get('name')} (${data.get('email')})`;
            window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }

        showToast(`Merci ${data.get('name')} ! Je vous répondrai dans les plus brefs délais.`);
        contactForm.reset();
    });

    contactForm.querySelectorAll('input, textarea').forEach((input) => {
        input.addEventListener('input', () => input.parentElement.classList.remove('invalid'));
    });
}
