/* =========================
   REGRAS
========================= */

const regras = {
    "NET FONE": {
        sintomas: ["MUDO", "MANOBRA"],
        eventos: {
            "MUDO": ["INTERRUPCAO", "PROGRAMADA", "AVALIAÇÃO DE DESEMPENHO"],
            "MANOBRA": ["PROGRAMADA"],

        }
    },
    "NET VIRTUA": {
        sintomas: ["QUEDA NO TRAFEGO", "MANOBRA"],
        eventos: ["DEGRADACAO", "INTERRUPCAO", "PROGRAMADA", "AVALIAÇÃO DE DESEMPENHO"]
    },
    "NOW": {
        sintomas: ["QUEDA NO TRAFEGO", "MANOBRA"],
        eventos: ["DEGRADACAO", "INTERRUPCAO", "PROGRAMADA", "AVALIAÇÃO DE DESEMPENHO"]
    },
    "PAY TV DIGITAL": {
        sintomas: ["QUEDA NO TRAFEGO", "MANOBRA"],
        eventos: ["DEGRADACAO", "INTERRUPCAO", "PROGRAMADA", "AVALIAÇÃO DE DESEMPENHO"]
    },
    "BSOD": {
        sintomas: ["QUEDA NO TRAFEGO", "MANOBRA"],
        eventos: ["INTERRUPCAO", "PROGRAMADA", "AVALIAÇÃO DE DESEMPENHO"]
    },
    "WI-FI": {
        sintomas: ["QUEDA NO TRAFEGO", "MANOBRA"],
        eventos: ["DEGRADACAO", "INTERRUPCAO", "PROGRAMADA", "AVALIAÇÃO DE DESEMPENHO"]
    },
};


/* =========================
   DADOS (JSON)
========================= */

let estrutura = {};

async function carregarEstrutura() {
    const res = await fetch("/data/estrutura.json");
    estrutura = await res.json();
}


/* =========================
   CIDADES / DRAG DROP
========================= */

let dragItem = null;

function criarLi(texto) {
    const li = document.createElement("li");
    li.textContent = texto;
    li.draggable = true;

    li.onclick = () => li.classList.toggle("selected");
    li.ondragstart = () => dragItem = li;

    return li;
}


/* =========================
   INICIALIZAÇÃO
========================= */

function iniciarFormulario() {
    const servicos = document.getElementById("servicosAfetados");

    Object.keys(regras).forEach(s => {
        servicos.add(new Option(s, s));
    });
}

function iniciarCidades() {
    const disp = document.getElementById("cidadesDisponiveis");

    if (disp) disp.innerHTML = "";

   
    Object.keys(estrutura)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .forEach(cidade => {
        if (disp) disp.appendChild(criarLi(cidade));
    });

}


/* =========================
   CASCATA
========================= */

function getCidadeSelecionada() {
    const selecionadas = document.querySelectorAll("#cidadesSelecionadas li");
    if (selecionadas.length === 0) return null;
    return selecionadas[0].textContent;
}

function atualizarCategorias() {

    const cidadesSelecionadas = [...document.querySelectorAll("#cidadesSelecionadas li")];
    const categoria = document.getElementById("categoria");

    categoria.innerHTML = "";

    if (!cidadesSelecionadas.length) return;

    const multiCidade = cidadesSelecionadas.length > 1;

    if (multiCidade) {

        const categoriasPermitidas = [
            "Backbone IP",
            "Infra Estrutura",
            "CMTS",
            "Links"
        ];

        categoriasPermitidas.forEach(cat => {
            categoria.add(new Option(cat, cat));
        });

    } else {

        const cidade = cidadesSelecionadas[0].textContent;

        if (!estrutura[cidade]) return;

        Object.keys(estrutura[cidade])
            .sort((a, b) => a.localeCompare(b, "pt-BR"))
            .forEach(cat => {
                categoria.add(new Option(cat, cat));
            });
    }

    atualizarOfensores();
}

