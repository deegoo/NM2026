/* =========================
   REGRAS
========================= */

const regras = {

    "NET FONE": {
        sintomas: ["MUDO", "MANOBRA"],
        eventos: {
            "MUDO": ["INTERRUPCAO", "PROGRAMADA"],
            "MANOBRA": ["PROGRAMADA"]
        }
    },

    "NET VIRTUA": {
        sintomas: ["QUEDA NO TRAFEGO", "MANOBRA"],
        eventos: ["DEGRADACAO", "INTERRUPCAO", "PROGRAMADA"]
    },

    "NOW": {
        sintomas: ["QUEDA NO TRAFEGO", "MANOBRA"],
        eventos: ["DEGRADACAO", "INTERRUPCAO", "PROGRAMADA"]
    },

    "PAY TV DIGITAL": {
        sintomas: ["QUEDA NO TRAFEGO", "MANOBRA"],
        eventos: ["DEGRADACAO", "INTERRUPCAO", "PROGRAMADA"]
    }
};


/* =========================
   CATEGORIA / OFENSOR (UNIFICADO)
========================= */

const mapaOfensores = {
    "Não Definida": ["Não Definida"],
    "SoftSwitch": ["CDR","DCN","HIQ","ISMC","PNT"],
    "Servidores/Provisionamento": ["AKAMAI","AMAZON","FACEBOOK","GGC","GLOBO","LOAD BALANCE","NETFLIX","PTT","TIKTOK","SPACEX","CLOUDFARE","UOL","BYTEDANCE","MICROSOFT","UPIX","RIOTGAMES","ALGAR","DURAND","MAXHOST","MARS","FLYS","OPENX","GARENA","EDGEUNO","FASTLY","VIVO","CDN77","CDNSTAR","BRASILTELECOM","QWILT","APPLE","I3D","ZENLAYER"],
    "Infra Estrutura": ["Rede HFC","Rede FTTH","Queda de energia - Datacenter/HeadEnd","Queda de energia-POP EBT","Queda de energia - Região"],
    "Backbone IP": ["Backbone IP"],
    "Geradora": ["HBO","Telecine","Warner"],
    "Canal indisponível": ["Globo","SBT","Record"]
};


/* =========================
   VALIDAÇÃO
========================= */

function validarRegras(servico, sintoma, evento) {

    if (servico === "NET FONE") {

        if (sintoma === "MUDO" && !["INTERRUPCAO", "PROGRAMADA"].includes(evento)) {
            return "MUDO aceita apenas INTERRUPÇÃO ou PROGRAMADA";
        }

        if (sintoma === "MANOBRA" && evento !== "PROGRAMADA") {
            return "MANOBRA só aceita PROGRAMADA";
        }
    }

    if (["NET VIRTUA", "NOW", "PAY TV DIGITAL"].includes(servico)) {

        if (!["DEGRADACAO", "INTERRUPCAO", "PROGRAMADA"].includes(evento)) {
            return "Evento inválido";
        }
    }

    return null;
}


/* =========================
   CIDADES / DRAG DROP
========================= */

const capitais = [
    "São Paulo",
    "Rio de Janeiro",
    "Belo Horizonte",
    "Brasília",
    "Salvador"
];

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

    const categoria = document.getElementById("categoria");
    const servicos = document.getElementById("servicosAfetados");
    const selectCidades = document.getElementById("cidades_lista");
    const disp = document.getElementById("cidadesDisponiveis");

    // serviços
    Object.keys(regras).forEach(s => {
        servicos.add(new Option(s, s));
    });

    // categorias
    Object.keys(mapaOfensores).forEach(c => {
        categoria.add(new Option(c, c));
    });

    // select cidades
    if (selectCidades) {
        capitais.forEach(cidade => {
            selectCidades.add(new Option(cidade, cidade));
        });
    }

    // lista cidades drag
    if (disp) {
        capitais.forEach(c => disp.appendChild(criarLi(c)));
    }

    atualizarOfensores();
}


/* =========================
   OFENSORES
========================= */

