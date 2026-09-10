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
                <td colspan="30">
                    Nenhum resultado
                </td>
            </tr>`;

        return;
    }

    dadosGlobal.forEach(t => {

        const tr =
            document.createElement("tr");

        tr.innerHTML = `
            <td>${t.semana_evento || ""}</td>

            <td>
                <a href="/ticket/${t.id_ticket}" target="_self">
                    ${t.id_ticket}
                </a>
            </td>

            <td>${t.nm_regional_cmv_bi || ""}</td>

            <td>${t.cidade || ""}</td>

            <td>${t.servico || ""}</td>

            <td>${t.categoria || ""}</td>

            <td>${t.ofensor || ""}</td>

            <td>${t.sintoma || ""}</td>

            <td>${t.evento || ""}</td>

            <td>${t.descricao || ""}</td>

            <td>${t.data_inicio || ""}</td>

            <td>${t.chamado_operadora || ""}</td>

            <td>${t.outage || ""}</td>

            <td>${t.status || ""}</td>

            <td>${t.data_fim || ""}</td>

            <td>${t.interrupcao || ""}</td>

            <td>${Number(t.impacto ?? 0)}</td>

            <td>${Number(t.vc_evento || 0).toFixed(4)}</td>

            <td>${Number(t.minutos_ponderados || 0).toFixed(4)}</td>

            <td>${t.base_cidade || ""}</td>

            <td>${t.assinantes_impactados || ""}</td>

            <td>${t.responsabilidade || ""}</td>

            <td>${t.natureza || ""}</td>

            <td>${t.parte || ""}</td>

            <td>${t.causa || ""}</td>

            <td>${t.solucao || ""}</td>

            <td>${t.sumario || ""}</td>

            <td>${t.causa_raiz || ""}</td>

            <td>${
                Number(t.isolamento_olt_cmts || 0) === 1
                    ? "SIM"
                    : "NÃO"
            }</td>

            <td>${t.tecnologia_acesso || ""}</td>
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
        "Semana",
        "Ticket",
        "Regional",
        "Cidade",
        "Serviço",
        "Categoria",
        "Ofensor",
        "Sintoma",
        "Evento",
        "Descrição",
        "Data Início",
        "Chamado Operadora",
        "Outage",
        "Status",
        "Fim Evento",
        "Interrupção (min)",
        "Impacto (%)",
        "VC",
        "Minutos Ponderados",
        "Base Cidade",
        "Assinantes Impactados",
        "Responsável",
        "Natureza",
        "Parte Rede",
        "Causa",
        "Solução",
        "Sumário",
        "Causa Raiz",
        "Isolamento OLT/CMTS",
        "Tecnologia Acesso"
    ].join(";"));

    dadosGlobal.forEach(t => {

        csv.push([
            t.semana_evento || "",
            t.id_ticket || "",
            t.nm_regional_cmv_bi || "",
            t.cidade || "",
            t.servico || "",
            t.categoria || "",
            t.ofensor || "",
            t.sintoma || "",
            t.evento || "",
            t.descricao || "",
            t.data_inicio || "",
            t.chamado_operadora || "",
            t.outage || "",
            t.status || "",
            t.data_fim || "",
            t.interrupcao || "",
            t.impacto ?? 0,
            Number(t.vc_evento || 0).toFixed(2),
            Number(t.minutos_ponderados || 0).toFixed(2),
            t.base_cidade || "",
            t.assinantes_impactados || "",
            t.responsabilidade || "",
            t.natureza || "",
            t.parte || "",
            t.causa || "",
            t.solucao || "",
            t.sumario || "",
            t.causa_raiz || "",
            Number(t.isolamento_olt_cmts || 0) === 1 ? "SIM" : "NÃO",
            t.tecnologia_acesso || ""
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
        Semana: t.semana_evento || "",
        Ticket: t.id_ticket || "",
        Regional: t.nm_regional_cmv_bi || "",
        Cidade: t.cidade || "",
        Servico: t.servico || "",
        Categoria: t.categoria || "",
        Ofensor: t.ofensor || "",
        Sintoma: t.sintoma || "",
        Evento: t.evento || "",
        Descricao: t.descricao || "",
        Data_Inicio: t.data_inicio || "",
        Chamado_Operadora: t.chamado_operadora || "",
        Outage: t.outage || "",
        Status: t.status || "",
        Fim_Evento: t.data_fim || "",
        Interrupcao_Min: t.interrupcao || "",
        Impacto: t.impacto ?? 0,
        VC: Number(t.vc_evento || 0).toFixed(2),
        Minutos_Ponderados: Number(t.minutos_ponderados || 0).toFixed(2),
        Base_Cidade: t.base_cidade || "",
        Assinantes_Impactados: t.assinantes_impactados || "",
        Responsavel: t.responsabilidade || "",
        Natureza: t.natureza || "",
        Parte_Rede: t.parte || "",
        Causa: t.causa || "",
        Solucao: t.solucao || "",
        Sumario: t.sumario || "",
        Causa_Raiz: t.causa_raiz || "",
        Isolamento_OLT_CMTS:
            Number(t.isolamento_olt_cmts || 0) === 1
                ? "SIM"
                : "NÃO",
        Tecnologia_Acesso: t.tecnologia_acesso || ""
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