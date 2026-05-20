document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("form_comentario");

    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        const formData = new FormData();

        formData.append("comentario", document.getElementById("comentario").value);

        const arquivo = document.getElementById("imagem").files[0];
        if (arquivo) {
            formData.append("imagem", arquivo);
        }

        fetch(window.location.pathname.replace("/ticket/", "/comentar/"), {
            method: "POST",
            body: formData
        })
        .then(() => {
            alert("✅ Comentário adicionado");
            location.reload();
        });
    });

});