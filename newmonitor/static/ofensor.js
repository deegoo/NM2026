function preencherSelect(id, lista) {

    const select =
        document.getElementById(id);

    if (!select) return;

    const primeiro =
        select.options[0]?.outerHTML ||
        '<option value="">Selecione</option>';

    select.innerHTML = primeiro;

    (lista || []).forEach(item => {

        const opt =
            document.createElement("option");

        opt.value = item;
        opt.textContent = item;

        select.appendChild(opt);

    });

}
function carregarCategoriasInclusao() {

    const cidade =
        document.getElementById(
            "cidade_incluir"
        ).value;

    if (!cidade) return;

    fetch(
        `/api/ofensores/categorias?cidade=${encodeURIComponent(cidade)}`
    )
    .then(r => r.json())
    .then(lista => {

        preencherSelect(
            "categoria_incluir",
            lista
        );

    });

}
function carregarFiltrosOfensores() {

    fetch("/api/ofensores/filtros")
        .then(r => r.json())
        .then(dados => {

            preencherSelect(
                "cidade_incluir",
                dados.cidades
            );

            preencherSelect(
                "cidade_consulta",
                dados.cidades
            );

        });

}
function carregarCategoriasCidade() {

    const cidade =
        document.getElementById(
            "cidade_consulta"
        ).value;

    if (!cidade) return;

    fetch(
        `/api/ofensores/categorias?cidade=${encodeURIComponent(cidade)}`
    )
    .then(r => r.json())
    .then(lista => {

        preencherSelect(
            "categoria_consulta",
            lista
        );

    });

}
function carregarOfensoresCategoria() {

    const cidade =
        document.getElementById(
            "cidade_consulta"
        ).value;

    const categoria =
        document.getElementById(
            "categoria_consulta"
        ).value;

    if (!cidade || !categoria)
        return;

    fetch(
        `/api/ofensores?cidade=${encodeURIComponent(cidade)}&categoria=${encodeURIComponent(categoria)}`
    )
    .then(r => r.json())
    .then(lista => {

        const select =
            document.getElementById(
                "ofensor_consulta"
            );

        select.innerHTML =
            '<option value="">Selecione o ofensor</option>';

        lista.forEach(item => {

            select.innerHTML += `
                <option value="${item.id}">
                    ${item.ofensor}
                </option>
            `;

        });

    });

}
function excluirOfensor() {

    const id =
        document.getElementById(
            "ofensor_consulta"
        ).value;

    if (!id) {

        alert(
            "Selecione um ofensor"
        );

        return;
    }

    fetch(
        `/api/ofensores/${id}`,
        {
            method: "DELETE"
        }
    )
    .then(() => {

        carregarOfensoresCategoria();

    });

}

function incluirOfensor() {

    const cidade =
        document.getElementById(
            "cidade_incluir"
        ).value;

    const categoria =
        document.getElementById(
            "categoria_incluir"
        ).value;

    const ofensor =
        document.getElementById(
            "novo_ofensor"
        ).value.trim();

    if (!cidade) {

        alert(
            "Selecione a cidade"
        );

        return;
    }

    if (!categoria) {

        alert(
            "Selecione a categoria"
        );

        return;
    }

    if (!ofensor) {

        alert(
            "Informe o ofensor"
        );

        return;
    }

    fetch(
        "/api/ofensores",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                cidade,
                categoria,
                ofensor

            })
        }
    )
    .then(r => r.json())
    .then(() => {

        alert(
            "✅ Ofensor incluído"
        );

        document.getElementById(
            "novo_ofensor"
        ).value = "";

    });

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        carregarFiltrosOfensores();

        document
            .getElementById(
                "cidade_consulta"
            )
            .addEventListener(
                "change",
                carregarCategoriasCidade
            );

        document
            .getElementById(
                "categoria_consulta"
            )
            .addEventListener(
                "change",
                carregarOfensoresCategoria
            );
            document
            .getElementById("btnIncluirOfensor")
            .addEventListener(
                "click",
                incluirOfensor
            );

        document
            .getElementById(
                "btnExcluirOfensor"
            )
            .addEventListener(
                "click",
                excluirOfensor
            );
            document
            .getElementById(
                "cidade_incluir"
            )
            .addEventListener(
                "change",
                carregarCategoriasInclusao
            );

    }
);