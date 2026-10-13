-- ==========================================================
-- PORTFOLIO LAMA-DEV : BASE DE DONNÉES SUPABASE
-- À exécuter une seule fois dans Supabase > SQL Editor > New query
-- ⚠️ Remplace TON_EMAIL_ADMIN@exemple.com (en bas) par ton email
-- ==========================================================

-- ---------- Administrateurs ----------
create table if not exists public.admins (
    email text primary key
);
alter table public.admins enable row level security;
-- Aucune policy : la table n'est lisible que via la fonction ci-dessous

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1 from public.admins
        where lower(email) = lower(auth.jwt() ->> 'email')
    );
$$;

-- ---------- Messages du formulaire de contact ----------
create table if not exists public.messages (
    id          bigint generated always as identity primary key,
    name        text not null check (char_length(name) between 1 and 100),
    email       text not null check (char_length(email) between 3 and 200),
    subject     text check (char_length(subject) <= 200),
    message     text not null check (char_length(message) between 1 and 5000),
    is_read     boolean not null default false,
    created_at  timestamptz not null default now()
);
alter table public.messages enable row level security;

drop policy if exists "Visiteurs : envoyer un message" on public.messages;
create policy "Visiteurs : envoyer un message" on public.messages
    for insert to anon, authenticated
    with check (is_read = false);

drop policy if exists "Admin : lire les messages" on public.messages;
create policy "Admin : lire les messages" on public.messages
    for select to authenticated using (public.is_admin());

drop policy if exists "Admin : modifier les messages" on public.messages;
create policy "Admin : modifier les messages" on public.messages
    for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin : supprimer les messages" on public.messages;
create policy "Admin : supprimer les messages" on public.messages
    for delete to authenticated using (public.is_admin());

-- ---------- Projets ----------
create table if not exists public.projects (
    id          bigint generated always as identity primary key,
    title       text not null,
    type_label  text,                       -- ex : "E-commerce"
    category    text not null default 'front', -- sert aux filtres
    description text,
    tags        text[] not null default '{}',
    image_url   text,
    demo_url    text,
    code_url    text,
    position    int not null default 0,     -- ordre d'affichage
    created_at  timestamptz not null default now()
);
alter table public.projects enable row level security;

drop policy if exists "Public : voir les projets" on public.projects;
create policy "Public : voir les projets" on public.projects
    for select using (true);

drop policy if exists "Admin : gérer les projets" on public.projects;
create policy "Admin : gérer les projets" on public.projects
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Technologies ----------
create table if not exists public.skills (
    id          bigint generated always as identity primary key,
    name        text not null,
    icon        text not null default 'fa-solid fa-code', -- classe Font Awesome
    color       text not null default '#818cf8',
    level       int  not null default 0 check (level between 0 and 100),
    category    text not null default 'web' check (category in ('web', 'outils')),
    position    int  not null default 0,
    created_at  timestamptz not null default now()
);
alter table public.skills enable row level security;

drop policy if exists "Public : voir les technologies" on public.skills;
create policy "Public : voir les technologies" on public.skills
    for select using (true);

drop policy if exists "Admin : gérer les technologies" on public.skills;
create policy "Admin : gérer les technologies" on public.skills
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Stockage des images de projets ----------
insert into storage.buckets (id, name, public)
values ('projects', 'projects', true)
on conflict (id) do nothing;

drop policy if exists "Public : voir les images" on storage.objects;
create policy "Public : voir les images" on storage.objects
    for select using (bucket_id = 'projects');

drop policy if exists "Admin : ajouter des images" on storage.objects;
create policy "Admin : ajouter des images" on storage.objects
    for insert to authenticated with check (bucket_id = 'projects' and public.is_admin());

drop policy if exists "Admin : supprimer des images" on storage.objects;
create policy "Admin : supprimer des images" on storage.objects
    for delete to authenticated using (bucket_id = 'projects' and public.is_admin());

-- ---------- Données de départ (ton contenu actuel) ----------
insert into public.projects (title, type_label, category, description, tags, position)
select * from (values
    ('Site E-commerce WordPress', 'E-commerce', 'wordpress',
     'Création d''une boutique en ligne complète et sécurisée sous WordPress, avec gestion des produits, du panier et des paiements.',
     array['WordPress', 'WooCommerce', 'CSS'], 1),
    ('Application Web PHP / MySQL', 'Application web', 'php',
     'Gestion de données et espaces utilisateurs sur mesure : authentification, tableau de bord et administration.',
     array['PHP', 'MySQL', 'Bootstrap'], 2),
    ('Landing Page Responsive', 'Landing page', 'front',
     'Intégration d''une maquette moderne et animée, parfaitement adaptée au mobile, à la tablette et au desktop.',
     array['HTML', 'CSS', 'JavaScript'], 3)
) as v
where not exists (select 1 from public.projects);

insert into public.skills (name, icon, color, level, category, position)
select * from (values
    ('HTML5',      'fa-brands fa-html5',          '#e34f26', 90, 'web', 1),
    ('CSS3',       'fa-brands fa-css3-alt',       '#2965f1', 90, 'web', 2),
    ('JavaScript', 'fa-brands fa-js',             '#f7df1e', 70, 'web', 3),
    ('PHP',        'fa-brands fa-php',            '#8892bf', 75, 'web', 4),
    ('Bootstrap',  'fa-brands fa-bootstrap',      '#7952b3', 80, 'web', 5),
    ('WordPress',  'fa-brands fa-wordpress',      '#21759b', 85, 'web', 6),
    ('Microsoft Word',  'fa-solid fa-file-word',       '#2b579a', 0, 'outils', 7),
    ('Microsoft Excel', 'fa-solid fa-file-excel',      '#217346', 0, 'outils', 8),
    ('PowerPoint',      'fa-solid fa-file-powerpoint', '#d24726', 0, 'outils', 9)
) as v
where not exists (select 1 from public.skills);

-- ---------- ⚠️ TON COMPTE ADMIN ----------
insert into public.admins (email) values ('TON_EMAIL_ADMIN@exemple.com')
on conflict do nothing;
