
let cacheMEG = {
    valor: 0,
    time: 0
};

let cacheSIT = {
    valor: 0,
    time: 0
};

document.addEventListener("DOMContentLoaded", () => {
    iniciarSistema();
    atualizarTudo();
    setInterval(atualizarTudo, 120000);
});

        /* =========================
        LOAD DASHBOARD
        ========================= */
        function carregarDashboard() {

        fetch("/listar")
            .then(r => {
                if (!r.ok) throw new Error("Erro ao listar");
                return r.json();
            })
            .then(lista => {

                const abertos = lista.filter(t =>
                    (t.status || "").toUpperCase() === "ABERTO"
                );

                atualizarCards(abertos);
            })
            .catch(err => {
                console.error("❌ erro ao carregar dashboard:", err);
            });
        }


        /* =========================
        ATUALIZAR TODOS OS CARDS
        ========================= */
        function atualizarCards(lista) {

            atualizarCardNaoTratados(lista);
            atualizarCardAbertos(lista);
            atualizarCardComImpacto(lista);
            atualizarCardMEG();
            atualizarCardSIT();
            // 👉 novos cards, adicionar aqui:
            // atualizarCardCriticos(lista);
            // atualizarCardHelix(lista);
        }


        /* =========================
        CARD: NÃO TRATADOS
        ========================= */
function atualizarCardNaoTratados(lista) {

    const agora = new Date();

    let temAmarelo = false;
    let temVermelho = false;
    let total = 0;

    lista.forEach(t => {

        const ultima = getUltimaAtualizacao(t);

        if (!(ultima instanceof Date) || isNaN(ultima)) return;

        const diffMin = Math.floor((agora - ultima) / 60000);

        const ev = (t.evento || "").toUpperCase();

        // 🔹 REGRA ESPECIAL AVALIAÇÃO
        if (ev.includes("AVALIAÇÃO")) {

            if (diffMin >= 1440) {      // 24h
                temVermelho = true;
                total++;
                return;
            }

            if (diffMin >= 720) {       // 12h
                temAmarelo = true;
                total++;
                return;
            }
        }

        // 🔹 REGRA PADRÃO
        if (diffMin >= 180) {       
            temVermelho = true;
            total++;
        } else if (diffMin >= 90) { 
            temAmarelo = true;
            total++;
        }
    });

    const el = document.getElementById("card_nao_tratados");

    if (!el) return;

    el.textContent = total;

    const card = el.parentElement;

    // reset
    card.style.border = "";
    card.classList.remove("piscar");

    // 🔥 PRIORIDADE VISUAL
    if (temVermelho) {
        card.style.border = "5px solid #dc3545"; // 🔴 vermelho
    } else if (temAmarelo) {
        card.style.border = "5px solid #ffc107"; // 🟡 amarelo
    }
}

        /* =========================
        CARD: ABERTOS
        ========================= */
        function atualizarCardAbertos(lista) {

            const total = lista.length;

            const el = document.getElementById("card_abertos");

            if (!el) return;

            el.textContent = total;
        }
        /* =========================
        CARD: COM IMPACTO
        ========================= */

        function atualizarCardComImpacto(lista) {

            const filtrados = lista.filter(t =>
                (t.status || "").toUpperCase() === "ABERTO" &&
                t.outage !== null &&
                t.outage !== ""
            );

            const ids = new Set(filtrados.map(t => t.id_ticket));

            const total = ids.size;

            const el = document.getElementById("card_com_impacto");

            if (!el) return;

            el.textContent = total;
            
            const card = el.parentElement;

            aplicarBordaCardElemento(card, total)

        }

        /* =========================
        UTIL: ÚLTIMA ATUALIZAÇÃO
        ========================= */
        function getUltimaAtualizacao(t) {

            if (t.logs && t.logs.length > 0) {
                const ultimo = t.logs[t.logs.length - 1];
                return parseBR(ultimo.data);
            }

            return parseBR(t.data_inicio);
        }

        /* =========================
        UTIL: PARSE DATA BR
        ========================= */
        function parseBR(data) {

            if (!data) return null;

            if (data instanceof Date) return data;

            if (typeof data !== "string") return null;

            if (!data.includes("/")) return null;

            data = data.replace(",", "");

            const partes = data.split(" ");
            const d = partes[0];
            const h = partes[1] || "00:00";

            const [dia, mes, ano] = d.split("/").map(Number);
            const [hora, min] = h.split(":").map(Number);

            return new Date(ano, mes - 1, dia, hora || 0, min || 0);
        }
