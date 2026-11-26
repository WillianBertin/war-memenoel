var c = document.getElementById('c'), ctx = c.getContext('2d', { alpha: false });
var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
var estado = 'INICIO', modo = 'PROX', fase = 1, maxFaseSalva = 1, pontos = 0, combo = 1, comboT = 0;
var modoInfinito = false, q = 0, abates = 0, totalAbatesPartida = 0, tirosDisparados = 0, tirosAcertados = 0, metaAbates = 24;
var chefeOn = false, miniChefeOn = false, tremor = 0, flashTela = 0, mudo = false, ac = null;
var alertaChefeT = 0, nomeAlertaChefe = '', bgmTimer = null, bgmPasso = 0, raioFlash = 0;
var tipoNaveSelecionada = 1, bulletTimeAtivo = false, bulletTimeCooldown = 120;
var corCustomizadaNave = '#00f3ff', ultimoTempo = 0, intervaloFps = 1000 / 60;
var MAX_PARTS = isMobile ? 45 : 90;

var PERFIS_NAVE = {
  1: { vel: 7.4, hpInicial: 100, multDano: 1.0, multCadencia: 0.85, drones: 2, icone: '🚀', stVel: 95, stHp: 65, stDmg: 72 },
  2: { vel: 6.1, hpInicial: 130, multDano: 1.35, multCadencia: 1.05, drones: 2, icone: '🔥', stVel: 65, stHp: 100, stDmg: 95 },
  3: { vel: 6.7, hpInicial: 110, multDano: 1.15, multCadencia: 0.95, drones: 2, icone: '⚡', stVel: 80, stHp: 80, stDmg: 88 }
};

var nave = { x: 300, y: 650, hp: 100, maxHp: 100, t: 0, arma: 1, ult: 0, laserT: 0, escudoT: 0, dashT: 0, dashCd: 0, tilt: 0, drones: 2, rastro: [] };
var tiros = [], tChefe = [], inimigos = [], itens = [], parts = [], ondas = [], estrelas = [], meteoros = [], textosDano = [], clima = [], raiosChefe = [], bombasChefe = [];
var chefe = null, miniChefe = null, teclas = {}, alvoX = 300, alvoY = 650, tocando = false;

var gradFundoCache = null, faseGradCache = -1;
function obterGradFundo() {
  if (faseGradCache === fase && gradFundoCache) return gradFundoCache;
  faseGradCache = fase;
  var g = ctx.createRadialGradient(300, 380, 50, 300, 380, 520);
  if (fase >= 22) { g.addColorStop(0, '#004d26'); g.addColorStop(1, '#020a04'); }
  else if (fase === 21) { g.addColorStop(0, '#4a0066'); g.addColorStop(1, '#0a0014'); }
  else if (fase >= 19) { g.addColorStop(0, '#5e0f22'); g.addColorStop(1, '#040106'); }
  else if (fase % 3 === 0) { g.addColorStop(0, '#0e365c'); g.addColorStop(1, '#010208'); }
  else { g.addColorStop(0, '#0f233c'); g.addColorStop(1, '#010206'); }
  gradFundoCache = g; return g;
}

var planetas = [
  { x: 95, y: 140, r: 32, vy: 0.35, cor: '#1e3a5f', anel: true },
  { x: 510, y: 540, r: 20, vy: 0.45, cor: '#4c1d3d', anel: false }
];
for (var i = 0; i < (isMobile ? 16 : 32); i++) clima.push({ x: Math.random() * 600, y: Math.random() * 760, vx: (Math.random() - 0.5) * 1.1, vy: 1.2 + Math.random() * 2, r: 1.5 + Math.random() * 2 });
for (var i = 0; i < (isMobile ? 55 : 100); i++) {
  var camada = (i % 3) + 1;
  estrelas.push({ x: Math.random() * 600, y: Math.random() * 760, v: camada * 1.4, r: camada * 0.9, cor: camada === 3 ? '#ff85b3' : (camada === 2 ? '#ffffff' : '#00f3ff') });
}

function mudarAba(nome, btn) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.add('hidden'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  var alvo = document.getElementById('tab-' + nome);
  if (alvo) alvo.classList.remove('hidden');
  if (btn) btn.classList.add('active');
}

function atualizarBarrasNave() {
  var p = PERFIS_NAVE[tipoNaveSelecionada] || PERFIS_NAVE[1];
  document.getElementById('st-vel').style.width = p.stVel + '%';
  document.getElementById('st-hp').style.width = p.stHp + '%';
  document.getElementById('st-dmg').style.width = p.stDmg + '%';
}

function criarTextoDano(x, y, valor, cor) {
  if (textosDano.length > 18) textosDano.shift();
  textosDano.push({ x: x + (Math.random() - 0.5) * 16, y: y - 8, txt: '-' + Math.round(valor), cor: cor || '#ffee00', vida: 24, maxVida: 24 });
}

function desenharModeloNave(g, tipo, cor, escala, chama) {
  g.save(); g.scale(escala, escala);
  if (chama) {
    g.fillStyle = '#ff3300'; g.beginPath(); g.moveTo(-12, 20); g.lineTo(0, 40 + Math.random() * 12); g.lineTo(12, 20); g.fill();
    g.fillStyle = '#ffee00'; g.beginPath(); g.moveTo(-6, 20); g.lineTo(0, 28 + Math.random() * 8); g.lineTo(6, 20); g.fill();
  }
  g.fillStyle = cor;
  if (tipo === 1) {
    g.beginPath(); g.moveTo(-10, 6); g.lineTo(-40, 24); g.lineTo(-16, 16); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(10, 6); g.lineTo(40, 24); g.lineTo(16, 16); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0, -38); g.lineTo(-22, 20); g.lineTo(0, 12); g.lineTo(22, 20); g.closePath(); g.fill();
  } else if (tipo === 2) {
    g.fillRect(-30, -8, 12, 30); g.fillRect(18, -8, 12, 30);
    g.beginPath(); g.moveTo(0, -32); g.lineTo(-26, 18); g.lineTo(26, 18); g.closePath(); g.fill();
    g.fillStyle = '#ff0055'; g.beginPath(); g.arc(0, 2, 7, 0, Math.PI * 2); g.fill();
  } else {
    g.beginPath(); g.moveTo(-14, 0); g.lineTo(-42, 14); g.lineTo(-36, 24); g.lineTo(-14, 18); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(14, 0); g.lineTo(42, 14); g.lineTo(36, 24); g.lineTo(14, 18); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0, -34); g.lineTo(-18, 22); g.lineTo(18, 22); g.closePath(); g.fill();
    g.fillStyle = '#ffee00'; g.fillRect(-34, 8, 6, 12); g.fillRect(28, 8, 6, 12);
  }
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.beginPath(); g.moveTo(0, -24); g.lineTo(-8, 6); g.lineTo(0, 2); g.lineTo(8, 6); g.closePath(); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 1.6; g.stroke();
  g.restore();
}

function renderizarPreviasNaves() {
  for (var n = 1; n <= 3; n++) {
    var cv = document.getElementById('prev-' + n);
    if (!cv) continue;
    var g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    g.save(); g.translate(30, 29); desenharModeloNave(g, n, corCustomizadaNave, 0.52, false); g.restore();
  }
}

function resetarEstadoPartida() {
  var perfil = PERFIS_NAVE[tipoNaveSelecionada] || PERFIS_NAVE[1];
  pontos = 0; combo = 1; comboT = 0; totalAbatesPartida = 0; tirosDisparados = 0; tirosAcertados = 0;
  bulletTimeAtivo = false; bulletTimeCooldown = 120;
  nave.x = 300; nave.y = 650; alvoX = 300; alvoY = 650; nave.rastro = [];
  nave.maxHp = perfil.hpInicial; nave.hp = perfil.hpInicial;
  nave.arma = 1; nave.ult = 0; nave.laserT = 0; nave.escudoT = 0; nave.dashT = 0; nave.dashCd = 0; nave.drones = perfil.drones;
  textosDano = []; raiosChefe = []; bombasChefe = [];
}

function selecionarNave(id) {
  tipoNaveSelecionada = id;
  document.querySelectorAll('.ship-option').forEach(function(el) { el.classList.remove('selected'); });
  var ativa = document.querySelector('.ship-option[data-ship="' + id + '"]');
  if (ativa) ativa.classList.add('selected');
  atualizarBarrasNave();
}

var CONQUISTAS_DEF = [
  { id: 'sangue', nome: '🩸 Primeiro Sangue' }, { id: 'chefe', nome: '🎅 Caça-Noel' },
  { id: 'arma', nome: '⚡ Arsenal Nv.6' }, { id: 'combo', nome: '🔥 Combo x10' },
  { id: 'inferno', nome: '💀 Sobreviveu F19' }, { id: 'lenda', nome: '🏆 Grinch Destruído' }
];
var conquistasSalvas = {};
try { conquistasSalvas = JSON.parse(localStorage.getItem('wm_conq') || '{}'); } catch (e) {}

