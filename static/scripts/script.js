// Determine base path prefix dynamically
function getBasePrefix() {
	const scriptEl = document.querySelector('script[src*="script.js"]');
	if (scriptEl) {
		const src = scriptEl.getAttribute('src');
		const match = src.match(/^(.*?)static\//);
		if (match && match[1] !== undefined) {
			return match[1];
		}
	}
	const isSubdir = window.location.pathname.includes('/about') ||
		window.location.pathname.includes('/team') ||
		window.location.pathname.includes('/link') ||
		window.location.pathname.includes('/events') ||
		window.location.pathname.includes('/gallery');
	return isSubdir ? '../' : './';
}

const basePrefix = getBasePrefix();

let allEventsList = [];
let upcomingEvents = [];
let highlights = [];

// Helper to parse date strings cleanly
function parseEventDate(dateStr, timeStr = '') {
	if (!dateStr) return null;
	let dt = new Date(`${dateStr} ${timeStr}`.trim());
	if (isNaN(dt.getTime())) {
		dt = new Date(dateStr);
	}
	return isNaN(dt.getTime()) ? null : dt;
}

// Check if an event is in the past (supports automatic date calculation or explicit isPast property)
function isPastEvent(event) {
	if (typeof event.isPast === 'boolean') return event.isPast;
	if (event.isPast === 'true' || event.isPast === 'past') return true;
	if (event.isPast === 'false' || event.isPast === 'upcoming') return false;
	if (!event.date) return false;
	const dt = parseEventDate(event.date, event.time);
	if (!dt) return false;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return dt < today;
}

// --- Render Upcoming Events on Home Page ---
function renderEvents() {
	const eventsSection = document.getElementById('events');
	const eventsContainer = document.getElementById('events-list');
	if (!eventsSection) return;

	if (!upcomingEvents || upcomingEvents.length === 0) {
		if (eventsContainer) {
			eventsContainer.innerHTML = `
				<div style="text-align: center; padding: 2rem; border: 2px dashed #ccc; border-radius: 12px; color: #666;">
					<p style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem;">No upcoming events right now!</p>
					<p style="font-size: 0.9rem;">Check back soon or explore our past highlights below.</p>
				</div>
			`;
		}
		return;
	}

	eventsSection.style.display = 'block';
	if (!eventsContainer) return;

	eventsContainer.innerHTML = upcomingEvents.map((event, index) => `
        <a href="${event.link || '#'}" class="event-link" style="text-decoration: none; color: inherit;">
            <div class="event-item" style="border-bottom: 1px solid #ddd; padding: 1.5rem 0; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s ease; opacity: 0; transform: translateY(20px);" data-delay="${index * 100}">
                <div style="display: flex; align-items: center; gap: 2rem;">
                    <ion-icon name="flower-outline" style="color: #4CAF50; font-size: 1.5rem; transition: transform 0.5s;"></ion-icon>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 800; font-size: 1rem; text-transform: uppercase;">${event.date || 'TBA'}</span>
                        <span style="color: #666; font-size: 0.75rem; font-weight: 600;">${event.time || ''}</span>
                    </div>
                </div>
                <div style="font-family: 'Playfair Display', serif; font-size: 1.5rem; letter-spacing: 1px; flex-grow: 1; text-align: center; font-style: italic; font-weight: 800; margin: 0 1rem;">${event.name}</div>
                <div class="arrow-icon" style="transform: rotate(-45deg); font-size: 1.5rem; transition: transform 0.3s;">
                    <ion-icon name="arrow-forward-outline"></ion-icon>
                </div>
            </div>
        </a>
    `).join('');

	// Attach hover listeners
	const items = document.querySelectorAll('.event-item');
	items.forEach(item => {
		item.addEventListener('mouseenter', () => {
			item.style.background = '#fafafa';
			item.style.paddingLeft = '10px';
			item.style.paddingRight = '10px';
			const icon = item.querySelector('ion-icon[name="flower-outline"]');
			if (icon) icon.style.transform = 'rotate(180deg) scale(1.2)';
			const arrow = item.querySelector('.arrow-icon');
			if (arrow) arrow.style.transform = 'rotate(0deg)';
		});
		item.addEventListener('mouseleave', () => {
			item.style.background = 'transparent';
			item.style.paddingLeft = '0';
			item.style.paddingRight = '0';
			const icon = item.querySelector('ion-icon[name="flower-outline"]');
			if (icon) icon.style.transform = 'rotate(0deg)';
			const arrow = item.querySelector('.arrow-icon');
			if (arrow) arrow.style.transform = 'rotate(-45deg)';
		});
	});
}

// --- Smooth Scroll & Scroll Animations ---
function setupObservers() {
	const observerOptions = {
		threshold: 0.1,
		rootMargin: "0px 0px -50px 0px"
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('is-visible');

				// Specific logic for event items to stagger them
				if (entry.target.classList.contains('event-item')) {
					const delay = entry.target.getAttribute('data-delay') || 0;
					setTimeout(() => {
						entry.target.style.opacity = 1;
						entry.target.style.transform = 'translateY(0)';
					}, delay);
				}

				// Stats Counter Logic
				if (entry.target.classList.contains('stat-circle')) {
					startCounter(entry.target);
				}

				observer.unobserve(entry.target);
			}
		});
	}, observerOptions);

	// Observe Sections
	document.querySelectorAll('section').forEach(sec => {
		sec.classList.add('fade-in-section');
		observer.observe(sec);
	});

	// Observe Hero Cards
	document.querySelectorAll('.gallery-card').forEach(card => card.classList.add('animate-card'));

	// Observe Highlight Cards
	document.querySelectorAll('.highlight-card').forEach(card => observer.observe(card));

	// Observe Event Items
	setTimeout(() => {
		document.querySelectorAll('.event-item').forEach(item => observer.observe(item));
	}, 100);

	// Observe Stats
	document.querySelectorAll('.stat-circle').forEach(stat => observer.observe(stat));
}

