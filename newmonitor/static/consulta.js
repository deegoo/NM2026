let listaGlobal = [];
let paginaAtual = 1;
const itensPorPagina = 10;
let carregando = false;

// ============================
// ✅ PARSE DATA BR
// ============================
function parseBR(dataBR) {
    if (!dataBR) return null;

    const [data, hora] = dataBR.split(" ");
    const [dia, mes, ano] = data.split("/");

    return new Date(`${ano}-${mes}-${dia}T${hora || "00:00"}`);
}

// ============================
// ✅ LOADING
// ============================
function showLoading(show) {
    const el = document.getElementById("loading");
    if (!el) return;
    el.style.display = show ? "block" : "none";
}

// ============================
// ✅ BUSCAR
// ============================
async function buscar() {

    const ticket =
        document.getElementById(
            "filtro_ticket"
        ).value.trim();

    const dataInicio =
        document.getElementById(
            "filtro_data_inicio"
        ).value;

    const dataFim =
        document.getElementById(
            "filtro_data_fim"
        ).value;

    const cidade =
        document.getElementById(
            "filtro_cidade"
        ).value;

    showLoading(true);

    const params =
        new URLSearchParams();

    if (ticket)
        params.append(
            "ticket",
            ticket
        );

    if (cidade)
        params.append(
            "cidade",
            cidade
        );

    if (dataInicio)
        params.append(
            "data_inicio",
            dataInicio
        );

    if (dataFim)
        params.append(
            "data_fim",
            dataFim
        );

    const resp =
        await fetch(
            `/api/consulta?${params}`
        );

    listaGlobal =
        await resp.json();

    paginaAtual = 1;

    renderTabela();
    renderPaginacao();

    showLoading(false);
}

// ============================
// ✅ TABELA COM PAGINAÇÃO
// ============================
function renderTabela() {

    const tbody = document.getElementById("resultado");
    tbody.innerHTML = "";

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;

    const pagina = listaGlobal.slice(inicio, fim);

    if (pagina.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">Nenhum resultado</td></tr>`;
        return;
    }

    pagina.forEach(t => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>
                <a href="/ticket/${t.id_ticket}" target="_self">
                    ${t.id_ticket}
                </a>
            </td>
            <td>${t.cidade}</td>
            <td>${t.servico}</td>
            <td>${t.sintoma}</td>
            <td>${t.data_inicio}</td>
            <td style="color:${
                (t.status || "").toUpperCase() === "ABERTO"
                    ? "red"
                    : "green"
            }">
                ${t.status || ""}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ============================
// ✅ PAGINAÇÃO
// ============================
function renderPaginacao() {

    const div = document.getElementById("paginacao");
    if (!div) return;

    const totalPaginas = Math.ceil(listaGlobal.length / itensPorPagina);

    div.innerHTML = "";

    for (let i = 1; i <= totalPaginas; i++) {

        const btn = document.createElement("button");
        btn.textContent = i;

        if (i === paginaAtual) {
            btn.style.fontWeight = "bold";
        }

        btn.onclick = () => {
            paginaAtual = i;
            renderTabela();
        };

        div.appendChild(btn);
    }
}

// ============================
// ✅ LIMPAR
// ============================
function limpar() {

    document.getElementById("filtro_ticket").value = "";
    document.getElementById("filtro_data_inicio").value = "";
    document.getElementById("filtro_data_fim").value = "";
    document.getElementById("filtro_cidade").value = "";

    document.getElementById("resultado").innerHTML = "";
    document.getElementById("paginacao").innerHTML = "";
}

// ============================
// ✅ CARREGAR CIDADES
// ============================
function carregarCidades() {

    fetch("/api/cidades")
        .then(r => r.json())
        .then(cidades => {

            const select =
                document.getElementById(
                    "filtro_cidade"
                );

            select.innerHTML =
                '<option value="">Selecione</option>';

            cidades.forEach(c => {

                const opt =
                    document.createElement(
                        "option"
                    );

                opt.value = c;
                opt.textContent = c;

                select.appendChild(opt);
            });

        });
}

// ============================
// ✅ ENTER PARA BUSCAR
// ============================
document.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        buscar();
    }
});

// ============================
// ✅ INIT
// ============================
document.addEventListener("DOMContentLoaded", () => {
    carregarCidades();
});
