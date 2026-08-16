const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const navToggle = document.querySelector(".nav-toggle");
if (navToggle) {
    navToggle.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("nav-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
        navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });
}

const closeNav = () => {
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open navigation");
};

document.querySelectorAll(".site-nav a, .menu-links a").forEach(link => {
    const page = document.body.dataset.page;
    const href = link.getAttribute("href") || "";
    if (page && href.includes(`${page}.html`)) {
        link.setAttribute("aria-current", "page");
    }

    link.addEventListener("click", closeNav);
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeNav();
});

const clockEls = document.querySelectorAll("[data-clock]");
if (clockEls.length) {
    const clockFormat = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Phoenix",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
    const tick = () => {
        const now = clockFormat.format(new Date());
        clockEls.forEach(el => { el.textContent = now; });
    };
    tick();
    window.setInterval(tick, 1000);
}

document.querySelectorAll(".spin-badge").forEach(badge => {
    badge.addEventListener("click", () => {
        if (window.__lenis) window.__lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
});

const revealItems = document.querySelectorAll(".luxury-reveal");
if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(item => item.classList.add("is-visible"));
} else {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });

    revealItems.forEach(item => observer.observe(item));
}
