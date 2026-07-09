document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("btnSilenciar");

    if (!btn) return;

    btn.addEventListener("click", () => {

        silenciado = !silenciado;

        if (silenciado) {
            btn.textContent = "🔇 Silenciado";
            btn.style.background = "#ffffff";
        } else {
            btn.textContent = "🔊 Som";
            btn.style.background = "#ffffff";
        }

    });

});