let listaTickets = [];
let indexAtual = null;

/* =========================
   CARREGAR TICKETS
========================= */
function carregarTickets() {

    fetch("/listar")
    .then(r => r.json())
    .then(lista => {

        listaTickets = lista;

        const tabela = document.getElementById("tabela_tickets");
        tabela.innerHTML = "";

        lista.forEach((t, index) => {

            if (!t.aberto) return;

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>
                    <a href="/ticket/${t.id_ticket}" target="_blank">
                    ${t.id_ticket}
                    </a>
                </td>
                <td>${t.cidade}</td>
                <td>${t.servico}</td>
                <td>${t.sintoma}</td>
                <td>${t.evento}</td>
                <td>${t.categoria}</td>
                <td>${t.ofensor}</td>
                <td>${t.chamado_operadora || "-"}</td>
                <td>${t.usuario}</td>
            `;

            tabela.appendChild(tr);
});

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
   INICIALIZA
========================= */
carregarTickets();