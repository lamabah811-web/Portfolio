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
const hoverEffects = !isTouch && !prefersReducedMotion;

// Applique les effets aux éléments d'un conteneur (aussi pour le contenu chargé plus tard)
function bindEffects(scope = document) {
    if (!hoverEffects) return;

    // Spotlight à l'intérieur des cartes
    scope.querySelectorAll('.spotlight').forEach((card) => {
        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--y', `${e.clientY - rect.top}px`);
        });
    });

    // Inclinaison 3D
    scope.querySelectorAll('.tilt').forEach((card) => {
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
    scope.querySelectorAll('.magnetic').forEach((btn) => {
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

if (hoverEffects) {
    // Halo lumineux qui suit la souris
    window.addEventListener('pointermove', (e) => {
        root.style.setProperty('--mx', `${e.clientX}px`);
        root.style.setProperty('--my', `${e.clientY}px`);
    }, { passive: true });
}
bindEffects();

// ==========================================
// 9. FILTRES DES PROJETS
// ==========================================
const filtersBar = document.getElementById('project-filters');
const projectsGrid = document.getElementById('projects-grid');

filtersBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    filtersBar.querySelectorAll('.filter').forEach((b) => b.classList.toggle('active', b === btn));

    const filter = btn.dataset.filter;
    projectsGrid.querySelectorAll('.project-card').forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !match);
        if (match) card.classList.add('visible');
    });
});

// ==========================================
// 10. CONTENU DYNAMIQUE (SUPABASE)
// Projets et technologies gérés depuis admin.html.
// Sans configuration, le contenu écrit dans index.html reste affiché.
// ==========================================
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

// N'accepte que les liens http(s) pour éviter les liens "javascript:"
function safeUrl(url) {
    if (!url) return '';
    try {
        const u = new URL(url, window.location.href);
        return ['http:', 'https:'].includes(u.protocol) ? u.href : '';
    } catch (e) {
        return '';
    }
}

function safeColor(color) {
    return /^#[0-9a-f]{3,8}$/i.test(color || '') ? color : '#818cf8';
}

function safeIcon(icon) {
    return /^[a-z0-9\- ]+$/i.test(icon || '') ? icon : 'fa-solid fa-code';
}

const CATEGORY_LABELS = { wordpress: 'WordPress', php: 'PHP', front: 'Front-end', js: 'JavaScript', design: 'Design' };
const CATEGORY_ICONS = { wordpress: 'fa-brands fa-wordpress', php: 'fa-solid fa-database', front: 'fa-solid fa-mobile-screen', js: 'fa-brands fa-js', design: 'fa-solid fa-pen-ruler' };

