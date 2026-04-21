const capitais = ["São Paulo","Rio de Janeiro","Belo Horizonte","Brasília","Salvador"];
const disp = document.getElementById("cidadesDisponiveis");
const sel = document.getElementById("cidadesSelecionadas");
let dragItem = null;


capitais.forEach(c => disp.appendChild(criarLi(c)));

function criarLi(texto) {
  const li = document.createElement("li");
  li.textContent = texto;
  li.draggable = true;
  li.onclick = () => li.classList.toggle("selected");
  li.ondragstart = () => dragItem = li;
  return li;
}

function moverParaSelecionadas() {
  [...disp.querySelectorAll('.selected')].forEach(li => {
    li.classList.remove('selected');
    sel.appendChild(li);
  });
}

function moverParaDisponiveis() {
  [...sel.querySelectorAll('.selected')].forEach(li => {
    li.classList.remove('selected');
    disp.appendChild(li);
  });
}

function drop(e, tipo) {
  if (!dragItem) return;
  (tipo === 'sel' ? sel : disp).appendChild(dragItem);
  dragItem = null;
}

const mapaOfensores = {
  "Não Definida": ["Não Definida"],
  "SoftSwitch": ["CDR","DCN","HIQ","ISMC","PNT"],
  "Servidores/Provisionamento": ["AKAMAI","AMAZON","FACEBOOK","GOOGLE","NETFLIX"],
  "Infra Estrutura": ["Rede HFC","Rede FTTH","Falta de energia na Região","Falta de energia no site"],
  "Backbone IP": ["Backbone IP"],
  "Geradora": ["HBO","Telecine","Warner"],
  "Canal indisponível": ["Globo","SBT","Record"]
};

function atualizarOfensores() {
  const cat = document.getElementById("categoria").value;
  const of = document.getElementById("ofensor");
  of.innerHTML = "";

  if (cat === "Links") {
    [...sel.children].forEach(li => {
      of.appendChild(new Option(li.textContent.substring(0,3).toUpperCase() + "/IP/00001"));
    });
    of.appendChild(new Option("GPON"));
    return;
  }

  (mapaOfensores[cat] || []).forEach(o => of.appendChild(new Option(o)));
}

function cadastrar() {
  const servicosSelecionados = 
    [...document.getElementById('servicosAfetados').selectedOptions]
      .map(o => o.value);

  alert(
    "Ticket cadastrado (simulação)\nServiços: " +
    servicosSelecionados.join(', ')
  );
}



atualizarOfensores();
