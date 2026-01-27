console.log('TinkerHub CEAl script loaded (Enhanced)');

let events = [];

const eventsContainer = document.getElementById('events-list');

// --- Render Events ---
function renderEvents() {
	if (!eventsContainer) return;

	eventsContainer.innerHTML = events.map((event, index) => `
        <a href="${event.link}" class="event-link" style="text-decoration: none; color: inherit;">
            <div class="event-item" style="border-bottom: 1px solid #ddd; padding: 1.5rem 0; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s ease; opacity: 0; transform: translateY(20px);" data-delay="${index * 100}">
                <div style="display: flex; align-items: center; gap: 2rem;">
                    <ion-icon name="flower-outline" style="color: #4CAF50; font-size: 1.5rem; transition: transform 0.5s;"></ion-icon>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 800; font-size: 1rem; text-transform: uppercase;">${event.date}</span>
                        <span style="color: #666; font-size: 0.75rem; font-weight: 600;">${event.time}</span>
                    </div>
                </div>
                <div style="font-family: 'Playfair Display', serif; font-size: 1.5rem; letter-spacing: 1px; flex-grow: 1; text-align: center; font-style: italic; font-weight: 800; margin: 0 1rem;">${event.name}</div>
                <div class="arrow-icon" style="transform: rotate(-45deg); font-size: 1.5rem; transition: transform 0.3s;">
                    <ion-icon name="arrow-forward-outline"></ion-icon>
                </div>
            </div>
        </a>
    `).join('');

	// Attach hover listeners manually for complex interaction if needed, or rely on CSS
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
	const suffix = numberSpan.innerText.replace(/[0-9]/g, ''); // get + or k
	let count = 0;
	const duration = 2000; // 2s
	const startTime = performance.now();

	function update(currentTime) {
		const elapsed = currentTime - startTime;
		const progress = Math.min(elapsed / duration, 1);

		// Easing function for smooth stop
		const easeOut = 1 - Math.pow(1 - progress, 3);

		count = Math.floor(easeOut * target);
		numberSpan.innerText = count + suffix;

		if (progress < 1) {
			requestAnimationFrame(update);
		} else {
			numberSpan.innerText = target + suffix; // Ensure final value
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

async function loadEvents() {
	try {
		const response = await fetch('./static/json/events.json');
		if (!response.ok) throw new Error('Failed to fetch events');
		events = await response.json();
		renderEvents();
		setTimeout(setupObservers, 100);
	} catch (error) {
		console.error('Error loading events:', error);
		if (eventsContainer) {
			eventsContainer.innerHTML = `<p style="text-align: center; color: #999;">Unable to load events at this time.</p>`;
		}
	}
}

// --- Highlights Carousel ---
let highlights = [];
const highlightsContainer = document.getElementById('highlightsContainer');

function renderHighlights() {
	if (!highlightsContainer) return;

	highlightsContainer.innerHTML = highlights.map((highlight, index) => `
		<div class="highlight-photo-card" data-delay="${index * 100}">
			<div class="highlight-card-header">
				<div class="highlight-event-info">
					<h3 class="highlight-event-name">${highlight.name}</h3>
					<div class="highlight-event-date">${highlight.date}</div>
				</div>
				<div class="highlight-star-marker">★</div>
			</div>
			<div class="highlight-image-box">
				<img src="./static/images/${highlight.image}" alt="${highlight.name}" onerror="this.style.display='none'">
			</div>
		</div>
	`).join('');

	// Trigger animation
	setTimeout(() => {
		document.querySelectorAll('.highlight-photo-card').forEach(card => {
			card.classList.add('is-visible');
		});
	}, 100);
}

function initCarousel() {
	const container = highlightsContainer;
	const prevBtn = document.getElementById('highlightPrev');
	const nextBtn = document.getElementById('highlightNext');

	if (!container || !prevBtn || !nextBtn) return;

	// Determine how many cards are visible at once
	function getVisibleCards() {
		return window.innerWidth <= 768 ? 1 : 3;
	}

	// Update button visibility and state
	function updateButtons() {
		const visibleCards = getVisibleCards();
		const totalCards = highlights.length;

		// Hide buttons if all cards fit in view
		if (totalCards <= visibleCards) {
			prevBtn.classList.add('hidden');
			nextBtn.classList.add('hidden');
			return;
		} else {
			prevBtn.classList.remove('hidden');
			nextBtn.classList.remove('hidden');
		}

		// Check scroll position
		const scrollLeft = container.scrollLeft;
		const maxScroll = container.scrollWidth - container.clientWidth;

		prevBtn.disabled = scrollLeft <= 0;
		nextBtn.disabled = scrollLeft >= maxScroll - 5; // 5px tolerance
	}

	// Scroll to next/prev set of cards
	function scrollCarousel(direction) {
		const cardWidth = container.querySelector('.highlight-photo-card')?.offsetWidth || 0;
		const gap = 32; // 2rem gap
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

	// Initial button state
	updateButtons();
}

async function loadHighlights() {
	try {
		const response = await fetch('./static/json/highlights.json');
		if (!response.ok) throw new Error('Failed to fetch highlights');
		highlights = await response.json();
		renderHighlights();
		initCarousel();
	} catch (error) {
		console.error('Error loading highlights:', error);
		if (highlightsContainer) {
			highlightsContainer.innerHTML = `<p style="text-align: center; color: #999;">Unable to load highlights at this time.</p>`;
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	updateCopyright();
	loadEvents();
	loadHighlights();

	// Hamburger Menu Toggle
	const hamburger = document.getElementById('hamburger');
	const navLinks = document.getElementById('navLinks');

	if (hamburger && navLinks) {
		hamburger.addEventListener('click', () => {
			hamburger.classList.toggle('active');
			navLinks.classList.toggle('active');
		});

		// Close menu when clicking on a link
		navLinks.querySelectorAll('a').forEach(link => {
			link.addEventListener('click', () => {
				hamburger.classList.remove('active');
				navLinks.classList.remove('active');
			});
		});

		// Close menu when clicking outside
		document.addEventListener('click', (e) => {
			if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
				hamburger.classList.remove('active');
				navLinks.classList.remove('active');
			}
		});
	}
});

// =========================================
// TEAM PAGE FUNCTIONALITY
// =========================================

let teamMembers = [];
const teamGrid = document.getElementById('teamGrid');

// Render team members
function renderTeam() {
	if (!teamGrid) return;

	teamGrid.innerHTML = teamMembers.map((member, index) => `
		<div class="team-member-card" data-delay="${index * 100}">
			<div class="member-photo-container">
				<img src="./static/images/${member.image}" alt="${member.name}" class="member-photo" onerror="this.style.display='none'">
			</div>
			<div class="member-info">
				<h3 class="member-name">${member.name}</h3>
				<p class="member-position">${member.position}</p>
			</div>
		</div>
	`).join('');

	// Trigger animations
	setTimeout(() => {
		document.querySelectorAll('.team-member-card').forEach((card, index) => {
			setTimeout(() => {
				card.classList.add('is-visible');
			}, index * 100);
		});
	}, 100);
}

// Load team data
async function loadTeam() {
	try {
		const response = await fetch('./static/json/team.json');
		if (!response.ok) throw new Error('Failed to fetch team data');
		teamMembers = await response.json();
		renderTeam();
	} catch (error) {
		console.error('Error loading team:', error);
		if (teamGrid) {
			teamGrid.innerHTML = `<p style="text-align: center; color: #999; grid-column: 1/-1;">Unable to load team members at this time.</p>`;
		}
	}
}

// Initialize team page if on team page
if (teamGrid) {
	document.addEventListener('DOMContentLoaded', () => {
		loadTeam();
	});
}
