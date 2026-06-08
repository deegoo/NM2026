console.log("🚀 ticket.js carregado");

// ============================
// ✅ VARIÁVEIS GLOBAIS
// ============================

let regras = [];
let tickets = window.TICKETS || [];
let baseClientes = {};

// ============================
// ✅ Normaliza os serviços
// ============================

function normalizarServico(servico) {

    const mapa = {
        "PAY TV DIGITAL": "PAY TV",
        "PAY TV HD": "PAY TV",
        "PAYTV": "PAY TV",
        "NET TV": "PAY TV"
    };

    return mapa[servico] || servico;
}
// ============================
// ✅ abrir telas do ticket
// ============================


function abrirTela(nome) {

    document.querySelectorAll('.tela').forEach(t => {
        t.style.display = "none";
    });

    const el = document.getElementById("tela_" + nome);

    if (el) el.style.display = "block";
}


// ============================
// ✅ CALCULAR DURAÇÃO
// ============================

function parseBR(data) {
    if (!data) return null;

    // "03/06/2026 19:43" → "2026-06-03T19:43"
    const [d, h] = data.split(" ");
    const [dia, mes, ano] = d.split("/");

    return new Date(`${ano}-${mes}-${dia}T${h}`);
}

function calcularDuracao(inicio, fim) {

    if (!inicio || !fim) return 0;

    if (typeof inicio !== "string" || typeof fim !== "string") return 0;

    if (!inicio.includes("/") || !fim.includes("/")) return 0;

    const [d1, h1] = inicio.split(" ");
    const [dia1, mes1, ano1] = d1.split("/");

    const [d2, h2] = fim.split(" ");
    const [dia2, mes2, ano2] = d2.split("/");

    const inicioDate = new Date(`${ano1}-${mes1}-${dia1}T${h1}`);
    const fimDate = new Date(`${ano2}-${mes2}-${dia2}T${h2}`);

    if (isNaN(inicioDate) || isNaN(fimDate)) return 0;

    return Math.floor((fimDate - inicioDate) / 60000);
}

// ============================
// ✅ GERAR EVENTOS (CIDADE + SERVIÇO)
// ============================


function gerarEventosPorRegistro() {

    const container = document.getElementById("eventosPorCidade");
    if (!container) return;

    container.innerHTML = "";

    tickets.forEach(reg => {

        const key = `${reg.cidade}-${reg.servico}`;

        const bloco = document.createElement("div");

        bloco.innerHTML = `
            <b>${reg.cidade} | ${reg.servico}</b><br><br>

            <label>Interrupção (min):</label><br>
            <span class="tempo-view" data-key="${key}">0</span><br>

            <label>Impacto (%):</label><br>
            <input type="number" class="impacto" data-key="${key}"><br>

            <label>Final Evento:</label><br>
            <input type="datetime-local" class="final_evento" data-key="${key}"><br>

            <div class="fases-container" data-key="${key}" style="display:none;"></div>

            <button type="button" class="add-fase" data-key="${key}" style="display:none;">
                + adicionar fase
            </button>

            <hr>
        `;

        container.appendChild(bloco);
    });
}
function gerarInputsPorCidade() {

        const container = document.getElementById("impactoPorCidadeContainer");
        container.innerHTML = "";

        // ✅ pega cidades únicas
        const cidades = [...new Set(tickets.map(t => t.cidade))];

            cidades.forEach(cidade => {

        const div = document.createElement("div");

        div.innerHTML = `
            <b>${cidade}</b><br>
            Impacto (%):
            <input type="number" class="impacto-cidade" data-cidade="${cidade}">
            <br><br>
        `;

        container.appendChild(div);
    });

} 

// ============================
// ✅ CRIAR FASE (IMPACTO PARCIAL)
// ============================

function criarFase(container, key) {

    const div = document.createElement("div");

    div.innerHTML = `
        <label>Tempo (min):</label>
        <input type="number" class="fase-tempo" data-key="${key}">

        <label>Impacto (%):</label>
        <input type="number" class="fase-impacto" data-key="${key}">
        <hr>
    `;

    container.appendChild(div);
}