/* =========================
TELA INTERNA MEG
========================= */

function abrirTelaMEG() {
    window.open("/meg_detalhe", "_self");
}
// ================= SISTEMA PRINCIPAL =================
let sistemaIniciado = false;
function iniciarSistema() {

    if (sistemaIniciado) return;
    sistemaIniciado = true;

    console.log("🚀 iniciarSistema rodou");

    try {

        if (typeof carregarDashboard === "function") {
            console.log("✅ vai chamar carregarDashboard");
            carregarDashboard();
        } else {
            console.log("❌ carregarDashboard NÃO existe");
        }

        if (typeof carregarCards === "function") {
            carregarCards();
        }

        if (typeof carregarTickets === "function") {
            carregarTickets();
        }

        if (typeof inicializarEventos === "function") {
            inicializarEventos();
        }

    } catch (err) {
        console.error("Erro ao iniciar sistema:", err);
    }
}

function atualizarTudo() {

    console.log("🔄 atualizando dashboard");

    fetch("/listar")
        .then(r => r.json())
        .then(lista => {

            const abertos = lista.filter(t =>
                (t.status || "").toUpperCase() === "ABERTO"
            );

            atualizarCards(abertos);
        })
        .catch(err => console.error("erro listar:", err));

    atualizarCardMEG();
    atualizarCardSIT();
}

/* =========================
CARD: MEG
========================= */
function atualizarCardMEG() {

    const agora = Date.now();

    const card = document.getElementById("card_meg_box");

    if (agora - cacheMEG.time < 120000) {

        const total = cacheMEG.valor;

        document.getElementById("card_meg").textContent = total;

        aplicarBordaCardElemento(card, total); 

        return;
    }

        fetch("/api/meg_detalhe")
            .then(r => r.json())
            .then(lista => {

                const total = lista.length;

                cacheMEG.valor = total;
                cacheMEG.time = agora;

                document.getElementById("card_meg").textContent = total;

                aplicarSLA_MEG(card, lista);
            })
            .catch(err => console.error("erro MEG:", err));
}
/* =========================
CARD: SIT
========================= */
function atualizarCardSIT() {

    const agora = Date.now();

    if (agora - cacheSIT.time < 120000) {

        const total = cacheSIT.valor;

        document.getElementById("card_sit").textContent = total;

        aplicarBorda("card_sit_box", total);

        return;
    }

    fetch("/api/sit")
        .then(r => r.json())
        .then(d => {

            const total = d.total || 0;

            cacheSIT.valor = total;
            cacheSIT.time = agora;

            document.getElementById("card_sit").textContent = total;

            aplicarBorda("card_sit_box", total);

        })
        .catch(err => console.error("erro SIT:", err));
}

function aplicarBorda(cardId, total) {

    const card = document.getElementById(cardId);

    if (!card) return;

    if (total > 0) {
        card.style.border = "5px solid #dc3545";
        card.classList.add("piscar");  
    } else {
        card.style.border = "1px solid #ccc";
        card.classList.remove("piscar"); 
    }
}

function aplicarBordaCardElemento(card, total) {

    if (!card) return;

    card.style.border = total > 0
        ? "5px solid #dc3545"  // 🔴 vermelho
        : "1px solid #ccc";
}

function extrairDataPrevisao(texto) {

    if (!texto) return null;

    const regex = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/;

    const match = texto.match(regex);

    if (!match) return null;

    const [_, data, hora] = match;

    return parseBR(`${data} ${hora}`);
}            
function aplicarSLA_MEG(card, listaMeg) {

    if (!card) return;

    if (!listaMeg || listaMeg.length === 0) {
        card.style.border = "1px solid #ccc";
        card.classList.remove("piscar");
        return;
    }

    const agora = new Date();

    let menorTempo = Infinity;


    listaMeg.forEach(m => {

    const previsao = extrairDataPrevisao(m.previsao);

    if (!previsao) return;

    let diffMin = Math.floor((previsao - agora) / 60000);

    // 🔥 se já passou do SLA, vira 0 (crítico imediato)
    if (diffMin < 0) {
        diffMin = 0;
    }

    if (diffMin < menorTempo) {
        menorTempo = diffMin;

        }
    });

    card.classList.remove("piscar");

    if (menorTempo <= 15) {
        card.style.border = "5px solid #dc3545";
        card.classList.add("piscar");
    } else if (menorTempo <= 30) {
        card.style.border = "5px solid #dc3545";
    } else {
        card.style.border = "5px solid #ffc107";
    }
}