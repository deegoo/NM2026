let listaTickets = [];
let indexAtual = null;
let dadosOriginais = [];
let filtrosAtivos = {};

let ordemAtual = {};
let dadosAgrupados = [];


/* =========================
   CARREGAR TICKETS
========================= */
function carregarTickets() {

    fetch("/listar")
    .then(r => r.json())
    .then(lista => {


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
                    sintoma: t.sintoma,
                    evento: t.evento,
                    categoria: t.categoria,
                    ofensor: t.ofensor,
                    chamado_operadora: t.chamado_operadora,
                    usuario: t.usuario,
                    aberto: t.aberto
                };
            }

            agrupados[t.id_ticket].cidades.add(t.cidade);
            agrupados[t.id_ticket].servicos.add(t.servico);

        });

        dadosAgrupados = Object.values(agrupados);

        renderTabela(dadosAgrupados);

    });
}

/* =========================
   ABRIR MODAL
========================= */
function abrirFechamento(index) {

    indexAtual = index;

    document.getElementById("modal_fechamento").style.display = "block";
}


/* =========================
   FECHAR MODAL
========================= */
function fecharModal() {
    document.getElementById("modal_fechamento").style.display = "none";
}


/* =========================
   CONFIRMAR FECHAMENTO
========================= */
document.getElementById("btn_confirmar").addEventListener("click", () => {

    const dados = {
        index: indexAtual,
        data_final: document.getElementById("data_final").value,
        causa: document.getElementById("causa").value,
        solucao: document.getElementById("solucao").value
    };

    fetch("/fechar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
    })
    .then(() => {
        alert("✅ Ticket fechado");
        fecharModal();
        carregarTickets();
    });
});

/*================
    histórico
================


document.getElementById("form_comentario").addEventListener("submit", function(e) {
    e.preventDefault();

    const formData = new FormData();

    formData.append("comentario", document.getElementById("comentario").value);

    const arquivo = document.getElementById("imagem").files[0];
    if (arquivo) {
        formData.append("imagem", arquivo);
    }

    fetch(window.location.pathname.replace("/ticket/", "/comentar/"), {
        method: "POST",
        body: formData
    })
    .then(() => {
        alert("✅ Comentário adicionado");
        location.reload();
    });
});*/

/* =========================
   FILTRO POR COLUNA
========================= */
function filtrarColuna(campo) {

    // alterna filtro (liga/desliga)
    if (filtrosAtivos[campo]) {
        delete filtrosAtivos[campo];
    } else {

        const valores = [...new Set(dadosOriginais.map(t => {
            if (campo === "aberto") {
                return t.aberto ? "ABERTO" : "FECHADO";
            }
            return t[campo];
        }))];

        const valor = prompt(`Filtrar por ${campo}:\n\n${valores.join("\n")}`);

        if (!valor) return;

        filtrosAtivos[campo] = valor;
    }

    aplicarFiltros();
}

function aplicarFiltros() {

    let resultado = dadosAgrupados;

    Object.keys(filtrosAtivos).forEach(campo => {

        resultado = resultado.filter(t => {

            let valorCampo = t[campo];

            // ✅ tratamento para cidade e serviço
            if (valorCampo instanceof Set) {
                valorCampo = [...valorCampo].join(", ");
            }

            valorCampo = String(valorCampo).toLowerCase();

            return valorCampo.includes(filtrosAtivos[campo].toLowerCase());

        });

    });

    renderTabela(resultado);
}

function renderTabela(lista) {

    const tabela = document.getElementById("tabela_tickets");
    tabela.innerHTML = "";

    lista.forEach(t => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>
                <a href="/ticket/${t.id_ticket}" target="_blank">
                    ${t.id_ticket}
                </a>
            </td>
            <td>${[...t.cidades].join(", ")}</td>
            <td>${[...t.servicos].join(", ")}</td>
            <td>${t.sintoma}</td>
            <td>${t.evento}</td>
            <td>${t.categoria}</td>
            <td>${t.ofensor}</td>
            <td>${t.chamado_operadora || "-"}</td>
            <td>${t.usuario}</td>
        `;

        tabela.appendChild(tr);
    });
}

function ordenarPor(campo) {

    ordemAtual[campo] = !ordemAtual[campo];
    const crescente = ordemAtual[campo];

    const listaOrdenada = [...dadosAgrupados].sort((a, b) => {

        let valA = a[campo];
        let valB = b[campo];

        // ✅ trata Set (cidade/serviço)
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