// --- Number Counter Animation ---
function startCounter(element) {
	const numberSpan = element.querySelector('.stat-number');
	if (!numberSpan) return;

	const target = parseInt(numberSpan.innerText) || 0;
	const suffix = numberSpan.innerText.replace(/[0-9]/g, '');
	let count = 0;
	const duration = 2000;
	const startTime = performance.now();

	function update(currentTime) {
		const elapsed = currentTime - startTime;
		const progress = Math.min(elapsed / duration, 1);

		const easeOut = 1 - Math.pow(1 - progress, 3);

		count = Math.floor(easeOut * target);
		numberSpan.innerText = count + suffix;

		if (progress < 1) {
			requestAnimationFrame(update);
		} else {
			numberSpan.innerText = target + suffix;
		}
	}

	requestAnimationFrame(update);
}

function updateCopyright() {
	const yearSpan = document.getElementById('year');
	if (yearSpan) {
		yearSpan.innerText = new Date().getFullYear();
	}
}

// --- Unified Data Fetcher for Events ---
async function loadEventsData() {
	try {
		const response = await fetch(basePrefix + 'static/json/events.json');
		if (!response.ok) throw new Error('Failed to fetch events');
		const data = await response.json();
		allEventsList = Array.isArray(data) ? data : (data.events || []);

		// Sort events chronologically (newest/future first)
		allEventsList.sort((a, b) => {
			const dtA = parseEventDate(a.date, a.time) || new Date(0);
			const dtB = parseEventDate(b.date, b.time) || new Date(0);
			return dtB - dtA;
		});

		// Filter upcoming vs past for home page
		upcomingEvents = allEventsList.filter(e => !isPastEvent(e));
		highlights = allEventsList.filter(e => isPastEvent(e) && e.image);

		renderEvents();
		renderHighlights();
		initCarousel();
		initEventsPage();
	} catch (error) {
		console.error('Error loading events:', error);
		const eventsContainer = document.getElementById('events-list');
		if (eventsContainer) {
			eventsContainer.innerHTML = `<p style="text-align: center; color: #999;">Unable to load events at this time.</p>`;
		}
		const eventsGrid = document.getElementById('eventsGrid');
		if (eventsGrid) {
			eventsGrid.innerHTML = `
				<div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: white; border: 2px dashed #000; border-radius: 12px;">
					<h3 style="font-family: var(--font-serif); font-style: italic; font-size: 1.5rem; margin-bottom: 0.5rem;">Unable to load events</h3>
					<p style="color: #666;">Please check back later or refresh the page.</p>
				</div>
			`;
		}
	} finally {
		setTimeout(setupObservers, 100);
	}
}

async function loadEvents() {
	await loadEventsData();
}

// --- Highlights Carousel ---
function renderHighlights() {
	const highlightsContainer = document.getElementById('highlightsContainer');
	if (!highlightsContainer) return;

	if (!highlights || highlights.length === 0) {
		highlightsContainer.innerHTML = `<p style="text-align: center; color: #999; width: 100%;">No past highlights available.</p>`;
		return;
	}

	highlightsContainer.innerHTML = highlights.map((highlight, index) => `
		<div class="highlight-photo-card" data-delay="${index * 100}">
			<div class="highlight-card-header">
				<div class="highlight-event-info">
					<h3 class="highlight-event-name">${highlight.name}</h3>
					<div class="highlight-event-date">${highlight.date || ''}</div>
				</div>
				<div class="highlight-star-marker">★</div>
			</div>
			<div class="highlight-image-box">
				<img src="${basePrefix}static/images/${highlight.image}" alt="${highlight.name}" onerror="this.style.display='none'">
			</div>
		</div>
	`).join('');

	setTimeout(() => {
		document.querySelectorAll('.highlight-photo-card').forEach(card => {
			card.classList.add('is-visible');
		});
	}, 100);
}

