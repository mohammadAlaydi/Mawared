/* Mawared Al Dawliah — Landing Page JS */

// Scroll-triggered fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

// Sticky header shadow on scroll
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (header) {
        header.style.boxShadow = window.scrollY > 50
            ? '0 2px 16px rgba(0,0,0,0.1)'
            : '0 1px 8px rgba(0,0,0,0.06)';
    }
});

// Stats counter animation
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-target'), 10);
            let current = 0;
            const increment = Math.ceil(target / 60);
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = current;
            }, 30);
            counterObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-card__number').forEach((el) => counterObserver.observe(el));
