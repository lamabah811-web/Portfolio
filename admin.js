// ==========================================
// ESPACE ADMIN : messages, projets, technologies (Supabase)
// ==========================================
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

const state = {
    messages: [],
    projects: [],
    skills: [],
    tab: 'messages',
    msgFilter: 'all',
    editingProjectId: null,
    editingSkillId: null
};

// ---------- Utilitaires ----------
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function safeUrl(url) {
    if (!url) return '';
    try {
        const u = new URL(url);
        return ['http:', 'https:'].includes(u.protocol) ? u.href : '';
    } catch (e) {
        return '';
    }
}

function safeColor(color) {
    return /^#[0-9a-f]{3,8}$/i.test(color || '') ? color : '#818cf8';
}

function safeIcon(icon) {
    return /^[a-z0-9\- ]+$/i.test(icon || '') ? icon.trim() : 'fa-solid fa-code';
}

function formatDate(iso) {
    const d = new Date(iso);
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const toast = $('.toast');
let toastTimer;
function showToast(message, isError = false) {
    const icon = document.createElement('i');
    icon.className = `fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}`;
    toast.replaceChildren(icon, message);
    toast.classList.toggle('error', isError);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function showView(name) {
    ['setup', 'login', 'app'].forEach((v) => {
        $(`#view-${v}`).hidden = v !== name;
    });
}

// ---------- Thème ----------
const themeBtn = $('#theme-toggle');
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeBtn.querySelector('i').className = theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}
applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
themeBtn.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
});

// ==========================================
// AUTHENTIFICATION
// ==========================================
async function enterApp(session) {
    // Vérifie que ce compte est bien déclaré comme administrateur
    const { data: isAdmin, error } = await db.rpc('is_admin');
    if (error || !isAdmin) {
        await db.auth.signOut();
        showView('login');
        $('#login-error').textContent = "Ce compte n'est pas autorisé. Vérifie que ton email est bien dans la table « admins ».";
        return;
    }
    $('#admin-email').textContent = session.user.email;
    showView('app');
    await loadAll();
}

async function init() {
    if (!window.db) {
        showView('setup');
        return;
    }
    const { data: { session } } = await db.auth.getSession();
    if (session) {
        enterApp(session);
    } else {
        showView('login');
    }
}

$('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = $('[type="submit"]', form);
    $('#login-error').textContent = '';
    btn.disabled = true;

    const { data, error } = await db.auth.signInWithPassword({
        email: form.email.value.trim(),
        password: form.password.value
    });
    btn.disabled = false;

    if (error) {
        $('#login-error').textContent = 'Email ou mot de passe incorrect.';
        return;
    }
    form.reset();
    enterApp(data.session);
});

$('#logout').addEventListener('click', async () => {
    await db.auth.signOut();
    showView('login');
});

// ==========================================
// NAVIGATION ENTRE LES ONGLETS
// ==========================================
const TAB_TITLES = { messages: 'Messages', projects: 'Projets', skills: 'Technologies' };
const ADD_LABELS = { projects: 'Ajouter un projet', skills: 'Ajouter une technologie' };