function categoryLabel(cat) {
    return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

function setStat(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.count = value;
    // Si le compteur a déjà été animé, on met la valeur directement
    if (el.closest('.visible')) el.textContent = value + (el.dataset.suffix || '');
}

function projectCardHtml(p, i) {
    const demo = safeUrl(p.demo_url);
    const code = safeUrl(p.code_url) || CONFIG.github;
    const image = safeUrl(p.image_url);
    const visual = image
        ? `<div class="project-visual has-image"><img src="${escapeHtml(image)}" alt="Aperçu du projet ${escapeHtml(p.title)}" loading="lazy"></div>`
        : `<div class="project-visual v-${(i % 3) + 1}">
               <div class="mock-browser">
                   <div class="mock-bar"><i></i><i></i><i></i></div>
                   <div class="mock-body">
                       <div class="mock-line w60"></div>
                       <div class="mock-line w40"></div>
                       <div class="mock-grid"><span></span><span></span><span></span></div>
                   </div>
               </div>
               <i class="${CATEGORY_ICONS[p.category] || 'fa-solid fa-code'} project-emblem"></i>
           </div>`;

    return `
        <article class="project-card tilt reveal" data-category="${escapeHtml(p.category)}" style="--d: ${(i % 3) * 0.05 + 0.05}s">
            ${visual}
            <div class="project-info">
                <div class="project-top">
                    <span class="project-type">${escapeHtml(p.type_label || categoryLabel(p.category))}</span>
                    <div class="project-links">
                        ${code ? `<a href="${escapeHtml(code)}" target="_blank" rel="noopener" aria-label="Voir le code"><i class="fa-brands fa-github"></i></a>` : ''}
                        ${demo ? `<a href="${escapeHtml(demo)}" target="_blank" rel="noopener" aria-label="Voir le site"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                    </div>
                </div>
                <h3>${escapeHtml(p.title)}</h3>
                <p>${escapeHtml(p.description)}</p>
                <div class="tags">${(p.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>
            </div>
        </article>`;
}

function renderProjects(projects) {
    projectsGrid.innerHTML = projects.map(projectCardHtml).join('');

    const categories = [...new Set(projects.map((p) => p.category).filter(Boolean))];
    filtersBar.innerHTML = '<button class="filter active" data-filter="all">Tous</button>' +
        categories.map((c) => `<button class="filter" data-filter="${escapeHtml(c)}">${escapeHtml(categoryLabel(c))}</button>`).join('');
    filtersBar.hidden = categories.length < 2;

    setStat('stat-projects', projects.length);
    projectsGrid.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
    bindEffects(projectsGrid);
}

function renderSkills(skills) {
    const web = skills.filter((s) => s.category === 'web');
    const tools = skills.filter((s) => s.category === 'outils');
    const leveled = web.filter((s) => s.level > 0).sort((a, b) => b.level - a.level);

    const webGrid = document.getElementById('skills-web');
    webGrid.innerHTML = web.map((s) => `
        <div class="skill-card spotlight" style="--c: ${safeColor(s.color)}">
            <i class="${safeIcon(s.icon)}"></i><span>${escapeHtml(s.name)}</span>
        </div>`).join('');

    const bars = document.getElementById('skills-bars');
    bars.innerHTML = leveled.map((s) => `
        <div class="bar" data-level="${Number(s.level)}">
            <div class="bar-head"><span>${escapeHtml(s.name)}</span><span class="bar-val">${Number(s.level)}%</span></div>
            <div class="bar-track"><span></span></div>
        </div>`).join('');
    // Si la section est déjà apparue, on remplit les barres tout de suite
    if (bars.closest('.visible')) {
        requestAnimationFrame(() => bars.querySelectorAll('.bar').forEach((bar) => {
            bar.querySelector('.bar-track span').style.width = `${bar.dataset.level}%`;
        }));
    }
    bars.closest('.skills-block').hidden = leveled.length === 0;

    const toolsList = document.getElementById('skills-tools');
    toolsList.innerHTML = tools.map((s) => `
        <div class="office-item" style="--c: ${safeColor(s.color)}"><i class="${safeIcon(s.icon)}"></i> ${escapeHtml(s.name)}</div>`).join('');
    toolsList.closest('.skills-block').hidden = tools.length === 0;

    setStat('stat-skills', web.length);
    bindEffects(webGrid);
}

async function loadContent() {
    if (!window.db) return;
    try {
        const [projects, skills] = await Promise.all([
            db.from('projects').select('*').order('position').order('created_at'),
            db.from('skills').select('*').order('position').order('created_at')
        ]);
        if (!projects.error && projects.data.length) renderProjects(projects.data);
        if (!skills.error && skills.data.length) renderSkills(skills.data);
    } catch (e) {
        console.warn('Contenu dynamique indisponible, affichage du contenu par défaut.', e);
    }
}
loadContent();

// ==========================================
// 11. FORMULAIRE DE CONTACT
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
    const submitBtn = contactForm.querySelector('[type="submit"]');

    contactForm.addEventListener('submit', async (e) => {
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
        const message = {
            name: data.get('name').trim(),
            email: data.get('email').trim(),
            subject: data.get('subject').trim() || null,
            message: data.get('message').trim()
        };

        if (window.db) {
            // Enregistre le message : il apparaît dans l'espace admin
            submitBtn.disabled = true;
            const { error } = await db.from('messages').insert(message);
            submitBtn.disabled = false;
            if (error) {
                showToast("Oups, l'envoi a échoué. Réessayez ou contactez-moi sur WhatsApp.", true);
                return;
            }
        } else if (CONFIG.email) {
            // Sans base de données : ouvre la messagerie du visiteur avec le message pré-rempli
            const subject = message.subject || `Nouveau message de ${message.name}`;
            const body = `${message.message}\n\n${message.name} (${message.email})`;
            window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }

        showToast(`Merci ${message.name} ! Je vous répondrai dans les plus brefs délais.`);
        contactForm.reset();
    });

    contactForm.querySelectorAll('input, textarea').forEach((input) => {
        input.addEventListener('input', () => input.parentElement.classList.remove('invalid'));
    });
}