function initCarousel() {
	const container = document.getElementById('highlightsContainer');
	const prevBtn = document.getElementById('highlightPrev');
	const nextBtn = document.getElementById('highlightNext');

	if (!container || !prevBtn || !nextBtn) return;

	function getVisibleCards() {
		return window.innerWidth <= 768 ? 1 : 3;
	}

	function updateButtons() {
		const visibleCards = getVisibleCards();
		const totalCards = highlights.length;

		if (totalCards <= visibleCards) {
			prevBtn.classList.add('hidden');
			nextBtn.classList.add('hidden');
			return;
		} else {
			prevBtn.classList.remove('hidden');
			nextBtn.classList.remove('hidden');
		}

		const scrollLeft = container.scrollLeft;
		const maxScroll = container.scrollWidth - container.clientWidth;

		prevBtn.disabled = scrollLeft <= 0;
		nextBtn.disabled = scrollLeft >= maxScroll - 5;
	}

	function scrollCarousel(direction) {
		const cardWidth = container.querySelector('.highlight-photo-card')?.offsetWidth || 0;
		const gap = 32;
		const scrollAmount = (cardWidth + gap) * getVisibleCards();

		container.scrollBy({
			left: direction === 'next' ? scrollAmount : -scrollAmount,
			behavior: 'smooth'
		});

		setTimeout(updateButtons, 300);
	}

	prevBtn.addEventListener('click', () => scrollCarousel('prev'));
	nextBtn.addEventListener('click', () => scrollCarousel('next'));
	container.addEventListener('scroll', updateButtons);
	window.addEventListener('resize', updateButtons);

	updateButtons();
}

// --- Video Slider ---
function initVideoSlider() {
	const sliderContainer = document.querySelector('.video-slider-container');
	if (!sliderContainer) return;

	const slides = sliderContainer.querySelectorAll('.video-slide');
	const prevBtn = sliderContainer.querySelector('.prev-btn');
	const nextBtn = sliderContainer.querySelector('.next-btn');
	let currentIndex = 0;

	if (slides.length <= 1) {
		if (prevBtn) prevBtn.style.display = 'none';
		if (nextBtn) nextBtn.style.display = 'none';
		return;
	}

	function showVideo(index) {
		slides.forEach((slide, i) => {
			const video = slide.querySelector('video');
			if (i === index) {
				slide.classList.add('active');
				if (video) {
					video.currentTime = 0;
					video.play().catch(() => { });
				}
			} else {
				slide.classList.remove('active');
				if (video) {
					video.pause();
				}
			}
		});
	}

	prevBtn.addEventListener('click', () => {
		currentIndex = (currentIndex - 1 + slides.length) % slides.length;
		showVideo(currentIndex);
	});

	nextBtn.addEventListener('click', () => {
		currentIndex = (currentIndex + 1) % slides.length;
		showVideo(currentIndex);
	});

	// Initialize the first video
	showVideo(currentIndex);
}

// --- Hero Gallery ---
let galleryItems = [];

function renderHeroGallery() {
	const heroGalleryContainer = document.getElementById('heroGallery');
	if (!heroGalleryContainer) return;
	const itemsToShow = galleryItems.slice(0, 6);
	let cardsHtml = itemsToShow.map(item => {
		const srcPath = item.src.startsWith('static/') ? (basePrefix + item.src) : item.src;
		if (item.type === 'video') {
			return `
				<div class="gallery-card">
					<video muted autoplay loop class="video-container">
						<source src="${srcPath}" type="video/mp4">
						Your browser does not support the video tag.
					</video>
				</div>
			`;
		} else {
			return `
				<div class="gallery-card">
					<img src="${srcPath}" alt="Gallery Image" class="gallery-image">
				</div>
			`;
		}
	}).join('');

	// Pad with empty cards to ensure at least 6 cards total
	const totalCardsNeeded = 6;
	if (galleryItems.length < totalCardsNeeded) {
		const emptyCardsCount = totalCardsNeeded - galleryItems.length;
		for (let i = 0; i < emptyCardsCount; i++) {
			cardsHtml += `<div class="gallery-card"></div>`;
		}
	}

	heroGalleryContainer.innerHTML = cardsHtml;

	// Trigger animation for the newly created cards
	document.querySelectorAll('.gallery-card').forEach(card => card.classList.add('animate-card'));
}

async function loadHeroGallery() {
	const heroGalleryContainer = document.getElementById('heroGallery');
	try {
		const response = await fetch(basePrefix + 'static/json/gallery.json');
		if (!response.ok) throw new Error('Failed to fetch gallery data');
		galleryItems = await response.json();
		renderHeroGallery();
	} catch (error) {
		console.error('Error loading gallery:', error);
		// Fallback to static cards if JSON fails to load
		if (heroGalleryContainer && heroGalleryContainer.children.length === 0) {
			heroGalleryContainer.innerHTML = `
				<div class="gallery-card"></div>
				<div class="gallery-card"></div>
				<div class="gallery-card"></div>
				<div class="gallery-card"></div>
				<div class="gallery-card"></div>
				<div class="gallery-card"></div>
			`;
			document.querySelectorAll('.gallery-card').forEach(card => card.classList.add('animate-card'));
		}
	}
}