function desbloquearConquista(id) {
  if (conquistasSalvas[id]) return;
  conquistasSalvas[id] = true;
  try { localStorage.setItem('wm_conq', JSON.stringify(conquistasSalvas)); } catch (e) {}
  var info = CONQUISTAS_DEF.find(function(item) { return item.id === id; });
  if (info) {
    var toast = document.getElementById('toast-conquista');
    toast.textContent = 'CONQUISTA: ' + info.nome; toast.style.opacity = '1'; pontos += 500;
    som(980, 'sine', 0.35, 0.12, 1320); setTimeout(function() { toast.style.opacity = '0'; }, 2800);
  }
  renderizarConquistas();
}

function renderizarConquistas() {
  var el = document.getElementById('conq-lista'), countEl = document.getElementById('conq-count');
  if (!el) return;
  var html = '', total = 0;
  for (var i = 0; i < CONQUISTAS_DEF.length; i++) {
    var cItem = CONQUISTAS_DEF[i], ativa = !!conquistasSalvas[cItem.id];
    if (ativa) total++;
    html += '<div class="conq-item' + (ativa ? ' ativa' : '') + '">' + cItem.nome + '</div>';
  }
  el.innerHTML = html; if (countEl) countEl.textContent = total;
}

function iniciarAudioContext() { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); }
function som(freq, tipo, dur, vol, freqFim) {
  if (mudo) return;
  try {
    iniciarAudioContext();
    var osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = tipo || 'sine'; osc.frequency.setValueAtTime(freq, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25, freqFim || (freq * 0.35)), ac.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.08, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.connect(gain); gain.connect(ac.destination); osc.start(); osc.stop(ac.currentTime + dur);
  } catch (e) {}
}
function tocarBatidaMusica() {
  if (mudo || estado !== 'JOGANDO') return;
  try {
    iniciarAudioContext();
    var notasNormais = [110, 110, 146.83, 130.81, 164.81, 146.83, 196, 164.81];
    var notasChefe = [98, 103.83, 98, 116.54, 98, 130.81, 116.54, 103.83];
    var escala = (chefeOn || fase >= 15) ? notasChefe : notasNormais;
    var freq = escala[bgmPasso % escala.length]; bgmPasso++;
    var osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = (chefeOn || fase >= 15) ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(0.035, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
    osc.connect(gain); gain.connect(ac.destination); osc.start(); osc.stop(ac.currentTime + 0.19);
  } catch (e) {}
}
function iniciarMusica() { if (bgmTimer) clearInterval(bgmTimer); bgmTimer = setInterval(tocarBatidaMusica, fase >= 19 ? 150 : (fase >= 15 ? 175 : 210)); }

function criarParticulas(x, y, cor, qtd, ondaChoque) {
  var n = isMobile ? Math.max(2, Math.floor(qtd * 0.5)) : qtd;
  for (var i = 0; i < n; i++) {
    if (parts.length >= MAX_PARTS) parts.shift();
    var ang = Math.random() * Math.PI * 2, vel = 1.4 + Math.random() * 5.8;
    parts.push({ x: x, y: y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, vida: 20 + Math.random() * 16, maxVida: 36, cor: cor, r: 1.8 + Math.random() * 2.6 });
  }
  if (ondaChoque && ondas.length < 10) ondas.push({ x: x, y: y, r: 10, maxR: 100, cor: cor, alpha: 0.9 });
}

function alternarPausa() {
  if (estado === 'JOGANDO') { estado = 'PAUSADO'; document.getElementById('pause-screen').classList.remove('hidden'); document.getElementById('btn-pause').textContent = 'VOLTAR'; }
  else if (estado === 'PAUSADO') { estado = 'JOGANDO'; document.getElementById('pause-screen').classList.add('hidden'); document.getElementById('btn-pause').textContent = 'PAUSAR'; }
}
function reiniciarParaFase1() {
  modoInfinito = false; resetarEstadoPartida();
  document.getElementById('pause-screen').classList.add('hidden');
  document.getElementById('modal').classList.add('hidden');
  iniciarFase(1); estado = 'JOGANDO';
}
function iniciarFase(numFase) {
  fase = numFase; abates = 0; chefeOn = false; miniChefeOn = false; chefe = null; miniChefe = null;
  tiros = []; tChefe = []; inimigos = []; itens = []; meteoros = []; textosDano = []; raiosChefe = []; bombasChefe = []; alertaChefeT = 0;
  metaAbates = fase >= 15 ? (42 + (fase * 3)) : (24 + (fase * 2));
  document.getElementById('lvl').textContent = fase;
  document.getElementById('lvl-max').textContent = modoInfinito ? ' ∞' : '/22';
  document.getElementById('pause-screen').classList.add('hidden');
  document.getElementById('btn-pause').textContent = 'PAUSAR';
  iniciarMusica(); atualizarHUD();
}

function obterCoresChefao(nFase) {
  var paletas = [
    { aura: '#ff0055', prim: '#00f3ff' }, { aura: '#ffaa00', prim: '#ff0055' }, { aura: '#a855f7', prim: '#ffee00' },
    { aura: '#00ff88', prim: '#ff0055' }, { aura: '#ff0055', prim: '#ffee00' }, { aura: '#38bdf8', prim: '#ff0055' },
    { aura: '#ffee00', prim: '#00f3ff' }, { aura: '#f43f5e', prim: '#ffee00' }, { aura: '#10b981', prim: '#ff0055' },
    { aura: '#6366f1', prim: '#ec4899' }, { aura: '#14b8a6', prim: '#ff0055' }, { aura: '#8b5cf6', prim: '#10b981' },
    { aura: '#f97316', prim: '#06b6d4' }, { aura: '#e879f9', prim: '#ff0055' }, { aura: '#38bdf8', prim: '#fb7185' },
    { aura: '#facc15', prim: '#ff0055' }, { aura: '#34d399', prim: '#f472b6' }, { aura: '#fb923c', prim: '#ff0055' },
    { aura: '#ef4444', prim: '#ffffff' }, { aura: '#00ff88', prim: '#ff0055' }, { aura: '#ffd700', prim: '#a855f7' },
    { aura: '#00ff44', prim: '#ff0033' }
  ];
  return paletas[(nFase - 1) % paletas.length];
}

function invocarMiniChefe() {
  if (miniChefeOn || chefeOn) return;
  miniChefeOn = true;
  var vidaMini = fase >= 15 ? (420 + fase * 85) : (180 + fase * 40), cores = obterCoresChefao(fase);
  miniChefe = { x: 300, y: -80, alvoY: 180, vx: (fase >= 15 ? 3.2 : 2.2) + (fase * 0.06), hp: vidaMini, maxHp: vidaMini, r: 40, hitFlash: 0, corAura: cores.prim, corPrim: cores.aura, tipo: fase >= 22 ? 'GRINCH' : 'NOEL', nome: fase >= 22 ? 'GRINCH MECÂNICO' : 'MINI-NOEL S' + fase };
  som(180, 'sawtooth', 0.5, 0.12, 60);
}

function invocarChefe() {
  if (chefeOn) return;
  chefeOn = true; alertaChefeT = 140;
  var isHardcore = (fase >= 15), isInferno = (fase >= 19);
  var vidaMax = isInferno ? (fase >= 22 ? 18000 + (fase - 22) * 3500 : 13000) : (isHardcore ? (1200 + fase * 180) : (240 + fase * 40));
  var velBase = isInferno ? 5.2 : (isHardcore ? 3.2 : 1.5), cores = obterCoresChefao(fase);
  var tipoChefe = fase === 21 ? 'DEUS' : (fase >= 22 ? 'GRINCH' : 'NOEL');
  nomeAlertaChefe = tipoChefe === 'GRINCH' ? 'O GRINCH CIBERNÉTICO SUPREMO' : (tipoChefe === 'DEUS' ? 'DEUS DO NATAL' : (fase === 20 ? 'PAPAI NOEL SUPREMO' : 'PAPAI NOEL S' + fase));
  chefe = { x: 300, y: -110, alvoY: 145, vx: velBase, hp: vidaMax, hpVisual: vidaMax, maxHp: vidaMax, t: 0, r: 54, final: (fase >= 20), inferno: isInferno, faseChefe: 1, corAura: cores.aura, corPrim: cores.prim, hitFlash: 0, tipo: tipoChefe, nome: nomeAlertaChefe };
  tremor = isInferno ? 32 : (isHardcore ? 18 : 10);
  som(420, 'sawtooth', 0.35, 0.12, 180);
}

function atualizarHUD() {
  document.getElementById('pts').textContent = pontos;
  document.getElementById('wpn-lvl').textContent = 'NV.' + nave.arma;
  document.getElementById('hp-bar').style.width = Math.max(0, Math.min(100, (nave.hp / (nave.maxHp || 100)) * 100)) + '%';
  document.getElementById('ult-bar').style.width = Math.min(100, nave.ult) + '%';
  document.getElementById('bt-bar').style.width = Math.max(0, Math.min(100, (bulletTimeCooldown / 120) * 100)) + '%';
  document.getElementById('sh-bar').style.width = Math.max(0, Math.min(100, (nave.escudoT / 300) * 100)) + '%';
  var tag = document.getElementById('combo-tag');
  if (combo > 1) { tag.textContent = 'COMBO x' + combo; tag.style.opacity = '1'; } else { tag.style.opacity = '0'; }
  var btnUlt = document.getElementById('btn-ult');
  if (nave.ult >= 100) btnUlt.classList.remove('hidden'); else btnUlt.classList.add('hidden');
  var btnDash = document.getElementById('btn-dash');
  if (btnDash) btnDash.style.opacity = nave.dashCd > 0 ? '0.45' : '1';
}

function ativarSuperLaser() {
  if (nave.ult < 100 || estado !== 'JOGANDO') return;
  nave.ult = 0; nave.laserT = 135; tremor = 20; flashTela = 0.55;
  som(260, 'sawtooth', 0.85, 0.16, 65); atualizarHUD();
}

function ativarDash() {
  if (estado !== 'JOGANDO' || nave.dashCd > 0) return;
  nave.dashT = 22; nave.dashCd = 95;
  alvoY = Math.max(90, alvoY - 75);
  criarParticulas(nave.x, nave.y, '#ffee00', 10, true);
  som(740, 'triangle', 0.16, 0.1, 320);
}

function sofrerDano(dano) {
  if (nave.escudoT > 0 || nave.dashT > 0) return;
  nave.hp -= dano; combo = 1; tremor = 18; flashTela = 0.5;
  criarParticulas(nave.x, nave.y, '#ff0055', 14, true);
  som(90, 'square', 0.28, 0.14, 30);
  if (nave.hp > 0 && nave.hp < (nave.maxHp || 100) * 0.25) som(300, 'sine', 0.15, 0.1, 150);
  if (nave.hp <= 0) { nave.hp = 0; atualizarHUD(); encerrarPartida('DERROTA!', 'Sua nave foi destruída no setor ' + fase + '. Salve seu recorde:', 'REINICIAR'); }
}

function comprarLoja(tipo) {
  var capHp = nave.maxHp || 100;
  if (tipo === 'hp' && pontos >= 250) { pontos -= 250; nave.hp = Math.min(capHp, nave.hp + 35); som(880, 'sine', 0.2, 0.1, 1320); }
  else if (tipo === 'arma' && pontos >= 500) { pontos -= 500; nave.arma = Math.min(6, nave.arma + 1); if (nave.arma >= 6) desbloquearConquista('arma'); som(880, 'sine', 0.2, 0.1, 1760); }
  else if (tipo === 'escudo' && pontos >= 400) { pontos -= 400; nave.escudoT = 300; som(880, 'sine', 0.2, 0.1, 1500); }
  else { som(150, 'sawtooth', 0.15, 0.1, 80); }
  atualizarHUD(); document.getElementById('stat-pts').textContent = pontos;
}

function buscarAlvoMaisProximo(x, y) {
  var alvo = null, menorDist = 9999;
  if (chefeOn && chefe) return chefe;
  if (miniChefeOn && miniChefe) return miniChefe;
  for (var i = 0; i < inimigos.length; i++) { var d = Math.hypot(inimigos[i].x - x, inimigos[i].y - y); if (d < menorDist) { menorDist = d; alvo = inimigos[i]; } }
  return alvo;
}

function atualizarJogo() {
  if (estado !== 'JOGANDO') return;
  var perfil = PERFIS_NAVE[tipoNaveSelecionada] || PERFIS_NAVE[1];
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : [], gp = gamepads[0];
  if (gp) {
    var stickX = gp.axes[0] || 0, stickY = gp.axes[1] || 0;
    if (Math.abs(stickX) > 0.15) alvoX += stickX * perfil.vel;
    if (Math.abs(stickY) > 0.15) alvoY += stickY * perfil.vel;
    if (gp.buttons[0] && gp.buttons[0].pressed && nave.ult >= 100) ativarSuperLaser();
    if (gp.buttons[1] && gp.buttons[1].pressed) ativarDash();
    bulletTimeAtivo = !!(gp.buttons[4] && gp.buttons[4].pressed);
  }

  var multiplicadorTempo = 1;
  if (bulletTimeAtivo && bulletTimeCooldown > 0) {
    multiplicadorTempo = 0.5; bulletTimeCooldown = Math.max(0, bulletTimeCooldown - 0.5);
    if (bulletTimeCooldown <= 0) bulletTimeAtivo = false;
  } else {
    bulletTimeAtivo = false; if (bulletTimeCooldown < 120) bulletTimeCooldown = Math.min(120, bulletTimeCooldown + 0.25);
  }

  q += multiplicadorTempo;
  if (tremor > 0) tremor--;
  if (flashTela > 0) flashTela = Math.max(0, flashTela - 0.05);
  if (raioFlash > 0) raioFlash = Math.max(0, raioFlash - 0.06);
  if (fase >= 19 && Math.random() < 0.008) raioFlash = 0.45;
  if (alertaChefeT > 0) alertaChefeT -= multiplicadorTempo;
  if (nave.escudoT > 0) nave.escudoT -= multiplicadorTempo;
  if (nave.laserT > 0) nave.laserT -= multiplicadorTempo;
  if (nave.dashT > 0) nave.dashT -= multiplicadorTempo;
  if (nave.dashCd > 0) nave.dashCd -= multiplicadorTempo;
  if (comboT > 0) { comboT -= multiplicadorTempo; if (comboT <= 0) combo = 1; }

  var vel = perfil.vel;
  if (teclas['ArrowLeft'] || teclas['KeyA']) alvoX -= vel;
  if (teclas['ArrowRight'] || teclas['KeyD']) alvoX += vel;
  if (teclas['ArrowUp'] || teclas['KeyW']) alvoY -= vel;
  if (teclas['ArrowDown'] || teclas['KeyS']) alvoY += vel;
  alvoX = Math.max(28, Math.min(572, alvoX)); alvoY = Math.max(80, Math.min(720, alvoY));

  var dx = alvoX - nave.x;
  nave.tilt = Math.max(-0.38, Math.min(0.38, dx * 0.032));
  nave.x += dx * 0.22; nave.y += (alvoY - nave.y) * 0.22;
  if (!isMobile) { nave.rastro.push({ x: nave.x, y: nave.y, tilt: nave.tilt }); if (nave.rastro.length > 4) nave.rastro.shift(); }

  if (nave.hp < (nave.maxHp || 100) * 0.3 && Math.random() < 0.3 && parts.length < MAX_PARTS) {
    parts.push({ x: nave.x + (Math.random() - 0.5) * 18, y: nave.y + 8, vx: (Math.random() - 0.5) * 1.5, vy: 2 + Math.random() * 2, vida: 16, maxVida: 16, cor: Math.random() < 0.5 ? '#ff5500' : '#64748b', r: 2.5 });
  }

  if (nave.laserT > 0) {
    var danoLaser = 6.5 * perfil.multDano * multiplicadorTempo;
    for (var l = inimigos.length - 1; l >= 0; l--) { var enL = inimigos[l]; if (Math.abs(enL.x - nave.x) < 52 + enL.r && enL.y < nave.y) { enL.hp -= danoLaser; enL.hitFlash = 2; } }
    for (var tk = tChefe.length - 1; tk >= 0; tk--) { if (Math.abs(tChefe[tk].x - nave.x) < 54 && tChefe[tk].y < nave.y) { criarParticulas(tChefe[tk].x, tChefe[tk].y, '#00f3ff', 2, false); tChefe.splice(tk, 1); } }
    if (miniChefeOn && miniChefe && Math.abs(miniChefe.x - nave.x) < 52 + miniChefe.r && miniChefe.y < nave.y) { miniChefe.hp -= danoLaser * 1.2; miniChefe.hitFlash = 2; }
    if (chefeOn && chefe && Math.abs(chefe.x - nave.x) < 52 + chefe.r && chefe.y < nave.y) { chefe.hp -= danoLaser * 1.2; chefe.hitFlash = 2; }
  }

  nave.t += multiplicadorTempo;
  var danoBase = (18 + (nave.arma * 9)) * perfil.multDano;
  var cadencia = Math.max(4, (13 - nave.arma * 1.5) * perfil.multCadencia);

  if (Math.floor(nave.t) % Math.max(2, Math.floor(cadencia)) === 0) {
    tirosDisparados++;
    som(tipoNaveSelecionada === 2 ? 360 : (tipoNaveSelecionada === 3 ? 520 : 620 + nave.arma * 50), tipoNaveSelecionada === 2 ? 'sawtooth' : 'triangle', 0.055, 0.03);
    if (tipoNaveSelecionada === 1) {
      if (nave.arma === 1) tiros.push({ x: nave.x, y: nave.y - 24, vx: 0, vy: -16, d: danoBase, cor: corCustomizadaNave, tipo: 'LASER' });
      else if (nave.arma === 2) { tiros.push({ x: nave.x - 14, y: nave.y - 20, vx: 0, vy: -16, d: danoBase, cor: corCustomizadaNave, tipo: 'LASER' }); tiros.push({ x: nave.x + 14, y: nave.y - 20, vx: 0, vy: -16, d: danoBase, cor: corCustomizadaNave, tipo: 'LASER' }); }
      else if (nave.arma === 3) { tiros.push({ x: nave.x, y: nave.y - 28, vx: 0, vy: -17, d: danoBase * 1.2, cor: '#ffee00', tipo: 'LASER' }); tiros.push({ x: nave.x - 20, y: nave.y - 18, vx: -1.8, vy: -15, d: danoBase, cor: corCustomizadaNave, tipo: 'LASER' }); tiros.push({ x: nave.x + 20, y: nave.y - 18, vx: 1.8, vy: -15, d: danoBase, cor: corCustomizadaNave, tipo: 'LASER' }); }
      else if (nave.arma === 4) { tiros.push({ x: nave.x - 12, y: nave.y - 22, vx: -1, vy: -17, d: danoBase, cor: '#ff0055', tipo: 'LASER' }); tiros.push({ x: nave.x + 12, y: nave.y - 22, vx: 1, vy: -17, d: danoBase, cor: '#ff0055', tipo: 'LASER' }); tiros.push({ x: nave.x - 28, y: nave.y - 14, vx: -3.5, vy: -14, d: danoBase, cor: corCustomizadaNave, tipo: 'LASER' }); tiros.push({ x: nave.x + 28, y: nave.y - 14, vx: 3.5, vy: -14, d: danoBase, cor: corCustomizadaNave, tipo: 'LASER' }); }
      else if (nave.arma === 5) { tiros.push({ x: nave.x, y: nave.y - 30, vx: 0, vy: -18, d: danoBase * 1.5, cor: '#ff0055', tipo: 'ONDA' }); tiros.push({ x: nave.x - 18, y: nave.y - 22, vx: -2.2, vy: -16, d: danoBase, cor: corCustomizadaNave, tipo: 'LASER' }); tiros.push({ x: nave.x + 18, y: nave.y - 22, vx: 2.2, vy: -16, d: danoBase, cor: corCustomizadaNave, tipo: 'LASER' }); tiros.push({ x: nave.x - 36, y: nave.y - 14, vx: -4.5, vy: -13, d: danoBase, cor: '#ffee00', tipo: 'LASER' }); tiros.push({ x: nave.x + 36, y: nave.y - 14, vx: 4.5, vy: -13, d: danoBase, cor: '#ffee00', tipo: 'LASER' }); }
      else { tiros.push({ x: nave.x - 10, y: nave.y - 32, vx: 0, vy: -19, d: danoBase * 2, cor: '#00ff88', tipo: 'ONDA' }); tiros.push({ x: nave.x + 10, y: nave.y - 32, vx: 0, vy: -19, d: danoBase * 2, cor: '#00ff88', tipo: 'ONDA' }); tiros.push({ x: nave.x - 24, y: nave.y - 22, vx: -2.5, vy: -17, d: danoBase * 1.3, cor: '#ffee00', tipo: 'LASER' }); tiros.push({ x: nave.x + 24, y: nave.y - 22, vx: 2.5, vy: -17, d: danoBase * 1.3, cor: '#ffee00', tipo: 'LASER' }); tiros.push({ x: nave.x - 44, y: nave.y - 14, vx: -5.5, vy: -14, d: danoBase * 1.2, cor: '#ff0055', tipo: 'PLASMA' }); tiros.push({ x: nave.x + 44, y: nave.y - 14, vx: 5.5, vy: -14, d: danoBase * 1.2, cor: '#ff0055', tipo: 'PLASMA' }); }
    } else if (tipoNaveSelecionada === 2) {
      var qtdPlasma = Math.min(6, nave.arma);
      for (var p = 0; p < qtdPlasma; p++) { var offX = (p - (qtdPlasma - 1) / 2) * 12; tiros.push({ x: nave.x + offX, y: nave.y - 26, vx: offX * 0.12, vy: -15, d: danoBase * 1.4, cor: '#ff0055', tipo: 'PLASMA' }); }
      if (nave.arma >= 6) tiros.push({ x: nave.x, y: nave.y - 34, vx: 0, vy: -18, d: danoBase * 3, cor: '#ffffff', tipo: 'ONDA' });
    } else {
      var qtdQuantum = Math.min(6, nave.arma);
      for (var qNum = 0; qNum < qtdQuantum; qNum++) { var qX = nave.x + (qNum - (qtdQuantum - 1) / 2) * 14; tiros.push({ x: qX, y: nave.y - 25, vx: (qNum - (qtdQuantum - 1) / 2) * 0.5, vy: -16, d: danoBase * 1.3, cor: '#ffee00', tipo: 'LASER' }); }
      if (nave.arma >= 2 && Math.floor(nave.t) % (Math.max(3, 10 - nave.arma)) === 0) {
        var qtdM = Math.min(4, Math.floor(nave.arma / 1.2));
        for (var m = 0; m < qtdM; m++) { var mX = nave.x + (m - (qtdM - 1) / 2) * 26; tiros.push({ x: mX, y: nave.y - 10, vx: (m - (qtdM - 1) / 2) * 2.5, vy: -12, d: danoBase * 1.8, cor: '#00ff88', tipo: 'MISSIL' }); }
      }
    }
    if (nave.drones > 0) { tiros.push({ x: nave.x - 30, y: nave.y - 10, vx: 0, vy: -15, d: danoBase * 0.5, cor: '#00ff88', tipo: 'LASER' }); tiros.push({ x: nave.x + 30, y: nave.y - 10, vx: 0, vy: -15, d: danoBase * 0.5, cor: '#00ff88', tipo: 'LASER' }); }
  }

  var isHardcore = (fase >= 15), isInferno = (fase >= 19);
  var freqMeteoro = isInferno ? 75 : (isHardcore ? 110 : 180);
  if (Math.floor(q) % freqMeteoro === 0 && Math.random() < (isHardcore ? 0.85 : 0.6)) {
    for (var mt = 0; mt < (isInferno ? 2 : 1); mt++) meteoros.push({ x: Math.random() * 600, y: -40 - (mt * 35), vx: (Math.random() - 0.5) * (isHardcore ? 3.5 : 2), vy: ((isHardcore ? 4.2 : 3) + Math.random() * 3.5) * multiplicadorTempo, r: 14 + Math.random() * 12, rot: Math.random() * Math.PI });
  }
  for (var i = meteoros.length - 1; i >= 0; i--) {
    var met = meteoros[i]; met.x += met.vx * multiplicadorTempo; met.y += met.vy * multiplicadorTempo; met.rot += 0.05;
    if (Math.hypot(met.x - nave.x, met.y - nave.y) < met.r + 14) { sofrerDano(isHardcore ? 30 : 25); meteoros.splice(i, 1); continue; }
    if (met.y > 790) meteoros.splice(i, 1);
  }

  var freqSpawn = isInferno ? (chefeOn ? 18 : 8) : (isHardcore ? (chefeOn || miniChefeOn ? 26 : 11) : (chefeOn || miniChefeOn ? 45 : Math.max(14, 38 - fase * 1.2)));
  if (Math.floor(q) % Math.max(4, Math.floor(freqSpawn)) === 0 && (!chefeOn || isHardcore)) {
    for (var s = 0; s < (isInferno ? 3 : (isHardcore ? 2 : 1)); s++) {
      var formaId = Math.floor(Math.random() * 5), coresMonstros = ['#ff0055', '#00f3ff', '#ffee00', '#00ff88', '#a855f7'];
      var corEscohida = coresMonstros[Math.floor(Math.random() * coresMonstros.length)];
      var tipoEsp = Math.random() < (isInferno ? 0.65 : (isHardcore ? 0.55 : 0.35)) ? (Math.random() < 0.5 ? 6 : 7) : 1;
      var hpInimigo = tipoEsp === 6 ? (isHardcore ? 28 + fase * 2 : 15) : (isHardcore ? (55 + fase * 10) : (25 + fase * 5));
      inimigos.push({ x: 40 + Math.random() * 520, y: -30 - (s * 28), vx: tipoEsp === 6 ? (Math.random() - 0.5) * (isHardcore ? 6.5 : 5) : (Math.random() - 0.5) * (2.2 + fase * 0.16), vy: (tipoEsp === 6 ? (5.2 + fase * 0.24) : (2.6 + fase * 0.11)) * multiplicadorTempo, hp: hpInimigo, maxHp: hpInimigo, r: 20 + Math.random() * 8, forma: tipoEsp === 6 ? 0 : formaId, cor: tipoEsp === 6 ? '#ff5500' : (tipoEsp === 7 ? '#a855f7' : corEscohida), especial: tipoEsp, t: 0, hitFlash: 0, rot: 0 });
    }
  }

  if (!chefeOn && !miniChefeOn && abates >= Math.floor(metaAbates / 2) && abates < metaAbates) invocarMiniChefe();

  for (var i = tiros.length - 1; i >= 0; i--) {
    var t = tiros[i];
    if (t.tipo === 'MISSIL') { var alvo = buscarAlvoMaisProximo(t.x, t.y); if (alvo) { var ang = Math.atan2(alvo.y - t.y, alvo.x - t.x); t.vx += Math.cos(ang) * 0.85; t.vy += Math.sin(ang) * 0.85; } }
    t.x += t.vx * multiplicadorTempo; t.y += t.vy * multiplicadorTempo;
    var projecilLimpo = false;
    for (var k = tChefe.length - 1; k >= 0; k--) { if (Math.hypot(tChefe[k].x - t.x, tChefe[k].y - t.y) < 18) { criarParticulas(tChefe[k].x, tChefe[k].y, '#00f3ff', 3, false); tChefe.splice(k, 1); projecilLimpo = true; break; } }
    if (projecilLimpo) { tiros.splice(i, 1); continue; }
    if (chefeOn && chefe && Math.hypot(chefe.x - t.x, chefe.y - t.y) < chefe.r + 14) { chefe.hp -= t.d; chefe.hitFlash = 3; tirosAcertados++; criarParticulas(t.x, t.y, t.cor, 3, false); if (Math.random() < 0.3) criarTextoDano(t.x, t.y, t.d, '#ffee00'); tiros.splice(i, 1); continue; }
    if (miniChefeOn && miniChefe && Math.hypot(miniChefe.x - t.x, miniChefe.y - t.y) < miniChefe.r + 14) { miniChefe.hp -= t.d; miniChefe.hitFlash = 3; tirosAcertados++; criarParticulas(t.x, t.y, t.cor, 3, false); if (Math.random() < 0.35) criarTextoDano(t.x, t.y, t.d, '#00f3ff'); tiros.splice(i, 1); continue; }
    var tiroRemovido = false;
    for (var j = inimigos.length - 1; j >= 0; j--) {
      var en = inimigos[j], raioHit = t.tipo === 'ONDA' ? en.r + 24 : en.r + 18;
      if (Math.hypot(en.x - t.x, en.y - t.y) < raioHit) { en.hp -= t.d; en.hitFlash = 3; tirosAcertados++; criarParticulas(t.x, t.y, t.cor, 3, false); if (Math.random() < 0.25) criarTextoDano(en.x, en.y, t.d, '#ffffff'); if (t.tipo !== 'ONDA') { tiros.splice(i, 1); tiroRemovido = true; } break; }
    }
    if (tiroRemovido) continue;
    if (t.y < -30 || t.x < -30 || t.x > 630) tiros.splice(i, 1);
  }

  if (miniChefeOn && miniChefe) {
    if (miniChefe.hitFlash > 0) miniChefe.hitFlash--;
    miniChefe.x += miniChefe.vx * multiplicadorTempo; if (miniChefe.y < miniChefe.alvoY) miniChefe.y += 2 * multiplicadorTempo;
    if (miniChefe.x < 70 || miniChefe.x > 530) miniChefe.vx *= -1;
    if (Math.floor(q) % (isHardcore ? 36 : 55) === 0) tChefe.push({ x: miniChefe.x, y: miniChefe.y + 20, vx: 0, vy: (isHardcore ? 6.0 : 5.2) * multiplicadorTempo, cor: miniChefe.corAura, dano: isHardcore ? 22 : 18 });
    if (miniChefe.hp <= 0) { criarParticulas(miniChefe.x, miniChefe.y, miniChefe.corAura, 25, true); som(120, 'sawtooth', 0.6, 0.18, 30); pontos += 1200; miniChefeOn = false; miniChefe = null; }
  }

  for (var i = inimigos.length - 1; i >= 0; i--) {
    var en = inimigos[i]; en.t += multiplicadorTempo; en.rot += 0.04 * multiplicadorTempo;
    if (en.hitFlash > 0) en.hitFlash--;
    if (en.especial === 7 && Math.floor(en.t) % (isInferno ? 36 : (isHardcore ? 46 : 65)) === 0) {
      var angIn = Math.atan2(nave.y - en.y, nave.x - en.x), velTiroIn = (isHardcore ? 6.0 : 4.8) * multiplicadorTempo;
      tChefe.push({ x: en.x, y: en.y + 10, vx: Math.cos(angIn) * velTiroIn, vy: Math.sin(angIn) * velTiroIn, cor: '#a855f7', dano: isHardcore ? 20 : 16 });
    }
    en.x += en.vx * multiplicadorTempo; en.y += en.vy * multiplicadorTempo;
    if (en.x < 25) { en.x = 25; en.vx = Math.abs(en.vx); }
    if (en.x > 575) { en.x = 575; en.vx = -Math.abs(en.vx); }
    if (en.hp <= 0) {
      desbloquearConquista('sangue'); pontos += (20 + fase * 4) * combo; totalAbatesPartida++;
      combo = Math.min(10, combo + 1); if (combo >= 10) desbloquearConquista('combo');
      comboT = 135; nave.ult = Math.min(100, nave.ult + 8); abates++;
      criarParticulas(en.x, en.y, en.cor, 10, true); som(180, 'sawtooth', 0.14, 0.06);
      if (Math.random() < 0.25) { var tiposItem = ['ARMA', 'ARMA', 'HP', 'ESCUDO', 'ULT', 'BOMBA']; itens.push({ x: en.x, y: en.y, vy: 2.6, tipo: tiposItem[Math.floor(Math.random() * tiposItem.length)] }); }
      inimigos.splice(i, 1); if (!chefeOn && abates >= metaAbates) invocarChefe(); continue;
    }
    if (Math.hypot(en.x - nave.x, en.y - nave.y) < en.r + 18) { sofrerDano(isHardcore ? 26 : 22); inimigos.splice(i, 1); continue; }
    if (en.y > 790) inimigos.splice(i, 1);
  }

  if (chefeOn && chefe) {
    if (chefe.hitFlash > 0) chefe.hitFlash--;
    chefe.hpVisual += (chefe.hp - chefe.hpVisual) * 0.12;
    if (chefe.y < chefe.alvoY) chefe.y += 2.2 * multiplicadorTempo;
    else { chefe.x += chefe.vx * multiplicadorTempo; if (chefe.x < 85 || chefe.x > 515) chefe.vx *= -1; }
    chefe.t += multiplicadorTempo;
    if (chefe.final && chefe.hp <= chefe.maxHp * 0.5 && chefe.faseChefe === 1) { chefe.faseChefe = 2; chefe.corAura = '#00ff88'; chefe.vx *= 1.4; tremor = 22; flashTela = 0.4; }

    // Ataques exclusivos dos Chefes Finais
    if (chefe.tipo === 'DEUS' && Math.floor(chefe.t) % 130 === 0) {
      raiosChefe.push({ x: nave.x, avisoT: 48, ativoT: 26 });
    }
    if (chefe.tipo === 'GRINCH' && Math.floor(chefe.t) % 110 === 0) {
      bombasChefe.push({ x: chefe.x, y: chefe.y + 30, vy: 3.4 * multiplicadorTempo, timer: 55 });
    }

    var freqAtaqueChefe = isInferno ? 14 : (isHardcore ? 38 : 90);
    if (Math.floor(chefe.t) % (freqAtaqueChefe + Math.floor(Math.random() * 20)) === 0) {
      if (isInferno || chefe.faseChefe === 2) {
        var qtd = chefe.faseChefe === 2 ? 12 : 8;
        for (var k = 0; k < qtd; k++) { var ang = (Math.PI / 2) + ((k - (qtd - 1) / 2) * 0.2); tChefe.push({ x: chefe.x, y: chefe.y + 42, vx: Math.cos(ang) * 6.2 * multiplicadorTempo, vy: Math.sin(ang) * 6.2 * multiplicadorTempo, cor: chefe.corPrim, dano: 25 }); }
      } else if (isHardcore) {
        for (var k = 0; k < 5; k++) { var angH = (Math.PI / 2) + ((k - 2) * 0.24); tChefe.push({ x: chefe.x, y: chefe.y + 36, vx: Math.cos(angH) * 5.0 * multiplicadorTempo, vy: Math.sin(angH) * 5.0 * multiplicadorTempo, cor: chefe.corAura, dano: 18 }); }
      } else {
        var angMirado = Math.atan2(nave.y - chefe.y, nave.x - chefe.x) + (Math.random() - 0.5) * 0.4;
        tChefe.push({ x: chefe.x, y: chefe.y + 26, vx: Math.cos(angMirado) * 3.8 * multiplicadorTempo, vy: Math.sin(angMirado) * 3.8 * multiplicadorTempo, cor: chefe.corAura, dano: 12 });
      }
      som(140, 'square', 0.12, 0.06);
    }
  }

  for (var i = raiosChefe.length - 1; i >= 0; i--) {
    var rc = raiosChefe[i];
    if (rc.avisoT > 0) rc.avisoT -= multiplicadorTempo;
    else {
      rc.ativoT -= multiplicadorTempo;
      if (Math.abs(nave.x - rc.x) < 28) sofrerDano(18);
      if (rc.ativoT <= 0) raiosChefe.splice(i, 1);
    }
  }
  for (var i = bombasChefe.length - 1; i >= 0; i--) {
    var bm = bombasChefe[i]; bm.y += bm.vy; bm.timer -= multiplicadorTempo;
    if (bm.timer <= 0) {
      criarParticulas(bm.x, bm.y, '#00ff44', 14, true);
      var dirs = [[0, -6], [0, 6], [-6, 0], [6, 0]];
      for (var d = 0; d < 4; d++) tChefe.push({ x: bm.x, y: bm.y, vx: dirs[d][0] * multiplicadorTempo, vy: dirs[d][1] * multiplicadorTempo, cor: '#00ff44', dano: 22 });
      bombasChefe.splice(i, 1);
    }
  }

  for (var i = tChefe.length - 1; i >= 0; i--) {
    var tc = tChefe[i]; tc.x += tc.vx * multiplicadorTempo; tc.y += tc.vy * multiplicadorTempo;
    if (Math.hypot(tc.x - nave.x, tc.y - nave.y) < 20) { sofrerDano(tc.dano || 15); tChefe.splice(i, 1); continue; }
    if (tc.y > 790 || tc.y < -30 || tc.x < -30 || tc.x > 630) tChefe.splice(i, 1);
  }
  for (var i = itens.length - 1; i >= 0; i--) {
    var it = itens[i]; it.y += it.vy * multiplicadorTempo;
    if (Math.hypot(it.x - nave.x, it.y - nave.y) < 28) {
      if (it.tipo === 'ARMA') { nave.arma = Math.min(6, nave.arma + 1); if (nave.arma >= 6) desbloquearConquista('arma'); }
      else if (it.tipo === 'HP') nave.hp = Math.min(nave.maxHp || 100, nave.hp + 35);
      else if (it.tipo === 'ESCUDO') nave.escudoT = 240;
      else if (it.tipo === 'ULT') nave.ult = 100;
      else if (it.tipo === 'BOMBA') { inimigos = []; tChefe = []; tremor = 25; flashTela = 0.8; criarParticulas(nave.x, nave.y, '#ffee00', 20, true); }
      som(520, 'sine', 0.2, 0.1, 880); itens.splice(i, 1); atualizarHUD(); continue;
    }
    if (it.y > 790) itens.splice(i, 1);
  }

  for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.x += p.vx; p.y += p.vy; p.vida--; if (p.vida <= 0) parts.splice(i, 1); }
  for (var i = ondas.length - 1; i >= 0; i--) { var od = ondas[i]; od.r += 4.2; od.alpha -= 0.045; if (od.alpha <= 0 || od.r >= od.maxR) ondas.splice(i, 1); }
  for (var i = textosDano.length - 1; i >= 0; i--) { var td = textosDano[i]; td.y -= 1.2; td.vida--; if (td.vida <= 0) textosDano.splice(i, 1); }

  if (chefeOn && chefe && chefe.hp <= 0) {
    desbloquearConquista('chefe'); if (fase >= 19) desbloquearConquista('inferno');
    criarParticulas(chefe.x, chefe.y, chefe.corAura, 35, true); som(70, 'sawtooth', 0.9, 0.2, 20);
    pontos += 4000 * fase; chefeOn = false; chefe = null; raiosChefe = []; bombasChefe = [];
    if (modoInfinito) encerrarPartida('SETOR INFINITO ' + fase + ' CONCLUÍDO!', 'Prepare-se para a próxima onda suprema!', 'PROX');
    else if (fase === 20) encerrarPartida('FASE SECRETA 21 DESBLOQUEADA!', 'Derrote o Deus do Natal Cibernético!', 'PROX');
    else if (fase === 21) encerrarPartida('BATALHA FINAL LIBERADA!', 'Enfrente o Grinch Cibernético no Setor 22!', 'PROX');
    else if (fase >= 22) { desbloquearConquista('lenda'); try { localStorage.setItem('wm_endless', '1'); } catch (e) {} encerrarPartida('VITÓRIA SUPREMA!', 'Você destruiu o Grinch e liberou o Modo Infinito!', 'REINICIAR'); }
    else encerrarPartida('SETOR CONCLUÍDO!', 'Chefão derrotado com sucesso.', 'PROX');
  }
  atualizarHUD();
}

