let dadosGlobal = [];

// ============================
// ✅ PARSE DATA BR
// ============================
function parseBR(data) {
    if (!data) return null;

    const [d, h] = data.split(" ");
    const [dia, mes, ano] = d.split("/");

    return new Date(`${ano}-${mes}-${dia}T${h || "00:00"}`);
}

// ============================
// ✅ BUSCAR RELATÓRIO
// ============================
async function buscarRelatorio() {

    const dIni =
        document.getElementById(
            "f_data_inicio"
        ).value;

    const dFim =
        document.getElementById(
            "f_data_fim"
        ).value;

    const cidade =
        document.getElementById(
            "f_cidade"
        ).value;

    const servico =
        document.getElementById(
            "f_servico"
        ).value;

    const evento =
        document.getElementById(
            "f_evento"
        ).value;

    const responsavel =
        document.getElementById(
            "f_responsavel"
        ).value;

    if (!dIni || !dFim) {

        alert(
            "❌ Informe Data Início e Fim"
        );

        return;
    }

    const params =
        new URLSearchParams();

    params.append(
        "data_inicio",
        dIni
    );

    params.append(
        "data_fim",
        dFim
    );

    if (cidade)
        params.append(
            "cidade",
            cidade
        );

    if (servico)
        params.append(
            "servico",
            servico
        );

    if (evento)
        params.append(
            "evento",
            evento
        );

    if (responsavel)
        params.append(
            "responsavel",
            responsavel
        );

    const resp =
        await fetch(
            `/api/relatorio?${params}`
        );

    dadosGlobal =
        await resp.json();

    renderRelatorio();
}
// ============================
// ✅ RENDER RELATÓRIO
// ============================

function renderRelatorio() {

    const tbody =
        document.getElementById(
            "resultado_relatorio"
        );

    tbody.innerHTML = "";

    if (
        !dadosGlobal ||
        dadosGlobal.length === 0
    ) {

        tbody.innerHTML =
            `<tr>
                <td colspan="18">
                    Nenhum resultado
                </td>
            </tr>`;

        return;
    }

    dadosGlobal.forEach(t => {

        const tr =
            document.createElement("tr");

        tr.innerHTML = `
            <td>
                /ticket/${t.id_ticket}
                    ${t.id_ticket}
                </a>
            </td>

            <td>${t.cidade || ""}</td>

            <td>${t.data_inicio || ""}</td>

            <td>${t.data_fim || ""}</td>

            <td>${t.interrupcao || ""}</td>

            <td>${t.evento || "SEM EVENTO"}</td>

            <td>${t.impacto ?? ""}</td>

            <td>${t.servico || ""}</td>

            <td>${t.responsabilidade || ""}</td>

            <td>${t.sintoma || ""}</td>

            <td>${t.natureza || ""}</td>

            <td>${t.parte || ""}</td>

            <td>${t.causa || ""}</td>

            <td>${t.solucao || ""}</td>

            <td>${t.outage || ""}</td>

            <td>${t.causa_raiz || ""}</td>

            <td>${Number(t.isolamento_olt_cmts || 0) === 1 ? "SIM" : "NÃO"}</td>

        `;

        tbody.appendChild(tr);

    });

}

// ============================
// ✅ CSV
// ============================
function exportarCSV() {

    if (!dadosGlobal.length) {
        alert("❌ Sem dados");
        return;
    }

    let csv = [];

    csv.push([
        "Ticket","Cidade","Início","Fim","Interrupção (min)","Evento","Impacto (%)",
        "Serviço","Responsável","Sintoma","Nat. manut.","Parte rede",
        "Causa","Solução","Num. do Outage", "Causa raiz", "Isolamento OLT/CMTS"

    ].join(";"));

    dadosGlobal.forEach(t => {

        csv.push([
            t.id_ticket,
            t.cidade || "0",
            t.data_inicio || "0",
            t.data_fim || "0",
            t.interrupcao || "0",
            t.evento || "0",
            t.impacto || "0",
            t.servico || "0",
            t.responsabilidade || "0",
            t.sintoma || "0",
            t.natureza || "0",
            t.parte || "0",
            t.causa || "0",
            t.solucao || "0",
            t.outage || "0",
            t.causa_raiz || "0",
            Number(t.isolamento_olt_cmts || "0") === 1 ? "SIM" : "NÃO"
        ].join(";"));

    });

    const blob = new Blob(["\uFEFF" + csv.join("\n")], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${new Date().toISOString().slice(0,10)}.csv`;

    link.click();
}

// ============================
// ✅ XLSX
// ============================
function exportarXLSX() {

    if (!dadosGlobal.length) {
        alert("❌ Sem dados");
        return;
    }

    const dados = dadosGlobal.map(t => ({
        Ticket: t.id_ticket,
        Cidade: t.cidade || "0",
        Inicio: t.data_inicio || "0",
        Fim: t.data_fim || "0",
        Interrupcao: t.interrupcao || "0",
        Evento: t.evento || "0",
        Impacto: t.impacto || "0",
        Servico: t.servico || "0",
        Responsavel: t.responsabilidade || "0",
        Sintoma: t.sintoma || "0",
        Natureza: t.natureza || "0",
        ParteRede: t.parte || "0",
        Causa: t.causa || "0",
        Solucao: t.solucao || "0",
        Outage: t.outage || "0",
        Causa_Raiz: t.causa_raiz || "0",
        Isolamento_OLT_CMTS: Number(t.isolamento_olt_cmts || "0") === 1 ? "SIM" : "NÃO"
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");

    XLSX.writeFile(
        wb,
        `relatorio_${new Date().toISOString().slice(0,10)}.xlsx`
    );
}

// ============================
// ✅ POPULAR FILTROS
// ============================
function preencherSelect(id, lista) {

    const select = document.getElementById(id);
    if (!select) return;

    const valores = [...new Set(
        lista
            .filter(v => v && v !== "")
            .map(v => String(v).trim())
    )].sort();

    select.innerHTML = `<option value="">Todos</option>`;

    valores.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
    });
}

function carregarFiltros() {

    fetch("/api/filtros_relatorio")
        .then(r => r.json())
        .then(lista => {

            preencherSelect("f_cidade", lista.map(t => t.cidade));
            preencherSelect("f_servico", lista.map(t => t.servico));
            preencherSelect("f_evento", lista.map(t => t.evento || "SEM EVENTO"));
            preencherSelect("f_responsavel", lista.map(t => t.responsabilidade || "N/A"));

        })
        .catch(e => {
            console.error("Erro ao carregar filtros:", e);
        });
}

document.addEventListener("DOMContentLoaded", carregarFiltros);