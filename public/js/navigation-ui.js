// Mobile navigation is an inline disclosure, not a modal: no focus trap needed.
export function bindNavigation(document) {
  const toggle = document.getElementById('menu-toggle');
  const close = () => {
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Menu';
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close menu' : 'Menu';
  });
  document.querySelector('.sidebar').addEventListener('click', event => {
    if (event.target.closest('a[href]')) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      close();
      toggle.focus();
    }
  });
  return close;
}

export function updateNavigation(document, route, arg, lessons) {
  let target = `#${route}`;
  if (route === 'mission') target = '#missions';
  if (route === 'lesson') {
    const category = lessons.find(lesson => lesson.id === arg)?.category;
    target = category ? `#library/${category}` : '#library';
  }
  if (route === 'library' && arg) target = `#library/${arg}`;
  if (route === 'practice' && ['quick', 'recall', 'simulation'].includes(arg)) target = `#practice/${arg}`;
  const links = [...document.querySelectorAll('nav a')];
  if (!links.some(a => a.getAttribute('href') === target)) target = `#${route}`;
  for (const link of links) {
    if (link.getAttribute('href') === target) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
