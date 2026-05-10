document.addEventListener("DOMContentLoaded", () => {

  const menuParents = document.querySelectorAll(".menu_main");

  menuParents.forEach(menu => {
    const submenu = menu.querySelector(".menu_option");

    menu.addEventListener("click", (e) => {
      e.stopPropagation();

      // fecha todos os outros menus
      document.querySelectorAll(".menu_option").forEach(other => {
        if (other !== submenu) {
          other.classList.remove("show");
        }
      });

      // alterna o menu clicado
      submenu.classList.toggle("show");
    });
  });

  // fecha tudo ao clicar fora do menu
  document.addEventListener("click", () => {
    document.querySelectorAll(".menu_option").forEach(menu => {
      menu.classList.remove("show");
    });
  });

});