function desenharInimigoForma(en) {
  ctx.save(); ctx.rotate(en.rot || 0);
  ctx.fillStyle = en.hitFlash > 0 ? '#ffffff' : en.cor;
  ctx.beginPath();
  if (en.especial === 6) { ctx.moveTo(0, en.r * 1.4); ctx.lineTo(-en.r * 0.85, -en.r); ctx.lineTo(en.r * 0.85, -en.r); }
  else if (en.forma === 0) { ctx.moveTo(0, en.r * 1.1); ctx.lineTo(-en.r * 0.9, -en.r * 0.8); ctx.lineTo(en.r * 0.9, -en.r * 0.8); }
  else if (en.forma === 1) { for (var h = 0; h < 6; h++) { var ang = (Math.PI / 3) * h; if (h === 0) ctx.moveTo(Math.cos(ang) * en.r, Math.sin(ang) * en.r); else ctx.lineTo(Math.cos(ang) * en.r, Math.sin(ang) * en.r); } }
  else if (en.forma === 2) { ctx.moveTo(0, en.r * 1.2); ctx.lineTo(-en.r, 0); ctx.lineTo(0, -en.r * 1.2); ctx.lineTo(en.r, 0); }
  else if (en.forma === 3) { ctx.fillRect(-en.r * 0.8, -en.r * 0.8, en.r * 1.6, en.r * 1.6); }
  else { ctx.arc(0, 0, en.r, 0, Math.PI * 2); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.beginPath(); ctx.arc(0, 0, en.r * 0.34, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
  if (fase >= 15 && en.hp < en.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(-16, -en.r - 9, 32, 4);
    ctx.fillStyle = en.cor; ctx.fillRect(-16, -en.r - 9, 32 * Math.max(0, en.hp / en.maxHp), 4);
  }
}

function desenharChefeEspecial(obj) {
  var x = obj.x, y = obj.y, r = obj.r, corAura = obj.corAura, corPrim = obj.corPrim, hit = obj.hitFlash > 0;
  ctx.save(); ctx.translate(x, y);
  ctx.save(); ctx.rotate(q * 0.03); ctx.strokeStyle = corPrim; ctx.lineWidth = 3; ctx.setLineDash([12, 8]);
  ctx.beginPath(); ctx.arc(0, 5, r * 1.3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  if (obj.tipo === 'DEUS') {
    ctx.fillStyle = hit ? '#ffffff' : 'rgba(255, 215, 0, 0.35)';
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(-r * 2.1, -r * 0.7); ctx.lineTo(-r * 1.6, r * 0.6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(r * 2.1, -r * 0.7); ctx.lineTo(r * 1.6, r * 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = hit ? '#ffffff' : '#fef08a'; ctx.beginPath(); ctx.arc(0, 5, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(0, 5, r * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.5); ctx.lineTo(-r * 0.4, -r * 1.2); ctx.lineTo(0, -r * 0.8); ctx.lineTo(r * 0.4, -r * 1.2); ctx.lineTo(r * 0.6, -r * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#00f3ff'; ctx.fillRect(-r * 0.35, -4, r * 0.25, 10); ctx.fillRect(r * 0.1, -4, r * 0.25, 10);
  } else if (obj.tipo === 'GRINCH') {
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-r * 0.9, 10); ctx.lineTo(-r * 1.5, -18); ctx.lineTo(-r * 1.2, -36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.9, 10); ctx.lineTo(r * 1.5, -18); ctx.lineTo(r * 1.2, -36); ctx.stroke();
    ctx.fillStyle = hit ? '#ffffff' : '#16a34a'; ctx.beginPath(); ctx.arc(0, 5, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#052e16'; ctx.fillRect(-r * 0.55, -12, r * 1.1, r * 0.32);
    ctx.fillStyle = '#ff0033';
    ctx.beginPath(); ctx.moveTo(-r * 0.42, -8); ctx.lineTo(-r * 0.08, -2); ctx.lineTo(-r * 0.42, 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r * 0.42, -8); ctx.lineTo(r * 0.08, -2); ctx.lineTo(r * 0.42, 4); ctx.fill();
    ctx.strokeStyle = '#ffee00'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, 14, r * 0.45, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  } else {
    ctx.fillStyle = hit ? '#ffffff' : '#f8fafc'; ctx.beginPath(); ctx.arc(0, 5, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hit ? '#ffcccc' : '#ffffff'; ctx.beginPath(); ctx.arc(0, 10, r * 0.78, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hit ? '#ffffff' : '#ffcca8'; ctx.beginPath(); ctx.arc(0, 2, r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#03050c'; ctx.fillRect(-r * 0.4, -3, r * 0.8, r * 0.32);
    ctx.fillStyle = corAura; ctx.fillRect(-r * 0.32, -1, r * 0.25, r * 0.16); ctx.fillRect(r * 0.07, -1, r * 0.25, r * 0.16);
    ctx.fillStyle = '#ff0033'; ctx.beginPath(); ctx.moveTo(-r * 0.75, -5); ctx.lineTo(r * 0.75, -5); ctx.lineTo(r * 0.2, -r * 0.95); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.95, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-r * 0.8, -10, r * 1.6, r * 0.22);
  }
  ctx.strokeStyle = corPrim; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 5, r * 1.12, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function desenharJogo() {
  ctx.save();
  if (tremor > 0) ctx.translate((Math.random() - 0.5) * tremor, (Math.random() - 0.5) * tremor);
  ctx.fillStyle = obterGradFundo(); ctx.fillRect(0, 0, 600, 760);

  for (var i = 0; i < planetas.length; i++) {
    var pl = planetas[i]; pl.y += pl.vy; if (pl.y - pl.r > 800) { pl.y = -80; pl.x = 60 + Math.random() * 480; }
    ctx.fillStyle = pl.cor; ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.r, 0, Math.PI * 2); ctx.fill();
    if (pl.anel) { ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(pl.x, pl.y, pl.r * 1.7, pl.r * 0.42, -0.35, 0, Math.PI * 2); ctx.stroke(); }
  }
  for (var i = 0; i < estrelas.length; i++) {
    var st = estrelas[i]; st.y += bulletTimeAtivo ? st.v * 0.4 : st.v;
    if (st.y > 760) { st.y = 0; st.x = Math.random() * 600; }
    ctx.fillStyle = st.cor;
    if (bulletTimeAtivo) ctx.fillRect(st.x, st.y, 1.5, st.v * 5); else ctx.fillRect(st.x, st.y, st.r * 1.5, st.r * 1.5);
  }
  ctx.fillStyle = fase >= 22 ? 'rgba(0,255,136,0.35)' : (fase >= 19 ? 'rgba(255,85,0,0.35)' : 'rgba(255,255,255,0.3)');
  for (var i = 0; i < clima.length; i++) { var cl = clima[i]; cl.x += cl.vx; cl.y += cl.vy; if (cl.y > 760) { cl.y = -5; cl.x = Math.random() * 600; } ctx.fillRect(cl.x, cl.y, cl.r, cl.r); }

  for (var i = 0; i < raiosChefe.length; i++) {
    var rc = raiosChefe[i];
    if (rc.avisoT > 0) { ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(rc.x, 0); ctx.lineTo(rc.x, 760); ctx.stroke(); ctx.setLineDash([]); }
    else { ctx.fillStyle = 'rgba(255, 238, 0, 0.85)'; ctx.fillRect(rc.x - 16, 0, 32, 760); ctx.fillStyle = '#ffffff'; ctx.fillRect(rc.x - 6, 0, 12, 760); }
  }
  for (var i = 0; i < bombasChefe.length; i++) {
    var bm = bombasChefe[i]; ctx.fillStyle = '#00ff44'; ctx.beginPath(); ctx.arc(bm.x, bm.y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff0033'; ctx.lineWidth = 2.5; ctx.stroke();
  }

  for (var i = 0; i < meteoros.length; i++) {
    var met = meteoros[i]; ctx.save(); ctx.translate(met.x, met.y); ctx.rotate(met.rot || 0);
    ctx.fillStyle = '#c2410c'; ctx.beginPath(); ctx.arc(0, 0, met.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7c2d12'; ctx.beginPath(); ctx.arc(-met.r * 0.3, -met.r * 0.2, met.r * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (var i = 0; i < tiros.length; i++) {
    var tr = tiros[i]; ctx.fillStyle = tr.cor;
    if (tr.tipo === 'ONDA') { ctx.beginPath(); ctx.arc(tr.x, tr.y, 12, Math.PI, 0); ctx.lineWidth = 4; ctx.strokeStyle = tr.cor; ctx.stroke(); }
    else if (tr.tipo === 'PLASMA') { ctx.beginPath(); ctx.arc(tr.x, tr.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(tr.x, tr.y, 3, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillRect(tr.x - 3.5, tr.y - 16, 7, 28); ctx.fillStyle = '#ffffff'; ctx.fillRect(tr.x - 1.5, tr.y - 12, 3, 20); }
  }
  for (var i = 0; i < tChefe.length; i++) {
    var tc = tChefe[i]; ctx.fillStyle = tc.cor || '#ff0055'; ctx.beginPath(); ctx.arc(tc.x, tc.y, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(tc.x, tc.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  for (var i = 0; i < inimigos.length; i++) { var en = inimigos[i]; ctx.save(); ctx.translate(en.x, en.y); desenharInimigoForma(en); ctx.restore(); }
  if (miniChefeOn && miniChefe) desenharChefeEspecial(miniChefe);
  if (chefeOn && chefe) {
    desenharChefeEspecial(chefe);
    ctx.fillStyle = 'rgba(6, 9, 20, 0.95)'; ctx.fillRect(110, 60, 380, 18);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'; ctx.fillRect(112, 62, 376 * Math.max(0, chefe.hpVisual / chefe.maxHp), 14);
    ctx.fillStyle = chefe.corAura; ctx.fillRect(112, 62, 376 * Math.max(0, chefe.hp / chefe.maxHp), 14);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText(chefe.nome + ' [CHEFÃO]', 300, 73);
  }

  for (var i = 0; i < itens.length; i++) {
    var it = itens[i]; ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(it.x, it.y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#000'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText(it.tipo, it.x, it.y + 3.5);
  }

  if (nave.laserT > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var gradLaser = ctx.createLinearGradient(nave.x - 45, 0, nave.x + 45, 0);
    gradLaser.addColorStop(0, 'rgba(255, 0, 85, 0)'); gradLaser.addColorStop(0.3, 'rgba(255, 0, 85, 0.9)');
    gradLaser.addColorStop(0.5, 'rgba(255, 255, 255, 1)'); gradLaser.addColorStop(0.7, 'rgba(0, 243, 255, 0.9)');
    gradLaser.addColorStop(1, 'rgba(0, 243, 255, 0)');
    ctx.fillStyle = gradLaser; ctx.fillRect(nave.x - 45, 0, 90, nave.y); ctx.restore();
  }

  if (!isMobile) {
    for (var rn = 0; rn < nave.rastro.length; rn++) {
      var pos = nave.rastro[rn]; ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(pos.tilt);
      ctx.globalAlpha = (rn / nave.rastro.length) * 0.2; desenharModeloNave(ctx, tipoNaveSelecionada, corCustomizadaNave, 1, false); ctx.restore();
    }
  }
  ctx.save(); ctx.translate(nave.x, nave.y); ctx.rotate(nave.tilt);
  if (nave.dashT > 0) ctx.globalAlpha = 0.6;
  desenharModeloNave(ctx, tipoNaveSelecionada, corCustomizadaNave, 1, true);
  if (nave.escudoT > 0) { ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();

  if (nave.drones > 0) {
    var anguloDrone = q * 0.08; ctx.fillStyle = '#00ff88';
    ctx.beginPath(); ctx.arc(nave.x + Math.cos(anguloDrone) * 45, nave.y + Math.sin(anguloDrone) * 20, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(nave.x + Math.cos(anguloDrone + Math.PI) * 45, nave.y + Math.sin(anguloDrone + Math.PI) * 20, 6, 0, Math.PI * 2); ctx.fill();
  }

  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (var i = 0; i < ondas.length; i++) { var od = ondas[i]; ctx.strokeStyle = od.cor; ctx.globalAlpha = Math.max(0, od.alpha); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(od.x, od.y, od.r, 0, Math.PI * 2); ctx.stroke(); }
  for (var i = 0; i < parts.length; i++) { var p = parts[i]; ctx.fillStyle = p.cor; ctx.globalAlpha = Math.max(0, p.vida / p.maxVida); ctx.fillRect(p.x, p.y, p.r * 1.6, p.r * 1.6); }
  ctx.restore();

  ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
  for (var i = 0; i < textosDano.length; i++) { var td = textosDano[i]; ctx.globalAlpha = Math.max(0, td.vida / td.maxVida); ctx.fillStyle = td.cor; ctx.fillText(td.txt, td.x, td.y); }
  ctx.globalAlpha = 1;

  if (bulletTimeAtivo) { ctx.fillStyle = 'rgba(0, 243, 255, 0.12)'; ctx.fillRect(0, 0, 600, 760); }
  if (nave.hp > 0 && nave.hp < (nave.maxHp || 100) * 0.3) { ctx.strokeStyle = 'rgba(255, 0, 50, ' + (0.35 + Math.sin(q * 0.2) * 0.25) + ')'; ctx.lineWidth = 14; ctx.strokeRect(0, 0, 600, 760); }
  if (alertaChefeT > 0) {
    var blink = Math.floor(alertaChefeT / 8) % 2 === 0;
    ctx.fillStyle = blink ? 'rgba(255, 0, 55, 0.85)' : 'rgba(120, 0, 30, 0.75)'; ctx.fillRect(0, 310, 600, 74);
    ctx.fillStyle = '#ffee00'; ctx.fillRect(0, 310, 600, 5); ctx.fillRect(0, 379, 600, 5);
    ctx.fillStyle = '#ffffff'; ctx.font = '900 22px Arial'; ctx.textAlign = 'center'; ctx.fillText('⚠ WARNING // CHEFÃO DETECTADO ⚠', 300, 344);
    ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#ffee00'; ctx.fillText(nomeAlertaChefe, 300, 367);
  }
  if (raioFlash > 0) { ctx.fillStyle = 'rgba(200, 230, 255, ' + raioFlash + ')'; ctx.fillRect(0, 0, 600, 760); }
  if (flashTela > 0) { ctx.fillStyle = 'rgba(255, 255, 255, ' + flashTela + ')'; ctx.fillRect(0, 0, 600, 760); }
  ctx.restore();
}

function loop(tempoAtual) {
  requestAnimationFrame(loop);
  if (!ultimoTempo) ultimoTempo = tempoAtual;
  var delta = tempoAtual - ultimoTempo;
  if (delta >= intervaloFps) { ultimoTempo = tempoAtual - (delta % intervaloFps); atualizarJogo(); desenharJogo(); }
}

window.addEventListener('keydown', function(e) {
  teclas[e.code] = true;
  if (e.code === 'Space') ativarSuperLaser();
  if (e.code === 'KeyE') ativarDash();
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') bulletTimeAtivo = true;
  if (e.code === 'KeyP' || e.code === 'Escape') alternarPausa();
});
window.addEventListener('keyup', function(e) {
  teclas[e.code] = false;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') bulletTimeAtivo = false;
});

function moverPonteiro(clientX, clientY) { var rect = c.getBoundingClientRect(); alvoX = (clientX - rect.left) * (600 / rect.width); alvoY = (clientY - rect.top) * (760 / rect.height) - 35; }
c.addEventListener('mousemove', function(e) { if (estado === 'JOGANDO') moverPonteiro(e.clientX, e.clientY); });
c.addEventListener('touchstart', function(e) { tocando = true; var t = e.touches.item(0); if (t) moverPonteiro(t.clientX, t.clientY); }, { passive: true });
c.addEventListener('touchmove', function(e) { if (tocando) { var t = e.touches.item(0); if (t) moverPonteiro(t.clientX, t.clientY); } }, { passive: true });
c.addEventListener('touchend', function() { tocando = false; });

function encerrarPartida(titulo, desc, acaoModo) {
  estado = 'MODAL'; modo = acaoModo;
  document.getElementById('m-tit').textContent = titulo; document.getElementById('m-desc').textContent = desc;
  var precisao = tirosDisparados > 0 ? Math.min(100, Math.round((tirosAcertados / tirosDisparados) * 100)) : 100;
  document.getElementById('stat-abates').textContent = totalAbatesPartida;
  document.getElementById('stat-precisao').textContent = precisao + '%';
  document.getElementById('stat-pts').textContent = pontos;
  document.getElementById('shop-container').style.display = (acaoModo === 'PROX') ? 'block' : 'none';
  try { document.getElementById('nome-modal').value = localStorage.getItem('wm_n') || ''; } catch (e) {}
  document.getElementById('btn-ok').textContent = (acaoModo === 'PROX') ? 'PRÓXIMO SETOR' : 'JOGAR NOVAMENTE';
  if (acaoModo === 'PROX' && !modoInfinito && fase + 1 > maxFaseSalva) { maxFaseSalva = Math.min(22, fase + 1); try { localStorage.setItem('wm_maxf', maxFaseSalva); localStorage.setItem('wm_chk', maxFaseSalva); } catch (e) {} }
  salvarRanking('nome-modal'); document.getElementById('modal').classList.remove('hidden');
}

window.rankingGlobal = [];
window.desenharRankingNaTela = function(lista) {
  var html = lista.length === 0 ? '<div class="rk-row"><span>Nenhum recorde ainda.</span></div>' : '';
  for (var idx = 0; idx < lista.length; idx++) {
    var item = lista[idx], medalhas = ['🥇', '🥈', '🥉', '🎖️', '🎖️'], icone = medalhas[idx] || '#' + (idx + 1);
    var naveIc = item.nave || '🚀';
    html += '<div class="rk-row"><span>' + icone + ' ' + naveIc + ' ' + item.nome + ' (S' + (item.fase || 1) + ')</span><span style="color:#00f3ff;">' + (item.pts || 0) + ' pts</span></div>';
  }
  document.getElementById('rank-inicio').innerHTML = html; document.getElementById('rank-modal').innerHTML = html;
};

function atualizarSeletorFases() {
  var sel = document.getElementById('select-fase'); if (!sel) return;
  sel.innerHTML = '';
  var limite = Math.min(22, Math.max(1, maxFaseSalva));
  for (var f = 1; f <= limite; f++) { var opt = document.createElement('option'); opt.value = f; opt.textContent = 'Setor ' + f; if (f === limite) opt.selected = true; sel.appendChild(opt); }
  var endlessLiberado = false; try { endlessLiberado = localStorage.getItem('wm_endless') === '1' || maxFaseSalva >= 22; } catch (e) {}
  var btnEnd = document.getElementById('btn-endless'); if (btnEnd) btnEnd.classList.toggle('hidden', !endlessLiberado);
}

function atualizarListasRanking() {
  try {
    document.getElementById('nome-inicio').value = localStorage.getItem('wm_n') || '';
    maxFaseSalva = parseInt(localStorage.getItem('wm_maxf') || '1', 10);
    atualizarSeletorFases();
    var localRank = JSON.parse(localStorage.getItem('wm_local_rank') || '[]');
    if (localRank.length > 0) { window.rankingGlobal = localRank; window.desenharRankingNaTela(localRank); }
    renderizarConquistas();
  } catch (e) {}
}

function salvarRanking(nomeInputId) {
  try {
    var el = document.getElementById(nomeInputId), n = (el && el.value.trim()) ? el.value.trim() : (localStorage.getItem('wm_n') || 'Piloto');
    var icNave = (PERFIS_NAVE[tipoNaveSelecionada] || PERFIS_NAVE[1]).icone;
    localStorage.setItem('wm_n', n);
    if (!modoInfinito && fase > maxFaseSalva) { maxFaseSalva = Math.min(22, fase); localStorage.setItem('wm_maxf', maxFaseSalva); }
    var localRank = JSON.parse(localStorage.getItem('wm_local_rank') || '[]');
    var existente = localRank.find(function(p) { return p.nome.toLowerCase() === n.toLowerCase(); });
    if (existente) { if (pontos > existente.pts) { existente.pts = pontos; existente.fase = fase; existente.nave = icNave; } }
    else { localRank.push({ nome: n, pts: pontos, fase: fase, nave: icNave }); }
    localRank.sort(function(a, b) { return b.pts - a.pts; }); localRank = localRank.slice(0, 5);
    localStorage.setItem('wm_local_rank', JSON.stringify(localRank));
    window.rankingGlobal = localRank; window.desenharRankingNaTela(localRank);
    if (pontos > 0 && typeof window.enviarPontuacaoFirebase === 'function') window.enviarPontuacaoFirebase(n, fase, pontos, icNave);
    atualizarListasRanking();
  } catch (e) {}
}

document.getElementById('btn-pause').onclick = alternarPausa;
document.getElementById('btn-resume').onclick = alternarPausa;
document.getElementById('btn-restart-f1').onclick = reiniciarParaFase1;
document.getElementById('btn-restart-f1-modal').onclick = reiniciarParaFase1;
document.getElementById('btn-pause-menu').onclick = function() { document.getElementById('pause-screen').classList.add('hidden'); document.getElementById('start-screen').classList.remove('hidden'); estado = 'INICIO'; };
document.getElementById('btn-som').onclick = function() { mudo = !mudo; this.textContent = mudo ? 'MUDO' : 'SOM'; };
document.getElementById('btn-crt').onclick = function() { document.getElementById('crt-overlay').classList.toggle('on'); };
document.getElementById('btn-ult').onclick = ativarSuperLaser;
document.getElementById('btn-dash').onclick = ativarDash;
var btnBtMob = document.getElementById('btn-bt-mob');
btnBtMob.onmousedown = btnBtMob.ontouchstart = function() { bulletTimeAtivo = true; };
btnBtMob.onmouseup = btnBtMob.onmouseleave = btnBtMob.ontouchend = function() { bulletTimeAtivo = false; };

document.getElementById('cor-nave').oninput = function() { corCustomizadaNave = this.value; try { localStorage.setItem('wm_cor', corCustomizadaNave); } catch (e) {} renderizarPreviasNaves(); };
try { var corSalva = localStorage.getItem('wm_cor'); if (corSalva) { corCustomizadaNave = corSalva; document.getElementById('cor-nave').value = corSalva; } } catch (e) {}

document.getElementById('btn-play').onclick = function() {
  modoInfinito = false; try { localStorage.setItem('wm_n', document.getElementById('nome-inicio').value.trim() || 'Piloto'); } catch (e) {}
  resetarEstadoPartida(); document.getElementById('start-screen').classList.add('hidden');
  iniciarFase(parseInt(document.getElementById('select-fase').value || '1', 10)); estado = 'JOGANDO';
};
document.getElementById('btn-endless').onclick = function() {
  modoInfinito = true; try { localStorage.setItem('wm_n', document.getElementById('nome-inicio').value.trim() || 'Piloto'); } catch (e) {}
  resetarEstadoPartida(); document.getElementById('start-screen').classList.add('hidden');
  iniciarFase(23); estado = 'JOGANDO';
};
document.getElementById('btn-ok').onclick = function() {
  salvarRanking('nome-modal'); document.getElementById('modal').classList.add('hidden');
  if (modo === 'PROX') { nave.hp = Math.min(nave.maxHp || 100, nave.hp + 25); iniciarFase(fase + 1); }
  else { modoInfinito = false; resetarEstadoPartida(); iniciarFase(1); }
  estado = 'JOGANDO';
};
document.getElementById('btn-menu').onclick = function() { salvarRanking('nome-modal'); document.getElementById('modal').classList.add('hidden'); document.getElementById('start-screen').classList.remove('hidden'); estado = 'INICIO'; };

atualizarListasRanking();
renderizarPreviasNaves();
atualizarBarrasNave();
requestAnimationFrame(loop);