function atualizarOfensores() {

    const categoria = document.getElementById("categoria");
    const ofensor = document.getElementById("ofensor");

    if (!categoria || !ofensor) return;

    ofensor.innerHTML = "";

    (mapaOfensores[categoria.value] || []).forEach(o => {
        ofensor.add(new Option(o, o));
    });
}


/* =========================
   CIDADES MOVE
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
}


/* =========================
   SINTOMA / EVENTO
========================= */

function iniciarSintomas() {

    const sintoma = document.getElementById("sintoma");

    const listaSintomas = ["MUDO", "MANOBRA", "QUEDA NO TRAFEGO"];

    sintoma.innerHTML = "";

    listaSintomas.forEach(s => {
        sintoma.add(new Option(s, s));
    });

    atualizarEventos();
}

function atualizarEventos() {

    const sintomaSelect = document.getElementById("sintoma");
    const evento = document.getElementById("evento");

    const sintomaAtual = sintomaSelect.value;

    const servicosSelecionados = [...document.getElementById("servicosAfetados").selectedOptions]
        .map(o => o.value);

    evento.innerHTML = "";

    if (servicosSelecionados.length === 0) {
        evento.add(new Option("Selecione um serviço primeiro", ""));
        return;
    }

    let sintomasValidos = new Set();
    let eventosValidos = new Set();

    servicosSelecionados.forEach(servico => {

        regras[servico].sintomas.forEach(s => sintomasValidos.add(s));

        if (servico === "NET FONE") {
            if (regras[servico].eventos[sintomaAtual]) {
                regras[servico].eventos[sintomaAtual].forEach(e => eventosValidos.add(e));
            }
        } else {
            regras[servico].eventos.forEach(e => eventosValidos.add(e));
        }

    });

    if (!sintomasValidos.has(sintomaAtual)) {
        sintomaSelect.value = [...sintomasValidos][0];
        return atualizarEventos();
    }

    if (eventosValidos.size === 0) {
        evento.add(new Option("Nenhum evento válido", ""));
        return;
    }

    eventosValidos.forEach(e => {
        evento.add(new Option(e, e));
    });
}


/* =========================
   CADASTRAR
========================= */

function cadastrar() {

    const id_ticket = Date.now();

    const cidades = [...document.querySelectorAll("#cidadesSelecionadas li")]
        .map(li => li.textContent);

    const servicos = [...document.getElementById("servicosAfetados").selectedOptions]
        .map(o => o.value);

    if (!cidades.length || !servicos.length) {
        alert("Selecione cidades e serviços");
        return;
    }

    const sintoma = document.getElementById("sintoma").value;
    const evento = document.getElementById("evento").value;

    const registros = [];
    const erros = [];

    cidades.forEach(cidade => {

        servicos.forEach(servico => {

            const erro = validarRegras(servico, sintoma, evento);

            if (erro) {
                erros.push(`${cidade} / ${servico}: ${erro}`);
            }

            registros.push({
                id_ticket,
                cidade,
                servico,
                sintoma,
                evento,
                descricao: document.getElementById("descricao").value,
                data_inicio: document.getElementById("data_inicio").value,
                categoria: document.getElementById("categoria").value,
                ofensor: document.getElementById("ofensor").value,
                chamado_operadora: document.getElementById("chamado_operadora").value,
                usuario: window.USUARIO_LOGADO,
                aberto: true
            });

        });

    });

    if (erros.length > 0) {
        alert("❌ Erros:\n\n" + erros.join("\n"));
        return;
    }

    fetch("/abrir", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(registros)
    })
    .then(() => {
        alert("✅ Tickets gerados");
        window.location.href = "/ticket/" + id_ticket;
    });
}


/* =========================
   EVENTOS GERAIS (UNIFICADO)
========================= */

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("categoria")?.addEventListener("change", atualizarOfensores);
    document.getElementById("servicosAfetados")?.addEventListener("change", atualizarEventos);
    document.getElementById("sintoma")?.addEventListener("change", atualizarEventos);

    iniciarFormulario();
    iniciarSintomas();

});