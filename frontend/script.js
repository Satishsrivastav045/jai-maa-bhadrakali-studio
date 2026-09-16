const API_BASE = String(window.STUDIO_API_BASE || '').replace(/\/$/, '');
const apiUrl = (path) => `${API_BASE}${path}`;

const studioConfig = {
  name: 'Jai Maa Bhadrakali Studio',
  phone: '+918853496825',
  email: 'jaimaabhadrakalistudio@gmail.com',
  website: 'https://jaimaabhadrakalistudio.in/',
  address: 'Shop no 5, Lalganj Ajhara, Near Saryu Montessori School, Pratapgarh, Uttar Pradesh 230128',
  socials: {
    youtube: 'https://www.youtube.com/@arvindsrivastava9574',
    instagram: 'https://www.instagram.com/jmbkstudio?igsh=ejYzZ3k5cHZkbXE2',
    facebook: '#',
    googleReviews: '#',
    directions: 'https://www.google.com/maps/search/?api=1&query=Shop%20No%205%20Lalganj%20Ajhara%20Pratapgarh%20Uttar%20Pradesh%20230128%20Near%20Saryu%20Montessori%20School',
  },
  messages: {
    wedding: 'Namaste Jai Maa Bhadrakali Studio, mujhe wedding photography ke liye enquiry karni hai.',
    preWedding: 'Namaste Jai Maa Bhadrakali Studio, mujhe pre-wedding shoot ke liye information chahiye.',
    katha: 'Namaste Jai Maa Bhadrakali Studio, mujhe Katha/Religious Event Live Streaming ke liye enquiry karni hai.',
    general: 'Namaste Jai Maa Bhadrakali Studio, mujhe aapki services ke baare mein information chahiye.',
  },
};

try {
  Object.assign(studioConfig, JSON.parse(localStorage.getItem('jmbs_settings') || '{}'));
} catch {
  // Keep the published defaults if saved browser settings are invalid.
}

const toast = document.querySelector('.toast');
let toastTimer;

function cleanPhone(phone) {
  return phone.replace(/\D/g, '');
}

function formatPhone(phone) {
  const digits = cleanPhone(phone);
  return digits.length === 12 && digits.startsWith('91') ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}` : phone;
}

function whatsappUrl(message) {
  return `https://wa.me/${cleanPhone(studioConfig.phone)}?text=${encodeURIComponent(message)}`;
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function trackLead(eventName, detail = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...detail });
}

function setupViewerCounter() {
  const counter = document.querySelector('#viewerCount');
  const stripCounter = document.querySelector('#viewerCountStrip');
  if (!counter && !stripCounter) return;

  const key = counter?.dataset.counterKey || 'jmbs_profile_views';
  let views = 1;

  try {
    views = Number(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, String(views));
  } catch {
    views = 1;
  }

  const formatted = String(views).padStart(4, '0');
  if (counter) counter.textContent = formatted;
  if (stripCounter) stripCounter.textContent = formatted;
  trackLead('profile_view_counted', { local_views: views });
}