// Initiate component fetches immediately in parallel with DOM parsing
const navbarFetchPromise = fetch(basePrefix + 'static/components/navbar.html').then(res => res.ok ? res.text() : '').catch(err => '');
const footerFetchPromise = fetch(basePrefix + 'static/components/footer.html').then(res => res.ok ? res.text() : '').catch(err => '');

async function loadComponents() {
	const navbarPlaceholder = document.getElementById('navbar');
	const footerPlaceholder = document.getElementById('footer');

	if (navbarPlaceholder) {
		try {
			const html = await navbarFetchPromise;
			if (html) {
				navbarPlaceholder.innerHTML = html;
				setupNavbar();
			}
		} catch (err) {
			console.error('Error loading navbar component:', err);
		}
	}

	if (footerPlaceholder) {
		try {
			const html = await footerFetchPromise;
			if (html) {
				footerPlaceholder.innerHTML = html;
				setupFooter();
				updateCopyright();
			}
		} catch (err) {
			console.error('Error loading footer component:', err);
		}
	}
}

function setupFooter() {
	const footerContent = document.getElementById('footerContent');
	const footerExtra = document.getElementById('footerExtra');

	const path = window.location.pathname.toLowerCase();
	const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/ceal') || path.endsWith('/ceal/') || path === '' || (basePrefix === './' && !path.includes('/about') && !path.includes('/events') && !path.includes('/team') && !path.includes('/gallery') && !path.includes('/profile') && !path.includes('/404'));

	if (isHome) {
		if (footerContent && !footerContent.querySelector('.stats-container')) {
			const statsDiv = document.createElement('div');
			statsDiv.className = 'stats-container';
			statsDiv.innerHTML = `
				<div class="stat-circle">
					<span class="stat-number">350+</span>
					<span class="stat-label">community<br>members</span>
				</div>
				<div class="stat-circle" style="background: #E8D5B5;">
					<span class="stat-number">40+</span>
					<span class="stat-label">events</span>
				</div>
				<div class="stat-circle" style="background: #F0E0C0;">
					<span class="stat-number">70+</span>
					<span class="stat-label">projects</span>
				</div>
			`;
			footerContent.appendChild(statsDiv);
		}

		if (footerExtra && !footerExtra.querySelector('.image-banner-section')) {
			footerExtra.innerHTML = `
				<section class="image-banner-section container">
					<div class="banner-image-container">
						<img src="${basePrefix}static/images/team2026.png" alt="Community Image" class="banner-image">
					</div>
				</section>
			`;
		}
	}

	if (typeof setupObservers === 'function') {
		setTimeout(setupObservers, 50);
	}
}

function setupNavbar() {
	const navbar = document.querySelector('.navbar');
	if (navbar) {
		// Update relative links based on current page basePrefix
		navbar.querySelectorAll('a').forEach(link => {
			const href = link.getAttribute('href');
			if (href && href.startsWith('./')) {
				link.setAttribute('href', basePrefix + href.substring(2));
			}
		});

		// Update relative image sources based on current page basePrefix
		navbar.querySelectorAll('img').forEach(img => {
			const src = img.getAttribute('src');
			if (src && src.startsWith('./')) {
				img.setAttribute('src', basePrefix + src.substring(2));
			}
		});

		// Prevent hard reloads when clicking brand logo or home link while already on home page
		const path = window.location.pathname.toLowerCase();
		const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/ceal') || path.endsWith('/ceal/') || path === '' || (basePrefix === './' && !path.includes('/about') && !path.includes('/events') && !path.includes('/team') && !path.includes('/gallery') && !path.includes('/profile') && !path.includes('/404'));

		navbar.querySelectorAll('.brand, a[data-nav="home"]').forEach(homeLink => {
			homeLink.addEventListener('click', (e) => {
				if (isHome) {
					e.preventDefault();
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}
			});
		});
	}

	const navLinks = document.getElementById('navLinks');
	if (navLinks) {

		// Highlight active navigation link
		const path = window.location.pathname.toLowerCase();
		let activeNav = '';
		if (path.includes('/gallery')) activeNav = 'gallery';
		else if (path.includes('/events')) activeNav = 'events';
		else if (path.includes('/team')) activeNav = 'team';
		else if (path.includes('/about')) activeNav = 'about';

		navLinks.querySelectorAll('a').forEach(link => {
			const navKey = link.getAttribute('data-nav');
			if (navKey && navKey === activeNav) {
				link.classList.add('active');
			} else {
				link.classList.remove('active');
			}
		});
	}

	// Hamburger Menu Toggle
	const hamburger = document.getElementById('hamburger');
	if (hamburger && navLinks) {
		hamburger.addEventListener('click', () => {
			hamburger.classList.toggle('active');
			navLinks.classList.toggle('active');
		});

		navLinks.querySelectorAll('a').forEach(link => {
			link.addEventListener('click', () => {
				hamburger.classList.remove('active');
				navLinks.classList.remove('active');
			});
		});

		document.addEventListener('click', (e) => {
			if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
				hamburger.classList.remove('active');
				navLinks.classList.remove('active');
			}
		});
	}
}

