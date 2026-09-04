console.log("ABERTURA.JS CARREGOU");
/* =========================
   REGRAS DE ABERTURA
========================= */
let estrutura = {};
let regras = {};
let categoriasMulticidade = [];

async function carregarEstrutura() {

    const res = await fetch("/api/estrutura");

    if (!res.ok) {
        throw new Error("Erro ao carregar estrutura");
    }

    estrutura = await res.json();
}
async function carregarRegras() {

    const res =
        await fetch("/api/regras_abertura");

    if (!res.ok) {
        throw new Error(
            "Erro ao carregar regras"
        );
    }

    regras = await res.json();

}
async function carregarCategoriasMulticidade() {

    const res =
        await fetch(
            "/api/categorias_multicidade"
        );

    if (!res.ok) {
        throw new Error(
            "Erro ao carregar categorias multicidade"
        );
    }

    categoriasMulticidade =
        await res.json();

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

    const servicos =
        document.getElementById("servicosAfetados");

    servicos.innerHTML = "";

    Object.keys(regras)
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .forEach(servico => {

            servicos.add(
                new Option(servico, servico)
            );
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

    const cidadesSelecionadas =
        [...document.querySelectorAll(
            "#cidadesSelecionadas li"
        )];

    const categoria =
        document.getElementById("categoria");

    categoria.innerHTML = "";

    if (!cidadesSelecionadas.length) {
        return;
    }

    const multiCidade =
        cidadesSelecionadas.length > 1;

    if (multiCidade) {

        categoriasMulticidade
            .sort((a, b) =>
                a.localeCompare(
                    b,
                    "pt-BR"
                )
            )
            .forEach(cat => {

                categoria.add(
                    new Option(
                        cat,
                        cat
                    )
                );

            });

    } else {

        const cidade =
            cidadesSelecionadas[0]
                .textContent;

        carregarDadosCidade(cidade);

        if (!estrutura[cidade]) {
            return;
        }

        Object.keys(
            estrutura[cidade]
        )
        .sort((a, b) =>
            a.localeCompare(
                b,
                "pt-BR"
            )
        )
        .forEach(cat => {

            categoria.add(
                new Option(
                    cat,
                    cat
                )
            );

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

        li.style.display = "block";
        li.style.fontWeight = "normal";
        li.style.backgroundColor = "";

        destino.appendChild(li);
    });

    if (destinoId === "cidadesDisponiveis") {

        [...destino.querySelectorAll("li")]
            .sort((a, b) =>
                a.textContent.localeCompare(
                    b.textContent,
                    "pt-BR"
                )
            )
            .forEach(li =>
                destino.appendChild(li)
            );
    }

    const busca = document.getElementById("buscaCidades");

    if (busca) {

        busca.value = "";

        busca.dispatchEvent(
            new Event("input")
        );
    }

    atualizarCategorias();
}

/* =========================
   ✅ NOVO: CONFIG POR SERVIÇO
========================= */

function renderConfigServicos() {

    const container = document.getElementById("configServicos");

    container.innerHTML = "";

    const servicos = [
        ...document.getElementById("servicosAfetados").selectedOptions
    ].map(o => o.value);

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

        const sintomaSelect =
            div.querySelector(".sintoma-servico");

        const eventoSelect =
            div.querySelector(".evento-servico");

        const regra = regras[servico] || {};

        Object.keys(regra)
            .sort((a, b) => a.localeCompare(b, "pt-BR"))
            .forEach(sintoma => {

                sintomaSelect.add(
                    new Option(
                        sintoma,
                        sintoma
                    )
                    
                );
                if (servico === "NET FONE") {

                    sintomaSelect.value = "MUDO";

                } else {

                    sintomaSelect.value = "QUEDA NO TRAFEGO";

                }
            });

        function atualizarEventosServico() {

            eventoSelect.innerHTML = "";

            const eventos =
                regra[sintomaSelect.value] || [];

            eventos.forEach(evento => {

                eventoSelect.add(
                    new Option(
                        evento,
                        evento
                    )
                );

            });
            
        if (servico === "NET FONE") {

                if (
                    [...eventoSelect.options]
                        .some(o => o.value === "INTERRUPCAO")
                ) {
                    eventoSelect.value = "INTERRUPCAO";
                }

            } else if (servico === "BSOD") {

                if (
                    [...eventoSelect.options]
                        .some(o => o.value === "INTERRUPCAO")
                ) {
                    eventoSelect.value = "INTERRUPCAO";
                }

            } else {

                if (
                    [...eventoSelect.options]
                        .some(o => o.value === "DEGRADACAO")
                ) {
                    eventoSelect.value = "DEGRADACAO";
                }
            }
}
        sintomaSelect.addEventListener(
            "change",
            atualizarEventosServico
        );

        atualizarEventosServico();

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
    const uf =document.getElementById("uf")?.value || "";
    const registros = [];
    configs.forEach(div => {
        const servico = div.querySelector("strong").textContent;
        const sintoma = div.querySelector(".sintoma-servico").value;
        const evento = div.querySelector(".evento-servico").value;
        cidades.forEach(cidade => {
            registros.push({
                cidade,
                servico,
                sintoma,
                evento,
                uf,
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
    .then(async res => {

        const data = await res.json();

        console.log("RESPOSTA:", data);

        if (!res.ok) {

            alert(data.erro);

            return;
        }

        alert("✅ Tickets gerados");

        window.location.href =
            "/ticket/" + data.id_ticket;

    });
}

async function carregarDadosCidade(cidade) {

    const resp = await fetch(
        `/api/dados_cidade/${encodeURIComponent(cidade)}`
    );

    const dados = await resp.json();

    document.getElementById("uf").value =
        dados.uf || "";

    document.getElementById("regional").value =
        dados.regional || "";

    document.getElementById("nm_regional_cmv_bi").value =
        dados.nm_regional_cmv_bi || "";
}

//=========================
//   DOM
//=========================

document.addEventListener("DOMContentLoaded", async () => {

    await carregarEstrutura();
    await carregarRegras();
    await carregarCategoriasMulticidade();

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

        campoData.value =
            `${ano}-${mes}-${dia}T${hora}:${min}`;
    }

    const inputBusca =
        document.getElementById("buscaCidades");

    if (!inputBusca) {
        console.log("❌ buscaCidades não encontrado");
        return;
    }

    inputBusca.addEventListener("input", function () {

        const termo =
            this.value.toUpperCase();

        const lista =
            document.querySelectorAll(
                "#cidadesDisponiveis li"
            );

        let primeiraMatch = null;

        lista.forEach(li => {

            const texto =
                li.textContent.toUpperCase();

            if (texto.startsWith(termo)) {

                li.style.display = "block";

                if (!primeiraMatch) {
                    primeiraMatch = li;
                }

                li.style.fontWeight = "bold";
                li.style.backgroundColor =
                    "#e6f0ff";

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

    inputBusca.addEventListener("keydown", function (e) {

        if (e.key === "Enter") {

            e.preventDefault();

            const lista =
                document.querySelectorAll(
                    "#cidadesDisponiveis li"
                );

            document
                .querySelectorAll(
                    "#cidadesDisponiveis li.selected"
                )
                .forEach(li =>
                    li.classList.remove("selected")
                );

            for (let li of lista) {

                if (
                    li.style.display !== "none"
                ) {

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
    const uf = document.getElementById("uf");

    [
        "AC","AL","AM","AP","BA","CE",
        "DF","ES","GO","MA","MG","MS",
        "MT","PA","PB","PE","PI","PR",
        "RJ","RN","RO","RS","SC","SE",
        "TO"
    ].forEach(sigla => {

        uf.innerHTML +=
            `<option value="${sigla}">
                ${sigla}
            </option>`;
    });

    uf.innerHTML += `
        <option value="SPC">SP Capital</option>
        <option value="SPI">SP Interior</option>
    `;

});