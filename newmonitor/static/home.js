document.addEventListener("DOMContentLoaded", () => {
    iniciarSistema();
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

                const abertos = lista.filter(t => t.aberto);

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


            // 👉 novos cards, adicionar aqui:
            // atualizarCardCriticos(lista);
            // atualizarCardHelix(lista);
        }


        /* =========================
        CARD: NÃO TRATADOS
        ========================= */
        function atualizarCardNaoTratados(lista) {

            const agora = new Date();
            let total = 0;

            lista.forEach(t => {

                const ultima = getUltimaAtualizacao(t);

                if (!(ultima instanceof Date) || isNaN(ultima)) return;

                const diff = (agora - ultima) / 3600000;

                if (diff >= 1.5) {
                    total++;
                }
            });

            const el = document.getElementById("card_nao_tratados");

            if (!el) return;

            el.textContent = total;

            const card = el.parentElement;

            // reset visual
            card.style.border = "";
            card.style.backgroundColor = "";
            
            // status visual
            if (total >= 5) {
                card.style.border = "2px solid #dc3545"; // vermelho
            } else if (total > 0) {
                card.style.border = "2px solid #ffc107"; // amarelo
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

            const filtrados = lista.filter(t => t.outage !== null && t.outage !== "");

            const ids = new Set(filtrados.map(t => t.id_ticket));

            const total = ids.size;

            const el = document.getElementById("card_com_impacto");

            if (!el) return;

            el.textContent = total;
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