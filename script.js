const header = document.querySelector('.site-header');
const isHome = document.body.classList.contains('home');

if (header) {
  const syncHeader = () => {
    if (!isHome) {
      header.classList.remove('transparent');
      header.classList.add('solid');
      return;
    }
    if (window.scrollY > 12) {
      header.classList.add('solid');
      header.classList.remove('transparent');
    } else {
      header.classList.add('transparent');
      header.classList.remove('solid');
    }
  };

  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
}

const menuBtn = document.querySelector('.menu-btn');
if (menuBtn && header) {
  menuBtn.addEventListener('click', () => {
    const open = header.classList.toggle('mobile-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
