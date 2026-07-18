console.log("🚀 ticket.js carregado");

// ============================
// ✅ VARIÁVEIS GLOBAIS
// ============================

let regras = [];
let tickets = window.TICKETS || [];
let baseClientes = {};
let dadosEventoEdicao = null;
let modoEdicao =
    new URLSearchParams(
        window.location.search
    ).get("editar") === "1";
let regrasFechamento = [];
let temEventoSalvo = false;
let temFechamentoSalvo = false;
let modoEdicaoFechamento = false;
const servicoEdicao =
    new URLSearchParams(
        window.location.search
    ).get("servico");

const CAUSAS_RAIZ = [
    "AR CONDICIONADO",
    "ATAQUE",
    "BALANCEAMENTO DE TRAFEGO",
    "BB IP NACIONAL - FOTONICO",
    "CABEAMENTO",
    "ENERGIA",
    "ERRO OPERACIONAL",
    "FALHA DE COMUTAÇÃO",
    "FALHA DE HARDWARE",
    "FALHA DE HARDWARE - CMTS",
    "FALHA DE HARDWARE - EQUIPAMENTO TX",
    "FALHA DE HARDWARE - ROTEADOR",
    "FALHA DE HARDWARE - SERVIDOR",
    "FALHA DE SOFTWARE",
    "FALHA DE SOFTWARE - CMTS",
    "FALHA DE SOFTWARE - EQUIPAMENTO TX",
    "FALHA DE SOFTWARE - ROTEADOR",
    "FALHA DE SOFTWARE - SERVIDOR",
    "FALHA DUPLA",
    "FALHA DUPLA COM LONGA DURAÇÃO",
    "FALHA SIMPLES - CORDÃO OPTICO",
    "FALHA SIMPLES - REDE HFC LINEAR",
    "FALHA SIMPLES - ROTA LINEAR BACKBONE",
    "FALHA SIMPLES - TRECHO LINEAR",
    "FALHA SIMPLES COM SATURAÇÃO",
    "FALHA TRIPLA",
    "FENÔMENO NATURAL",
    "HFC",
    "HFC - PASSIVO DE REDE",
    "INFRAESTRUTURA - FALHA DE ARCON",
    "INFRAESTRUTURA - FALHA DE ENERGIA NO SITE",
    "NÃO IDENTIFICADA",
    "OUTROS",
    "RUPTURA PARCIAL",
    "SATURAÇÃO",
    "SEM REDUNDÂNCIA",
    "TEMPO DE COMUTAÇÃO",
    "VIA DEGRADADA"
];

// ============================
// ✅ FECHAMENTO (CASCATA)
// ============================

async function carregarRegrasFechamento() {

    console.log("ENTROU carregarRegrasFechamento");

    const resp =
        await fetch("/api/regras_fechamento");

    console.log("STATUS", resp.status);

    regrasFechamento =
        await resp.json();

    console.log(
        "REGRAS FECHAMENTO",
        regrasFechamento.length
    );
}
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

    // ✅ se não for Date, faz parse
    if (!(d instanceof Date)) {
        d = parseBR(d);
    }

    if (!d || isNaN(d)) return "-";

    return d.toLocaleString("pt-BR");
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

    const dados =
        baseClientes[
            normalizarServico(servico)
        ];

    console.log(
        "CALCULAR VC",
        {
            tempo,
            impacto,
            cidade,
            servico,
            dados
        }
    );

    if (!dados) {

        console.log("SEM DADOS");

        return 0;
    }

    const baseCidade =
        dados.cidades[
            cidade.toUpperCase()
        ] || 0;

    const baseBrasil =
        dados.base_brasil || 0;

    console.log(
        "BASES",
        {
            cidade,
            baseCidade,
            baseBrasil
        }
    );

    if (!baseCidade || !baseBrasil) {

        console.log(
            "BASE INVÁLIDA",
            {
                baseCidade,
                baseBrasil
            }
        );

        return 0;
    }

    const vc =
        ((tempo * (impacto / 100))
            * baseCidade)
        / baseBrasil;

    console.log(
        "VC FINAL",
        vc
    );

    return vc;
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
// ✅ CASCATA
// ============================