function hydrateLinks() {
  const contactPhone = document.querySelector('#contactPhone');
  const contactEmail = document.querySelector('#contactEmail');
  const contactAddress = document.querySelector('#contactAddress');
  const contactAddressInline = document.querySelector('#contactAddressInline');
  if (contactPhone) {
    contactPhone.textContent = formatPhone(studioConfig.phone);
    contactPhone.href = `tel:${studioConfig.phone}`;
  }
  if (contactEmail) {
    contactEmail.textContent = studioConfig.email;
    contactEmail.href = `mailto:${studioConfig.email}`;
  }
  if (contactAddress) contactAddress.textContent = studioConfig.address;
  if (contactAddressInline) contactAddressInline.textContent = studioConfig.address;

  document.querySelectorAll('.call-link').forEach((link) => {
    link.href = `tel:${studioConfig.phone}`;
    link.addEventListener('click', () => trackLead('call_click', { location: link.dataset.track || 'site' }));
  });

  document.querySelectorAll('.whatsapp-link').forEach((link) => {
    const key = link.dataset.messageKey || 'general';
    link.href = whatsappUrl(studioConfig.messages[key] || studioConfig.messages.general);
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.addEventListener('click', () => trackLead('whatsapp_click', { message_key: key }));
  });

  const linkMap = [
    ['.youtube-link', studioConfig.socials.youtube],
    ['.instagram-link', studioConfig.socials.instagram],
    ['.facebook-link', studioConfig.socials.facebook],
    ['.google-review-link', studioConfig.socials.googleReviews],
    ['.directions-link', studioConfig.socials.directions],
  ];

  linkMap.forEach(([selector, href]) => {
    document.querySelectorAll(selector).forEach((link) => {
      link.href = link.dataset.youtubeUrl || href;
      if (href === '#') {
        link.hidden = true;
      }
    });
  });

  const profileLink = document.querySelector('#profileLink');
  if (profileLink) profileLink.textContent = studioConfig.website;

  const websiteQr = document.querySelector('#websiteQr');
  if (websiteQr) {
    websiteQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(studioConfig.website)}`;
  }

  const whatsappShare = document.querySelector('#whatsappShare');
  if (whatsappShare) {
    whatsappShare.href = `https://wa.me/?text=${encodeURIComponent(`${studioConfig.name} - ${studioConfig.website}`)}`;
  }

  const facebookShare = document.querySelector('#facebookShare');
  if (facebookShare) {
    facebookShare.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(studioConfig.website)}`;
  }
}

function hydrateManagedGallery(remoteItems = null) {
  const grid = document.querySelector('#portfolioGrid');
  if (!grid) return;

  let managedItems = remoteItems;
  if (!managedItems) {
    try {
      managedItems = JSON.parse(localStorage.getItem('jmbs_gallery') || 'null');
    } catch {
      managedItems = null;
    }
  }
  if (!Array.isArray(managedItems)) return;

  grid.replaceChildren(...managedItems.map((item, index) => {
    const button = document.createElement('button');
    button.className = `gallery-item reveal${index === 0 ? ' large' : ''}${index === 4 ? ' tall' : ''}`;
    button.type = 'button';
    button.dataset.category = item.category || 'wedding';
    button.dataset.full = item.url;
    const image = document.createElement('img');
    image.loading = 'lazy';
    image.src = item.url;
    image.alt = item.title || 'Jai Maa Bhadrakali Studio portfolio image';
    const label = document.createElement('span');
    label.textContent = item.title || 'Portfolio';
    button.append(image, label);
    return button;
  }));
}

async function hydratePublicData() {
  try {
    const response = await fetch(apiUrl('/api/public'));
    if (!response.ok) return;
    const payload = await response.json();
    Object.assign(studioConfig, payload.settings || {});
    hydrateLinks();
    hydrateManagedGallery(payload.gallery);
    setupReveal();
    setupGallery();
  } catch {
    // Static defaults remain usable on a static host without the API.
  }
}

function setupReveal() {
  const revealItems = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('visible'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 35, 220)}ms`;
    revealObserver.observe(item);
  });
}

