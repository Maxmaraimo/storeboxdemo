/** StoreBox landing motion system: progressive, reduced-motion safe, dependency free. */
(function () {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const header = document.querySelector('.landing-v2 header');
    const progress = document.querySelector('.scroll-progress');
    const aura = document.querySelector('.cursor-aura');
    const chapters = document.querySelectorAll('.landing-v2 section');

    chapters.forEach((chapter, index) => {
        if (index === 0) return;
        const content = chapter.querySelector(':scope > div');
        if (content) content.classList.add('motion-reveal');
    });

    if (!reducedMotion && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -10% 0px' });
        document.querySelectorAll('.motion-reveal').forEach((node) => observer.observe(node));
    } else {
        document.querySelectorAll('.motion-reveal').forEach((node) => node.classList.add('is-visible'));
    }

    let ticking = false;
    function updateScrollEffects() {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const ratio = Math.min(1, Math.max(0, window.scrollY / max));
        if (progress) progress.style.transform = `scaleX(${ratio})`;
        if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateScrollEffects);
    }, { passive: true });
    updateScrollEffects();

    if (!reducedMotion && aura && window.matchMedia('(pointer:fine)').matches) {
        window.addEventListener('pointermove', (event) => {
            aura.style.left = `${event.clientX}px`;
            aura.style.top = `${event.clientY}px`;
        }, { passive: true });
        document.documentElement.addEventListener('mouseleave', () => { aura.style.opacity = '0'; });
        document.documentElement.addEventListener('mouseenter', () => { aura.style.opacity = '.17'; });
    }
})();