document.addEventListener('DOMContentLoaded', () => {
	loadComponents();
	updateCopyright();
	loadEvents();
	initVideoSlider();
	loadHeroGallery();
	initMediaPopupSystem();
	if (document.getElementById('teamGrid')) {
		loadTeam();
	}

	if (document.getElementById('profile-card')) {
		initProfilePage();
	}

	if (document.getElementById('allGalleryGrid')) {
		initGalleryPage();
	}
});

// =========================================
// GALLERY PAGE FUNCTIONALITY
// =========================================

async function initGalleryPage() {
	const allGalleryGrid = document.getElementById('allGalleryGrid');
	if (!allGalleryGrid) return;

	let allMediaItems = [];
	const filterBtns = document.querySelectorAll('.gallery-filter-btn');

	try {
		const response = await fetch(basePrefix + 'static/json/gallery.json');
		if (!response.ok) throw new Error('Failed to fetch gallery data');
		allMediaItems = await response.json();
	} catch (err) {
		console.error('Error loading gallery page data:', err);
		allGalleryGrid.innerHTML = `
			<div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: white; border: 2px dashed #000; border-radius: 12px;">
				<h3 style="font-family: var(--font-serif); font-style: italic; font-size: 1.5rem; margin-bottom: 0.5rem;">Unable to load gallery</h3>
				<p style="color: #666;">Please check back later or refresh the page.</p>
			</div>
		`;
		return;
	}

	function filterAndRenderGallery(filterType) {
		filterBtns.forEach(btn => {
			if (btn.getAttribute('data-filter') === filterType) {
				btn.classList.add('active');
			} else {
				btn.classList.remove('active');
			}
		});

		let filtered = allMediaItems;
		if (filterType === 'IMAGES') {
			filtered = allMediaItems.filter(item => item.type === 'image');
		} else if (filterType === 'VIDEOS') {
			filtered = allMediaItems.filter(item => item.type === 'video');
		}

		renderGalleryPageCards(filtered);
	}

	filterBtns.forEach(btn => {
		btn.addEventListener('click', () => {
			const type = btn.getAttribute('data-filter');
			filterAndRenderGallery(type);
		});
	});

	filterAndRenderGallery('ALL');
}

function renderGalleryPageCards(items) {
	const grid = document.getElementById('allGalleryGrid');
	if (!grid) return;

	if (!items || items.length === 0) {
		grid.innerHTML = `
			<div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: white; border: 2px dashed #000; border-radius: 12px;">
				<h3 style="font-family: var(--font-serif); font-style: italic; font-size: 1.5rem; margin-bottom: 0.5rem;">No Media Found</h3>
				<p style="color: #666;">There are no items matching this category.</p>
			</div>
		`;
		return;
	}

	grid.innerHTML = items.map((item, index) => {
		const srcPath = item.src.startsWith('static/') ? (basePrefix + item.src) : item.src;
		const title = item.title || (item.type === 'video' ? 'Gallery Video' : 'Gallery Image');
		const isVid = item.type === 'video';

		return `
			<div class="gallery-card-item" data-delay="${index * 60}">
				<div class="gallery-media-wrapper">
					${isVid ? `
						<video muted autoplay loop class="video-container" alt="${title}" title="${title}">
							<source src="${srcPath}" type="video/mp4">
							Your browser does not support video.
						</video>
					` : `
						<img src="${srcPath}" alt="${title}" class="gallery-image">
					`}
				</div>
				<div class="gallery-card-info">
					<span class="gallery-card-title">${title}</span>
					<span class="gallery-type-badge">${isVid ? 'Video' : 'Photo'}</span>
				</div>
			</div>
		`;
	}).join('');

	setTimeout(() => {
		document.querySelectorAll('.gallery-card-item').forEach((card, idx) => {
			setTimeout(() => {
				card.classList.add('is-visible');
			}, idx * 60);
		});
	}, 100);
}

// =========================================
// TEAM PAGE FUNCTIONALITY
// =========================================

let teamMembers = [];
let currentYear = "2026";