function setupSaveCard() {
  const button = document.querySelector('#saveCard');
  if (!button) return;

  button.addEventListener('click', () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${studioConfig.name}`,
      `ORG:${studioConfig.name}`,
      `TEL;TYPE=CELL:${studioConfig.phone}`,
      `EMAIL:${studioConfig.email}`,
      `URL:${studioConfig.website}`,
      `ADR;TYPE=WORK:;;${studioConfig.address}`,
      'NOTE:Wedding photography, cinematic films and Katha live streaming',
      'END:VCARD',
    ].join('\n');
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'jai-maa-bhadrakali-studio.vcf';
    link.click();
    URL.revokeObjectURL(link.href);
    trackLead('save_card_click');
    showToast('Contact card downloaded');
  });
}

function setupDateForm() {
  const form = document.querySelector('#dateForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const message = [
      `Namaste ${studioConfig.name},`,
      'Mujhe date availability check karni hai.',
      `Name: ${data.get('name')}`,
      `WhatsApp: ${data.get('phone')}`,
      `Event Type: ${data.get('eventType')}`,
      `Event Date: ${data.get('date')}`,
      `Location: ${data.get('location')}`,
      `Required Service: ${data.get('service')}`,
      `Package Preference: ${data.get('package') || 'Not decided'}`,
      `Message: ${data.get('message') || 'Please share package details and availability.'}`,
    ].join('\n');
    try {
      const leads = JSON.parse(localStorage.getItem('jmbs_leads') || '[]');
      leads.push({
        name: data.get('name'),
        phone: data.get('phone'),
        eventType: data.get('eventType'),
        date: data.get('date'),
        location: data.get('location'),
        service: data.get('service'),
        message: data.get('message'),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('jmbs_leads', JSON.stringify(leads));
    } catch {
      // WhatsApp enquiry still works if browser storage is unavailable.
    }
    try {
      await fetch(apiUrl('/api/leads'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: data.get('name'), phone: data.get('phone'), eventType: data.get('eventType'), date: data.get('date'), location: data.get('location'), service: data.get('service'), package: data.get('package'), message: data.get('message'),
      }) });
    } catch {
      // Keep the WhatsApp flow working when the API is unavailable.
    }
    trackLead('date_availability_submit', {
      event_type: data.get('eventType'),
      service: data.get('service'),
    });
    window.open(whatsappUrl(message), '_blank', 'noreferrer');
    showToast('WhatsApp enquiry ready');
  });
}

function setupGallery() {
  const filterButtons = document.querySelectorAll('[data-filter]');
  const items = Array.from(document.querySelectorAll('.gallery-item'));
  const lightbox = document.querySelector('#lightbox');
  if (!items.length || !lightbox) return;

  const lightboxImage = lightbox.querySelector('img');
  let visibleItems = items;
  let currentIndex = 0;

  function setFilter(filter) {
    filterButtons.forEach((button) => button.classList.toggle('active', button.dataset.filter === filter));
    items.forEach((item) => {
      const categories = item.dataset.category.split(' ');
      item.hidden = filter !== 'all' && !categories.includes(filter);
    });
    visibleItems = items.filter((item) => !item.hidden);
    trackLead('gallery_filter', { filter });
  }

  function openLightbox(index) {
    currentIndex = index;
    const item = visibleItems[currentIndex];
    if (!item) return;
    const image = item.querySelector('img');
    lightboxImage.src = item.dataset.full || image.src;
    lightboxImage.alt = image.alt;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
  }

  function moveLightbox(direction) {
    if (!visibleItems.length) return;
    currentIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length;
    openLightbox(currentIndex);
  }

  filterButtons.forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  items.forEach((item) => item.addEventListener('click', () => openLightbox(visibleItems.indexOf(item))));
  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => moveLightbox(-1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => moveLightbox(1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') moveLightbox(-1);
    if (event.key === 'ArrowRight') moveLightbox(1);
  });
}

function setupShare() {
  const shareButton = document.querySelector('#shareProfile');
  const copyButton = document.querySelector('#copyLink');

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(studioConfig.website);
        showToast('Profile link copied');
      } catch {
        showToast(studioConfig.website);
      }
      trackLead('copy_link_click');
    });
  }

  if (shareButton) {
    shareButton.addEventListener('click', async () => {
      const shareData = {
        title: studioConfig.name,
        text: `${studioConfig.name} - Wedding Photography, Cinematic Films and Katha Live Streaming`,
        url: studioConfig.website,
      };
      if (navigator.share) {
        await navigator.share(shareData);
        trackLead('native_share_click');
        return;
      }
      showToast('Copy Link, WhatsApp Share ya Facebook Share use karein');
    });
  }
}

hydrateLinks();
setupViewerCounter();
hydrateManagedGallery();
setupReveal();
setupSaveCard();
setupDateForm();
setupGallery();
setupShare();
hydratePublicData();
