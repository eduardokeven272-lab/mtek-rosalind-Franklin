(() => {
  const $ = id => document.getElementById(id);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Dados ---------- */
  const SEQ = "ATGCATGGCTAACGTCAGCTTACGGATCAGTC";
  const PAIR = { A:"T", T:"A", G:"C", C:"G" };

  const DEFAULT = {
    name: "Dupla hélice", color: "#a7b0c5",
    text: "A estrutura que a Foto 51 tornou visível: duas fitas complementares enroladas uma na outra, bases emparelhadas voltadas para dentro. O padrão em X da imagem de Franklin correspondia exatamente a essa geometria.",
    facts: [["Volta completa","~10 pares de base"],["Passo da hélice","3,4 nm"],["Diâmetro","2 nm"]]
  };

  const INFO = {
    bb: {
      name: "Esqueleto de açúcar-fosfato", color: "#a793ed",
      text: "A parte estrutural da fita: um grupo fosfato ligado a uma desoxirribose, repetidos milhares de vezes. Esse padrão repetitivo, visto nos raios-X de Franklin, sugeria a regularidade de uma hélice.",
      facts: [["Componentes","fosfato + desoxirribose"],["Ligação","fosfodiéster"],["Sentido","5' → 3'"]]
    },
    A: {
      name: "Adenina", color: "#5FBF7E",
      text: "Base púrica, com dois anéis fundidos. Pareia exclusivamente com a timina.",
      facts: [["Tipo","purina (2 anéis)"],["Par","timina"],["Pontes de H","2"]]
    },
    T: {
      name: "Timina", color: "#E6A23C",
      text: "Base pirimídica, de um anel só. Parceira fixa da adenina. No RNA ela é substituída pela uracila.",
      facts: [["Tipo","pirimidina (1 anel)"],["Par","adenina"],["Pontes de H","2"]]
    },
    G: {
      name: "Guanina", color: "#E2694C",
      text: "Base púrica de dois anéis. Forma três pontes de hidrogênio com a citosina, um encaixe mais firme que o par A–T.",
      facts: [["Tipo","purina (2 anéis)"],["Par","citosina"],["Pontes de H","3"]]
    },
    C: {
      name: "Citosina", color: "#4E9FE0",
      text: "Base pirimídica de um anel, sempre pareada com a guanina. Alvo comum de metilação na regulação genética.",
      facts: [["Tipo","pirimidina (1 anel)"],["Par","guanina"],["Pontes de H","3"]]
    }
  };

  /* ---------- Navegação: cartão ⇄ tela de detalhes ---------- */
  const card = $("view-card"), dnaView = $("view-dna"), openBtn = $("openBtn");

  function toggle(open) {
    if (open) {
      const r = openBtn.getBoundingClientRect();
      dnaView.style.setProperty("--ox", r.left + r.width / 2 + "px");
      dnaView.style.setProperty("--oy", r.top + r.height / 2 + "px");
      dnaView.scrollTop = 0;
    }
    dnaView.classList.toggle("open", open);
    card.style.opacity = open ? "0" : "";
    card.style.transform = open ? "scale(.97)" : "";
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) openBtn.focus();
  }
  openBtn.onclick = () => toggle(true);
  $("backBtn").onclick = () => toggle(false);
  document.onkeydown = e => e.key === "Escape" && dnaView.classList.contains("open") && toggle(false);

  document.querySelectorAll(".jump button").forEach(b => {
    b.onclick = () => $(b.dataset.to).scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth" });
  });

  /* ---------- Hélice ---------- */
  const CY = 170, AMP = 108, K = 2 * Math.PI / 360, X0 = 46, X1 = 714, STEP = 24;
  const helix = $("helix"), cam = $("cam"), panel = $("infoPanel");
  const resetBtn = $("reset"), hint = $("hint");
  let phase = 0, selected = null;

  const set = (n, attrs) => { for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  const el = (tag, attrs, ...kids) => {
    const n = set(document.createElementNS("http://www.w3.org/2000/svg", tag), attrs);
    n.append(...kids);
    return n;
  };
  const activate = (n, fn) => {
    n.onclick = fn;
    n.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };
  };

  // Fitas: dois traços visíveis + dois traços transparentes mais largos (área de clique)
  const strands = [.95, .55].map(o => el("path", { fill:"none", stroke:INFO.bb.color, "stroke-width":6, "stroke-linecap":"round", opacity:o }));
  const hits = [0, 1].map(() => el("path", { fill:"none", stroke:"transparent", "stroke-width":18, style:"cursor:pointer" }));
  const gStrand = el("g", { class:"strand", tabindex:"0", role:"button", "aria-label":"Esqueleto de açúcar-fosfato" }, ...strands, ...hits);
  helix.append(gStrand);
  const openStrand = () => select(gStrand, INFO.bb, 380, "Fitas antiparalelas", 2.2);
  activate(gStrand, openStrand);

  // Pares de bases
  const rungs = [];
  for (let x = X0, i = 0; x <= X1; x += STEP, i++) {
    const top = SEQ[i % SEQ.length], bot = PAIR[top];
    const bar = b => el("line", { class:"bar", stroke:INFO[b].color, "stroke-linecap":"round" });
    const r = {
      x, top, b1: bar(top), b2: bar(bot),
      hb: el("line", { stroke:"#9FB4C4", "stroke-width":1, "stroke-dasharray":"2 3", opacity:.5 }),
      hit: el("rect", { class:"hit", fill:"transparent", width:22, rx:6, style:"cursor:pointer" })
    };
    r.g = el("g", { class:"rung", tabindex:"0", role:"button", "aria-label":`Par de bases ${top}–${bot}` }, r.b1, r.b2, r.hb, r.hit);
    r.pick = () => select(r.g, INFO[top], x, `Par ${top}–${bot}`);
    activate(r.g, r.pick);
    helix.append(r.g);
    rungs.push(r);
  }

  // Legenda
  ["A", "T", "G", "C", "bb"].forEach(k => {
    const b = document.createElement("button");
    b.className = "chip";
    b.innerHTML = `<span class="dot" style="background:${INFO[k].color}"></span>${INFO[k].name}`;
    b.onclick = k === "bb" ? openStrand : () => rungs.find(r => r.top === k).pick();
    $("legend").append(b);
  });

  /* ---------- Desenho (a cada quadro) ---------- */
  function draw() {
    [-1, 1].forEach((side, i) => {
      let d = "";
      for (let x = X0 - 6; x <= X1 + 6; x += 6)
        d += `${d ? "L" : "M"}${x} ${(CY + side * Math.sin(K * x + phase) * AMP).toFixed(1)} `;
      set(strands[i], { d });
      set(hits[i], { d });
    });

    for (const r of rungs) {
      const s = Math.sin(K * r.x + phase) * AMP, depth = (Math.cos(K * r.x + phase) + 1) / 2;
      const yA = CY - s, yB = CY + s, gap = Math.min(9, Math.abs(yB - yA) / 5);
      const end = y => y < CY ? CY - gap : CY + gap, w = (4 + 4 * depth).toFixed(1);
      set(r.b1, { x1:r.x, y1:yA, x2:r.x, y2:end(yA), "stroke-width":w });
      set(r.b2, { x1:r.x, y1:yB, x2:r.x, y2:end(yB), "stroke-width":w });
      set(r.hb, { x1:r.x, y1:CY - gap, x2:r.x, y2:CY + gap });
      set(r.g, { opacity:(0.4 + 0.6 * depth).toFixed(2) });
      set(r.hit, { x:r.x - 11, y:Math.min(yA, yB) - 6, height:Math.abs(yB - yA) + 12 });
    }
  }

  /* ---------- Painel, seleção e zoom ---------- */
  function render(info) {
    panel.innerHTML =
      `<h2><span class="dot" style="background:${info.color}"></span>${info.name}</h2><p>${info.text}</p>` +
      `<ul class="facts">${info.facts.map(f => `<li><b>${f[0]}</b><span>${f[1]}</span></li>`).join("")}</ul>`;
  }

  // node = null volta para a visão geral
  function select(node, info, x, label, zoom = 3.4) {
    selected?.classList.remove("sel");
    node?.classList.add("sel");
    selected = node;
    helix.classList.toggle("dim", !!node);
    cam.style.transform = node ? `translate(380px,${CY}px) scale(${zoom}) translate(${-x}px,${-CY}px)` : "none";
    resetBtn.hidden = !node;
    hint.textContent = label;
    render(info);
  }
  resetBtn.onclick = () => select(null, DEFAULT, 0, "Clique em qualquer parte da hélice");

  /* ---------- Animação ---------- */
  let last = 0;
  function tick(t) {
    const dt = Math.min(t - last, 40);
    last = t;
    if (!selected && !document.hidden && !reduce.matches && dnaView.classList.contains("open")) {
      phase += dt * 0.00045;
      draw();
    }
    requestAnimationFrame(tick);
  }

  render(DEFAULT);
  draw();
  requestAnimationFrame(tick);
})();