// Render team members
function renderTeam() {
	const teamGrid = document.getElementById('teamGrid');
	if (!teamGrid) return;

	teamGrid.innerHTML = teamMembers.map((memberData, index) => {
		const member = memberData.member;
		const memberId = memberData.id;
		const s = member.socials || {};
		const hasSocials = s.linkedin || s.github || s.instagram || s.email || s.website;
		return `
			<div class="team-member-card" data-delay="${index * 80}" onclick="window.location.href='${basePrefix}profile/#${memberId}'">
				<div class="member-photo-container">
					<img src="${basePrefix}static/images/core_team/${member.image}" alt="${member.name}" class="member-photo" onerror="this.src='${basePrefix}static/images/team2026.png';">
				</div>
				<div class="member-info">
					<h3 class="member-name">${member.name}</h3>
					<p class="member-position">${member.position}</p>
					${hasSocials ? `
						<div class="member-socials">
							${s.linkedin ? `<a href="${s.linkedin}" target="_blank" rel="noopener" title="LinkedIn" aria-label="LinkedIn" onclick="event.stopPropagation();"><ion-icon name="logo-linkedin"></ion-icon></a>` : ''}
							${s.github ? `<a href="${s.github}" target="_blank" rel="noopener" title="GitHub" aria-label="GitHub" onclick="event.stopPropagation();"><ion-icon name="logo-github"></ion-icon></a>` : ''}
							${s.instagram ? `<a href="${s.instagram}" target="_blank" rel="noopener" title="Instagram" aria-label="Instagram" onclick="event.stopPropagation();"><ion-icon name="logo-instagram"></ion-icon></a>` : ''}
							${s.email ? `<a href="${s.email}" title="Email" aria-label="Email" onclick="event.stopPropagation();"><ion-icon name="mail-outline"></ion-icon></a>` : ''}
							${s.website ? `<a href="${s.website}" target="_blank" rel="noopener" title="Website" aria-label="Website" onclick="event.stopPropagation();"><ion-icon name="globe-outline"></ion-icon></a>` : ''}
						</div>
					` : ''}
				</div>
			</div>
		`;
	}).join('');

	// Trigger animations
	setTimeout(() => {
		document.querySelectorAll('.team-member-card').forEach((card, index) => {
			setTimeout(() => {
				card.classList.add('is-visible');
			}, index * 80);
		});
	}, 100);
}

// Load team data
async function loadTeam() {
	const teamGrid = document.getElementById('teamGrid');
	try {
		const response = await fetch(basePrefix + 'static/json/team.json');
		if (!response.ok) throw new Error('Failed to fetch team data');
		const data = await response.json();

		if (data[currentYear]) {
			teamMembers = Object.entries(data[currentYear]).map(([id, member]) => ({ id, member }));
		} else {
			teamMembers = [];
		}

		renderTeam();
	} catch (error) {
		console.error('Error loading team:', error);
		if (teamGrid) {
			teamGrid.innerHTML = `<p style="text-align: center; color: #999; grid-column: 1/-1;">Unable to load team members at this time.</p>`;
		}
	}
}

// =========================================
// DEDICATED EVENTS PAGE FUNCTIONALITY
// =========================================

function initEventsPage() {
	const eventsGrid = document.getElementById('eventsGrid');
	if (!eventsGrid) return;

	const filterBtns = document.querySelectorAll('.events-filter-btn');
	let activeFilter = 'ALL';

	function filterAndRender(filterType) {
		activeFilter = filterType;
		filterBtns.forEach(btn => {
			if (btn.getAttribute('data-filter') === filterType) {
				btn.classList.add('active');
			} else {
				btn.classList.remove('active');
			}
		});

		let filtered = allEventsList;
		if (filterType === 'UPCOMING') {
			filtered = allEventsList.filter(e => !isPastEvent(e));
		} else if (filterType === 'PAST') {
			filtered = allEventsList.filter(e => isPastEvent(e));
		}

		window.currentFilteredEventsList = filtered;
		renderEventsPageCards(filtered);
	}

	filterBtns.forEach(btn => {
		btn.addEventListener('click', () => {
			const type = btn.getAttribute('data-filter');
			filterAndRender(type);
		});
	});

	filterAndRender('ALL');
}

function renderEventsPageCards(filteredList) {
	const eventsGrid = document.getElementById('eventsGrid');
	if (!eventsGrid) return;

	if (filteredList.length === 0) {
		eventsGrid.innerHTML = `
			<div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: white; border: 2px dashed #000; border-radius: 12px;">
				<h3 style="font-family: var(--font-serif); font-style: italic; font-size: 1.5rem; margin-bottom: 0.5rem;">No Events Found</h3>
				<p style="color: #666;">There are no events matching this category right now.</p>
			</div>
		`;
		return;
	}

	eventsGrid.innerHTML = filteredList.map((event, index) => {
		const isPast = isPastEvent(event);
		const hasSub = Array.isArray(event.subEvents) && event.subEvents.length > 0;
		return `
			<div class="event-card-item" data-delay="${index * 80}">
				<div class="event-card-top">
					<span class="event-date-chip">${event.date || 'TBA'}</span>
					${event.time ? `<span class="event-time-chip"><ion-icon name="time-outline"></ion-icon> ${event.time}</span>` : ''}
				</div>
				<div class="event-card-body">
					<h3 class="event-card-title">${event.name}</h3>
					${event.description ? `<p class="event-card-desc">${event.description}</p>` : ''}
					${hasSub ? `
						<div>
							<button class="event-sub-badge" onclick="openSubEventsModal(${index})">
								<ion-icon name="layers-outline"></ion-icon> ${event.subEvents.length} Sub-events &rsaquo;
							</button>
						</div>
					` : ''}
					${event.image ? `
						<div style="width: 100%; height: 180px; border-radius: 8px; overflow: hidden; margin-bottom: 1rem; border: 1px solid #000;">
							<img src="${basePrefix}static/images/${event.image}" alt="${event.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.style.display='none'">
						</div>
					` : ''}
					<div class="event-card-footer">
						<span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: ${isPast ? '#777' : '#4CAF50'};">
							${isPast ? '● Past Event' : '● Upcoming'}
						</span>
						${event.link ? `
							<a href="${event.link}" target="_blank" class="event-card-link-btn">
								View Details <ion-icon name="arrow-forward-outline"></ion-icon>
							</a>
						` : ''}
					</div>
				</div>
			</div>
		`;
	}).join('');

	setTimeout(() => {
		document.querySelectorAll('.event-card-item').forEach(card => card.classList.add('is-visible'));
	}, 100);
}

