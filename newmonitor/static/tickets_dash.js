let listaTickets = [];
let indexAtual = null;
let dadosAgrupados = [];

/* =========================
   CARREGAR TICKETS
========================= */
function carregarTickets() {
    
    fetch("/listar")
        .then(r => r.json())
        .then(lista => {
            console.log("📦 lista recebida:", lista)


        const tabela = document.getElementById("tabela_tickets");
        tabela.innerHTML = "";

        const agrupados = {};

        lista.forEach(t => {

            if (!t.aberto) return;

            if (!agrupados[t.id_ticket]) {
                agrupados[t.id_ticket] = {
                    id_ticket: t.id_ticket,
                    cidades: new Set(),
                    servicos: new Set(),
                    evento: t.evento,
                    categoria: t.categoria,
                    ofensor: t.ofensor,
                    chamado_operadora: t.chamado_operadora,
                    outage: t.outage,
                    usuario: t.usuario,
                    data_inicio: t.data_inicio,
                    logs: t.logs || []
                };
            }

            agrupados[t.id_ticket].cidades.add(t.cidade);
            agrupados[t.id_ticket].servicos.add(t.servico);
        });

        dadosAgrupados = Object.values(agrupados);


        dadosAgrupados.sort((a, b) => {
            const aUlt = getUltimaAtualizacao(a);
            const bUlt = getUltimaAtualizacao(b);
            return bUlt - aUlt; // mais novo primeiro
        });

        renderTabela(dadosAgrupados);
    });
}


/* =========================
   FORMATAR DATA
========================= */
function parseBR(data) {

    if (!data) return null;

    if (data instanceof Date) return data;

    if (typeof data !== "string") return null;

    data = data.replace(",", "");

    const [d, h] = data.split(" ");
    const [dia, mes, ano] = d.split("/").map(Number);

    const [hora, min] = (h || "00:00").split(":").map(Number);

    return new Date(ano, mes - 1, dia, hora || 0, min || 0);
}

function formatarData(dataStr) {
    if (!dataStr) return "-";

    let d = dataStr;

    if (!(d instanceof Date)) {
        d = parseBR(d);
    }

    if (!d || isNaN(d)) return "-";

    return d.toLocaleString("pt-BR");
}


/* =========================
   CALCULAR ÚLTIMA ATUALIZAÇÃO
========================= */
function getUltimaAtualizacao(t) {

    if (t.logs && t.logs.length > 0) {
        const ultimoLog = t.logs[t.logs.length - 1];

        if (ultimoLog.data instanceof Date) {
            return ultimoLog.data;
        }

        return parseBR(ultimoLog.data);
    }

    return parseBR(t.data_inicio);
}


/* =========================
   DEFINIR COR SLA
========================= */
function aplicarCor(tr, abertura, ultimaAtualizacao, evento) {

    const agora = new Date();

    if (!(ultimaAtualizacao instanceof Date) || isNaN(ultimaAtualizacao)) {
        tr.style.backgroundColor = "#fff";
        return;
    }

    const diffAtualizacao = (agora - ultimaAtualizacao) / (1000 * 60 * 60);

    console.log({
        ticket: tr.innerText,
        ultimaAtualizacao,
        diffAtualizacao
    });

    const ev = (evento || "").toUpperCase();

    // =============================
    // 🔹 REGRA ESPECIAL AVALIAÇÃO
    // =============================
    if (ev.includes("AVALIAÇÃO")) {

        if (diffAtualizacao >= 24) {
            tr.style.backgroundColor = "#ffbfc4"; // vermelho
            return;
        }

        if (diffAtualizacao >= 12) {
            tr.style.backgroundColor = "#ffde72"; // amarelo
            return;
        }
    }

    // =========================
    // 🔹 REGRA PADRÃO
    // =========================

    if (diffAtualizacao >= 3) {
        tr.style.backgroundColor = "#ffbdbd"; // vermelho
    }
    else if (diffAtualizacao >= 1.5) {
        tr.style.backgroundColor = "#fdffbd"; // amarelo
    }
    else {
        tr.style.backgroundColor = "#fff"; // branco
    }
}



/* =========================
   RENDER TABELA
========================= */
function renderTabela(lista) {

    const tabela = document.getElementById("tabela_tickets");
    tabela.innerHTML = "";

    if (!lista.length) return;

    lista.forEach(t => {

        const tr = document.createElement("tr");

        const abertura = new Date(t.data_inicio);
        const ultimaAtualizacao = getUltimaAtualizacao(t);
    
        t.ultima_atualizacao = ultimaAtualizacao;

        tr.setAttribute("data-abertura", t.data_inicio);
        tr.setAttribute("data-ultima", ultimaAtualizacao.toISOString());

        tr.style.backgroundColor = "";

        aplicarCor(tr, abertura, ultimaAtualizacao, t.evento);

        tr.innerHTML = `
            <td>
                <a href="/ticket/${t.id_ticket}" target="_self">
                    ${t.id_ticket}
                </a>
            </td>
            <td>${[...t.cidades].join(", ")}</td>
            <td>${[...t.servicos].join(", ")}</td>
            <td>${t.evento}</td>
            <td>${t.categoria}</td>
            <td>${t.ofensor}</td>
            <td>${formatarData(t.data_inicio)}</td>
            <td>${formatarData(ultimaAtualizacao)}</td>
            <td>${t.chamado_operadora || "-"}</td>
            <td>${t.outage ?? "-"}</td>
            <td>${t.usuario}</td>
        `;

        tabela.appendChild(tr);
    });
}


/* =========================
   ORDENAR
========================= */
let ordemAtual = {};

function ordenarPor(campo) {

    ordemAtual[campo] = !ordemAtual[campo];
    const crescente = ordemAtual[campo];

    const listaOrdenada = [...dadosAgrupados].sort((a, b) => {

        let valA = a[campo];
        let valB = b[campo];

        if (valA instanceof Set) valA = [...valA].join(",");
        if (valB instanceof Set) valB = [...valB].join(",");

        valA = valA || "";
        valB = valB || "";

        if (valA < valB) return crescente ? -1 : 1;
        if (valA > valB) return crescente ? 1 : -1;

        return 0;
    });

    renderTabela(listaOrdenada);
}

/* =========================
   INICIALIZA
========================= */

carregarTickets();

setInterval(() => {
    carregarTickets();
}, 60000);
