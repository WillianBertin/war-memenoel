try {
  const base = "https://www.gstatic.com/firebasejs/10.8.0/";
  const { initializeApp } = await import(base + "firebase-app.js");
  const { getDatabase, ref, get, set, query, orderByChild, limitToLast, onValue } = await import(base + "firebase-database.js");

  const firebaseConfig = {
    apiKey: "AIzaSyDO2OsIRMpnTF__MHT022S2QT4bI5YTn1U",
    authDomain: "war-memenoel.firebaseapp.com",
    databaseURL: "https://war-memenoel-default-rtdb.firebaseio.com",
    projectId: "war-memenoel",
    storageBucket: "war-memenoel.firebasestorage.app",
    messagingSenderId: "225210728615",
    appId: "1:225210728615:web:bfe42ca37d738d4eed5b82",
    measurementId: "G-RX38KL6JNQ"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const rankingRef = ref(db, 'ranking_unico');

  window.enviarPontuacaoFirebase = async function(nome, faseAtual, pts, iconeNave) {
    const chavePiloto = nome.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!chavePiloto) return;
    const pilotoRef = ref(db, 'ranking_unico/' + chavePiloto);
    const snapshot = await get(pilotoRef);
    const ptsNovos = Number(pts);
    if (!snapshot.exists() || ptsNovos > (snapshot.val().pts || 0)) {
      await set(pilotoRef, { nome: nome.trim(), fase: Number(faseAtual), pts: ptsNovos, nave: iconeNave || '🚀', data: Date.now() });
    }
  };

  const top5Query = query(rankingRef, orderByChild('pts'), limitToLast(5));
  onValue(top5Query, (snapshot) => {
    const lista = [];
    snapshot.forEach((child) => { lista.push(child.val()); });
    lista.sort((a, b) => b.pts - a.pts);
    if (lista.length > 0) {
      window.rankingGlobal = lista;
      if (typeof window.desenharRankingNaTela === 'function') window.desenharRankingNaTela(lista);
    }
  });
} catch (err) {
  console.warn("Modo offline / Firebase indisponível:", err);
}