window.openSubEventsModal = function (eventIndex) {
	const currentFilteredList = window.currentFilteredEventsList || allEventsList;
	const event = currentFilteredList[eventIndex];
	if (!event || !event.subEvents) return;

	let modalOverlay = document.getElementById('subEventsModalOverlay');
	if (!modalOverlay) {
		modalOverlay = document.createElement('div');
		modalOverlay.id = 'subEventsModalOverlay';
		modalOverlay.className = 'sub-events-modal-overlay';
		modalOverlay.innerHTML = `
			<div class="sub-events-modal-box">
				<div class="sub-modal-header">
					<div>
						<span style="font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; color: #666; text-transform: uppercase;">Sub-events of</span>
						<h2 class="sub-modal-title" id="subModalTitle"></h2>
					</div>
					<button class="sub-modal-close-btn" onclick="closeSubEventsModal()">&times;</button>
				</div>
				<div class="sub-events-list" id="subModalGrid"></div>
			</div>
		`;
		document.body.appendChild(modalOverlay);
		modalOverlay.addEventListener('click', (e) => {
			if (e.target === modalOverlay) closeSubEventsModal();
		});
	}

	document.getElementById('subModalTitle').innerText = event.name;
	const grid = document.getElementById('subModalGrid');
	grid.innerHTML = event.subEvents.map(se => `
		<div class="sub-event-item-card">
			<div class="sub-event-item-header">
				<span class="sub-event-item-name">${se.name}</span>
				${se.date ? `<span class="sub-event-item-date">${se.date} ${se.time ? '• ' + se.time : ''}</span>` : ''}
			</div>
			${se.description ? `<p style="font-size: 0.9rem; color: #555; margin-top: 0.3rem;">${se.description}</p>` : ''}
		</div>
	`).join('');

	modalOverlay.classList.add('active');
};

window.closeSubEventsModal = function () {
	const modalOverlay = document.getElementById('subEventsModalOverlay');
	if (modalOverlay) modalOverlay.classList.remove('active');
};

// =========================================
// TINKERHUB MEDIA POPUP / LIGHTBOX SYSTEM
// =========================================

function initMediaPopupSystem() {
	if (document.getElementById('tinkerMediaPopupModal')) return;

	const modal = document.createElement('div');
	modal.id = 'tinkerMediaPopupModal';
	modal.className = 'tinker-media-popup-overlay';
	modal.innerHTML = `
		<div class="tinker-media-popup-content">
			<div class="tinker-media-popup-header">
				<div class="tinker-media-popup-title" id="tinkerMediaPopupTitle">Media Preview</div>
				<button class="tinker-media-popup-close" id="tinkerMediaPopupClose" aria-label="Close modal">&times;</button>
			</div>
			<div class="tinker-media-popup-body" id="tinkerMediaPopupBody"></div>
		</div>
	`;
	document.body.appendChild(modal);

	const closeBtn = document.getElementById('tinkerMediaPopupClose');
	const body = document.getElementById('tinkerMediaPopupBody');
	const titleEl = document.getElementById('tinkerMediaPopupTitle');

	function closeModal() {
		modal.classList.remove('active');
		body.innerHTML = '';
		document.body.style.overflow = '';
	}

	closeBtn.addEventListener('click', closeModal);
	modal.addEventListener('click', (e) => {
		if (e.target === modal) closeModal();
	});

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && modal.classList.contains('active')) {
			closeModal();
		}
	});

	// Global event listener for image and video clicks
	document.addEventListener('click', (e) => {
		const target = e.target;
		const mediaEl = target.closest('img, video');

		if (!mediaEl) return;

		// Check data-popup / nopopup / data-no-popup attribute on element or parent containers
		const popupAttr = mediaEl.getAttribute('data-popup') || mediaEl.closest('[data-popup]')?.getAttribute('data-popup');
		const noPopupAttr = mediaEl.hasAttribute('data-no-popup') || mediaEl.closest('[data-no-popup]') || mediaEl.hasAttribute('nopopup') || mediaEl.closest('[nopopup]') || mediaEl.closest('.brand');

		if (popupAttr === 'false' || popupAttr === 'no' || popupAttr === 'off' || noPopupAttr) {
			return; // Do not trigger popup
		}

		// Don't trigger if clicking video slider control buttons
		if (target.closest('.video-slider-btn') || target.closest('.carousel-nav-btn')) return;

		const altTitle = mediaEl.getAttribute('alt') || mediaEl.getAttribute('title') || 'Media Preview';
		titleEl.innerText = altTitle;
		body.innerHTML = '';

		if (mediaEl.tagName.toLowerCase() === 'img') {
			const imgSrc = mediaEl.currentSrc || mediaEl.src;
			if (!imgSrc) return;
			const popupImg = document.createElement('img');
			popupImg.src = imgSrc;
			popupImg.alt = altTitle;
			popupImg.className = 'tinker-media-popup-img';
			body.appendChild(popupImg);
		} else if (mediaEl.tagName.toLowerCase() === 'video') {
			const videoSrc = mediaEl.currentSrc || mediaEl.querySelector('source')?.src;
			if (!videoSrc) return;
			const popupVid = document.createElement('video');
			popupVid.src = videoSrc;
			popupVid.controls = true;
			popupVid.autoplay = true;
			popupVid.muted = true;
			popupVid.className = 'tinker-media-popup-vid';
			body.appendChild(popupVid);
		}

		modal.classList.add('active');
		document.body.style.overflow = 'hidden';
	});
}

