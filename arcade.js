/* SDSN Arcade: one canvas, four tiny games, phosphor-green CRT rendering.
   High scores persist in localStorage; everything runs only on this page. */
(() => {
    "use strict";

    const canvas = document.getElementById("crt-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    const GREEN = "#8dffa8";
    const GREEN_DIM = "rgba(141, 255, 168, 0.42)";
    const GREEN_FAINT = "rgba(141, 255, 168, 0.16)";
    const GOLD = "#d7b56d";
    const BG = "#050c06";
    const RED = "#ff7a7a";

    const hudGame = document.querySelector("[data-hud-game]");
    const hudScore = document.querySelector("[data-hud-score]");
    const hudBest = document.querySelector("[data-hud-best]");
    const hudHelp = document.querySelector("[data-hud-help]");
    const menuBtn = document.querySelector("[data-arcade-menu]");
    const shareBtn = document.querySelector("[data-arcade-share]");
    const hiddenInput = document.querySelector(".crt-input");
    const touch = window.matchMedia("(pointer: coarse)").matches;

    const mono = (px, weight) => `${weight || 700} ${px}px "JetBrains Mono", monospace`;

    const best = {
        get(id) {
            try { return Number(localStorage.getItem(`sdsn-arcade-${id}`) || 0); } catch (e) { return 0; }
        },
        set(id, value) {
            try { localStorage.setItem(`sdsn-arcade-${id}`, String(value)); } catch (e) { /* fine */ }
        }
    };

    const toast = message => { if (window.__toast) window.__toast(message); };

    /* ------------------------------------------------------------------ */
    /* Text helpers                                                        */
    /* ------------------------------------------------------------------ */

    function text(str, x, y, size, color, align, weight) {
        ctx.font = mono(size, weight);
        ctx.fillStyle = color || GREEN;
        ctx.textAlign = align || "left";
        ctx.textBaseline = "middle";
        ctx.fillText(str, x, y);
    }

    function centerText(str, y, size, color, weight) {
        text(str, W / 2, y, size, color, "center", weight);
    }

    /* ------------------------------------------------------------------ */
    /* Engine                                                              */
    /* ------------------------------------------------------------------ */

    let current = null;
    let lastShare = null;

    function setHud(game, score, bestScore, help) {
        if (hudGame) hudGame.textContent = game;
        if (hudScore) hudScore.textContent = score === null ? "" : `SCORE ${score}`;
        if (hudBest) hudBest.textContent = bestScore === null ? "" : `BEST ${bestScore}`;
        if (hudHelp) hudHelp.textContent = help || "";
    }

    function switchTo(game) {
        current = game;
        if (game.enter) game.enter();
    }

    let last = 0;
    function loop(t) {
        window.requestAnimationFrame(loop);
        const dt = Math.min((t - last) / 1000 || 0, 0.05);
        last = t;
        if (document.hidden || !current) return;
        if (current.update) current.update(dt);
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, W, H);
        current.draw();
    }

    document.addEventListener("keydown", e => {
        if (!current) return;
        const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter"];
        /* Never trap page scrolling once focus is outside the cabinet area:
           only intercept when the arcade section is at least partly visible. */
        const rect = canvas.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < window.innerHeight;
        if (!visible) return;
        if (e.key === "Escape" && current !== menu) {
            switchTo(menu);
            return;
        }
        if (current.key && current.key(e)) {
            if (keys.includes(e.key)) e.preventDefault();
        }
    });

    canvas.addEventListener("pointerdown", e => {
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * W;
        const y = ((e.clientY - rect.top) / rect.height) * H;
        if (current && current.pointer) current.pointer(x, y);
    });

    /* Swipe detection for snake on touch. */
    let swipeStart = null;
    canvas.addEventListener("touchstart", e => {
        swipeStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    canvas.addEventListener("touchmove", e => {
        if (!swipeStart || !current || !current.swipe) return;
        const dx = e.touches[0].clientX - swipeStart.x;
        const dy = e.touches[0].clientY - swipeStart.y;
        if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
        current.swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
        swipeStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    if (menuBtn) menuBtn.addEventListener("click", () => switchTo(menu));
    if (shareBtn) shareBtn.addEventListener("click", () => {
        if (!lastShare) {
            toast("PLAY A GAME FIRST ▸");
            return;
        }
        const line = `I scored ${lastShare.score} in ${lastShare.name} on sainadiminty's portfolio 🐈`;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(line).then(() => toast("BRAG LINE COPIED ✓"), () => toast(line));
        } else {
            toast(line);
        }
    });

    /* ------------------------------------------------------------------ */
    /* Boot                                                                */
    /* ------------------------------------------------------------------ */

    const BOOT_LINES = [
        "SDSN ARCADE BIOS v1.0",
        "CRT ............. OK",
        "PHOSPHOR ........ OK",
        "CAT ............. PURRING",
        "",
        touch ? "TAP TO INSERT COIN" : "PRESS ANY KEY TO INSERT COIN"
    ];

    const boot = {
        t: 0,
        enter() {
            this.t = 0;
            setHud("BOOT", null, null, "");
        },
        update(dt) { this.t += dt; },
        draw() {
            const visibleChars = Math.floor(this.t * 55);
            let used = 0;
            BOOT_LINES.forEach((line, i) => {
                if (used > visibleChars) return;
                const slice = line.slice(0, Math.max(0, visibleChars - used));
                text(slice, 70, 120 + i * 40, 20, i === BOOT_LINES.length - 1 ? GOLD : GREEN);
                used += line.length;
            });
            if (this.t % 1 < 0.55) text("█", 70 + ctx.measureText(BOOT_LINES[BOOT_LINES.length - 1]).width + 8, 120 + (BOOT_LINES.length - 1) * 40, 20, GOLD);
        },
        key() { switchTo(menu); return true; },
        pointer() { switchTo(menu); }
    };

    /* ------------------------------------------------------------------ */
    /* Menu                                                                */
    /* ------------------------------------------------------------------ */

    const menu = {
        idx: 0,
        items: [],
        enter() {
            this.items = [snake, whack, typer, flappy];
            setHud("MENU", null, null, touch ? "tap a game to start" : "↑↓ select · ↵ start · esc menu");
        },
        update() {},
        draw() {
            centerText("S D S N   A R C A D E", 66, 26, GOLD, 800);
            centerText("high scores live in this browser", 100, 13, GREEN_DIM, 600);
            this.items.forEach((game, i) => {
                const y = 170 + i * 66;
                const selected = i === this.idx;
                if (selected) {
                    ctx.fillStyle = GREEN_FAINT;
                    ctx.fillRect(60, y - 26, W - 120, 52);
                    text("▸", 84, y, 20, GOLD);
                }
                text(game.name, 116, y - 8, 20, selected ? GREEN : GREEN_DIM, "left", 800);
                text(game.tagline, 116, y + 15, 12, GREEN_DIM, "left", 600);
                text(`BEST ${best.get(game.id)}`, W - 84, y, 14, selected ? GOLD : GREEN_DIM, "right");
            });
        },
        key(e) {
            if (e.key === "ArrowDown") { this.idx = (this.idx + 1) % this.items.length; return true; }
            if (e.key === "ArrowUp") { this.idx = (this.idx + this.items.length - 1) % this.items.length; return true; }
            if (e.key === "Enter" || e.key === " ") { switchTo(this.items[this.idx]); return true; }
            return false;
        },
        pointer(x, y) {
            const i = Math.floor((y - 144) / 66);
            if (i >= 0 && i < this.items.length) {
                this.idx = i;
                switchTo(this.items[i]);
            }
        }
    };

    /* Shared game-over overlay behavior. */
    function gameOver(game) {
        game.over = true;
        lastShare = { name: game.name, score: game.score };
        const b = best.get(game.id);
        if (game.score > b) {
            best.set(game.id, game.score);
            toast("NEW HIGH SCORE ▸ " + game.score);
        }
        setHud(game.hudName, game.score, best.get(game.id), touch ? "tap to retry" : "↵ retry · esc menu");
    }

    function drawOver(game, subtitle) {
        ctx.fillStyle = "rgba(4, 10, 5, 0.82)";
        ctx.fillRect(0, 0, W, H);
        centerText("GAME OVER", H / 2 - 44, 30, RED, 800);
        centerText(`SCORE ${game.score} · BEST ${best.get(game.id)}`, H / 2, 18, GREEN);
        if (subtitle) centerText(subtitle, H / 2 + 32, 13, GREEN_DIM, 600);
        centerText(touch ? "tap to retry" : "press ↵ to retry · esc for menu", H / 2 + 66, 13, GOLD, 600);
    }

    /* ------------------------------------------------------------------ */
    /* 1. Data Snake                                                       */
    /* ------------------------------------------------------------------ */

    const snake = {
        id: "snake",
        name: "DATA SNAKE",
        hudName: "DATA SNAKE",
        tagline: "grow the pipeline. don't eat yourself.",
        cell: 30,
        cols: 24,
        rows: 16,
        enter() {
            this.body = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
            this.dir = { x: 1, y: 0 };
            this.nextDir = { x: 1, y: 0 };
            this.food = this.spawnFood();
            this.tickEvery = 0.13;
            this.acc = 0;
            this.score = 0;
            this.over = false;
            setHud(this.hudName, 0, best.get(this.id), touch ? "swipe to steer" : "arrows to steer · esc menu");
        },
        spawnFood() {
            while (true) {
                const p = { x: (Math.random() * this.cols) | 0, y: (Math.random() * this.rows) | 0 };
                if (!this.body || !this.body.some(seg => seg.x === p.x && seg.y === p.y)) return p;
            }
        },
        update(dt) {
            if (this.over) return;
            this.acc += dt;
            if (this.acc < this.tickEvery) return;
            this.acc = 0;
            this.dir = this.nextDir;
            const head = { x: this.body[0].x + this.dir.x, y: this.body[0].y + this.dir.y };
            if (head.x < 0 || head.y < 0 || head.x >= this.cols || head.y >= this.rows ||
                this.body.some(seg => seg.x === head.x && seg.y === head.y)) {
                gameOver(this);
                return;
            }
            this.body.unshift(head);
            if (head.x === this.food.x && head.y === this.food.y) {
                this.score += 10;
                this.tickEvery = Math.max(0.065, this.tickEvery * 0.975);
                this.food = this.spawnFood();
                setHud(this.hudName, this.score, best.get(this.id), "");
            } else {
                this.body.pop();
            }
        },
        draw() {
            ctx.strokeStyle = GREEN_FAINT;
            ctx.lineWidth = 1;
            ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
            /* food = glowing data point */
            const fx = this.food.x * this.cell + this.cell / 2;
            const fy = this.food.y * this.cell + this.cell / 2;
            ctx.fillStyle = GOLD;
            ctx.beginPath();
            ctx.arc(fx, fy, 7, 0, Math.PI * 2);
            ctx.fill();
            this.body.forEach((seg, i) => {
                ctx.fillStyle = i === 0 ? GREEN : `rgba(141, 255, 168, ${Math.max(0.25, 1 - i * 0.03)})`;
                ctx.fillRect(seg.x * this.cell + 2, seg.y * this.cell + 2, this.cell - 4, this.cell - 4);
            });
            if (this.over) drawOver(this, "the pipeline consumed itself");
        },
        key(e) {
            if (this.over) {
                if (e.key === "Enter" || e.key === " ") { this.enter(); return true; }
                return false;
            }
            const map = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
            const d = map[e.key];
            if (!d) return false;
            if (d.x === -this.dir.x && d.y === -this.dir.y) return true;
            this.nextDir = d;
            return true;
        },
        swipe(dirName) {
            const map = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
            const d = map[dirName];
            if (d.x === -this.dir.x && d.y === -this.dir.y) return;
            this.nextDir = d;
        },
        pointer() { if (this.over) this.enter(); }
    };

    /* ------------------------------------------------------------------ */
    /* 2. Whack-a-Bug                                                      */
    /* ------------------------------------------------------------------ */

    const whack = {
        id: "whack",
        name: "WHACK-A-BUG",
        hudName: "WHACK-A-BUG",
        tagline: "squash prod incidents before they escape.",
        enter() {
            this.cells = new Array(9).fill(null);
            this.score = 0;
            this.lives = 3;
            this.over = false;
            this.spawnEvery = 1.05;
            this.ttl = 1.6;
            this.acc = 0;
            setHud(this.hudName, 0, best.get(this.id), touch ? "tap the bugs" : "click the bugs · esc menu");
        },
        cellRect(i) {
            const col = i % 3;
            const row = (i / 3) | 0;
            const size = 118;
            const gap = 24;
            const x0 = (W - 3 * size - 2 * gap) / 2 + col * (size + gap);
            const y0 = 62 + row * (size + gap);
            return { x: x0, y: y0, s: size };
        },
        update(dt) {
            if (this.over) return;
            this.acc += dt;
            if (this.acc >= this.spawnEvery) {
                this.acc = 0;
                const empty = this.cells.map((c, i) => (c ? -1 : i)).filter(i => i >= 0);
                if (empty.length) {
                    const i = empty[(Math.random() * empty.length) | 0];
                    this.cells[i] = { life: this.ttl };
                }
                this.spawnEvery = Math.max(0.45, this.spawnEvery * 0.985);
                this.ttl = Math.max(0.75, this.ttl * 0.99);
            }
            this.cells.forEach((bug, i) => {
                if (!bug) return;
                bug.life -= dt;
                if (bug.life <= 0) {
                    this.cells[i] = null;
                    this.lives -= 1;
                    setHud(this.hudName, this.score, best.get(this.id), `LIVES ${Math.max(0, this.lives)}`);
                    if (this.lives <= 0) gameOver(this);
                }
            });
        },
        draw() {
            for (let i = 0; i < 9; i += 1) {
                const r = this.cellRect(i);
                ctx.strokeStyle = GREEN_FAINT;
                ctx.strokeRect(r.x, r.y, r.s, r.s);
                /* rack slots */
                ctx.fillStyle = "rgba(141, 255, 168, 0.05)";
                ctx.fillRect(r.x + 8, r.y + 8, r.s - 16, 10);
                const bug = this.cells[i];
                if (bug) {
                    const urgency = bug.life / this.ttl;
                    const cx = r.x + r.s / 2;
                    const cy = r.y + r.s / 2 + 6;
                    text("⬤", cx, cy - 8, 30, urgency < 0.4 ? RED : GOLD, "center");
                    text("╱╲ ╱╲", cx, cy + 16, 13, urgency < 0.4 ? RED : GREEN, "center");
                    ctx.fillStyle = GREEN_FAINT;
                    ctx.fillRect(r.x + 10, r.y + r.s - 16, (r.s - 20) * Math.max(0, urgency), 4);
                }
            }
            text(`LIVES ${"♥".repeat(Math.max(0, this.lives))}`, W - 30, 30, 15, RED, "right");
            if (this.over) drawOver(this, "the incidents reached production");
        },
        key(e) {
            if (this.over && (e.key === "Enter" || e.key === " ")) { this.enter(); return true; }
            return false;
        },
        pointer(x, y) {
            if (this.over) { this.enter(); return; }
            for (let i = 0; i < 9; i += 1) {
                const r = this.cellRect(i);
                if (x >= r.x && x <= r.x + r.s && y >= r.y && y <= r.y + r.s && this.cells[i]) {
                    this.cells[i] = null;
                    this.score += 15;
                    setHud(this.hudName, this.score, best.get(this.id), `LIVES ${this.lives}`);
                    return;
                }
            }
        }
    };

    /* ------------------------------------------------------------------ */
    /* 3. Type Racer: AI edition                                           */
    /* ------------------------------------------------------------------ */

    const WORDS = [
        "agent", "tensor", "gradient", "transformer", "retrieval", "embedding",
        "guardrail", "inference", "pipeline", "attention", "tokenizer",
        "alignment", "benchmark", "latency", "sandbox", "vector", "context",
        "prompt", "epoch", "dropout", "shipping", "quantize", "reasoning"
    ];

    const typer = {
        id: "typer",
        name: "TYPE RACER: AI",
        hudName: "TYPE RACER",
        tagline: "30 seconds. real ML words. no typos.",
        enter() {
            this.deck = [...WORDS].sort(() => Math.random() - 0.5);
            this.word = this.deck.pop();
            this.typed = "";
            this.time = 30;
            this.chars = 0;
            this.hits = 0;
            this.misses = 0;
            this.started = false;
            this.score = 0;
            this.over = false;
            setHud(this.hudName, 0, best.get(this.id), touch ? "tap screen, then type" : "start typing · esc menu");
            if (touch && hiddenInput) {
                hiddenInput.value = "";
            }
        },
        update(dt) {
            if (this.over || !this.started) return;
            this.time -= dt;
            if (this.time <= 0) {
                this.time = 0;
                this.score = Math.round((this.chars / 5) / 0.5);
                gameOver(this);
            }
        },
        draw() {
            centerText(`${Math.ceil(this.time)}s`, 62, 34, this.time < 6 ? RED : GOLD, 800);
            const acc = this.hits + this.misses ? Math.round((this.hits / (this.hits + this.misses)) * 100) : 100;
            centerText(`WPM ${this.started ? Math.round((this.chars / 5) / ((30 - this.time) / 60 || 1 / 60)) : 0} · ACC ${acc}%`, 100, 14, GREEN_DIM);
            /* current word with typed prefix */
            ctx.font = mono(52, 800);
            const full = this.word;
            const done = this.typed;
            const wWidth = ctx.measureText(full).width;
            let x = (W - wWidth) / 2;
            for (let i = 0; i < full.length; i += 1) {
                const ch = full[i];
                const color = i < done.length ? (done[i] === ch ? GREEN : RED) : GREEN_DIM;
                ctx.fillStyle = color;
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                ctx.fillText(ch, x, H / 2);
                x += ctx.measureText(ch).width;
            }
            const next = this.deck[this.deck.length - 1];
            if (next) centerText(`next: ${next}`, H / 2 + 70, 14, GREEN_FAINT);
            if (!this.started && !this.over) centerText(touch ? "tap here to summon keyboard" : "start typing to begin", H - 62, 15, GOLD);
            if (this.over) drawOver(this, `${this.hits} words · ${acc}% accuracy · score = WPM`);
        },
        typeChar(ch) {
            if (this.over) return;
            this.started = true;
            this.typed += ch;
            if (this.word.startsWith(this.typed)) {
                this.chars += 1;
                if (this.typed === this.word) {
                    this.hits += 1;
                    this.typed = "";
                    if (!this.deck.length) this.deck = [...WORDS].sort(() => Math.random() - 0.5);
                    this.word = this.deck.pop();
                }
            } else {
                this.misses += 1;
                this.typed = this.typed.slice(0, -1);
            }
        },
        key(e) {
            if (this.over) {
                if (e.key === "Enter" || e.key === " ") { this.enter(); return true; }
                return false;
            }
            if (e.key === "Backspace") { this.typed = this.typed.slice(0, -1); return true; }
            if (e.key.length === 1 && /[a-z-]/i.test(e.key)) {
                this.typeChar(e.key.toLowerCase());
                return true;
            }
            return false;
        },
        pointer() {
            if (this.over) { this.enter(); return; }
            if (touch && hiddenInput) {
                hiddenInput.focus();
                hiddenInput.value = "";
            }
        }
    };

    if (hiddenInput) {
        hiddenInput.addEventListener("input", () => {
            if (current !== typer) return;
            const value = hiddenInput.value;
            const ch = value.slice(-1).toLowerCase();
            hiddenInput.value = "";
            if (/[a-z-]/.test(ch)) typer.typeChar(ch);
        });
    }

    /* ------------------------------------------------------------------ */
    /* 4. Pipeline Flappy                                                  */
    /* ------------------------------------------------------------------ */

    const flappy = {
        id: "flappy",
        name: "PIPELINE FLAPPY",
        hudName: "PIPELINE FLAPPY",
        tagline: "fly the packet through the gaps.",
        enter() {
            this.y = H / 2;
            this.vy = 0;
            this.pipes = [];
            this.dist = 0;
            this.score = 0;
            this.started = false;
            this.over = false;
            setHud(this.hudName, 0, best.get(this.id), touch ? "tap to flap" : "space to flap · esc menu");
        },
        flap() {
            if (this.over) { this.enter(); return; }
            this.started = true;
            this.vy = -320;
        },
        update(dt) {
            if (!this.started || this.over) return;
            this.vy += 900 * dt;
            this.y += this.vy * dt;
            this.dist += dt;
            if (this.dist > 1.45) {
                this.dist = 0;
                const gapY = 90 + Math.random() * (H - 260);
                this.pipes.push({ x: W + 40, gapY, gap: 150, passed: false });
            }
            this.pipes.forEach(p => { p.x -= 190 * dt; });
            this.pipes = this.pipes.filter(p => p.x > -60);
            const bx = 150;
            this.pipes.forEach(p => {
                if (!p.passed && p.x + 26 < bx) {
                    p.passed = true;
                    this.score += 1;
                    setHud(this.hudName, this.score, best.get(this.id), "");
                }
                if (bx + 13 > p.x && bx - 13 < p.x + 52) {
                    if (this.y - 11 < p.gapY || this.y + 11 > p.gapY + p.gap) gameOver(this);
                }
            });
            if (this.y > H - 12 || this.y < 12) gameOver(this);
        },
        draw() {
            /* pipes as data conduits */
            this.pipes.forEach(p => {
                ctx.fillStyle = GREEN_FAINT;
                ctx.fillRect(p.x, 0, 52, p.gapY);
                ctx.fillRect(p.x, p.gapY + p.gap, 52, H - p.gapY - p.gap);
                ctx.strokeStyle = GREEN_DIM;
                ctx.strokeRect(p.x, 0, 52, p.gapY);
                ctx.strokeRect(p.x, p.gapY + p.gap, 52, H - p.gapY - p.gap);
            });
            /* packet */
            ctx.fillStyle = GOLD;
            ctx.save();
            ctx.translate(150, this.y);
            ctx.rotate(Math.max(-0.4, Math.min(0.6, this.vy / 700)));
            ctx.fillRect(-13, -11, 26, 22);
            ctx.fillStyle = BG;
            ctx.fillRect(-7, -4, 14, 3);
            ctx.fillRect(-7, 2, 9, 3);
            ctx.restore();
            if (!this.started && !this.over) centerText(touch ? "tap to launch the packet" : "press space to launch", H / 2 + 90, 15, GOLD);
            if (this.over) drawOver(this, "packet dropped. retries are free here");
        },
        key(e) {
            if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp") { this.flap(); return true; }
            return false;
        },
        pointer() { this.flap(); }
    };

    /* ------------------------------------------------------------------ */
    /* Go                                                                  */
    /* ------------------------------------------------------------------ */

    switchTo(boot);
    window.requestAnimationFrame(loop);
})();