function atualizarOfensores() {

    const cidadesSelecionadas = [...document.querySelectorAll("#cidadesSelecionadas li")];
    const categoria = document.getElementById("categoria").value;
    const ofensor = document.getElementById("ofensor");

    ofensor.innerHTML = "";

    if (!cidadesSelecionadas.length) return;

    const multiCidade = cidadesSelecionadas.length > 1;

    let ofensoresSet = new Set();

    cidadesSelecionadas.forEach(li => {

        const cidade = li.textContent;

        const lista = estrutura[cidade]?.[categoria] || [];

        lista.forEach(o => {
            ofensoresSet.add(o);
        });
    });

    let listaFinal = [...ofensoresSet];

    if (multiCidade) {

        if (categoria === "Links") {
            listaFinal = listaFinal.filter(o =>
                o.toUpperCase().includes("BACKBONE") ||
                o.toUpperCase().includes("GPON")
            );
        }

        // outras categorias permanecem completas
    }

    listaFinal
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .forEach(o => {
            ofensor.add(new Option(o, o));
        });
}


/* =========================
   MOVE
========================= */

function moverParaSelecionadas() {
    mover("cidadesDisponiveis", "cidadesSelecionadas");
}

function moverParaDisponiveis() {
    mover("cidadesSelecionadas", "cidadesDisponiveis");
}

function mover(origemId, destinoId) {

    const origem = document.getElementById(origemId);
    const destino = document.getElementById(destinoId);

    [...origem.querySelectorAll(".selected")].forEach(li => {
        li.classList.remove("selected");
        destino.appendChild(li);
    });

    atualizarCategorias();
}


/* =========================
   ✅ NOVO: CONFIG POR SERVIÇO
========================= */

function renderConfigServicos() {

    const container = document.getElementById("configServicos");
    container.innerHTML = "";

    const servicos = [...document.getElementById("servicosAfetados").selectedOptions]
        .map(o => o.value);

    servicos.forEach(servico => {

        const div = document.createElement("div");
        div.style.border = "1px solid #ccc";
        div.style.padding = "10px";
        div.style.marginBottom = "10px";

        div.innerHTML = `
            <strong>${servico}</strong><br><br>

            <label>Sintoma</label>
            <select class="sintoma-servico"></select><br>

            <label>Evento</label>
            <select class="evento-servico"></select><br>
        `;

        container.appendChild(div);

        const sintomaSelect = div.querySelector(".sintoma-servico");
        const eventoSelect = div.querySelector(".evento-servico");

        const regra = regras[servico];

        regra.sintomas.forEach(s => {
            sintomaSelect.add(new Option(s, s));
        });

        function atualizarEventos() {

            eventoSelect.innerHTML = "";

            if (servico === "NET FONE") {
                const lista = regra.eventos[sintomaSelect.value];
                lista.forEach(e => eventoSelect.add(new Option(e, e)));
            } else {
                regra.eventos.forEach(e => eventoSelect.add(new Option(e, e)));
            }
        }

        sintomaSelect.addEventListener("change", atualizarEventos);

        atualizarEventos();
    });
}


/* =========================
   CADASTRAR (NOVO MODELO)
========================= */

function cadastrar() {

    
    const dataInicio = document.getElementById("data_inicio").value;

    if (!dataInicio) {
        alert("Preencha a data de início");
        return;
    }

    const cidades = [...document.querySelectorAll("#cidadesSelecionadas li")]
        .map(li => li.textContent);

    const configs = document.querySelectorAll("#configServicos > div");

    if (!cidades.length || configs.length === 0) {
        alert("Selecione cidades e serviços");
        return;
    }

    const registros = [];

    configs.forEach(div => {

        const servico = div.querySelector("strong").textContent;
        const sintoma = div.querySelector(".sintoma-servico").value;
        const evento = div.querySelector(".evento-servico").value;

        const erro = validarRegras(servico, sintoma, evento);

        if (erro) {
            alert(`❌ ${servico}: ${erro}`);
            return;
        }

        cidades.forEach(cidade => {
            registros.push({
                cidade,
                servico,
                sintoma,
                evento,
                descricao: document.getElementById("descricao").value,
                data_inicio: document.getElementById("data_inicio").value,
                categoria: document.getElementById("categoria").value,
                ofensor: document.getElementById("ofensor").value,
                chamado_operadora: document.getElementById("chamado_operadora").value,
                outage: Number(document.getElementById("outage_ticket").value) || null,
                status: "ABERTO"
            });
        });
    });

    fetch("/abrir", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(registros)
    })
    .then(res => res.json())
    .then(data => {
        alert("✅ Tickets gerados");
        window.location.href = "/ticket/" + data.id_ticket;
    });
}


