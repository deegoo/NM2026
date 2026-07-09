let silenciado = false;

document.addEventListener("DOMContentLoaded", () => {
    iniciarSistema();
    iniciarStream()
    setInterval(atualizarTudo, 120000);
});

    /* =========================
    LOAD DASHBOARD
    ========================= */
    async function carregarDashboard() {

        const resp =
            await fetch("/api/dashboard");

        const dados =
            await resp.json();

        document.getElementById(
            "card_abertos"
        ).textContent =
            dados.abertos;

        document.getElementById(
            "card_com_impacto"
        ).textContent =
            dados.com_impacto;

        // =========================
        // NÃO TRATADOS
        // =========================

        const elNaoTratados =
            document.getElementById(
                "card_nao_tratados"
            );

        if (elNaoTratados) {

            elNaoTratados.textContent =
                dados.nao_tratados;

            const card =
                elNaoTratados.parentElement;

            card.style.border =
                "1px solid #ccc";

            card.classList.remove(
                "piscar"
            );

            if (
                (dados.nao_tratados_vermelho || 0) > 0
            ) {

                card.style.border =
                    "5px solid #dc3545";

            }
            else if (
                (dados.nao_tratados_amarelo || 0) > 0
            ) {

                card.style.border =
                    "5px solid #ffc107";
            }
        }

    // =========================
    // MEG
    // =========================

    const elMeg =
        document.getElementById(
            "card_meg"
        );

    if (elMeg) {

        elMeg.textContent =
            dados.meg;

        const cardMeg =
            document.getElementById(
                "card_meg_box"
            );

        if (cardMeg) {

            cardMeg.style.border =
                "1px solid #ccc";

            cardMeg.classList.remove(
                "piscar"
            );

            if (dados.meg_vermelho) {

                cardMeg.style.border =
                    "5px solid #dc3545";

                cardMeg.classList.add(
                    "piscar"
                );
            }
            else if (
                dados.meg_amarelo
            ) {

                cardMeg.style.border =
                    "5px solid #ffc107";
                }
        }
    }

    // =========================
    // SIT
    // =========================

    const elSit =
        document.getElementById(
            "card_sit"
        );

    if (elSit) {

        elSit.textContent =
            dados.sit;

        const cardSit =
            document.getElementById(
                "card_sit_box"
            );

        if (cardSit) {

            cardSit.style.border =
                "1px solid #ccc";

            cardSit.classList.remove(
                "piscar"
            );

            if (dados.sit > 0) {

                cardSit.style.border =
                    "5px solid #dc3545";

                cardSit.classList.add(
                    "piscar"
                );
            }
        }
    }
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

    console.log(
        "🔄 atualizando dashboard"
    );

    carregarDashboard();
}

function iniciarStream() {

    const source = new EventSource("/stream");

    source.onmessage = function () {

        carregarDashboard();

        console.log("📡 atualização em tempo real");
    };

    source.onerror = function () {
        console.log("⚠️ stream caiu, usando fallback");
        source.close();
    };
}

document.addEventListener("DOMContentLoaded", () => {


});