function setTab(tab) {
    state.tab = tab;
    $$('.side-link[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $$('.panel').forEach((p) => { p.hidden = p.id !== `panel-${tab}`; });
    $('#panel-title').textContent = TAB_TITLES[tab];
    $('#add-btn').hidden = !ADD_LABELS[tab];
    if (ADD_LABELS[tab]) $('#add-btn span').textContent = ADD_LABELS[tab];
}

$$('.side-link[data-tab]').forEach((btn) => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
$('#add-btn').addEventListener('click', () => {
    if (state.tab === 'projects') openProjectModal();
    if (state.tab === 'skills') openSkillModal();
});

// ==========================================
// CHARGEMENT DES DONNÉES
// ==========================================
async function loadAll() {
    const [messages, projects, skills] = await Promise.all([
        db.from('messages').select('*').order('created_at', { ascending: false }),
        db.from('projects').select('*').order('position').order('created_at'),
        db.from('skills').select('*').order('position').order('created_at')
    ]);
    if (messages.error || projects.error || skills.error) {
        showToast('Erreur de chargement des données.', true);
    }
    state.messages = messages.data || [];
    state.projects = projects.data || [];
    state.skills = skills.data || [];
    renderAll();
}

function renderAll() {
    renderMessages();
    renderProjects();
    renderSkills();
    updateCounters();
}

function updateCounters() {
    const unread = state.messages.filter((m) => !m.is_read).length;
    $('#ov-unread').textContent = unread;
    $('#ov-projects').textContent = state.projects.length;
    $('#ov-skills').textContent = state.skills.length;
    const badge = $('#unread-count');
    badge.textContent = unread;
    badge.hidden = unread === 0;
}

function emptyState(icon, text) {
    return `<div class="empty"><i class="${icon}"></i>${text}</div>`;
}

// ==========================================
// MESSAGES
// ==========================================
function renderMessages() {
    const list = $('#messages-list');
    const items = state.msgFilter === 'unread' ? state.messages.filter((m) => !m.is_read) : state.messages;

    if (!items.length) {
        list.innerHTML = emptyState('fa-regular fa-envelope-open',
            state.msgFilter === 'unread' ? 'Aucun message non lu 🎉' : 'Aucun message pour le moment.');
        return;
    }

    list.innerHTML = items.map((m) => {
        const reply = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('Re : ' + (m.subject || 'Votre message'))}`;
        return `
        <article class="msg ${m.is_read ? '' : 'unread'}" data-id="${m.id}">
            <button class="msg-head" data-action="toggle">
                <span class="avatar">${escapeHtml(m.name.charAt(0))}</span>
                <span class="msg-meta">
                    <strong>${escapeHtml(m.name)}</strong>
                    <p>${escapeHtml(m.subject || m.message)}</p>
                </span>
                <span class="msg-date">${formatDate(m.created_at)}</span>
            </button>
            <div class="msg-body">
                <a class="msg-email" href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a>
                ${m.subject ? `<p class="msg-subject"><strong>Sujet :</strong> ${escapeHtml(m.subject)}</p>` : ''}
                <p class="msg-text">${escapeHtml(m.message)}</p>
                <div class="actions">
                    <a class="btn btn-primary btn-xs" href="${reply}"><i class="fa-solid fa-reply"></i> Répondre</a>
                    <button class="btn btn-ghost btn-xs" data-action="read">
                        <i class="fa-regular ${m.is_read ? 'fa-envelope' : 'fa-envelope-open'}"></i> ${m.is_read ? 'Marquer non lu' : 'Marquer comme lu'}
                    </button>
                    <button class="btn btn-ghost btn-xs btn-danger" data-action="delete"><i class="fa-regular fa-trash-can"></i> Supprimer</button>
                </div>
            </div>
        </article>`;
    }).join('');
}

async function setRead(msg, isRead) {
    const { error } = await db.from('messages').update({ is_read: isRead }).eq('id', msg.id);
    if (error) return showToast('Impossible de mettre à jour le message.', true);
    msg.is_read = isRead;
    updateCounters();
}

$('#messages-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('.msg');
    const msg = state.messages.find((m) => m.id === Number(card.dataset.id));

    if (btn.dataset.action === 'toggle') {
        card.classList.toggle('open');
        // Ouvrir un message non lu le marque comme lu
        if (card.classList.contains('open') && !msg.is_read) {
            await setRead(msg, true);
            card.classList.remove('unread');
            const readBtn = $('[data-action="read"]', card);
            readBtn.innerHTML = '<i class="fa-regular fa-envelope"></i> Marquer non lu';
        }
    }

    if (btn.dataset.action === 'read') {
        await setRead(msg, !msg.is_read);
        renderMessages();
    }

    if (btn.dataset.action === 'delete') {
        if (!confirm(`Supprimer le message de ${msg.name} ?`)) return;
        const { error } = await db.from('messages').delete().eq('id', msg.id);
        if (error) return showToast('Suppression impossible.', true);
        state.messages = state.messages.filter((m) => m.id !== msg.id);
        renderMessages();
        updateCounters();
        showToast('Message supprimé.');
    }
});

$$('[data-msg-filter]').forEach((btn) => btn.addEventListener('click', () => {
    state.msgFilter = btn.dataset.msgFilter;
    $$('[data-msg-filter]').forEach((b) => b.classList.toggle('active', b === btn));
    renderMessages();
}));

$('#refresh-messages').addEventListener('click', async () => {
    const { data, error } = await db.from('messages').select('*').order('created_at', { ascending: false });
    if (error) return showToast('Erreur de chargement.', true);
    state.messages = data;
    renderMessages();
    updateCounters();
    showToast('Messages à jour.');
});

// ==========================================
// PROJETS
// ==========================================
const GRADIENTS = [
    'radial-gradient(circle at 30% 20%, #f472b6, transparent 55%), radial-gradient(circle at 80% 90%, #818cf8, transparent 55%), #1b1530',
    'radial-gradient(circle at 70% 20%, #22d3ee, transparent 55%), radial-gradient(circle at 20% 90%, #6366f1, transparent 55%), #0f1a2e',
    'radial-gradient(circle at 20% 20%, #a78bfa, transparent 55%), radial-gradient(circle at 85% 80%, #34d399, transparent 55%), #12201f'
];

function renderProjects() {
    const list = $('#projects-list');
    if (!state.projects.length) {
        list.innerHTML = emptyState('fa-solid fa-layer-group', 'Aucun projet. Clique sur « Ajouter un projet » pour commencer.');
        return;
    }

    list.innerHTML = state.projects.map((p, i) => {
        const image = safeUrl(p.image_url);
        return `
        <article class="p-card" data-id="${p.id}">
            <div class="p-thumb" style="background: ${GRADIENTS[i % 3]}">
                ${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy">` : '<i class="fa-solid fa-laptop-code"></i>'}
            </div>
            <div class="p-content">
                <span class="project-type">${escapeHtml(p.type_label || p.category)}</span>
                <h3>${escapeHtml(p.title)}</h3>
                <p>${escapeHtml(p.description)}</p>
                <div class="tags">${(p.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>
                <div class="actions">
                    <button class="btn btn-ghost btn-xs" data-action="edit"><i class="fa-regular fa-pen-to-square"></i> Modifier</button>
                    <button class="btn btn-ghost btn-xs btn-danger" data-action="delete"><i class="fa-regular fa-trash-can"></i> Supprimer</button>
                </div>
            </div>
        </article>`;
    }).join('');
}

const projectModal = $('#project-modal');
const projectForm = $('#project-form');

function setImagePreview(url) {
    const preview = $('#image-preview');
    const safe = safeUrl(url) || (url && url.startsWith('blob:') ? url : '');
    preview.innerHTML = safe ? `<img src="${escapeHtml(safe)}" alt="">` : '<i class="fa-regular fa-image"></i>';
}

function openProjectModal(project = null) {
    state.editingProjectId = project ? project.id : null;
    projectForm.reset();
    $('#project-modal-title').textContent = project ? 'Modifier le projet' : 'Nouveau projet';

    if (project) {
        ['title', 'type_label', 'category', 'description', 'demo_url', 'code_url', 'image_url', 'position'].forEach((k) => {
            projectForm[k].value = project[k] ?? '';
        });
        projectForm.tags.value = (project.tags || []).join(', ');
    } else {
        projectForm.position.value = state.projects.length + 1;
    }
    setImagePreview(projectForm.image_url.value);
    projectModal.showModal();
}

projectForm.image_url.addEventListener('input', () => setImagePreview(projectForm.image_url.value));
projectForm.image_file.addEventListener('change', () => {
    const file = projectForm.image_file.files[0];
    if (file) setImagePreview(URL.createObjectURL(file));
});

async function uploadImage(file) {
    if (file.size > 5 * 1024 * 1024) throw new Error("L'image dépasse 5 Mo.");
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await db.storage.from('projects').upload(path, file, { contentType: file.type });
    if (error) throw error;
    return db.storage.from('projects').getPublicUrl(path).data.publicUrl;
}

projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = $('[type="submit"]', projectForm);
    submitBtn.disabled = true;

    try {
        let imageUrl = projectForm.image_url.value.trim();
        const file = projectForm.image_file.files[0];
        if (file) imageUrl = await uploadImage(file);

        const payload = {
            title: projectForm.title.value.trim(),
            type_label: projectForm.type_label.value.trim() || null,
            category: projectForm.category.value.trim().toLowerCase(),
            description: projectForm.description.value.trim() || null,
            tags: projectForm.tags.value.split(',').map((t) => t.trim()).filter(Boolean),
            demo_url: safeUrl(projectForm.demo_url.value.trim()) || null,
            code_url: safeUrl(projectForm.code_url.value.trim()) || null,
            image_url: safeUrl(imageUrl) || null,
            position: Number(projectForm.position.value) || 0
        };

        const query = state.editingProjectId
            ? db.from('projects').update(payload).eq('id', state.editingProjectId).select().single()
            : db.from('projects').insert(payload).select().single();
        const { data, error } = await query;
        if (error) throw error;

        if (state.editingProjectId) {
            state.projects = state.projects.map((p) => (p.id === data.id ? data : p));
        } else {
            state.projects.push(data);
        }
        state.projects.sort((a, b) => a.position - b.position);
        renderProjects();
        updateCounters();
        projectModal.close();
        showToast(state.editingProjectId ? 'Projet mis à jour.' : 'Projet ajouté au portfolio !');
    } catch (err) {
        showToast(err.message || "Erreur lors de l'enregistrement.", true);
    } finally {
        submitBtn.disabled = false;
    }
});

$('#projects-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const project = state.projects.find((p) => p.id === Number(btn.closest('.p-card').dataset.id));

    if (btn.dataset.action === 'edit') openProjectModal(project);

    if (btn.dataset.action === 'delete') {
        if (!confirm(`Supprimer le projet « ${project.title} » ?`)) return;
        const { error } = await db.from('projects').delete().eq('id', project.id);
        if (error) return showToast('Suppression impossible.', true);
        state.projects = state.projects.filter((p) => p.id !== project.id);
        renderProjects();
        updateCounters();
        showToast('Projet supprimé.');
    }
});

// ==========================================
// TECHNOLOGIES
// ==========================================
const ICONS = [
    'fa-brands fa-html5', 'fa-brands fa-css3-alt', 'fa-brands fa-js', 'fa-brands fa-php',
    'fa-brands fa-bootstrap', 'fa-brands fa-wordpress', 'fa-brands fa-react', 'fa-brands fa-vuejs',
    'fa-brands fa-angular', 'fa-brands fa-node-js', 'fa-brands fa-python', 'fa-brands fa-laravel',
    'fa-brands fa-sass', 'fa-brands fa-git-alt', 'fa-brands fa-github', 'fa-brands fa-figma',
    'fa-brands fa-npm', 'fa-brands fa-docker', 'fa-brands fa-java', 'fa-brands fa-symfony',
    'fa-solid fa-database', 'fa-solid fa-server', 'fa-solid fa-mobile-screen', 'fa-solid fa-code',
    'fa-solid fa-file-word', 'fa-solid fa-file-excel', 'fa-solid fa-file-powerpoint', 'fa-solid fa-terminal'
];
const CATEGORY_NAMES = { web: 'Développement Web', outils: 'Outils & logiciels' };

function renderSkills() {
    const list = $('#skills-list');
    if (!state.skills.length) {
        list.innerHTML = emptyState('fa-solid fa-code', 'Aucune technologie. Ajoute ta première compétence !');
        return;
    }

    list.innerHTML = Object.entries(CATEGORY_NAMES).map(([cat, label]) => {
        const items = state.skills.filter((s) => s.category === cat);
        if (!items.length) return '';
        return `
        <div>
            <h3>${label} <small class="hint">(${items.length})</small></h3>
            <div class="s-grid">
                ${items.map((s) => `
                <div class="s-item" data-id="${s.id}" style="--c: ${safeColor(s.color)}">
                    <i class="${safeIcon(s.icon)}"></i>
                    <div class="s-info">
                        <strong>${escapeHtml(s.name)}</strong>
                        <small>${s.level > 0 ? `Niveau ${s.level}%` : 'Sans barre de niveau'}</small>
                    </div>
                    <div class="s-actions">
                        <button data-action="edit" aria-label="Modifier"><i class="fa-regular fa-pen-to-square"></i></button>
                        <button data-action="delete" class="del" aria-label="Supprimer"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
    }).join('');
}

const skillModal = $('#skill-modal');
const skillForm = $('#skill-form');

$('#icon-picker').innerHTML = ICONS.map((icon) =>
    `<button type="button" data-icon="${icon}" aria-label="${icon}"><i class="${icon}"></i></button>`).join('');

function updateSkillPreview() {
    const preview = $('#skill-preview');
    const icon = safeIcon(skillForm.icon.value);
    preview.style.setProperty('--c', safeColor(skillForm.color.value));
    preview.innerHTML = `<i class="${icon}"></i><span>${escapeHtml(skillForm.name.value || 'Aperçu')}</span>`;
    $('#level-value').textContent = `${skillForm.level.value}%`;
    $$('#icon-picker button').forEach((b) => b.classList.toggle('active', b.dataset.icon === icon));
}

$('#icon-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-icon]');
    if (!btn) return;
    skillForm.icon.value = btn.dataset.icon;
    updateSkillPreview();
});
['name', 'icon', 'color', 'level'].forEach((k) => skillForm[k].addEventListener('input', updateSkillPreview));

// Les outils (Word, Excel…) n'ont pas de barre de niveau par défaut
skillForm.category.addEventListener('change', () => {
    if (skillForm.category.value === 'outils') skillForm.level.value = 0;
    updateSkillPreview();
});

function openSkillModal(skill = null) {
    state.editingSkillId = skill ? skill.id : null;
    skillForm.reset();
    $('#skill-modal-title').textContent = skill ? 'Modifier la technologie' : 'Nouvelle technologie';

    if (skill) {
        ['name', 'icon', 'color', 'level', 'category', 'position'].forEach((k) => {
            skillForm[k].value = skill[k] ?? '';
        });
    } else {
        skillForm.position.value = state.skills.length + 1;
    }
    updateSkillPreview();
    skillModal.showModal();
}

skillForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = $('[type="submit"]', skillForm);
    submitBtn.disabled = true;

    const payload = {
        name: skillForm.name.value.trim(),
        icon: safeIcon(skillForm.icon.value),
        color: safeColor(skillForm.color.value),
        level: Number(skillForm.level.value) || 0,
        category: skillForm.category.value,
        position: Number(skillForm.position.value) || 0
    };

    const query = state.editingSkillId
        ? db.from('skills').update(payload).eq('id', state.editingSkillId).select().single()
        : db.from('skills').insert(payload).select().single();
    const { data, error } = await query;
    submitBtn.disabled = false;

    if (error) return showToast("Erreur lors de l'enregistrement.", true);

    if (state.editingSkillId) {
        state.skills = state.skills.map((s) => (s.id === data.id ? data : s));
    } else {
        state.skills.push(data);
    }
    state.skills.sort((a, b) => a.position - b.position);
    renderSkills();
    updateCounters();
    skillModal.close();
    showToast(state.editingSkillId ? 'Technologie mise à jour.' : `${data.name} ajouté à tes compétences !`);
});

$('#skills-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const skill = state.skills.find((s) => s.id === Number(btn.closest('.s-item').dataset.id));

    if (btn.dataset.action === 'edit') openSkillModal(skill);

    if (btn.dataset.action === 'delete') {
        if (!confirm(`Supprimer « ${skill.name} » ?`)) return;
        const { error } = await db.from('skills').delete().eq('id', skill.id);
        if (error) return showToast('Suppression impossible.', true);
        state.skills = state.skills.filter((s) => s.id !== skill.id);
        renderSkills();
        updateCounters();
        showToast('Technologie supprimée.');
    }
});

// ---------- Fermeture des fenêtres ----------
$$('[data-close]').forEach((btn) => btn.addEventListener('click', () => btn.closest('dialog').close()));
$$('dialog').forEach((dialog) => dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close(); // clic sur le fond
}));

init();
