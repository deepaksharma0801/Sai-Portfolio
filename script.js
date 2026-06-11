const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const intro = document.getElementById("intro");
if (intro) {
    if (prefersReducedMotion) {
        document.body.classList.remove("intro-sdsn", "intro-hello");
        document.body.classList.add("intro-done");
        intro.style.display = "none";
    } else {
        window.setTimeout(() => {
            document.body.classList.remove("intro-sdsn");
            document.body.classList.add("intro-hello");
        }, 1120);

        window.setTimeout(() => {
            document.body.classList.add("intro-done");
        }, 3380);

        window.setTimeout(() => {
            intro.style.display = "none";
        }, 4300);
    }
} else {
    document.body.classList.add("intro-done");
}

const navToggle = document.querySelector(".nav-toggle");
if (navToggle) {
    navToggle.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("nav-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
        navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });
}

document.querySelectorAll(".site-nav a").forEach(link => {
    const page = document.body.dataset.page;
    const href = link.getAttribute("href") || "";
    if (page && href.includes(`${page}.html`)) {
        link.setAttribute("aria-current", "page");
    }

    link.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        navToggle?.setAttribute("aria-expanded", "false");
        navToggle?.setAttribute("aria-label", "Open navigation");
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        document.body.classList.remove("nav-open");
        navToggle?.setAttribute("aria-expanded", "false");
        navToggle?.setAttribute("aria-label", "Open navigation");
    }
});

document.querySelectorAll(".credential-card").forEach(card => {
    card.addEventListener("click", event => {
        const href = card.getAttribute("href");
        if (!href) return;
        event.preventDefault();
        window.location.href = href;
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
    }, { threshold: 0.16 });

    revealItems.forEach(item => observer.observe(item));
}
