type Account = {
  fullName: string;
  email: string;
  role: string;
  xp: number;
  rankName: string;
  rankIcon?: string;
  avatarUrl?: string | null;
};

function element(tag: string, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function link(href: string, text: string, className = '') {
  const node = element('a', className, text) as HTMLAnchorElement;
  node.href = href;
  return node;
}

function linkWithIcon(href: string, text: string, iconName = '', className = '') {
  const node = element('a', className) as HTMLAnchorElement;
  node.href = href;
  if (iconName) {
    node.append(element('span', 'material-symbols-outlined', iconName));
  }
  node.append(element('span', '', text));
  return node;
}

function logout(className: string) {
  const form = document.createElement('form');
  form.method = 'post';
  form.action = '/api/auth/signout';
  const button = element('button', className) as HTMLButtonElement;
  button.type = 'submit';
  button.append(element('span', 'material-symbols-outlined', 'logout'));
  button.append(element('span', '', 'Keluar'));
  form.append(button);
  return form;
}

function logoutMobile(className: string) {
  const form = document.createElement('form');
  form.method = 'post';
  form.action = '/api/auth/signout';
  const button = element('button', className, 'Keluar') as HTMLButtonElement;
  button.type = 'submit';
  form.append(button);
  return form;
}

export function renderAccountNavigation(root: ParentNode, user: Account | null, unavailable = false) {
  const desktop = root.querySelector('[data-account-desktop]');
  const mobile = root.querySelector('[data-account-mobile]');
  if (!desktop || !mobile) return;

  const scopeStyles = () => {
    for (const container of [desktop, mobile]) {
      const scopes = container.getAttributeNames().filter((name) => name.startsWith('data-astro-cid-'));
      for (const child of container.querySelectorAll('*')) {
        for (const name of scopes) {
          child.setAttribute(name, '');
        }
      }
    }
  };

  if (!user) {
    const group = element('div', 'auth-nav-group');
    group.append(link('/login', unavailable ? 'Akun' : 'Masuk', 'login-nav-btn'));
    if (!unavailable) {
      group.append(link('/register', 'Daftar', 'register-nav-btn'));
    }
    desktop.replaceChildren(group);
    mobile.replaceChildren(link('/login', unavailable ? 'Akun' : 'Masuk'));
    if (!unavailable) {
      mobile.append(link('/register', 'Daftar Akun Baru', 'mobile-register-link'));
    }
    scopeStyles();
    return;
  }

  const wrap = element('div', 'user-menu-wrap');
  const details = document.createElement('details');
  details.className = 'user-menu-dropdown';

  const summary = element('summary', 'user-avatar-btn');
  summary.setAttribute('aria-label', 'Menu akun pengguna');

  if (user.avatarUrl) {
    const img = document.createElement('img');
    img.src = user.avatarUrl;
    img.alt = user.fullName;
    img.className = 'user-avatar-img';
    img.width = 36;
    img.height = 36;
    img.onerror = () => {
      img.remove();
      if (!summary.querySelector('.user-avatar-fallback')) {
        summary.append(element('span', 'user-avatar-fallback', user.fullName.slice(0, 1).toUpperCase()));
      }
    };
    summary.append(img);
  } else {
    summary.append(element('span', 'user-avatar-fallback', user.fullName.slice(0, 1).toUpperCase()));
  }

  const panel = element('div', 'user-dropdown-panel');
  const profile = element('div', 'dropdown-user-header');
  profile.append(element('strong', 'user-name-text', user.fullName), element('span', 'user-email-text', user.email));

  const badges = element('div', 'user-header-badges');
  const rankTag = element('span', 'rank-tag');
  if (user.rankIcon) {
    rankTag.append(element('span', 'material-symbols-outlined icon-micro', user.rankIcon));
  }
  rankTag.append(element('span', '', user.rankName));
  badges.append(rankTag, element('span', 'xp-tag', `${user.xp} XP`));
  profile.append(badges);

  if (user.role === 'admin') {
    profile.append(element('span', 'badge-admin', 'Admin'));
  }

  const hr1 = document.createElement('hr');
  hr1.className = 'dropdown-divider';
  panel.append(profile, hr1);

  panel.append(
    linkWithIcon('/dashboard', 'Dashboard Siswa', 'dashboard', 'dropdown-item'),
    linkWithIcon('/community', 'Komunitas', 'forum', 'dropdown-item')
  );

  mobile.replaceChildren(link('/dashboard', `Dashboard (${user.fullName})`));

  if (user.role === 'admin') {
    panel.append(linkWithIcon('/admin', 'Panel Administrator', 'admin_panel_settings', 'dropdown-item highlight-admin'));
    mobile.append(link('/admin', 'Panel Admin', 'mobile-admin-link'));
  }

  const hr2 = document.createElement('hr');
  hr2.className = 'dropdown-divider';
  panel.append(hr2, logout('dropdown-item text-danger'));
  mobile.append(logoutMobile('mobile-danger-link'));

  details.append(summary, panel);
  wrap.append(details);
  desktop.replaceChildren(wrap);
  scopeStyles();
}

let installed = false;
let currentUser: Account | null = null;

export function setupAccountNavigation() {
  if (installed) return;
  installed = true;

  let generation = 0;

  const refresh = async () => {
    const current = ++generation;
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) throw new Error('Status sesi tidak tersedia');

      const { user } = await response.json();
      if (
        user !== null &&
        (!user ||
          typeof user.fullName !== 'string' ||
          typeof user.email !== 'string' ||
          typeof user.rankName !== 'string' ||
          !Number.isFinite(user.xp) ||
          !['student', 'moderator', 'admin'].includes(user.role) ||
          (user.avatarUrl !== null && user.avatarUrl !== undefined && typeof user.avatarUrl !== 'string'))
      ) {
        throw new Error('Status sesi tidak valid');
      }

      if (current === generation) {
        currentUser = user;
        renderAccountNavigation(document, user);
      }
    } catch {
      if (current === generation) {
        currentUser = null;
        renderAccountNavigation(document, null, true);
      }
    }
  };

  window.addEventListener('account-avatar-updated', (event: Event) => {
    const customEvent = event as CustomEvent<{ avatarUrl?: string | null }>;
    if (currentUser) {
      currentUser.avatarUrl = customEvent.detail?.avatarUrl ?? null;
      renderAccountNavigation(document, currentUser);
    } else {
      void refresh();
    }
  });

  void refresh();
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) void refresh();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refresh();
  });
  document.addEventListener('astro:page-load', () => void refresh());
}
