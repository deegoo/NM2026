function buscar() {

    const ticket = document.getElementById("filtro_ticket").value;
    const dataInicio = document.getElementById("filtro_data_inicio").value;
    const dataFim    = document.getElementById("filtro_data_fim").value;
    const cidade     = document.getElementById("filtro_cidade").value.toLowerCase();

    fetch("/listar")
    .then(r => r.json())
    .then(lista => {

        let filtrados = lista;

        // ✅ 1. busca por ticket (prioridade total)
        if (ticket) {
            filtrados = lista.filter(t => String(t.id_ticket) === ticket);
        }

        // ✅ 2. busca por período + cidade
        else if (dataInicio && dataFim && cidade) {

            filtrados = lista.filter(t => {

                const dataTicket = t.data_inicio.split("T")[0];

                return dataTicket >= dataInicio &&
                       dataTicket <= dataFim &&
                       t.cidade.toLowerCase().includes(cidade);
            });
        }

        renderTabela(filtrados);
    });
}


function renderTabela(lista) {

    const tbody = document.getElementById("resultado");
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5'>Nenhum resultado</td></tr>";
        return;
    }

    lista.forEach(t => {

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
            <td>${t.data_inicio}</td>
        `;

        tbody.appendChild(tr);
    });

}

function limpar() {

    document.getElementById("filtro_ticket").value = "";
    document.getElementById("filtro_data_inicio").value = "";
    document.getElementById("filtro_data_fim").value = "";
    document.getElementById("filtro_cidade").value = "";

    document.getElementById("resultado").innerHTML = "";
}