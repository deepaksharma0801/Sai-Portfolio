/* Vanilla layer: command palette, copy-email, terminal easter egg, roaming
   pixel cat. Independent of GSAP so it works even when motion.js bails. */
(() => {
    "use strict";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const EMAIL = "deepak.nadiminti@gmail.com";

    const navigate = href => {
        if (typeof window.__sdsnNavigate === "function") window.__sdsnNavigate(href);
        else location.href = href;
    };

    /* ------------------------------------------------------------------ */
    /* Toast                                                               */
    /* ------------------------------------------------------------------ */

    let toastEl = null;
    let toastTimer = 0;

    function toast(message) {
        if (!toastEl) {
            toastEl = document.createElement("div");
            toastEl.className = "copy-toast";
            toastEl.setAttribute("role", "status");
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = message;
        toastEl.classList.add("show");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 1600);
    }
    window.__toast = toast;

    function copyText(text, doneMessage) {
        const done = () => toast(doneMessage);
        const fallback = () => {
            const area = document.createElement("textarea");
            area.value = text;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            try {
                document.execCommand("copy");
                done();
            } catch (e) {
                toast(text);
            }
            area.remove();
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done, fallback);
        } else {
            fallback();
        }
    }

    /* Any element opting in via data-copy-email copies instead of mailto. */
    document.addEventListener("click", e => {
        const el = e.target.closest("[data-copy-email]");
        if (!el) return;
        e.preventDefault();
        copyText(EMAIL, "EMAIL COPIED ✓");
    });

    /* ------------------------------------------------------------------ */
    /* Terminal easter egg                                                 */
    /* ------------------------------------------------------------------ */

    const BOOT_LINES = [
        "SDSN-AGENT v2.6 — boot sequence",
        "▸ loading skills ............ ok",
        "▸ retrieval grounding ....... ok",
        "▸ guardrails ................ ok",
        "▸ evaluation harness ........ ok",
        "▸ coffee levels ............. CRITICAL",
        "▸ shipping mode ............. always",
        "",
        "agent online. curiosity detected.",
        "want the Echelix story? deepak.nadiminti@gmail.com"
    ];

    let terminal = null;
    let typingTimer = 0;

    function closeTerminal() {
        if (!terminal) return;
        window.clearTimeout(typingTimer);
        terminal.remove();
        terminal = null;
    }

    function bootAgent() {
        if (terminal) return;
        terminal = document.createElement("div");
        terminal.className = "egg-terminal";
        terminal.setAttribute("role", "dialog");
        terminal.setAttribute("aria-label", "SDSN agent terminal");
        terminal.innerHTML =
            '<div class="egg-bar"><span>sdsn — agent</span><button type="button" aria-label="Close terminal">×</button></div>' +
            '<pre class="egg-body" aria-live="polite"></pre>';
        document.body.appendChild(terminal);
        terminal.querySelector("button").addEventListener("click", closeTerminal);

        const out = terminal.querySelector(".egg-body");
        let line = 0;
        let chars = 0;
        const step = () => {
            if (!terminal) return;
            if (line >= BOOT_LINES.length) {
                out.textContent += "\n█";
                return;
            }
            const current = BOOT_LINES[line];
            chars += 2;
            const doneLines = BOOT_LINES.slice(0, line).join("\n");
            out.textContent = (doneLines ? doneLines + "\n" : "") + current.slice(0, chars);
            if (chars >= current.length) {
                line += 1;
                chars = 0;
                typingTimer = window.setTimeout(step, reduced ? 0 : 90);
            } else {
                typingTimer = window.setTimeout(step, reduced ? 0 : 14);
            }
        };
        step();
    }
    window.__bootAgent = bootAgent;

    let typedBuffer = "";
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            closeTerminal();
            return;
        }
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const target = e.target;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
        if (e.key.length !== 1) return;
        typedBuffer = (typedBuffer + e.key.toLowerCase()).slice(-5);
        if (typedBuffer === "agent") bootAgent();
    });

    /* ------------------------------------------------------------------ */
    /* Command palette                                                     */
    /* ------------------------------------------------------------------ */

    const ACTIONS = [
        { label: "Go to Home", hint: "Page", run: () => navigate("index.html") },
        { label: "Go to Projects", hint: "Page", run: () => navigate("work.html") },
        { label: "Go to Work / Experience", hint: "Page", run: () => navigate("profile.html") },
        { label: "Go to Aegis-Evo case study", hint: "Page", run: () => navigate("aegis-evo.html") },
        { label: "Enter the Arcade", hint: "Secret", run: () => navigate("arcade.html") },
        { label: "Copy email address", hint: "Contact", run: () => copyText(EMAIL, "EMAIL COPIED ✓") },
        { label: "Download resume", hint: "PDF", run: () => window.open("resume_new.pdf", "_blank", "noopener") },
        { label: "Open GitHub", hint: "Social", run: () => window.open("https://github.com/deepaksharma0801", "_blank", "noopener") },
        { label: "Open LinkedIn", hint: "Social", run: () => window.open("https://www.linkedin.com/in/sai-deepak-sharma-09518b210/", "_blank", "noopener") },
        { label: "Boot agent", hint: "???", run: () => bootAgent() },
        {
            label: "Back to top",
            hint: "Scroll",
            run: () => {
                if (window.__lenis) window.__lenis.scrollTo(0);
                else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
            }
        }
    ];

    let palette = null;
    let paletteInput = null;
    let paletteList = null;
    let filtered = ACTIONS;
    let selected = 0;
    let lastFocus = null;

    function fuzzyScore(query, label) {
        const q = query.toLowerCase();
        const l = label.toLowerCase();
        if (!q) return 1;
        let qi = 0;
        let score = 0;
        for (let i = 0; i < l.length && qi < q.length; i += 1) {
            if (l[i] === q[qi]) {
                score += 10 - Math.min(9, i - qi);
                qi += 1;
            }
        }
        return qi === q.length ? score : -1;
    }

    function renderList() {
        paletteList.innerHTML = "";
        filtered.forEach((action, i) => {
            const li = document.createElement("li");
            li.setAttribute("role", "option");
            li.setAttribute("aria-selected", String(i === selected));
            li.className = i === selected ? "selected" : "";
            li.innerHTML = `<span>${action.label}</span><em>${action.hint}</em>`;
            li.addEventListener("mouseenter", () => {
                selected = i;
                renderList();
            });
            li.addEventListener("mousedown", e => {
                e.preventDefault();
                runSelected();
            });
            paletteList.appendChild(li);
        });
    }

    function applyFilter() {
        const q = paletteInput.value.trim();
        filtered = ACTIONS
            .map(a => ({ a, s: fuzzyScore(q, a.label) }))
            .filter(x => x.s >= 0)
            .sort((x, y) => y.s - x.s)
            .map(x => x.a);
        selected = 0;
        renderList();
    }

    function openPalette() {
        if (!palette) buildPalette();
        if (!palette.hidden) return;
        lastFocus = document.activeElement;
        palette.hidden = false;
        document.body.classList.add("palette-open");
        if (window.__lenis) window.__lenis.stop();
        paletteInput.value = "";
        applyFilter();
        window.requestAnimationFrame(() => {
            palette.classList.add("open");
            paletteInput.focus();
        });
    }

    function closePalette() {
        if (!palette || palette.hidden) return;
        palette.classList.remove("open");
        palette.hidden = true;
        document.body.classList.remove("palette-open");
        if (window.__lenis) window.__lenis.start();
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    }

    function runSelected() {
        const action = filtered[selected];
        if (!action) return;
        closePalette();
        action.run();
    }

    function buildPalette() {
        palette = document.createElement("div");
        palette.className = "palette";
        palette.hidden = true;
        palette.innerHTML =
            '<div class="palette-backdrop"></div>' +
            '<div class="palette-panel" role="dialog" aria-modal="true" aria-label="Command palette">' +
            '<input class="palette-input" type="text" placeholder="Type a command…" aria-label="Search commands" autocomplete="off" spellcheck="false" />' +
            '<ul class="palette-list" role="listbox"></ul>' +
            '<p class="palette-footnote">↑↓ navigate · ↵ run · esc close</p>' +
            "</div>";
        document.body.appendChild(palette);
        paletteInput = palette.querySelector(".palette-input");
        paletteList = palette.querySelector(".palette-list");
        palette.querySelector(".palette-backdrop").addEventListener("click", closePalette);
        paletteInput.addEventListener("input", applyFilter);
        palette.addEventListener("keydown", e => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                selected = Math.min(selected + 1, filtered.length - 1);
                renderList();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                selected = Math.max(selected - 1, 0);
                renderList();
            } else if (e.key === "Enter") {
                e.preventDefault();
                runSelected();
            } else if (e.key === "Tab") {
                e.preventDefault();
                paletteInput.focus();
            }
        });
    }

    document.addEventListener("keydown", e => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            if (palette && !palette.hidden) closePalette();
            else openPalette();
        } else if (e.key === "Escape") {
            closePalette();
        }
    });

    document.querySelectorAll("[data-palette-open]").forEach(el => {
        el.addEventListener("click", openPalette);
    });

    /* ------------------------------------------------------------------ */
    /* Roaming pixel cat -> arcade                                         */
    /* ------------------------------------------------------------------ */

    function spawnCat() {
        const cat = document.createElement("button");
        cat.type = "button";
        cat.className = "pixel-cat";
        cat.setAttribute("aria-label", "A pixel cat appeared — follow it to the arcade");
        cat.innerHTML = '<span class="pixel-cat-sprite" aria-hidden="true"></span>';
        document.body.appendChild(cat);

        const despawn = window.setTimeout(() => cat.remove(), 16000);
        cat.addEventListener("click", () => {
            window.clearTimeout(despawn);
            document.body.classList.add("cat-glitch");
            window.setTimeout(() => {
                document.body.classList.remove("cat-glitch");
                navigate("arcade.html");
            }, 420);
        });
    }

    function maybeRoamCat() {
        if (reduced || !finePointer) return;
        if (document.body.dataset.page === "arcade") return;
        let seen = 0;
        try { seen = Number(sessionStorage.getItem("sdsn-cat-rng") || 0); } catch (e) { /* fine */ }
        seen += 1;
        try { sessionStorage.setItem("sdsn-cat-rng", String(seen)); } catch (e) { /* fine */ }
        /* Guaranteed on the 3rd page view of a session, ~30% otherwise. */
        const show = seen === 3 || Math.random() < 0.3;
        if (!show) return;
        window.setTimeout(spawnCat, 12000);
    }
    maybeRoamCat();
})();
