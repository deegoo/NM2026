document.addEventListener("DOMContentLoaded", function () {

  const close_owner = ["Embratel", "Net", "Google", "Akamai",];
  const close_net = ["Enlace", "Links", "Backbone", "Não Definido",];
  const close_manu  = ["Manutenção Emergencial", "Manutenção Programada"];

  const gera_owner = document.getElementById("resp");
      
    if (gera_owner) {
    close_owner.forEach(responsavel => {
      const option = document.createElement("option");
      option.value = responsavel;
      option.textContent = responsavel;
      gera_owner.appendChild(option);
    });
  }

  const gera_net = document.getElementById("rede");
  const gera_manu = document.getElementById("manu");




});