/* =========================
   VALIDAÇÃO
========================= */

function validarRegras(servico, sintoma, evento) {

    const regra = regras[servico];

    if (!regra) return "Serviço inválido";

    if (!regra.sintomas.includes(sintoma)) {
        return `Sintoma inválido para ${servico}`;
    }

    if (servico === "NET FONE") {

        const eventosValidos = regra.eventos[sintoma];

        if (!eventosValidos || !eventosValidos.includes(evento)) {
            return `Evento inválido para ${servico} / ${sintoma}`;
        }

    } else {

        if (!regra.eventos.includes(evento)) {
            return `Evento inválido para ${servico}`;
        }
    }

    return null;
}


/* =========================
   EVENTOS GERAIS (CORRIGIDO)
========================= */

document.addEventListener("DOMContentLoaded", async () => {

    await carregarEstrutura();

    iniciarFormulario();
    iniciarCidades();

    document.getElementById("categoria")
        ?.addEventListener("change", atualizarOfensores);

    document.getElementById("servicosAfetados")
        ?.addEventListener("change", () => {

            renderConfigServicos(); 
        });
    
    const campoData = document.getElementById("data_inicio");

        if (campoData) {

            const agora = new Date();

            const ano = agora.getFullYear();
            const mes = String(agora.getMonth() + 1).padStart(2, "0");
            const dia = String(agora.getDate()).padStart(2, "0");

            const hora = String(agora.getHours()).padStart(2, "0");
            const min = String(agora.getMinutes()).padStart(2, "0");

            campoData.value = `${ano}-${mes}-${dia}T${hora}:${min}`;
        }

});

/*======================== 
      Busca de cidades
==========================*/

document.addEventListener("DOMContentLoaded", () => {

    const inputBusca = document.getElementById("buscaCidades");

    if (!inputBusca) {
        console.log("❌ buscaCidades não encontrado");
        return;
    }

    /*======================== 
          Busca de cidades
    ==========================*/
    inputBusca.addEventListener("input", function () {

        const termo = this.value.toUpperCase();
        const lista = document.querySelectorAll("#cidadesDisponiveis li");

        let primeiraMatch = null;

        lista.forEach(li => {

            const texto = li.textContent.toUpperCase();

            if (texto.startsWith(termo)) {

                li.style.display = "block";

                if (!primeiraMatch) {
                    primeiraMatch = li;
                }

                li.style.fontWeight = "bold";
                li.style.backgroundColor = "#e6f0ff";

            } else {
                li.style.display = "none";
                li.style.fontWeight = "normal";
                li.style.backgroundColor = "";
            }

        });

        if (primeiraMatch) {
            primeiraMatch.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    });

    /*=================================== 
          Selecionar cidades com enter
    =====================================*/
    inputBusca.addEventListener("keydown", function (e) {

        if (e.key === "Enter") {

            e.preventDefault();

            const lista = document.querySelectorAll("#cidadesDisponiveis li");

            document.querySelectorAll("#cidadesDisponiveis li.selected")
                .forEach(li => li.classList.remove("selected"));

            for (let li of lista) {

                if (li.style.display !== "none") {

                    li.classList.add("selected");

                    moverParaSelecionadas();

                    break;
                }
            }

            this.value = "";

            lista.forEach(li => {
                li.style.display = "block";
                li.style.fontWeight = "normal";
                li.style.backgroundColor = "";
            });
        }
    });

});