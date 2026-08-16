/* Award motion layer: hello preloader, curved page transitions, line-masked
   text reveals, magnetic hovers, cursor dot, Lenis smooth scroll, parallax.
   Degrades to the CSS baseline whenever GSAP is unavailable or the visitor
   prefers reduced motion. */
(() => {
    "use strict";

    const docEl = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const store = {
        get(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } },
        set(key, value) { try { sessionStorage.setItem(key, value); } catch (e) { /* replays are fine */ } },
        del(key) { try { sessionStorage.removeItem(key); } catch (e) { /* noop */ } }
    };

    if (reduced || !window.gsap) {
        docEl.classList.remove("is-loading", "is-arriving");
        store.del("sdsn-transition");
        return;
    }

    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
    docEl.classList.add("has-motion");

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const body = document.body;

    /* ------------------------------------------------------------------ */
    /* Loading / transition screen                                         */
    /* ------------------------------------------------------------------ */

    const screen = document.querySelector(".loading-screen");
    const wordsWrap = screen ? screen.querySelector(".loading-words") : null;
    const wordEl = screen ? screen.querySelector(".loading-word") : null;
    const curveTop = screen ? screen.querySelector(".rounded-div-wrap.top") : null;
    const curveBottom = screen ? screen.querySelector(".rounded-div-wrap.bottom") : null;

    const GREETINGS = ["Hello", "Bonjour", "स्वागत हे", "Ciao", "Olá", "おい", "Hallå", "Guten tag", "Hallo", "నమస్కారం"];
    const PAGE_LABELS = { index: "Home", work: "Projects", profile: "Work", "aegis-evo": "Aegis-Evo" };

    const pageLabelFor = pathname => {
        const file = (pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
        return PAGE_LABELS[file] || "Home";
    };

    const setWord = text => { if (wordEl) wordEl.textContent = text; };

    const hideScreen = () => {
        if (!screen) return;
        gsap.set(screen, { visibility: "hidden" });
        docEl.classList.remove("is-loading", "is-arriving");
    };

    /* Screen covering -> slides up and away; bottom curve trails, then flattens. */
    function screenExit(onDone) {
        const tl = gsap.timeline({ onComplete: hideScreen });
        gsap.set(curveBottom, { height: "10vh" });
        tl.to(wordsWrap, { opacity: 0, y: -34, duration: 0.3, ease: "power2.in" }, 0)
            .to(screen, { yPercent: -100, duration: 0.85, ease: "power4.inOut" }, 0.08)
            .to(curveBottom, { height: 0, duration: 0.4, ease: "power1.out" }, 0.55);
        /* Start the hero while the screen is still clearing. */
        if (onDone) tl.add(onDone, 0.55);
        return tl;
    }

    /* Screen rises from below and covers the page; top curve leads, then flattens. */
    function screenCover(label, onCovered) {
        setWord(label);
        gsap.set(screen, { visibility: "visible", yPercent: 100 });
        gsap.set(curveTop, { height: "10vh" });
        gsap.set(wordsWrap, { opacity: 0, y: 30 });
        const tl = gsap.timeline();
        tl.to(screen, { yPercent: 0, duration: 0.68, ease: "power4.inOut" })
            .to(curveTop, { height: 0, duration: 0.3, ease: "power1.out" }, 0.42)
            .to(wordsWrap, { opacity: 1, y: 0, duration: 0.34, ease: "power2.out" }, 0.28)
            .add(() => { if (onCovered) onCovered(); }, "+=0.04");
        return tl;
    }

    function playHello(onDone) {
        setWord(GREETINGS[0]);
        gsap.set(screen, { visibility: "visible", yPercent: 0 });
        gsap.set(curveTop, { height: 0 });
        gsap.set(wordsWrap, { opacity: 0, y: 22 });

        const tl = gsap.timeline();
        tl.to(wordsWrap, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.12);
        let at = 0.85;
        GREETINGS.slice(1).forEach(word => {
            tl.add(() => setWord(word), at);
            at += 0.165;
        });
        tl.add(screenExit(onDone), at + 0.18);
    }

    function playArrival(onDone) {
        store.del("sdsn-transition");
        setWord(pageLabelFor(location.pathname));
        gsap.set(screen, { visibility: "visible", yPercent: 0 });
        gsap.set(curveTop, { height: 0 });
        gsap.set(wordsWrap, { opacity: 0, y: 22 });
        const tl = gsap.timeline();
        tl.to(wordsWrap, { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }, 0.05);
        tl.add(screenExit(onDone), 0.55);
    }

    /* ------------------------------------------------------------------ */
    /* Line splitting                                                      */
    /* ------------------------------------------------------------------ */

    /* Split a plain-text element into visual lines, each wrapped in an
       overflow-hidden mask. Returns the inner (animatable) spans. */
    function splitLines(el) {
        if (!el || el.dataset.split === "done") {
            return el ? gsap.utils.toArray(el.querySelectorAll(".line-inner")) : [];
        }
        const text = el.textContent.trim().replace(/\s+/g, " ");
        if (!text) return [];
        el.setAttribute("aria-label", text);

        const probe = document.createDocumentFragment();
        const wordSpans = text.split(" ").map(word => {
            const s = document.createElement("span");
            s.style.display = "inline-block";
            s.textContent = word;
            probe.appendChild(s);
            probe.appendChild(document.createTextNode(" "));
            return s;
        });
        el.textContent = "";
        el.appendChild(probe);

        const lines = [];
        let lastTop = null;
        wordSpans.forEach(s => {
            if (s.offsetTop !== lastTop) {
                lastTop = s.offsetTop;
                lines.push([]);
            }
            lines[lines.length - 1].push(s.textContent);
        });

        el.textContent = "";
        el.dataset.split = "done";
        return lines.map(words => {
            const mask = document.createElement("span");
            mask.className = "line-mask";
            mask.setAttribute("aria-hidden", "true");
            const inner = document.createElement("span");
            inner.className = "line-inner";
            inner.textContent = words.join(" ");
            mask.appendChild(inner);
            el.appendChild(mask);
            return inner;
        });
    }

    /* Wrap existing block children (e.g. the two h1 name spans) in masks. */
    function maskBlocks(el, selector) {
        if (!el) return [];
        return gsap.utils.toArray(el.querySelectorAll(selector)).map(block => {
            if (block.dataset.masked === "done") return block.firstElementChild;
            const inner = document.createElement("span");
            inner.className = "line-inner";
            while (block.firstChild) inner.appendChild(block.firstChild);
            block.appendChild(inner);
            block.classList.add("line-mask");
            block.dataset.masked = "done";
            return inner;
        });
    }

    /* ------------------------------------------------------------------ */
    /* Hero choreography                                                   */
    /* ------------------------------------------------------------------ */

    /* 135%: masks carry 0.12em breathing room for descenders, so a line must
       travel further than its own height to be fully hidden. */
    const HIDE = { yPercent: 135 };

    /* Splitting measures rendered line breaks, so it must run at reveal time
       (layout settled), not at parse time. Until then targets sit at
       autoAlpha 0 — set here, pre-paint, so nothing flashes. */
    const heroParts = { splitTargets: [], fades: [], portrait: null, portraitImg: null, h1: null };

    function prepareHero() {
        const homeHero = document.querySelector(".home-hero");
        const pageHero = document.querySelector(".page-hero");

        if (homeHero) {
            heroParts.h1 = homeHero.querySelector("h1");
            heroParts.splitTargets = [homeHero.querySelector(".home-position")];
            heroParts.fades = gsap.utils.toArray(
                homeHero.querySelectorAll(".eyebrow, .signal-strip, .home-note, .action-row, .scroll-cue")
            );
            heroParts.portrait = homeHero.querySelector(".home-portrait");
            heroParts.portraitImg = homeHero.querySelector(".home-portrait img");
        } else if (pageHero) {
            heroParts.splitTargets = [pageHero.querySelector("h1"), pageHero.querySelector(".lede")];
            heroParts.fades = gsap.utils.toArray(
                pageHero.querySelectorAll(".eyebrow, .action-row, .github-link")
            );
        }
        heroParts.splitTargets = heroParts.splitTargets.filter(Boolean);

        gsap.set([heroParts.h1, ...heroParts.splitTargets].filter(Boolean), { autoAlpha: 0 });
        gsap.set(heroParts.fades, { opacity: 0, y: 26 });
        if (heroParts.portrait) {
            /* The blended portrait fades in; a wipe would drag a hard edge
               across its soft mask. */
            gsap.set(heroParts.portrait, { autoAlpha: 0 });
            gsap.set(heroParts.portraitImg, { scale: 1.3 });
        }
    }

    function playHero() {
        body.classList.add("hero-done");
        const lines = [];
        if (heroParts.h1) lines.push(...maskBlocks(heroParts.h1, ".name-primary, .name-secondary"));
        heroParts.splitTargets.forEach(el => lines.push(...splitLines(el)));
        gsap.set(lines, HIDE);
        gsap.set([heroParts.h1, ...heroParts.splitTargets].filter(Boolean), { autoAlpha: 1 });

        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        tl.to(lines, { yPercent: 0, duration: 1.15, stagger: 0.09 }, 0.05)
            .to(heroParts.fades, { opacity: 1, y: 0, duration: 0.85, stagger: 0.07 }, 0.32);
        const heroEyebrow = document.querySelector(".home-hero .eyebrow, .page-hero .eyebrow");
        if (heroEyebrow) tl.add(() => scrambleEl(heroEyebrow), 0.4);
        if (heroParts.portrait) {
            tl.to(heroParts.portrait, { autoAlpha: 1, duration: 1.25, ease: "power2.out" }, 0.3)
                .to(heroParts.portraitImg, { scale: 1.12, duration: 1.6, ease: "power3.out" }, 0.4);
        }
        return tl;
    }

    /* ------------------------------------------------------------------ */
    /* Label decode: mono kickers scramble into place on reveal            */
    /* ------------------------------------------------------------------ */

    const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/·+";

    function scrambleEl(el, duration = 0.75) {
        if (!el || el.dataset.decoded === "done") return;
        el.dataset.decoded = "done";
        const finalText = el.textContent.trim().replace(/\s+/g, " ");
        if (!finalText) return;
        /* Screen readers keep the real label; the scrambling copy is hidden. */
        el.setAttribute("aria-label", finalText);
        const span = document.createElement("span");
        span.setAttribute("aria-hidden", "true");
        el.textContent = "";
        el.appendChild(span);
        const proxy = { p: 0 };
        gsap.to(proxy, {
            p: 1,
            duration,
            ease: "power2.out",
            onUpdate() {
                const settled = Math.floor(proxy.p * finalText.length);
                let out = finalText.slice(0, settled);
                for (let i = settled; i < finalText.length; i += 1) {
                    const ch = finalText[i];
                    out += ch === " " ? " " : SCRAMBLE_GLYPHS[(Math.random() * SCRAMBLE_GLYPHS.length) | 0];
                }
                span.textContent = out;
            },
            onComplete() { span.textContent = finalText; }
        });
    }

    function initDecodes() {
        if (!window.ScrollTrigger) return;
        gsap.utils.toArray(".section-kicker, .eyebrow").forEach(el => {
            /* Hero eyebrows are choreographed inside playHero instead. */
            if (el.closest(".home-hero, .page-hero")) return;
            window.ScrollTrigger.create({
                trigger: el,
                start: "top 92%",
                once: true,
                onEnter: () => scrambleEl(el)
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /* Cursor glow inside cards                                            */
    /* ------------------------------------------------------------------ */

    function initGlow() {
        if (!finePointer) return;
        const hosts = gsap.utils.toArray(
            ".work-item, .experience-panel, .capability, .cert-card, .credential-card"
        );
        if (!hosts.length) return;
        hosts.forEach(host => {
            host.classList.add("glow-host");
            const glow = document.createElement("i");
            glow.className = "glow";
            glow.setAttribute("aria-hidden", "true");
            host.appendChild(glow);
        });
        document.addEventListener("pointermove", e => {
            const host = e.target.closest(".glow-host");
            if (!host) return;
            const r = host.getBoundingClientRect();
            host.style.setProperty("--mx", `${e.clientX - r.left}px`);
            host.style.setProperty("--my", `${e.clientY - r.top}px`);
        }, { passive: true });
    }

    /* ------------------------------------------------------------------ */
    /* Scroll-triggered heading reveals                                    */
    /* ------------------------------------------------------------------ */

    function initScrollReveals() {
        if (!window.ScrollTrigger) return;
        const targets = gsap.utils.toArray(
            ".ribbon-heading strong, .home-overview h2, .closing-quote blockquote, .case-copy h2, .footer-title"
        );
        targets.forEach(el => {
            gsap.set(el, { autoAlpha: 0 });
            window.ScrollTrigger.create({
                trigger: el,
                start: "top 88%",
                once: true,
                onEnter: () => {
                    const lines = el.matches(".footer-title")
                        ? maskBlocks(el, "span")
                        : splitLines(el);
                    if (!lines.length) {
                        gsap.set(el, { autoAlpha: 1 });
                        return;
                    }
                    gsap.set(lines, HIDE);
                    gsap.set(el, { autoAlpha: 1 });
                    gsap.to(lines, { yPercent: 0, duration: 1.05, stagger: 0.09, ease: "power4.out" });
                }
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /* Image parallax + settle + hover zoom (GSAP owns these transforms)   */
    /* ------------------------------------------------------------------ */

    function initImages() {
        if (!window.ScrollTrigger) return;
        const frames = gsap.utils.toArray(".work-item .image-frame");
        frames.forEach(frame => {
            const img = frame.querySelector("img");
            if (!img) return;
            gsap.set(img, { scale: 1.14 });
            gsap.fromTo(img, { yPercent: -6 }, {
                yPercent: 6,
                ease: "none",
                scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true }
            });
            if (finePointer) {
                const item = frame.closest(".work-item") || frame;
                item.addEventListener("mouseenter", () => gsap.to(img, { scale: 1.2, duration: 0.9, ease: "power3.out", overwrite: "auto" }));
                item.addEventListener("mouseleave", () => gsap.to(img, { scale: 1.14, duration: 0.9, ease: "power3.out", overwrite: "auto" }));
            }
        });

        const portrait = heroParts.portraitImg;
        if (portrait) {
            gsap.to(portrait, {
                yPercent: 5,
                ease: "none",
                scrollTrigger: { trigger: ".home-portrait", start: "top bottom", end: "bottom top", scrub: true }
            });
        }
    }

    /* ------------------------------------------------------------------ */
    /* Marquees: GSAP loops, velocity-reactive, calm on hover              */
    /* ------------------------------------------------------------------ */

    const marquees = [];

    function initMarquees() {
        gsap.utils.toArray(".skill-track").forEach(track => {
            const wrap = track.closest(".skill-marquee");
            const reverse = wrap && wrap.classList.contains("reverse");
            const tween = reverse
                ? gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 72, ease: "none", repeat: -1 })
                : gsap.to(track, { xPercent: -50, duration: 72, ease: "none", repeat: -1 });
            const entry = { tween, hovered: false };
            marquees.push(entry);
            if (wrap && finePointer) {
                wrap.addEventListener("mouseenter", () => { entry.hovered = true; gsap.to(tween, { timeScale: 0.12, duration: 0.5, overwrite: true }); });
                wrap.addEventListener("mouseleave", () => { entry.hovered = false; gsap.to(tween, { timeScale: 1, duration: 0.5, overwrite: true }); });
            }
        });
    }

    function marqueeVelocity(velocity) {
        const boost = gsap.utils.clamp(1, 2.4, 1 + Math.abs(velocity) / 220);
        marquees.forEach(entry => {
            if (entry.hovered) return;
            gsap.to(entry.tween, { timeScale: boost, duration: 0.35, overwrite: true });
        });
    }

    /* ------------------------------------------------------------------ */
    /* Magnetic elements                                                   */
    /* ------------------------------------------------------------------ */

    function initMagnetic() {
        if (!finePointer) return;
        gsap.utils.toArray("[data-magnetic], .site-nav a, .button, .github-icon-link, .github-link, .nav-toggle").forEach(el => {
            const strength = el.classList.contains("button") ? 0.28 : 0.38;
            const xTo = gsap.quickTo(el, "x", { duration: 1, ease: "elastic.out(1, 0.35)" });
            const yTo = gsap.quickTo(el, "y", { duration: 1, ease: "elastic.out(1, 0.35)" });
            el.addEventListener("mousemove", e => {
                const r = el.getBoundingClientRect();
                xTo((e.clientX - (r.left + r.width / 2)) * strength);
                yTo((e.clientY - (r.top + r.height / 2)) * strength);
            }, { passive: true });
            el.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
        });
    }

    /* ------------------------------------------------------------------ */
    /* Label rolls (nav + footer links)                                    */
    /* ------------------------------------------------------------------ */

    function initRolls() {
        gsap.utils.toArray(".site-nav a, .footer-links a").forEach(link => {
            if (link.querySelector(".roll")) return;
            const label = link.textContent.trim();
            if (!label) return;
            link.textContent = "";
            const roll = document.createElement("span");
            roll.className = "roll";
            [false, true].forEach(hidden => {
                const span = document.createElement("span");
                span.textContent = label;
                if (hidden) span.setAttribute("aria-hidden", "true");
                roll.appendChild(span);
            });
            link.appendChild(roll);
        });
    }

    /* ------------------------------------------------------------------ */
    /* Cursor dot                                                          */
    /* ------------------------------------------------------------------ */

    function initCursor() {
        if (!finePointer) return;
        const dot = document.createElement("div");
        dot.className = "cursor-dot";
        dot.setAttribute("aria-hidden", "true");
        body.appendChild(dot);
        const xTo = gsap.quickTo(dot, "x", { duration: 0.4, ease: "power3" });
        const yTo = gsap.quickTo(dot, "y", { duration: 0.4, ease: "power3" });
        let shown = false;
        window.addEventListener("mousemove", e => {
            if (!shown) { shown = true; gsap.to(dot, { opacity: 1, duration: 0.3 }); }
            xTo(e.clientX);
            yTo(e.clientY);
        }, { passive: true });
        document.addEventListener("mouseover", e => {
            if (e.target.closest("a, button, .credential-card, .cert-card")) {
                gsap.to(dot, { scale: 3.4, duration: 0.35, ease: "power3.out" });
            }
        });
        document.addEventListener("mouseout", e => {
            if (e.target.closest("a, button, .credential-card, .cert-card")) {
                gsap.to(dot, { scale: 1, duration: 0.35, ease: "power3.out" });
            }
        });
        document.addEventListener("mouseleave", () => gsap.to(dot, { opacity: 0, duration: 0.25 }));
        document.addEventListener("mouseenter", () => { if (shown) gsap.to(dot, { opacity: 1, duration: 0.25 }); });
    }

    /* ------------------------------------------------------------------ */
    /* Lenis smooth scroll                                                 */
    /* ------------------------------------------------------------------ */

    let lenis = null;

    function initLenis() {
        if (!window.Lenis) return;
        lenis = new window.Lenis({ lerp: 0.1 });
        window.__lenis = lenis;
        lenis.on("scroll", e => {
            if (window.ScrollTrigger) window.ScrollTrigger.update();
            marqueeVelocity(e.velocity || 0);
        });
        gsap.ticker.add(time => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener("click", e => {
                const target = document.querySelector(anchor.getAttribute("href"));
                if (!target) return;
                e.preventDefault();
                lenis.scrollTo(target, { offset: -96 });
            });
        });
    }

    /* ------------------------------------------------------------------ */
    /* Page transitions                                                    */
    /* ------------------------------------------------------------------ */

    let leaving = false;

    function initTransitions() {
        if (!screen) return;
        document.addEventListener("click", e => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const link = e.target.closest("a[href]");
            if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
            let url;
            try { url = new URL(link.href, location.href); } catch (err) { return; }
            if (url.origin !== location.origin) return;
            if (!/(\.html|\/)$/.test(url.pathname)) return;
            if (url.pathname === location.pathname) {
                if (!url.hash) e.preventDefault();
                return;
            }
            e.preventDefault();
            if (leaving) return;
            leaving = true;
            body.classList.remove("nav-open");
            store.set("sdsn-transition", "1");
            const go = () => { location.href = url.href; };
            screenCover(pageLabelFor(url.pathname), go);
            /* Navigation must not depend on the animation ticking (background
               tabs pause rAF) — leave regardless shortly after cover time. */
            window.setTimeout(go, 1100);
        });

        /* bfcache restore: never come back with the screen stuck. */
        window.addEventListener("pageshow", e => {
            if (e.persisted) {
                leaving = false;
                store.del("sdsn-transition");
                hideScreen();
                gsap.set(screen, { yPercent: 100 });
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /* Boot                                                                */
    /* ------------------------------------------------------------------ */

    prepareHero();
    initRolls();
    initMarquees();
    initMagnetic();
    initCursor();
    initLenis();
    initTransitions();
    initScrollReveals();
    initImages();
    initDecodes();
    initGlow();

    if (docEl.classList.contains("is-loading") && screen) {
        playHello(playHero);
    } else if (docEl.classList.contains("is-arriving") && screen) {
        playArrival(playHero);
    } else {
        hideScreen();
        if (screen) gsap.set(screen, { yPercent: 100 });
        gsap.delayedCall(0.1, playHero);
    }

    /* Insurance: whatever happens, no text stays hidden. Only judged while the
       tab is visible — hidden tabs pause rAF, so pending timelines are normal
       there and resume on their own. */
    function forceHeroVisible() {
        const targets = [heroParts.h1, ...heroParts.splitTargets, ...heroParts.fades].filter(Boolean);
        if (targets.length) gsap.set(targets, { clearProps: "opacity,visibility,transform" });
        gsap.utils.toArray(".line-inner").forEach(el => gsap.set(el, { yPercent: 0 }));
        if (heroParts.portrait) gsap.set(heroParts.portrait, { clearProps: "clipPath,opacity,visibility" });
        body.classList.add("hero-done");
    }

    function armHeroInsurance() {
        if (document.hidden) {
            document.addEventListener("visibilitychange", armHeroInsurance, { once: true });
            return;
        }
        window.setTimeout(() => {
            if (body.classList.contains("hero-done")) return;
            try { playHero(); } catch (e) { forceHeroVisible(); }
        }, 5000);
    }
    armHeroInsurance();
})();
