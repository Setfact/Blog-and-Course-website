type Account = {
  fullName: string;
  email: string;
  role: string;
  xp: number;
  rankName: string;
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

function logout(className: string) {
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
  summary.append(element('span', 'user-avatar-fallback', user.fullName.slice(0, 1).toUpperCase()));

  const panel = element('div', 'user-dropdown-panel');
  const profile = element('div', 'dropdown-user-header');
  profile.append(element('strong', 'user-name-text', user.fullName), element('span', 'user-email-text', user.email));

  const badges = element('div', 'user-header-badges');
  badges.append(element('span', 'rank-tag', user.rankName), element('span', 'xp-tag', `${user.xp} XP`));
  profile.append(badges);

  panel.append(
    profile,
    link('/dashboard', 'Dashboard Siswa', 'dropdown-item'),
    link('/community', 'Komunitas', 'dropdown-item')
  );

  mobile.replaceChildren(link('/dashboard', `Dashboard (${user.fullName})`));

  if (user.role === 'admin') {
    panel.append(link('/admin', 'Panel Administrator', 'dropdown-item highlight-admin'));
    mobile.append(link('/admin', 'Panel Admin', 'mobile-admin-link'));
  }

  panel.append(logout('dropdown-item text-danger'));
  mobile.append(logout('mobile-danger-link'));

  details.append(summary, panel);
  wrap.append(details);
  desktop.replaceChildren(wrap);
  scopeStyles();
}

let installed = false;

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
          !['student', 'moderator', 'admin'].includes(user.role))
      ) {
        throw new Error('Status sesi tidak valid');
      }

      if (current === generation) {
        renderAccountNavigation(document, user);
      }
    } catch {
      if (current === generation) {
        renderAccountNavigation(document, null, true);
      }
    }
  };

  void refresh();
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) void refresh();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refresh();
  });
  document.addEventListener('astro:page-load', () => void refresh());
}
