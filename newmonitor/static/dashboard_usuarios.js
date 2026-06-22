document.addEventListener("DOMContentLoaded", () => {
    carregarDashboardUsuarios();
});

function carregarDashboardUsuarios() {

    fetch("/dashboard_usuarios")
        .then(r => r.json())
        .then(data => {

            const container = document.getElementById("dashboardUsuarios");

            if (!container) return;

            container.innerHTML = "";

            for (let user in data) {

                const info = data[user];

                const div = document.createElement("div");
                div.classList.add("card-usuario");

                div.innerHTML = `
                    <h3>👤 ${user}</h3>
                    <p class="abertos">Abertos: ${info.abertos}</p>
                    <p class="fechados">Fechados: ${info.fechados}</p>
                    <p class="updates">Atualizações: ${info.updates}</p>
                    <p class="cancelados">Cancelados: ${info.cancelados}</p>
                `;

                container.appendChild(div);
            }

        })
        .catch(err => console.error("❌ erro dashboard:", err));
}