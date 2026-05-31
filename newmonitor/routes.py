from flask import render_template, url_for, request, jsonify, send_from_directory
from newmonitor import app

from werkzeug.utils import secure_filename

import json
import os
import time

UPLOAD_PATH = "newmonitor/static/uploads"
DATA_PATH = "newmonitor/data/tickets.json"

lista_usuarios = ["Usuario1", "Usuario2", "Usuario3"]

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/registro")
def registro():
    return render_template("registro.html")

@app.route("/abrir_registro")
def abrir_registro():
    return render_template("abrir_registro.html", usuario ="Rodrigo")

@app.route("/consulta_regitro_falha")
def consulta_regitro_falha():
    return render_template("consulta_regitro_falha.html")

@app.route("/fechar_registro")
def fechar_registro():
    return render_template("fechar_registro.html")    

@app.route("/registra_ofensor")
def registra_ofensor():
    return render_template("registra_ofensor.html") 


@app.route("/abrir", methods=["POST"])
def abrir_ticket():

    dados = request.get_json()

    if not dados:
        return jsonify({"erro": "JSON inválido"}), 400

    os.makedirs("newmonitor/data", exist_ok=True)

    if not os.path.exists(DATA_PATH):
        with open(DATA_PATH, "w") as f:
            json.dump([], f)

    with open(DATA_PATH, "r") as f:
        try:
            lista = json.load(f)
        except:
            lista = []

    if isinstance(dados, list):
        lista.extend(dados)
    else:
        lista.append(dados)

    with open(DATA_PATH, "w") as f:
        json.dump(lista, f, indent=2)

    return jsonify({"ok": True})


@app.route("/listar", methods=["GET"])
def listar():

    if not os.path.exists(DATA_PATH):
        return jsonify([])

    with open(DATA_PATH) as f:
        return jsonify(json.load(f))


@app.route("/fechar", methods=["POST"])
def fechar():

    if not os.path.exists(DATA_PATH):
        return jsonify({"erro": "Arquivo não encontrado"}), 400

    dados = request.get_json()

    if not dados:
        return jsonify({"erro": "JSON inválido"}), 400

    with open(DATA_PATH, "r") as f:
        lista = json.load(f)

    index = dados.get("index")

    if index is None or index >= len(lista):
        return jsonify({"erro": "Index inválido"}), 400

    ticket = lista[index]

    ticket["aberto"] = False
    ticket["data_fim"] = dados.get("data_final")
    ticket["causa"] = dados.get("causa")
    ticket["solucao"] = dados.get("solucao")

    with open(DATA_PATH, "w") as f:
        json.dump(lista, f, indent=2)

    return jsonify({"ok": True})

@app.route("/ticket_aberto")
def ticket_aberto():
    return render_template("ticket_aberto.html")


@app.route("/ticket/<int:id_ticket>")
def visualizar_ticket(id_ticket):

    import json

    with open(DATA_PATH) as f:
        lista = json.load(f)

    # filtra os registros desse ticket
    tickets = [t for t in lista if t.get("id_ticket") == id_ticket]

    return render_template("ticket.html", tickets=tickets)



@app.route("/comentar/<int:id_ticket>", methods=["POST"])
def comentar(id_ticket):

    print("✅ Entrou na rota comentar")

    os.makedirs(UPLOAD_PATH, exist_ok=True)

    comentario = request.form.get("comentario")
    arquivo = request.files.get("imagem")

    nome_arquivo = None

    if arquivo:
        nome_arquivo = f"{int(time.time() * 1000)}_{secure_filename(arquivo.filename)}"
        caminho = os.path.join(UPLOAD_PATH, nome_arquivo)
        arquivo.save(caminho)

    with open(DATA_PATH, "r") as f:
        try:
            lista = json.load(f)
        except:
            lista = []

    for t in lista:
        if t.get("id_ticket") == id_ticket:

            if "logs" not in t:
                t["logs"] = []

            t["logs"].append({
                "comentario": comentario,
                "imagem": nome_arquivo
            })

            print("✅ Log adicionado:", t["logs"])
            break

    with open(DATA_PATH, "w") as f:
        json.dump(lista, f, indent=2)

    return {"ok": True}

@app.route("/consulta_incidentes")
def consulta_incidentes():
    return render_template("consulta_incidentes.html")

@app.route('/data/<path:filename>')
def servir_dados(filename):
    return send_from_directory('data', filename)