function atualizarParteServico(servico) {

    const resp = document.querySelector(`.responsabilidade[data-servico="${servico}"]`)?.value;
    const select = document.querySelector(`.parte_rede[data-servico="${servico}"]`);

    const servicoNorm = normalizarServico(servico);

    const lista = regrasFechamento.filter(r =>
        normalizarServico(r.servico) === servicoNorm &&
        r.responsavel === resp
    );

    const valores = [...new Set(lista.map(r => r.parte))];

    if (!select) return;
    select.innerHTML = "";

    valores.forEach(v => {
        select.add(new Option(v, v));
    });

    atualizarCausaServico(servico);
}
function atualizarCausaServico(servico) {

    const resp = document.querySelector(`.responsabilidade[data-servico="${servico}"]`)?.value;
    const parte = document.querySelector(`.parte_rede[data-servico="${servico}"]`)?.value;
    const select = document.querySelector(`.causa[data-servico="${servico}"]`);

    const servicoNorm = normalizarServico(servico);

    const lista = regrasFechamento.filter(r =>
        normalizarServico(r.servico) === servicoNorm &&
        r.responsavel === resp &&
        r.parte === parte
    );

    const valores = [...new Set(lista.map(r => r.causa))];

    if (!select) return;
    select.innerHTML = "";

    valores.forEach(v => {
        select.add(new Option(v, v));
    });

    atualizarSolucaoServico(servico);
}

function atualizarSolucaoServico(servico) {

    const resp = document.querySelector(`.responsabilidade[data-servico="${servico}"]`)?.value;
    const parte = document.querySelector(`.parte_rede[data-servico="${servico}"]`)?.value;
    const causa = document.querySelector(`.causa[data-servico="${servico}"]`)?.value;
    const select = document.querySelector(`.solucao[data-servico="${servico}"]`);

    const servicoNorm = normalizarServico(servico);

    const lista = regrasFechamento.filter(r =>
        normalizarServico(r.servico) === servicoNorm &&
        r.responsavel === resp &&
        r.parte === parte &&
        r.causa === causa
    );

    const valores = [...new Set(lista.map(r => r.solucao))];

    if (!select) return;
    select.innerHTML = "";

    valores.forEach(v => {
        select.add(new Option(v, v));
    });
}
// ============================
// ✅ CÁLCULO VC SIMPLES
// ============================

function calcularVC(tempo, impacto, cidade, servico) {

    const dados = baseClientes[normalizarServico(servico)];
    if (!dados) return 0;

    const baseCidade = dados.cidades[cidade.toUpperCase()] || 0;
    const baseBrasil = dados.base_brasil || 0;

    if (!baseCidade || !baseBrasil) return 0;

    return ((tempo * (impacto / 100)) * baseCidade) / baseBrasil;
}


// ============================
// ✅ CÁLCULO VC COM FASES
// ============================

function calcularVCFases(fases, cidade, servico) {

    return fases.reduce((total, fase) => {
        return total + calcularVC(fase.tempo, fase.impacto, cidade, servico);
    }, 0);
}

// ============================
// ✅ FECHAMENTO (CASCATA)
// ============================

let regrasFechamento = [];

// ============================
// ✅ CASCATA
// ============================

function gerarFechamentosPorServico() {

    const container = document.getElementById("fechamentosContainer");
    if (!container) return;

    container.innerHTML = "";

    const servicos = [...new Set(tickets.map(t => t.servico))];

    servicos.forEach(servico => {

        const bloco = document.createElement("div");

        bloco.innerHTML = `
            <h3>${servico}</h3>

            <label>Responsabilidade:</label>
            <select class="responsabilidade" data-servico="${servico}"></select>

            <label>Parte da Rede:</label>
            <select class="parte_rede" data-servico="${servico}"></select>

            <label>Causa:</label>
            <select class="causa" data-servico="${servico}"></select>

            <label>Solução:</label>
            <select class="solucao" data-servico="${servico}"></select>

            <label>Sumário:</label>
            <textarea class="sumario" data-servico="${servico}"></textarea>

            <hr>
        `;

        container.appendChild(bloco);

        iniciarFechamentoServico(servico);
    });
}

