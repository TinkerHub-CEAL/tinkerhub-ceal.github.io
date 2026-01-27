console.log('TinkerHub CEAl script loaded (Enhanced)');

const events = [
    { name: "Code & Coffee", date: "Dec 18", time: "5:30 PM", link: "#" },
    { name: "Web Wizardry", date: "Jan 12", time: "4:00 PM", link: "#" },
    { name: "AI Symposium", date: "Jan 25", time: "6:00 PM", link: "#" },
    { name: "Hack Day", date: "Feb 05", time: "9:00 AM", link: "#" }
];

const eventsContainer = document.getElementById('events-list');

// --- Render Events ---
function renderEvents() {
    if (!eventsContainer) return;

    eventsContainer.innerHTML = events.map((event, index) => `
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

document.addEventListener('DOMContentLoaded', () => {
    updateCopyright();
    renderEvents();

    // Tiny delay to ensure DOM is ready for observers
    setTimeout(setupObservers, 100);
});