// =========================================
// PROFILE PAGE FUNCTIONALITY
// =========================================

async function initProfilePage() {
	let rawHash = window.location.hash.substring(1);
	let parts = rawHash.split(/[\/#]+/);
	let urlYear = parts.length > 1 ? parts[0] : currentYear;
	let memberId = parts.length > 1 ? parts[1] : parts[0];

	// Support navigation if hash changes while on the page
	window.addEventListener('hashchange', () => {
		window.location.reload();
	});

	const loadingEl = document.getElementById('loading');
	const cardEl = document.getElementById('profile-card');

	if (!urlYear || !memberId) {
		showError();
		return;
	}

	try {
		const response = await fetch('../static/json/team.json');
		if (!response.ok) throw new Error('Failed to load data');
		const data = await response.json();

		const yearData = data[urlYear];
		if (!yearData || !yearData[memberId]) {
			showError();
			return;
		}

		renderProfile(yearData[memberId], urlYear);
	} catch (err) {
		showError();
	}

	function showError() {
		window.location.href = '../team/';
	}

	function renderProfile(member, year) {
		document.title = `${member.name} - TinkerHub CEAL`;

		const imgPath = `../static/images/core_team/${member.image}`;
		const imgEl = document.getElementById('profile-image');
		imgEl.src = imgPath;
		imgEl.onerror = () => { imgEl.src = '../static/images/team2026.png'; };

		document.getElementById('profile-name').innerText = member.name;
		document.getElementById('profile-position').innerText = member.position;
		document.getElementById('card-year').innerText = year;

		const quoteEl = document.getElementById('profile-quote');
		if (member.quote) {
			quoteEl.innerText = `"${member.quote}"`;
		} else {
			document.querySelector('.quote-box').style.display = 'none';
		}

		const interestsContainer = document.getElementById('profile-interests');
		if (member.interests && member.interests.length > 0) {
			interestsContainer.innerHTML = member.interests.map(i => `<span class="interest-tag">${i}</span>`).join('');
		} else {
			document.querySelector('.interests-section').style.display = 'none';
		}

		const socialsContainer = document.getElementById('profile-socials');
		if (member.socials) {
			const s = member.socials;
			let html = '';
			if (s.linkedin) html += `<a href="${s.linkedin}" target="_blank" title="LinkedIn"><ion-icon name="logo-linkedin"></ion-icon></a>`;
			if (s.github) html += `<a href="${s.github}" target="_blank" title="GitHub"><ion-icon name="logo-github"></ion-icon></a>`;
			if (s.instagram) html += `<a href="${s.instagram}" target="_blank" title="Instagram"><ion-icon name="logo-instagram"></ion-icon></a>`;
			if (s.email) html += `<a href="${s.email}" title="Email"><ion-icon name="mail-outline"></ion-icon></a>`;
			if (s.website) html += `<a href="${s.website}" target="_blank" title="Website"><ion-icon name="globe-outline"></ion-icon></a>`;

			if (html) {
				socialsContainer.innerHTML = html;
			} else {
				document.querySelector('.social-section').style.display = 'none';
			}
		} else {
			document.querySelector('.social-section').style.display = 'none';
		}

		loadingEl.style.display = 'none';
		cardEl.style.display = 'block';

		// Trigger animation
		setTimeout(() => {
			cardEl.classList.add('visible');
		}, 50);
	}
}


