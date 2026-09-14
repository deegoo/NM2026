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