function iniciarFechamentoServico(servico) {

    const servicoNorm = normalizarServico(servico);

    const lista = regrasFechamento.filter(r =>
        normalizarServico(r.servico) === servicoNorm
    );

    const respSelect = document.querySelector(`.responsabilidade[data-servico="${servico}"]`);
        if (!respSelect) return;

    const responsaveis = [...new Set(lista.map(r => r.responsavel))];

    respSelect.innerHTML = "";

    responsaveis.forEach(r => {
        respSelect.add(new Option(r, r));
    });

    atualizarParteServico(servico);
}


    
// ============================
// ✅ DOM READY
// ============================

document.addEventListener("DOMContentLoaded", () => {

    console.log("🔥 DOM carregado");

    const chkImpactoCidade = document.getElementById("impactoCidade");
    const containerCidades = document.getElementById("impactoPorCidadeContainer");

    // ✅ CHECKBOX IMPACTO POR CIDADE
    if (chkImpactoCidade) {
        chkImpactoCidade.addEventListener("change", () => {

            if (chkImpactoCidade.checked) {
                containerCidades.style.display = "block";
                gerarInputsPorCidade();
            } else {
                containerCidades.style.display = "none";
            }

        });
    } // ✅ FECHOU CORRETAMENTE AQUI

    // ============================
    // ✅ BOTÕES
    // ============================
    document.querySelectorAll('.evento_btn').forEach(btn => {

        const tela = btn.dataset.tela;
        if (!tela) return;

        btn.addEventListener('click', () => {

            document.querySelectorAll('.evento_btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            abrirTela(tela);

        });
    });

    // ============================
    // ✅ BASE CLIENTES
    // ============================
    fetch("/data/base_clientes.json")
        .then(r => r.json())
        .then(data => {
            baseClientes = data;
            console.log("✅ base clientes carregada:", baseClientes);
        });
    fetch("/data/fechamentos.json")
        .then(r => r.json())
        .then(data => {
            regrasFechamento = data;
            console.log("✅ regras fechamento carregadas");
            gerarFechamentosPorServico();
        });

    // ============================
    // ✅ GERAR EVENTOS
    // ============================
    gerarEventosPorRegistro();

    document.addEventListener("change", function (e) {

        if (!e.target.classList.contains("final_evento")) return;

        const key = e.target.dataset.key;
        const inicio = tickets[0]?.data_inicio;
        const fim = e.target.value;

        const minutos = calcularDuracao(inicio, fim);

        const span = document.querySelector(`.tempo-view[data-key="${key}"]`);
        if (span) span.textContent = minutos;
    });

    // ============================
    // ✅ IMPACTO PARCIAL
    // ============================
    const chkParcial = document.getElementById("impactoParcial");

    if (chkParcial) {
        chkParcial.addEventListener("change", () => {

            document.querySelectorAll(".fases-container").forEach(div => {
                div.style.display = chkParcial.checked ? "block" : "none";
            });

            document.querySelectorAll(".add-fase").forEach(btn => {
                btn.style.display = chkParcial.checked ? "inline-block" : "none";
            });

        });
    }

    // ============================
    // ✅ BOTÃO ADICIONAR FASE
    // ============================
    document.addEventListener("click", function (e) {

        if (!e.target.classList.contains("add-fase")) return;

        const key = e.target.dataset.key;
        const container = document.querySelector(`.fases-container[data-key="${key}"]`);

        criarFase(container, key);
    });

    // ============================
    // ✅ SUBMIT
    // ============================
    const formEvento = document.querySelector(".evento_form");

    if (formEvento) {
        formEvento.addEventListener("submit", function (e) {

            e.preventDefault();

            console.log("✅ submit rodando");

            const usarGlobal = document.getElementById("mesmoHorario")?.checked;
            const global = document.getElementById("data_final_global")?.value;
            const usarImpactoParcial = document.getElementById("impactoParcial")?.checked;

            // ✅ MAPA POR CIDADE
            let impactoCidadeMap = {};

            if (document.getElementById("impactoCidade")?.checked) {

                document.querySelectorAll(".impacto-cidade").forEach(inp => {
                    const cidade = inp.dataset.cidade;
                    impactoCidadeMap[cidade] = Number(inp.value || 0);
                });

                console.log("📊 impacto por cidade:", impactoCidadeMap);
            }

            const eventos = tickets.map(reg => {

                const key = `${reg.cidade}-${reg.servico}`;

                let final_evento = usarGlobal
                    ? global
                    : document.querySelector(`.final_evento[data-key="${key}"]`)?.value;

                // ✅ ISO → BR
                if (final_evento && final_evento.includes("T")) {
                    const [data, hora] = final_evento.split("T");
                    const [ano, mes, dia] = data.split("-");
                    final_evento = `${dia}/${mes}/${ano} ${hora}`;
                }

                let fases = [];

                if (usarImpactoParcial) {

                    const tempos = document.querySelectorAll(`.fase-tempo[data-key="${key}"]`);
                    const impactos = document.querySelectorAll(`.fase-impacto[data-key="${key}"]`);

                    tempos.forEach((t, i) => {
                        fases.push({
                            tempo: Number(t.value || 0),
                            impacto: Number(impactos[i]?.value || 0)
                        });
                    });

                } else {

                    const inicio = tickets[0]?.data_inicio;
                    const tempo = calcularDuracao(inicio, final_evento);

                    let impacto;

                    // ✅ AQUI É O CORRETO
                    if (document.getElementById("impactoCidade")?.checked) {
                        impacto = impactoCidadeMap[reg.cidade] || 0;
                    } else {
                        impacto = Number(
                            document.querySelector(`.impacto[data-key="${key}"]`)?.value || 0
                        );
                    }

                    fases.push({ tempo, impacto });
                }

                const vc_total = calcularVCFases(fases, reg.cidade, reg.servico);

                return {
                    cidade: reg.cidade,
                    servico: reg.servico,
                    final_evento,
                    fases,
                    vc_evento: vc_total
                };
            });

            const payload = {
                inicio_evento: tickets[0]?.data_inicio,
                eventos
            };

            console.log("📦 payload:", payload);

            fetch("/salvar_evento/" + window.ID_TICKET, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(() => {
                alert("✅ Eventos salvos");
            });

        });
    }

        document.getElementById("btnFecharTudo")?.addEventListener("click", () => {
            const servicos = [...new Set(tickets.map(t => t.servico))];

            let invalido = false;

        servicos.forEach(servico => {

            const resp = document.querySelector(`.responsabilidade[data-servico="${servico}"]`)?.value;
            const parte = document.querySelector(`.parte_rede[data-servico="${servico}"]`)?.value;
            const causa = document.querySelector(`.causa[data-servico="${servico}"]`)?.value;
            const solucao = document.querySelector(`.solucao[data-servico="${servico}"]`)?.value;

            if (!resp || !parte || !causa || !solucao) {
                invalido = true;
            }

        });

        if (invalido) {
            alert("❌ Preencha todos os campos de fechamento para TODOS os serviços");
            return;
        }


        const payload = [];

        servicos.forEach(servico => {

            payload.push({
                servico,
                responsabilidade: document.querySelector(`.responsabilidade[data-servico="${servico}"]`)?.value,
                parte: document.querySelector(`.parte_rede[data-servico="${servico}"]`)?.value,
                causa: document.querySelector(`.causa[data-servico="${servico}"]`)?.value,
                solucao: document.querySelector(`.solucao[data-servico="${servico}"]`)?.value,
                sumario: document.querySelector(`.sumario[data-servico="${servico}"]`)?.value
            });

        });
                
                fetch("/fechar_ticket_multi/" + window.ID_TICKET, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fechamentos: payload })
        })
        .then(res => {
            if (!res.ok) {
                console.error("❌ erro HTTP:", res.status);
                alert("Erro ao fechar ticket");
                return;
            }
            return res.json();
        })
        .then(() => {
            alert("✅ Ticket fechado");
            location.reload();
        });

    });
        document.addEventListener("change", function(e) {

        const servico = e.target.dataset.servico;

        if (!servico) return;

        if (e.target.classList.contains("responsabilidade")) {
            atualizarParteServico(servico);
        }

        if (e.target.classList.contains("parte_rede")) {
            atualizarCausaServico(servico);
        }

        if (e.target.classList.contains("causa")) {
            atualizarSolucaoServico(servico);
        }

    });
});
