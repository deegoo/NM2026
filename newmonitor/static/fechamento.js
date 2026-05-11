document.addEventListener("DOMContentLoaded", function () {

  const close_owner = ["Embratel", "Net", "Google", "Akamai",];
  const close_net = ["Enlace", "Links", "Backbone", "Não Definido",];
  const close_manu  = ["Manutenção Emergencial", "Manutenção Programada"];

  const gera_owner = document.getElementById("responsabilidade");
      
    if (gera_owner) {
      close_owner.forEach(responsavel => {
        const option = document.createElement("option");
        option.value = responsavel;
        option.textContent = responsavel;
        gera_owner.appendChild(option);
      });
    }

  const gera_net = document.getElementById("parte_rede");

    if (gera_net) {
      close_net.forEach(rede => {
        const option = document.createElement("option");
        option.value = rede;
        option.textContent = rede;
        gera_net.appendChild(option);
      });
    }

  const gera_manu = document.getElementById("natureza");
    if (gera_manu) {
      close_manu.forEach(manutencao => {
        const option = document.createElement("option");
        option.value = manutencao;
        option.textContent = manutencao;
        gera_net.appendChild(option);
      });
    }

});