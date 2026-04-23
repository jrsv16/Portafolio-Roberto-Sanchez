/* ============================================================
   main.js — Roberto Sánchez Vargas · Portfolio
   ============================================================ */

/* ─── CAROUSEL ─── */
function initCarousel(wrapperId, dotsId) {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;
  const track = wrap.querySelector('.carousel-track');
  const slides = Array.from(track.querySelectorAll('.carousel-slide'));
  const dotsContainer = document.getElementById(dotsId);
  const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.carousel-dot')) : [];
  const btnPrev = wrap.querySelector('.carousel-btn.prev');
  const btnNext = wrap.querySelector('.carousel-btn.next');
  let current = 0;

  function goTo(n) {
    current = ((n % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  btnPrev?.addEventListener('click', () => goTo(current - 1));
  btnNext?.addEventListener('click', () => goTo(current + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

  let touchStartX = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) > 44) goTo(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {

  // ─────────────────────────────────────────
  // NAVBAR — clase "scrolled" al hacer scroll
  // ─────────────────────────────────────────
  const navbar = document.querySelector('.navbar');

  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ─────────────────────────────────────────
  // NAVBAR TOGGLE — menú mobile
  // ─────────────────────────────────────────
  const toggle = document.querySelector('.navbar-toggle');
  const links  = document.querySelector('.navbar-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });

    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }

  // ─────────────────────────────────────────
  // SCROLL PROGRESS BAR
  // ─────────────────────────────────────────
  const progressBar = document.querySelector('.scroll-progress');

  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop  = window.scrollY;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
    }, { passive: true });
  }

  // ─────────────────────────────────────────
  // INTERSECTION OBSERVER — animaciones entrada
  // ─────────────────────────────────────────
  const animatedEls = document.querySelectorAll('.fade-up, .fade-in');

  if (animatedEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    animatedEls.forEach(el => observer.observe(el));
  }

  // ─────────────────────────────────────────
  // ACTIVE NAV LINK — highlight según sección visible
  // ─────────────────────────────────────────
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.navbar-links a');

  if (sections.length > 0 && navLinks.length > 0) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === '#' + entry.target.id
            );
          });
        }
      });
    }, { threshold: 0.4 });

    sections.forEach(section => sectionObserver.observe(section));
  }

  // ─────────────────────────────────────────
  // SKILL BARS — animar al entrar en viewport
  // ─────────────────────────────────────────
  const bars = document.querySelectorAll('.skill-bar-fill');

  if (bars.length) {
    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          barObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    bars.forEach(bar => barObserver.observe(bar));
  }

  // ─────────────────────────────────────────
  // CAROUSEL — auto-init para páginas de proyecto
  // ─────────────────────────────────────────
  if (document.getElementById('carousel-pub')) initCarousel('carousel-pub', 'dots-pub');

  // ─────────────────────────────────────────
  // LIGHTBOX
  // ─────────────────────────────────────────
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  const lbImg    = lb.querySelector('.lb-img');
  const lbVideo  = lb.querySelector('.lb-video');
  const lbClose  = lb.querySelector('.lb-close');
  const lbPrev   = lb.querySelector('.lb-prev');
  const lbNext   = lb.querySelector('.lb-next');
  const lbCount  = lb.querySelector('.lb-counter');
  const lbBd     = lb.querySelector('.lb-backdrop');

  let gallery = [], idx = 0;
  let scale = 1, panX = 0, panY = 0;
  let dragging = false, dragSX = 0, dragSY = 0;
  let pinchDist0 = null, pinchScale0 = 1;

  const galleries = {};
  document.querySelectorAll('[data-gallery]').forEach(el => {
    const g   = el.dataset.gallery;
    const i   = parseInt(el.dataset.idx, 10);
    const src = el.dataset.src;
    const isVid = /\.(mp4|webm|ogg)$/i.test(src);
    if (!galleries[g]) galleries[g] = [];
    galleries[g][i] = { src, type: isVid ? 'video' : 'image' };
  });

  function open(galleryName, startIdx) {
    gallery = galleries[galleryName] || [];
    idx = startIdx || 0;
    scale = 1; panX = 0; panY = 0;
    render();
    lb.classList.add('active');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('active');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lbVideo.pause?.();
    lbVideo.removeAttribute('src');
    lbImg.src = '';
  }

  function render() {
    const item = gallery[idx];
    if (!item) return;
    scale = 1; panX = 0; panY = 0;
    applyTransform();

    if (item.type === 'video') {
      lbImg.hidden = true;
      lbVideo.classList.add('show');
      lbVideo.src = item.src;
      lbVideo.load();
    } else {
      lbVideo.classList.remove('show');
      lbVideo.pause?.();
      lbVideo.removeAttribute('src');
      lbImg.hidden = false;
      lbImg.src = item.src;
    }

    const total = gallery.length;
    lbCount.textContent = total > 1 ? `${idx + 1} / ${total}` : '';
    lbPrev.hidden = total <= 1;
    lbNext.hidden = total <= 1;
  }

  function applyTransform() {
    lbImg.style.transform = `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`;
  }

  function clampScale(v) { return Math.min(5, Math.max(0.5, v)); }

  lbClose.addEventListener('click', close);
  lbBd.addEventListener('click', close);
  lbPrev.addEventListener('click', () => { idx = (idx - 1 + gallery.length) % gallery.length; render(); });
  lbNext.addEventListener('click', () => { idx = (idx + 1) % gallery.length; render(); });

  lb.addEventListener('wheel', e => {
    e.preventDefault();
    scale = clampScale(scale + (e.deltaY < 0 ? 0.15 : -0.15));
    if (scale <= 1) { panX = 0; panY = 0; }
    applyTransform();
  }, { passive: false });

  lbImg.addEventListener('mousedown', e => {
    if (scale <= 1) return;
    dragging = true;
    dragSX = e.clientX - panX;
    dragSY = e.clientY - panY;
    lbImg.classList.add('dragging');
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    panX = e.clientX - dragSX;
    panY = e.clientY - dragSY;
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    lbImg.classList.remove('dragging');
  });

  lb.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      pinchDist0 = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchScale0 = scale;
    }
  }, { passive: true });
  lb.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && pinchDist0 !== null) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      scale = clampScale(pinchScale0 * (dist / pinchDist0));
      applyTransform();
    }
  }, { passive: false });
  lb.addEventListener('touchend', () => { pinchDist0 = null; });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft')   lbPrev.click();
    if (e.key === 'ArrowRight')  lbNext.click();
    if (e.key === '+' || e.key === '=') { scale = clampScale(scale + 0.25); applyTransform(); }
    if (e.key === '-')           { scale = clampScale(scale - 0.25); if (scale <= 1) { panX = 0; panY = 0; } applyTransform(); }
  });

  document.querySelectorAll('[data-gallery]').forEach(el => {
    el.addEventListener('click', () => open(el.dataset.gallery, parseInt(el.dataset.idx, 10)));
  });

  window.openLightbox = open;

});
