document.addEventListener("DOMContentLoaded", function () {

  const capitais = [
    "São Paulo",
    "Rio de Janeiro",
    "Belo Horizonte",
    "Brasília",
    "Salvador"
  ];

  const selectCidades = document.getElementById("cidades_lista");

  if (selectCidades) {
    capitais.forEach(cidade => {
      const option = document.createElement("option");
      option.value = cidade;
      option.textContent = cidade;
      selectCidades.appendChild(option);
    });
  }

  const disp = document.getElementById("cidadesDisponiveis");
  const sel  = document.getElementById("cidadesSelecionadas");
  let dragItem = null;

  if (disp && sel) {
    capitais.forEach(c => disp.appendChild(criarLi(c)));
  }

  function criarLi(texto) {
    const li = document.createElement("li");
    li.textContent = texto;
    li.draggable = true;
    li.onclick = () => li.classList.toggle("selected");
    li.ondragstart = () => dragItem = li;
    return li;
  }

  const categoria = document.getElementById("categoria");
  const ofensor   = document.getElementById("ofensor");

  const mapaOfensores = {
    "Não Definida": ["Não Definida"],
    "SoftSwitch": ["CDR","DCN","HIQ","ISMC","PNT"],
    "Servidores/Provisionamento": ["AKAMAI","AMAZON","FACEBOOK","GOOGLE","NETFLIX"],
    "Infra Estrutura": [
      "Rede HFC",
      "Rede FTTH",
      "Falta de energia na Região",
      "Falta de energia no site"
    ],
    "Backbone IP": ["Backbone IP"],
    "Geradora": ["HBO","Telecine","Warner"],
    "Canal indisponível": ["Globo","SBT","Record"]
  };

  function atualizarOfensores() {
    if (!categoria || !ofensor) return;

    ofensor.innerHTML = "";
    const cat = categoria.value;

    (mapaOfensores[cat] || []).forEach(o =>
      ofensor.appendChild(new Option(o))
    );
  }

  if (categoria) {
    atualizarOfensores();
    categoria.addEventListener("change", atualizarOfensores);
  }

});
