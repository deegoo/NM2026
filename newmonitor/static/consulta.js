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
function buscar() {

    const ticket = document.getElementById("filtro_ticket").value.trim();
    const dataInicio = document.getElementById("filtro_data_inicio").value;
    const dataFim = document.getElementById("filtro_data_fim").value;
    const cidade = document.getElementById("filtro_cidade").value.toLowerCase();

    showLoading(true);

    fetch("/listar")
        .then(r => r.json())
        .then(lista => {

            let filtrados = [];

            // ✅ 1 — TICKET
            if (ticket) {
                filtrados = lista.filter(t =>
                    String(t.id_ticket) === ticket
                );
            }

            // ✅ 2 — PERÍODO + CIDADE
            else if (dataInicio && dataFim && cidade) {

                filtrados = lista.filter(t => {

                    const d = parseBR(t.data_inicio);
                    if (!d) return false;

                    const iso = d.toISOString().slice(0, 10);

                    return (
                        iso >= dataInicio &&
                        iso <= dataFim &&
                        t.cidade.toLowerCase().includes(cidade)
                    );
                });
            }

            else if (dataInicio || dataFim || cidade) {
                alert("❌ Informe Cidade + Data início + Data fim");
                showLoading(false);
                return;
            }

            // ✅ ORDENA (MAIS RECENTE → ANTIGO)
            filtrados.sort((a, b) => {
                return parseBR(b.data_inicio) - parseBR(a.data_inicio);
            });

            listaGlobal = filtrados;
            paginaAtual = 1;

            document.getElementById("resultado").innerHTML = "";
            paginaAtual = 1;
            carregarMais();
            renderPaginacao();

            showLoading(false);
        });
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
            <td style="color: ${t.aberto ? 'red' : 'green'}">
                ${t.aberto ? 'ABERTO' : 'FECHADO'}
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

    fetch("/listar")
        .then(r => r.json())
        .then(lista => {

            const select = document.getElementById("filtro_cidade");

            const cidades = [...new Set(lista.map(t => t.cidade))].sort();

            select.innerHTML = `<option value="">Selecione</option>`;

            cidades.forEach(c => {
                const opt = document.createElement("option");
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


// ============================
// ✅ CARREGAR MAIS TICKETS
// ============================
function carregarMais() {

    if (carregando) return;

    carregando = true;

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;

    const novos = listaGlobal.slice(inicio, fim);

    if (novos.length === 0) return;

    const tbody = document.getElementById("resultado");

    novos.forEach(t => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><a href="/ticket/${t.id_ticket}" target="_self">${t.id_ticket}</a></td>
            <td>${t.cidade}</td>
            <td>${t.servico}</td>
            <td>${t.sintoma}</td>
            <td>${t.data_inicio}</td>
            <td style="color:${t.aberto ? 'red' : 'green'}">
                ${t.aberto ? 'ABERTO' : 'FECHADO'}
            </td>
        `;

        tbody.appendChild(tr);
    });

    paginaAtual++;
    carregando = false;
}