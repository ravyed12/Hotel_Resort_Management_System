const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.style.color = 'var(--accent)';
      link.style.fontWeight = '700';
    }
  });

  const navbar = document.querySelector('.navbar-custom');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        navbar.style.background = 'rgba(15, 23, 42, 0.98)';
      } else {
        navbar.style.boxShadow = 'none';
        navbar.style.background = '';
      }
    });
  }

  const scrollBtn = document.createElement('button');
  scrollBtn.innerHTML = '↑';
  scrollBtn.setAttribute('aria-label', 'Scroll to top');
  Object.assign(scrollBtn.style, {
    position: 'fixed', bottom: '2rem', right: '2rem',
    width: '48px', height: '48px', borderRadius: '50%',
    border: 'none', background: 'var(--accent, #c8a96e)',
    color: '#fff', fontSize: '1.4rem', cursor: 'pointer',
    opacity: '0', transition: 'opacity 0.3s ease',
    zIndex: '9999', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  });
  document.body.appendChild(scrollBtn);

  window.addEventListener('scroll', () => {
    scrollBtn.style.opacity = window.scrollY > 300 ? '1' : '0';
  });
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
      '.card, .feature-image, .gallery-item, .booking-card, .booking-visual-card'
    );
    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => observer.observe(el));
  }

  function initDateValidation() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];

    dateInputs.forEach(input => input.setAttribute('min', today));

    if (dateInputs.length === 2) {
      const [checkin, checkout] = dateInputs;
      checkin.addEventListener('change', () => {
        const nextDay = new Date(checkin.value);
        nextDay.setDate(nextDay.getDate() + 1);
        checkout.setAttribute('min', nextDay.toISOString().split('T')[0]);
        if (checkout.value && checkout.value <= checkin.value) {
          checkout.value = '';
        }
      });
    }
  }
  initDateValidation();

  function initPriceCalculator(prices) {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const roomSelect = document.querySelector('#room-select');
    const submitBtn = document.querySelector('.btn-search.w-100');

    if (!roomSelect || dateInputs.length !== 2 || !submitBtn) return;

    const priceDisplay = document.createElement('div');
    priceDisplay.id = 'price-estimate';
    Object.assign(priceDisplay.style, {
      textAlign: 'center', padding: '0.75rem',
      marginBottom: '1rem', borderRadius: '8px',
      background: '#f8f9fa', fontWeight: 'bold',
      fontSize: '1rem', color: 'var(--primary, #0f172a)',
      display: 'none'
    });
    submitBtn.parentNode.insertBefore(priceDisplay, submitBtn);

    function updatePrice() {
      const [checkin, checkout] = dateInputs;
      if (!checkin.value || !checkout.value || !roomSelect.value) {
        priceDisplay.style.display = 'none';
        return;
      }
      const nights = Math.ceil(
        (new Date(checkout.value) - new Date(checkin.value)) / (1000 * 60 * 60 * 24)
      );
      const roomPrice = prices[roomSelect.value];
      if (nights > 0 && roomPrice) {
        const total = nights * roomPrice;
        priceDisplay.textContent = `Estimated Total: $${total.toLocaleString()} (${nights} night${nights > 1 ? 's' : ''})`;
        priceDisplay.style.display = 'block';
      } else {
        priceDisplay.style.display = 'none';
      }
    }

    dateInputs.forEach(input => input.addEventListener('change', updatePrice));
    roomSelect.addEventListener('change', updatePrice);
    updatePrice();
  }

  function initFormHandlers() {
    document.querySelectorAll('form[data-api]').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.submittedAt = new Date().toISOString();

        const endpoint = form.getAttribute('data-api');

        try {
          const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (!response.ok) throw new Error('Server error');

          const saved = await response.json();

          let message = 'Message sent successfully!';
          if (endpoint === 'bookings') message = 'Reservation confirmed! Booking ID: #' + saved.id;
          if (endpoint === 'newsletter') message = 'Subscribed! Watch your inbox for exclusive offers.';

          showModal(message);
          form.reset();
        } catch (error) {
          showModal('Could not connect to server. Please try again.', true);
          console.error('Form submission error:', error);
        }
      });
    });
  }

  function showModal(message, isError = false) {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: '99999'
    });
    overlay.innerHTML = `
      <div style="background: white; padding: 2.5rem 3rem; border-radius: 16px;
                  text-align: center; max-width: 420px; box-shadow: 0 25px 50px rgba(0,0,0,0.3);">
        <h3 style="margin-bottom: 0.5rem;">${message}</h3>
        <p style="color: #666; margin-bottom: 1.5rem;">${isError ? 'Make sure json-server is running.' : 'Thank you for choosing LuxeResort.'}</p>
        <button onclick="this.closest('div[style]').parentElement.remove()"
                style="padding: 0.6rem 2rem; border: none; background: ${isError ? '#dc3545' : 'var(--accent, #c8a96e)'};
                       color: white; border-radius: 8px; cursor: pointer; font-size: 1rem;">
          Close
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (galleryItems.length === 0) return;

    galleryItems.forEach(item => {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        const imgSrc = item.querySelector('img').src;
        const title = item.querySelector('.gallery-overlay')?.textContent || '';

        const lightbox = document.createElement('div');
        Object.assign(lightbox.style, {
          position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', zIndex: '99999', cursor: 'pointer'
        });
        lightbox.innerHTML = `
          <button style="position:absolute;top:1.5rem;right:1.5rem;background:none;border:none;
                         color:white;font-size:2.5rem;cursor:pointer;line-height:1;">✕</button>
          <img src="${imgSrc}" style="max-width:90vw;max-height:80vh;object-fit:contain;border-radius:8px;">
          <p style="color:white;margin-top:1rem;font-size:1.2rem;letter-spacing:1px;">${title}</p>
        `;
        lightbox.addEventListener('click', () => lightbox.remove());
        document.body.appendChild(lightbox);
      });
    });
  }

  function initCounters(stats) {
    const statRow = document.getElementById('stats-row');
    if (!statRow || !stats) return;

    statRow.innerHTML = stats.map(stat => {
      if (stat.isRating) {
        return `<div class="col-6 col-md-3 border-end"><i class="bi bi-star-fill text-warning"></i> ${stat.value} ${stat.label}</div>`;
      }
      if (stat.isYear) {
        return `<div class="col-6 col-md-3">Est. ${stat.value}</div>`;
      }
      return `<div class="col-6 col-md-3 border-end" data-target="${stat.value}" data-suffix="${stat.suffix}" data-label="${stat.label}">0${stat.suffix} ${stat.label}</div>`;
    }).join('');

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          statRow.querySelectorAll('[data-target]').forEach(stat => {
            const target = parseInt(stat.dataset.target);
            const suffix = stat.dataset.suffix;
            const label = stat.dataset.label;
            let current = 0;
            const step = Math.ceil(target / 60);
            const interval = setInterval(() => {
              current += step;
              if (current >= target) {
                current = target;
                clearInterval(interval);
              }
              stat.textContent = current + suffix + ' ' + label;
            }, 30);
          });
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counterObserver.observe(statRow);
  }

  async function loadHomepage() {
    const roomsContainer = document.getElementById('rooms-container');
    const testimonialsContainer = document.getElementById('testimonials-container');

    if (!roomsContainer && !testimonialsContainer) return;

    try {
      const [roomsRes, testimonialsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/rooms`),
        fetch(`${API_URL}/testimonials`),
        fetch(`${API_URL}/stats`)
      ]);

      const rooms = await roomsRes.json();
      const testimonials = await testimonialsRes.json();
      const stats = await statsRes.json();

      const prices = {};
      rooms.forEach(r => prices[r.slug] = r.price);

      if (roomsContainer) {
        roomsContainer.innerHTML = rooms.map(room => `
          <div class="col-md-4">
            <div class="card h-100 position-relative">
              <span class="badge bg-dark rounded-pill position-absolute top-0 end-0 m-3 px-3 py-2 fs-6">From $${room.price.toLocaleString()}/night</span>
              <img src="${room.image}" alt="${room.name}">
              <div class="card-body text-center p-4">
                <h4>${room.name}</h4>
                <p class="text-muted mb-4">${room.tagline}</p>
                <a href="${room.detailPage}" class="btn-custom w-100">${room.viewLabel}</a>
              </div>
            </div>
          </div>
        `).join('');
      }

      if (testimonialsContainer) {
        testimonialsContainer.innerHTML = testimonials.map(t => {
          const fullStars = Math.floor(t.rating);
          const halfStar = t.rating % 1 >= 0.5;
          let stars = '';
          for (let i = 0; i < fullStars; i++) stars += '<i class="bi bi-star-fill"></i>';
          if (halfStar) stars += '<i class="bi bi-star-half"></i>';

          return `
            <div class="col-md-4">
              <div class="card h-100 p-4 bg-light text-center">
                <div class="mb-3 text-warning">${stars}</div>
                <blockquote class="blockquote fs-6">"${t.text}"</blockquote>
                <figcaption class="blockquote-footer mt-2">${t.name}</figcaption>
              </div>
            </div>
          `;
        }).join('');
      }

      initCounters(stats);
      initPriceCalculator(prices);
      initScrollAnimations();
    } catch (error) {
      console.error('Failed to load homepage data:', error);
      if (roomsContainer) roomsContainer.innerHTML = '<p class="text-center text-muted">Could not load rooms. Make sure json-server is running on port 3000.</p>';
    }
  }

  async function loadRoomsPage() {
    const container = document.getElementById('rooms-grid');
    if (!container) return;

    try {
      const res = await fetch(`${API_URL}/rooms`);
      const rooms = await res.json();

      container.innerHTML = rooms.map(room => `
        <div class="card">
          <img src="${room.image}" alt="${room.name}">
          <div class="card-body">
            <h4>${room.name}</h4>
            <p>${room.tagline}</p>
            <a href="${room.detailPage}" class="btn-custom">${room.viewLabel}</a>
          </div>
        </div>
      `).join('');

      initScrollAnimations();
    } catch (error) {
      console.error('Failed to load rooms:', error);
      container.innerHTML = '<p class="text-center text-muted">Could not load rooms. Make sure json-server is running.</p>';
    }
  }

  async function loadTeamPage() {
    const container = document.getElementById('team-container');
    if (!container) return;

    try {
      const res = await fetch(`${API_URL}/team`);
      const team = await res.json();

      container.innerHTML = team.map(member => `
        <div class="card">
          <img src="${member.image}" class="card-img-portrait" alt="${member.role}">
          <div class="card-body">
            <h4>${member.name}</h4>
            <p>${member.bio}</p>
          </div>
        </div>
      `).join('');

      initScrollAnimations();
    } catch (error) {
      console.error('Failed to load team:', error);
      container.innerHTML = '<p class="text-center text-muted">Could not load team data.</p>';
    }
  }

  async function loadGalleryPage() {
    const container = document.getElementById('gallery-container');
    if (!container) return;

    try {
      const res = await fetch(`${API_URL}/gallery`);
      const gallery = await res.json();

      container.innerHTML = gallery.map(item => `
        <div class="gallery-item shadow-sm">
          <img src="${item.image}" alt="${item.title}">
          <div class="gallery-overlay">${item.title}</div>
        </div>
      `).join('');

      initLightbox();
      initScrollAnimations();
    } catch (error) {
      console.error('Failed to load gallery:', error);
      container.innerHTML = '<p class="text-center text-muted">Could not load gallery.</p>';
    }
  }

  async function loadAmenitiesPage() {
    const amenitiesContainer = document.getElementById('amenities-container');
    const spaContainer = document.getElementById('spa-menu-body');
    if (!amenitiesContainer && !spaContainer) return;

    try {
      const [amenitiesRes, spaRes] = await Promise.all([
        fetch(`${API_URL}/amenities`),
        fetch(`${API_URL}/spaMenu`)
      ]);

      const amenities = await amenitiesRes.json();
      const spaMenu = await spaRes.json();

      if (amenitiesContainer) {
        amenitiesContainer.innerHTML = amenities.map(a => `
          <div class="col-md-4">
            <div class="card h-100">
              <div class="card-body p-4">
                <i class="bi ${a.icon} ${a.iconColor} display-4 mb-3 d-block"></i>
                <h4>${a.name}</h4>
                <p class="text-muted">${a.description}</p>
              </div>
            </div>
          </div>
        `).join('');
      }

      if (spaContainer) {
        spaContainer.innerHTML = spaMenu.map(item => `
          <tr>
            <td>${item.treatment}</td>
            <td>${item.duration}</td>
            <td>${item.price}</td>
          </tr>
        `).join('');
      }

      initScrollAnimations();
    } catch (error) {
      console.error('Failed to load amenities:', error);
    }
  }

  async function loadBookingPage() {
    const roomSelect = document.getElementById('room-select');
    if (!roomSelect) return;

    try {
      const res = await fetch(`${API_URL}/rooms`);
      const rooms = await res.json();

      const prices = {};
      const preselect = roomSelect.dataset.preselect || '';

      roomSelect.innerHTML = rooms.map(room => {
        prices[room.slug] = room.price;
        const selected = room.slug === preselect ? 'selected' : '';
        return `<option value="${room.slug}" ${selected}>${room.name} ($${room.price.toLocaleString()} / night)</option>`;
      }).join('');

      if (!preselect) {
        roomSelect.insertAdjacentHTML('afterbegin', '<option value="">Select a room...</option>');
      }

      initPriceCalculator(prices);
      initScrollAnimations();
    } catch (error) {
      console.error('Failed to load rooms for booking:', error);
    }
  }

  const page = currentPage;

  if (page === 'index.html' || page === '') {
    loadHomepage();
  } else if (page === 'rooms.html') {
    loadRoomsPage();
  } else if (page === 'about.html') {
    loadTeamPage();
  } else if (page === 'gallery.html') {
    loadGalleryPage();
  } else if (page === 'amenities.html') {
    loadAmenitiesPage();
  } else if (page.startsWith('booking')) {
    loadBookingPage();
  } else {
    initScrollAnimations();
  }

  initFormHandlers();
  initLightbox();
});