function gerarFechamentosPorServico() {
    console.log(
        "GERANDO FECHAMENTOS",
        tickets
        );

    const container = document.getElementById("fechamentosContainer");
    if (!container) return;

    container.innerHTML = "";

    const servicos = [...new Set(tickets.map(t => t.servico))];
    console.log(
        "SERVICOS",
        servicos
    );

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

            <label>Causa Raiz:</label>
            <select class="causa_raiz" data-servico="${servico}"></select>

            <label><input type="checkbox" class="isolamento_olt_cmts" data-servico="${servico}">Isolamento de OLT/CMTS</label>

            <label>Sumário:</label>
            <textarea class="sumario" data-servico="${servico}"></textarea>

            <hr>
        `;
            console.log(
                "CRIANDO BLOCO",
                servico
            );
            container.appendChild(bloco);

            iniciarFechamentoServico(servico);

            atualizarParteServico(servico);
            atualizarCausaServico(servico);
            atualizarSolucaoServico(servico);
            atualizarCausaRaizServico(servico);
    });
}

function iniciarFechamentoServico(servico) {

    const servicoNorm = normalizarServico(servico);

    const lista = regrasFechamento.filter(r =>
        normalizarServico(r.servico) === servicoNorm
    );

    console.log(

        "SERVICO",
        servico,
        "LISTA",
        lista
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

async function carregarHistorico() {

    const container = document.getElementById("lista_logs");

    if (!container) return;

    try {

        const [atividades, comentarios] = await Promise.all([

            fetch(
                `/api/atividade/${window.ID_TICKET}`
            ).then(r => r.json()),

            fetch(
                `/api/comentarios/${window.ID_TICKET}`
            ).then(r => r.json())
        ]);

        let html = "";

        atividades.forEach(item => {

            html += `
                <div style="
                    border:1px solid #ccc;
                    margin:10px;
                    padding:10px;
                ">
                    <p>
                        <strong>
                            ${item.data} - ${item.usuario}
                        </strong>
                    </p>

                    <p>
                        ${item.acao}
                    </p>

                    <p>
                        ${item.detalhes || ""}
                    </p>
                </div>
            `;
        });

        comentarios.forEach(item => {

    html += `
        <div style="
            border:1px solid #ccc;
            margin:10px;
            padding:10px;
        ">

            <p>
                <strong>
                    ${item.data} - ${item.usuario}
                </strong>
            </p>

            <p>
                ${item.comentario || ""}
            </p>

            ${
                item.imagem
                    ? `
                        <img src="/static/uploads/${item.imagem}">
                    `
                    : ""
            }

        </div>
    `;
});

        if (!html) {

            html = `
                <p>
                    Sem histórico ainda
                </p>
            `;
        }

        container.innerHTML = html;

    } catch (erro) {

        console.error(
            "Erro ao carregar histórico:",
            erro
        );

        container.innerHTML = `
            <p>
                Erro ao carregar histórico
            </p>
        `;
    }
}

async function carregarEventosSalvos() {

    const container = document.getElementById("eventosSalvosContainer");

    if (!container) return;

    try {

        const resp = await fetch(`/api/eventos/${window.ID_TICKET}`);

        const dados = await resp.json();

        console.log(
            "EVENTOS API",
            dados
        );

        const eventos =
            dados.eventos || [];

        const fases =
            dados.fases || [];
        console.log("EVENTOS:", eventos);
        console.log("FASES:", fases);
        console.log("QTD EVENTOS:", eventos.length);
        if (!eventos.length) {
            console.log("SEM EVENTOS");
            temEventoSalvo = false;

            container.innerHTML = "";

            return;
        }

        temEventoSalvo = true;
        modoEdicao = false;

        bloquearCamposEvento(true);

        const btn =
            document.getElementById(
                "btnSalvarEvento"
            );

        if (btn) {
            btn.textContent =
                "Editar Evento";
        }

        let html = "";

        eventos.forEach(evento => {

            const fasesEvento =
                fases.filter(f =>
                    f.cidade === evento.cidade &&
                    f.servico === evento.servico
                );

            html += `
                <div style="
                    border:1px solid #ccc;
                    border-radius:6px;
                    padding:10px;
                    margin-bottom:15px;
                    background:#f8f9fa;
                ">

                    <h4>
                        ${evento.cidade}
                        |
                        ${evento.servico}
                    </h4>

                    <p>
                        <b>Início:</b>
                        ${evento.inicio_evento}
                    </p>

                    <p>
                        <b>Final:</b>
                        ${evento.final_evento}
                    </p>

                    <p>
                        <b>VC:</b>
                        ${evento.vc_evento}
                    </p>

                    <p>
                        <b>Fases:</b>
                    </p>

                    <ul>

                        ${
                            fasesEvento.map(f => `
                                <li>
                                    ${f.tempo} min
                                    /
                                    ${f.impacto}%
                                </li>
                            `).join("")
                        }

                    </ul>

                </div>
            `;
        });

        container.innerHTML = html;

    } catch (erro) {

        console.error(
            "Erro ao carregar eventos",
            erro
        );
    }
}

function bloquearCamposEvento(bloquear) {

    document.querySelectorAll(
        ".final_evento, .impacto, .impacto-cidade, .fase-tempo, .fase-impacto"
    ).forEach(el => {
        el.disabled = bloquear;
    });

    document.getElementById("impactoParcial")?.toggleAttribute(
        "disabled",
        bloquear
    );

    document.getElementById("impactoCidade")?.toggleAttribute(
        "disabled",
        bloquear
    );

    document.getElementById("mesmoHorario")?.toggleAttribute(
        "disabled",
        bloquear
    );

    document.querySelectorAll(".add-fase").forEach(btn => {
        btn.disabled = bloquear;
    });
}

function bloquearCamposFechamento(bloquear) {

    document.querySelectorAll(
        ".responsabilidade, .parte_rede, .causa, .solucao, .sumario"
    ).forEach(el => {
        el.disabled = bloquear;
    });

    document.getElementById("btnFecharTudo")?.toggleAttribute(
        "disabled",
        bloquear
    );
}

async function carregarFechamentosSalvos() {

    const container =
        document.getElementById(
            "fechamentosSalvosContainer"
        );

    try {

        const resp = await fetch(
            `/api/fechamentos/${window.ID_TICKET}`
        );

        const dados = await resp.json();

        console.log(
            "FECHAMENTOS API",
            dados
        );

        const fechamentos =
            dados.fechamentos || [];

        if (!fechamentos.length) {

            temFechamentoSalvo = false;

            if (container) {
                container.innerHTML = "";
            }

            return;
        }

        temFechamentoSalvo = true;

        bloquearCamposFechamento(true);

        const formFechamento =
            document.querySelector(
                "#fechamentosContainer"
            );

        if (formFechamento) {
            formFechamento.style.display = "none";
        }

        const btn =
            document.getElementById(
                "btnFecharTudo"
            );

        if (btn) {
            btn.style.display = "none";
        }

        let html = "";

        fechamentos.forEach(f => {

            html += `
                <div style="
                    border:1px solid #ccc;
                    border-radius:6px;
                    padding:10px;
                    margin-bottom:15px;
                    background:#f8f9fa;
                ">

                    <h4>
                        ${f.servico}
                    </h4>
                    <p>
                        <b>Interrupção (min):</b>
                        ${f.interrupcao ?? "-"}
                    </p>

                    <p>
                        <b>Responsabilidade:</b>
                        ${f.responsabilidade || "-"}
                    </p>

                    <p>
                        <b>Parte:</b>
                        ${f.parte || "-"}
                    </p>

                    <p>
                        <b>Causa:</b>
                        ${f.causa || "-"}
                    </p>

                    <p>
                        <b>Solução:</b>
                        ${f.solucao || "-"}
                    </p>

                    <p>
                        <b>Causa Raiz:</b>
                        ${f.causa_raiz || "-"}
                    </p>

                    <p>
                        <b>Isolamento OLT/CMTS:</b>
                        ${
                            Number(f.isolamento_olt_cmts || 0) === 1
                                ? "SIM"
                                : "NÃO"
                        }
                    </p>

                    <p>
                        <b>Sumário:</b>
                        ${f.sumario || "-"}
                    </p>

                </div>
            `;

            const servico =
                f.servico;

            const responsabilidade =
                document.querySelector(
                    `.responsabilidade[data-servico="${servico}"]`
                );

            if (responsabilidade) {
                responsabilidade.value =
                    f.responsabilidade || "";
            }

            atualizarParteServico(servico);

            const parte =
                document.querySelector(
                    `.parte_rede[data-servico="${servico}"]`
                );

            if (parte) {
                parte.value =
                    f.parte || "";
            }

            atualizarCausaServico(servico);

            const causa =
                document.querySelector(
                    `.causa[data-servico="${servico}"]`
                );

            if (causa) {
                causa.value =
                    f.causa || "";
            }
            const isolamento =
                document.querySelector(
                    `.isolamento_olt_cmts[data-servico="${servico}"]`
                );

            if (isolamento) {

                isolamento.checked =
                    Number(
                        f.isolamento_olt_cmts || 0
                    ) === 1;
            }

            atualizarSolucaoServico(servico);
            atualizarCausaRaizServico(servico);
            const causaRaiz =
                document.querySelector(
                    `.causa_raiz[data-servico="${servico}"]`
                );

            if (causaRaiz) {

                causaRaiz.value =
                    f.causa_raiz || "";
            }

            const solucao =
                document.querySelector(
                    `.solucao[data-servico="${servico}"]`
                );

            if (solucao) {
                solucao.value =
                    f.solucao || "";
            }

            const sumario =
                document.querySelector(
                    `.sumario[data-servico="${servico}"]`
                );

            if (sumario) {
                sumario.value =
                    f.sumario || "";
            }
        });

        if (container) {
            container.innerHTML = html;
        }

    } catch (erro) {

        console.error(
            "Erro ao carregar fechamentos",
            erro
        );
    }
    console.log("FIM carregarFechamentosSalvos");
}

async function carregarEdicaoFechamento(servico) {

    const resp =
        await fetch(
            `/api/fechamento_servico?id_ticket=${encodeURIComponent(window.ID_TICKET)}&servico=${encodeURIComponent(servico)}`
        );

    console.log(
        "CARREGANDO EDIÇÃO",
        servico
    );

    const dados =
        await resp.json();

    console.log(
        "EDIÇÃO",
        dados
    );

    console.log(
        "FECHAMENTO RETORNADO",
        dados.fechamento
    );

    console.log(
        "EVENTO RETORNADO",
        dados.evento
    );

    console.log(
        "SERVICO EDIÇÃO",
        servico
    );

    dadosEventoEdicao =
        dados.evento || null;

    bloquearCamposEvento(false);
    bloquearCamposFechamento(false);

    const containerSalvos =
        document.getElementById(
            "fechamentosSalvosContainer"
        );

    if (containerSalvos) {
        containerSalvos.style.display = "none";
    }

    const formFechamento =
        document.getElementById(
            "fechamentosContainer"
        );

    if (formFechamento) {
        formFechamento.style.display = "block";
    }

    const btn =
        document.getElementById(
            "btnFecharTudo"
        );

    if (btn) {

        btn.style.display = "";

        btn.textContent =
            "Salvar Alterações";
    }

    const fechamento =
        dados.fechamento || {};

    const responsabilidade =
        document.querySelector(
            `.responsabilidade[data-servico="${servico}"]`
        );

    if (responsabilidade) {

        responsabilidade.value =
            fechamento.responsabilidade || "";

        atualizarParteServico(servico);
        atualizarCausaRaizServico(servico);
        const causaRaiz =
            document.querySelector(
                `.causa_raiz[data-servico="${servico}"]`
            );

        if (causaRaiz) {

            causaRaiz.value =
                fechamento.causa_raiz || "";
        }

        const isolamento =
            document.querySelector(
                `.isolamento_olt_cmts[data-servico="${servico}"]`
            );

        if (isolamento) {

            isolamento.checked =
                Number(
                    fechamento.isolamento_olt_cmts || 0
                ) === 1;
        }
    }

    const parte =
        document.querySelector(
            `.parte_rede[data-servico="${servico}"]`
        );

    if (parte) {

        parte.value =
            fechamento.parte || "";

        atualizarCausaServico(servico);
    }

    const causa =
        document.querySelector(
            `.causa[data-servico="${servico}"]`
        );

    if (causa) {

        causa.value =
            fechamento.causa || "";

        atualizarSolucaoServico(servico);
    }

    const solucao =
        document.querySelector(
            `.solucao[data-servico="${servico}"]`
        );

    if (solucao) {

        solucao.value =
            fechamento.solucao || "";
    }

    const sumario =
        document.querySelector(
            `.sumario[data-servico="${servico}"]`
        );

    if (sumario) {

        sumario.value =
            fechamento.sumario || "";
    }
    console.log(
    "CONTAINER FECHAMENTO",
    document.getElementById(
        "fechamentosContainer"
    )
    );

    console.log(
        "HTML FECHAMENTOS",
        document.getElementById(
            "fechamentosContainer"
        )?.innerHTML
    );
    modoEdicaoFechamento = true;

    console.log(
        "MOSTRANDO FORMULÁRIO EDIÇÃO"
    );
}
function atualizarCausaRaizServico(servico) {

    const select =
        document.querySelector(
            `.causa_raiz[data-servico="${servico}"]`
        );

    if (!select) return;

    select.innerHTML = "";

    CAUSAS_RAIZ.forEach(item => {

        const opt =
            document.createElement("option");

        opt.value = item;
        opt.textContent = item;

        select.appendChild(opt);

    });
}
// ============================
// ✅ DOM READY
// ============================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("🔥 DOM carregado");
    await carregarRegrasFechamento();
    carregarHistorico()
    gerarEventosPorRegistro();
    gerarFechamentosPorServico();
    carregarEventosSalvos();
    carregarFechamentosSalvos();
    

    const chkImpactoCidade = document.getElementById("impactoCidade");
    const containerCidades = document.getElementById("impactoPorCidadeContainer");

    if (chkImpactoCidade) {
        chkImpactoCidade.addEventListener("change", () => {

            if (chkImpactoCidade.checked) {
                containerCidades.style.display = "block";
                gerarInputsPorCidade();
            } else {
                containerCidades.style.display = "none";
            }

        });
    } 

    
    const campoFinal = document.getElementById("data_final_global");

    if (campoFinal && !campoFinal.value) {

        const agora = new Date();

        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");

        const hora = String(agora.getHours()).padStart(2, "0");
        const min = String(agora.getMinutes()).padStart(2, "0");

        campoFinal.value = `${ano}-${mes}-${dia}T${hora}:${min}`;
    }


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
    // ✅ GERAR EVENTOS
    // ============================


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
    //  SUBMIT
    // ============================

const formEvento = document.querySelector(".evento_form");


if (formEvento) {

    formEvento.addEventListener("submit", function (e) {
        bloquearCamposEvento(true);

        e.preventDefault();

        // ✅ PRIMEIRO CLIQUE (EDITAR)
        console.log(
            "MODO EVENTO",
            {
                temEventoSalvo,
                modoEdicao
            }
        );
        if (temEventoSalvo && !modoEdicao) {

            console.log("🔓 liberando edição");

            bloquearCamposEvento(false);
            modoEdicao = true;

            const btn = document.getElementById("btnSalvarEvento");
            if (btn) btn.textContent = "Salvar Alterações";

            return;
        }

        console.log("✅ salvando evento");

        const usarGlobal = document.getElementById("mesmoHorario")?.checked;
        const global = document.getElementById("data_final_global")?.value;
        const usarImpactoParcial = document.getElementById("impactoParcial")?.checked;

        let impactoCidadeMap = {};

        if (document.getElementById("impactoCidade")?.checked) {

            document.querySelectorAll(".impacto-cidade").forEach(inp => {
                const cidade = inp.dataset.cidade;
                impactoCidadeMap[cidade] = Number(inp.value || 0);
            });
        }

        const eventos = tickets.map(reg => {

            const key = `${reg.cidade}-${reg.servico}`;

            let final_evento = usarGlobal
                ? global
                : document.querySelector(`.final_evento[data-key="${key}"]`)?.value;

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

                if (document.getElementById("impactoCidade")?.checked) {
                    impacto = impactoCidadeMap[reg.cidade] || 0;
                } else {
                    impacto = Number(
                        document.querySelector(`.impacto[data-key="${key}"]`)?.value || 0
                    );
                }

                fases.push({ tempo, impacto });
            }

            const vc_total = calcularVCFases(
                fases,
                reg.cidade,
                reg.servico
            );

        console.log(
            "VC DEBUG",
            "cidade=", reg.cidade,
            "servico=", reg.servico,
            "servicoNormalizado=", normalizarServico(reg.servico),
            "base=", baseClientes[
                normalizarServico(reg.servico)
            ],
            "fases=", fases,
            "vc_total=", vc_total
        );
        
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

        payload.eventos.forEach(ev => {

            console.log(
                "EVENTO",
                ev.cidade,
                ev.servico,
                "VC=",
                ev.vc_evento,
                "FASES=",
                ev.fases
            );
        });

        fetch("/salvar_evento/" + window.ID_TICKET, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(() => {
            alert("✅ Eventos salvos");

            
            bloquearCamposEvento(true);
            modoEdicao = false;

            const btn = document.getElementById("btnSalvarEvento");
            if (btn) btn.textContent = "Editar Evento";

            location.reload(); 
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
        if (
            temFechamentoSalvo &&
            !modoEdicaoFechamento
        ) {

            bloquearCamposFechamento(false);

            modoEdicaoFechamento = true;

            document.getElementById(
                "btnFecharTudo"
            ).textContent =
                "Salvar Alterações";

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
                sumario: document.querySelector(`.sumario[data-servico="${servico}"]`)?.value,
                causa_raiz: document.querySelector(`.causa_raiz[data-servico="${servico}"]`)?.value,
                isolamento_olt_cmts: document.querySelector(`.isolamento_olt_cmts[data-servico="${servico}"]`)?.checked ? 1 : 0,
            });

        });
        if (modoEdicaoFechamento) {

            const fechamento = payload.find(
                p => p.servico === servicoEdicao
            );

            fetch("/api/editar_fechamento", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({

                    id_ticket: window.ID_TICKET,
                    servico: servicoEdicao,

                    responsabilidade:
                        fechamento?.responsabilidade,

                    parte:
                        fechamento?.parte,

                    causa:
                        fechamento?.causa,

                    solucao:
                        fechamento?.solucao,

                    sumario:
                        fechamento?.sumario,

                    inicio_evento:
                        dadosEventoEdicao?.inicio_evento,

                    final_evento:
                        document.querySelector(
                            `.final_evento[data-key]`
                        )?.value,

                    vc_evento:
                        dadosEventoEdicao?.vc_evento,
                    
                    causa_raiz:
                        document.querySelector(
                            `.causa_raiz[data-servico="${servicoEdicao}"]`
                        )?.value,

                    isolamento_olt_cmts:
                        document.querySelector(
                            `.isolamento_olt_cmts[data-servico="${servicoEdicao}"]`
                        )?.checked ? 1 : 0,

                })
            })
            .then(res => {

                if (!res.ok) {
                    throw new Error(
                        "Erro ao editar fechamento"
                    );
                }

                return res.json();

            })
            .then(() => {

                alert(
                    "✅ Alterações salvas"
                );

                window.location.href =
                    `/ticket/${encodeURIComponent(window.ID_TICKET)}`;

            })
            

            return;
        }
                
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

        const formComentario = document.getElementById("form_comentario");

    if (formComentario) {
        formComentario.addEventListener("submit", function (e) {
            e.preventDefault();

            console.log("💬 enviando comentário...");

            const comentario = document.getElementById("comentario").value.trim();
            const imagemInput = document.getElementById("imagem");
            const imagem = imagemInput.files[0];

            const formData = new FormData();
            formData.append("comentario", comentario);
            formData.append("usuario", "Sistema"); // pode trocar depois

            if (imagem) {
                formData.append("imagem", imagem);
            }

            fetch(`/comentar/${window.ID_TICKET}`, {
                method: "POST",
                body: formData
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Erro HTTP: ${res.status}`);
                }
                return res.json();
            })
            .then(() => {
                console.log("✅ comentário salvo");

                // limpa o formulário
                document.getElementById("comentario").value = "";
                imagemInput.value = "";

                // recarrega pra mostrar no histórico
                location.reload();
            })
            .catch(err => {
                console.error("❌ erro ao salvar comentário:", err);
                alert("Erro ao salvar comentário");
            });
        });
    }


        if (
        modoEdicao &&
        servicoEdicao
    ) {
        
        console.log(
            "MODO EDIÇÃO",
            servicoEdicao
        );

        carregarEdicaoFechamento(servicoEdicao);
    }
        
});
