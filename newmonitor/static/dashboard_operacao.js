document.addEventListener("DOMContentLoaded", carregarDashboardOperacao);

function carregarDashboardOperacao() {

    fetch("/dashboard_operacao")
        .then(r => r.json())
        .then(data => {

            renderCards(data);

            renderRanking(
                "topCidades",
                data.top_cidades,
                "cidade"
            );

            renderRanking(
                "topOfensores",
                data.top_ofensores,
                "ofensor"
            );

            renderRanking(
                "topServicos",
                data.top_servicos,
                "servico"
            );

            renderRanking(
                "topRegionais",
                data.top_regionais,
                "nm_regional_cmv_bi"
            );

            renderRanking(
                "topCnl",
                data.top_cnl,
                "cnl_net"
            );

            renderTickets(
                "ticketsAmarelos",
                data.tickets_amarelos
            );

            renderTickets(
                "ticketsVermelhos",
                data.tickets_vermelhos
            );
            
            renderRanking(
                "topVc",
                data.top_vc,
                "cidade"
            );

            renderRankingCustom(
                "topMp",
                data.top_mp,
                "cidade",
                "total_mp"
            );
            renderRankingCustom(
                "topVc",
                data.top_vc,
                "cidade",
                "total_vc"
            );

            renderRankingCustom(
                "cidadesReincidentes",
                data.cidades_reincidentes,
                "cidade",
                "score"
            );

            renderOfensoresRegionais(
                data.ofensores_regionais
            );

            renderServicosRegionais(
                data.servicos_regionais
            );

            renderRankingCustom(
                "tempoMedioFalha",
                data.tempo_medio_falha,
                "cidade",
                "tempo_medio"
            );
            
            renderRankingCustom(
                "tendenciaMensal",
                data.tendencia_mensal,
                "mes",
                "total"
            );

            renderGraficoTendencia(
                data.tendencia_mensal
            );

            renderRankingCustom(
                "cidadesCriticas",
                data.cidades_criticas,
                "cidade",
                "score"
            );

            renderRankingCustom(
                "regionaisCriticas",
                data.regionais_criticas,
                "regional",
                "score"
            );

            renderGraficoVcMensal(
                data.vc_mensal
            );

            renderGraficoMpMensal(
                data.mp_mensal
            );        

        })
        .catch(err => {
            console.error(
                "Erro dashboard operação:",
                err
            );
        });

}

function renderCards(data) {

    const div =
        document.getElementById(
            "cardsOperacao"
        );

    div.innerHTML = `

        <div class="card-operacao">
            <h3>📂 Abertos</h3>
            <span>${data.abertos}</span>
        </div>

        <div class="card-operacao">
            <h3>✅ Fechados</h3>
            <span>${data.fechados}</span>
        </div>

        <div class="card-operacao">
            <h3>❌ Cancelados</h3>
            <span>${data.cancelados}</span>
        </div>

    `;

}

function renderRanking(
    id,
    lista,
    campo
) {

    const div =
        document.getElementById(id);

    if (!div) {
        return;
    }

    div.innerHTML = "";

    lista.forEach(item => {

        div.innerHTML += `

            <div class="linha-ranking">

                <span>
                    ${item[campo]}
                </span>

                <strong>
                    ${item.total}
                </strong>

            </div>

        `;

    });

}

function renderTickets(id, lista) {

    const div =
        document.getElementById(id);

    if (!div) {
        return;
    }

    div.innerHTML = "";

    if (!lista.length) {

        div.innerHTML = `
            <div class="linha-ranking">
                <span>
                    Nenhum ticket
                </span>
            </div>
        `;

        return;
    }

    lista.forEach(t => {

        div.innerHTML += `

            <div class="linha-ranking">

                <span>
                    ${t.id_ticket}
                    -
                    ${t.cidade}
                </span>

                <strong>
                    ${t.horas}h
                </strong>

            </div>

        `;

    });

}

function renderRankingCustom(
    id,
    lista,
    campo,
    valor
) {

    const div =
        document.getElementById(id);

    if (!div) {
        return;
    }

    div.innerHTML = "";

    lista.forEach(item => {

        div.innerHTML += `

            <div class="linha-ranking">

                <span>
                    ${item[campo]}
                </span>

                <strong>
                    ${item[valor]}
                </strong>

            </div>

        `;

    });

}

function renderOfensoresRegionais(dados) {

    const div =
        document.getElementById(
            "ofensoresRegionais"
        );

    if (!div) {
        return;
    }

    div.innerHTML = "";

    Object.keys(dados).forEach(regional => {

        div.innerHTML += `
            <h4>${regional}</h4>
        `;

        dados[regional]
            .slice(0, 3)
            .forEach(item => {

                div.innerHTML += `

                    <div class="linha-ranking">

                        <span>
                            ${item.ofensor}
                        </span>

                        <strong>
                            ${item.total}
                        </strong>

                    </div>

                `;

            });

        div.innerHTML += "<hr>";

    });

}

function renderServicosRegionais(dados) {

    const div =
        document.getElementById(
            "servicosRegionais"
        );

    if (!div) {
        return;
    }

    div.innerHTML = "";

    Object.keys(dados).forEach(regional => {

        div.innerHTML += `
            <h4>${regional}</h4>
        `;

        dados[regional]
            .slice(0, 3)
            .forEach(item => {

                div.innerHTML += `

                    <div class="linha-ranking">

                        <span>
                            ${item.servico}
                        </span>

                        <strong>
                            ${item.total}
                        </strong>

                    </div>

                `;

            });

        div.innerHTML += "<hr>";

    });

}

function renderGraficoTendencia(lista) {

    const ctx =
        document
            .getElementById(
                "graficoTendencia"
            );

    if (!ctx) {
        return;
    }

    const labels =
        lista.map(item =>
            item.mes
        );

    const valores =
        lista.map(item =>
            item.total
        );

    new Chart(ctx, {

        type: "line",

        data: {

            labels: labels,

            datasets: [

                {

                    label:
                        "Tickets",

                    data: valores,

                    borderColor:
                        "#1976d2",

                    backgroundColor:
                        "rgba(25,118,210,0.2)",

                    borderWidth: 3,

                    fill: true,

                    tension: 0.3

                }

            ]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    display: false
                }

            }

        }

    });

}

function renderGraficoVcMensal(lista) {

    const ctx =
        document.getElementById(
            "graficoVcMensal"
        );

    if (!ctx) {
        return;
    }

    const labels =
        lista.map(
            item => item.mes
        );

    const valores =
        lista.map(
            item => item.total_vc
        );

    new Chart(ctx, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [

                {

                    label: "VC",

                    data: valores,

                    backgroundColor:
                        "#ff9800",

                    borderColor:
                        "#f57c00",

                    borderWidth: 1

                }

            ]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    display: false
                }

            }

        }

    });

}

function renderGraficoMpMensal(lista) {

    const ctx =
        document.getElementById(
            "graficoMpMensal"
        );

    if (!ctx) {
        return;
    }

    const labels =
        lista.map(
            item => item.mes
        );

    const valores =
        lista.map(
            item => item.total_mp
        );

    new Chart(ctx, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [

                {

                    label:
                        "Minutos Ponderados",

                    data: valores,

                    backgroundColor:
                        "#d32f2f",

                    borderColor:
                        "#b71c1c",

                    borderWidth: 1

                }

            ]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    display: false
                }

            }

        }

    });

}
