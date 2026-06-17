const API = "/listar";

async function carregar() {

  const res = await fetch(API);
  const dados = await res.json();

  renderTabela(dados);
}

async function acao(id, servico, tipo) {

  if (!confirm(`Confirma ${tipo} o ticket?`)) return;

  const res = await fetch(`/ticket/${id}/acao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ acao: tipo, servico })
  });

  const data = await res.json();

  if (res.ok) {
    alert(`✅ ${tipo} executado`);
    carregar();
  } else {
    alert("❌ " + (data.msg || data.erro));
  }
}

carregar();


async function buscar() {

  const termo = document.getElementById("buscaTicket").value;
  const dataInicio = document.getElementById("dataInicio").value;
  const dataFim = document.getElementById("dataFim").value;

  const params = new URLSearchParams({
    term: termo,
    data_inicio: dataInicio,
    data_fim: dataFim
  });

  const res = await fetch(`/buscar?${params.toString()}`);
  const dados = await res.json();

  renderTabela(dados);
}

function renderTabela(dados) {

  const tabela = document.getElementById("tabela");
  tabela.innerHTML = "";

  const agrupados = {};

  dados.forEach(t => {

    const id = t.id_ticket;

    if (!agrupados[id]) {
      agrupados[id] = [];
    }

    agrupados[id].push(t);
  });

  Object.keys(agrupados).forEach(id => {

    const grupo = agrupados[id];

    const tr = document.createElement("tr");

    const qtdAbertos = grupo.filter(t =>
      (t.status || "ABERTO").toUpperCase() === "ABERTO"
    ).length;

    if (qtdAbertos > 1) {
      tr.style.background = "#fff3cd";
    }

    let servicosHtml = "";

    grupo.forEach(t => {

      const status = (t.status || "ABERTO").trim().toUpperCase();

      let statusColor =
        status === "CANCELADO" ? "red" :
        status === "FECHADO" ? "black" :
        "blue";

      let botoes = "";

      if (status === "ABERTO") {
        botoes = `
          <button class="btn-cancelar" onclick="acao('${t.id_ticket}','${t.servico}','cancelar')">
            Cancelar
          </button>
        `;
      } else if (status === "FECHADO") {
        botoes = `
          <button class="btn-reabrir" onclick="acao('${t.id_ticket}','${t.servico}','reabrir')">
            Reabrir
          </button>
        `;
      } else {
        botoes = "-";
      }

      servicosHtml += `
        <div class="linha-servico">
          <span class="servico">${t.servico}</span>
          <span class="status" style="color:${statusColor}">
            ${status}
          </span>
          <span class="acoes">
            ${botoes}
          </span>
        </div>
`;
    });

    tr.innerHTML = `
      <td><strong>${id}</strong><br>(${grupo.length} serviços)</td>
      <td>${grupo[0].cidade || ""}</td>
      <td>${servicosHtml}</td>
    `;

    tabela.appendChild(tr);
  });
}