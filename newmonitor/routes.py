
from flask import render_template, url_for, request, jsonify, send_from_directory, session
from newmonitor import app
from newmonitor.ticket_generator import gerar_id_ticket
from werkzeug.utils import secure_filename
from datetime import datetime

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
    return render_template("consulta_incidentes.html")

@app.route("/fechar_registro")
def fechar_registro():
    return render_template("fechar_registro.html")    

@app.route("/registra_ofensor")
def registra_ofensor():
    return render_template("registra_ofensor.html") 



@app.route("/abrir", methods=["POST"])
def abrir_ticket():

    def formatar_data_br(dt_str):
        if not dt_str:
            return None
        try:
            dt = datetime.strptime(dt_str, "%Y-%m-%dT%H:%M")
            return dt.strftime("%d/%m/%Y %H:%M")
        except:
            return dt_str

    dados = request.get_json()
    print("📦 RAW dados:", dados)

    if not dados:
        return jsonify({"erro": "JSON inválido"}), 400

    os.makedirs("newmonitor/data", exist_ok=True)

    if not os.path.exists(DATA_PATH):
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(lista, f, indent=2, ensure_ascii=False)

    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            lista = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        lista = []

    id_ticket = gerar_id_ticket()
    agora = datetime.now().strftime("%d/%m/%Y %H:%M") 


    if isinstance(dados, list):

        for t in dados:
            t["id_ticket"] = id_ticket

            t["data_inicio"] = formatar_data_br(t.get("data_inicio"))

            t["data_abertura"] = agora

        lista.extend(dados)

    else:
        dados["id_ticket"] = id_ticket

        dados["data_inicio"] = formatar_data_br(dados.get("data_inicio"))

        dados["data_abertura"] = agora

        lista.append(dados)

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(lista, f, indent=2, ensure_ascii=False)

    return jsonify({
        "ok": True,
        "id_ticket": id_ticket
    })



@app.route("/listar", methods=["GET"])
def listar():

    if not os.path.exists(DATA_PATH):
        return jsonify([])

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return jsonify(json.load(f))


@app.route("/fechar", methods=["POST"])
def fechar():

    if not os.path.exists(DATA_PATH):
        return jsonify({"erro": "Arquivo não encontrado"}), 400

    dados = request.get_json()

    if not dados:
        return jsonify({"erro": "JSON inválido"}), 400

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        lista = json.load(f)

    index = dados.get("index")

    if index is None or index >= len(lista):
        return jsonify({"erro": "Index inválido"}), 400

    ticket = lista[index]

    ticket["aberto"] = False
    ticket["data_fim"] = dados.get("data_final")
    ticket["causa"] = dados.get("causa")
    ticket["solucao"] = dados.get("solucao")

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(lista, f, indent=2)

    return jsonify({"ok": True})

@app.route("/ticket_aberto")
def ticket_aberto():
    return render_template("ticket_aberto.html")


@app.route("/ticket/<path:id_ticket>")
def visualizar_ticket(id_ticket):

    import json

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        lista = json.load(f)

    tickets = [t for t in lista if t.get("id_ticket") == id_ticket]

    return render_template("ticket.html", tickets=tickets)

@app.route("/comentar/<path:id_ticket>", methods=["POST"])
def comentar(id_ticket):

    print("✅ Entrou na rota comentar")

    os.makedirs(UPLOAD_PATH, exist_ok=True)

    comentario = request.form.get("comentario") or ""

    # ✅ protege encoding
    comentario = comentario.encode("utf-8", "ignore").decode("utf-8")

    comentario = comentario.replace("\n", "<br>")

    usuario = request.form.get("usuario") or "Usuário Desconhecido"
    arquivo = request.files.get("imagem")

    nome_arquivo = None

    if arquivo:
        nome_arquivo = f"{int(time.time() * 1000)}_{secure_filename(arquivo.filename)}"
        caminho = os.path.join(UPLOAD_PATH, nome_arquivo)
        arquivo.save(caminho)

    # ✅ leitura correta
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            lista = json.load(f)
    except:
        lista = []

    # ✅ aplica em TODOS os registros do ticket
    for t in lista:
        if str(t.get("id_ticket")) == str(id_ticket):

            if "logs" not in t:
                t["logs"] = []

            t["logs"].append({
                "comentario": comentario,
                "imagem": nome_arquivo,
                "usuario": usuario,
                "data": datetime.now().strftime("%d/%m/%Y %H:%M")
            })

    # ✅ escrita correta
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(lista, f, indent=2, ensure_ascii=False)

    return {"ok": True}

@app.route("/consulta_incidentes")
def consulta_incidentes():
    return render_template("consulta_incidentes.html")

@app.route('/data/<path:filename>')
def servir_dados(filename):
    return send_from_directory('data', filename)

from urllib.parse import unquote

@app.route("/salvar_evento/<path:id_ticket>", methods=["POST"])
def salvar_evento(id_ticket):

    from urllib.parse import unquote

    id_ticket = unquote(id_ticket)
    dados = request.json

    print("✅ ID recebido:", id_ticket)
    print("📦 dados:", dados)

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        tickets = json.load(f)

    atualizado = False

    for t in tickets:
        print("🔎 comparando:", t.get("id_ticket"), "vs", id_ticket)

        if str(t.get("id_ticket")) == str(id_ticket):

            inicio = dados.get("inicio_evento")
            eventos = dados.get("eventos", [])

            for t in tickets:

                if str(t.get("id_ticket")) == str(id_ticket):

                    evento_match = next(
                        (ev for ev in eventos
                        if ev["cidade"] == t["cidade"]
                        and ev["servico"] == t["servico"]),
                        None
                    )

                    if evento_match:
                        t["evento_detalhe"] = {
                            "inicio": inicio,
                            "eventos": [evento_match]
                        }

            atualizado = True
            print("✅ evento salvo nesse ticket")

    if not atualizado:
        print("🚨 nenhum ticket atualizado:", id_ticket)
        return jsonify({"erro": "ticket não encontrado"}), 404

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(tickets, f, indent=4, ensure_ascii=False)

    return jsonify({"ok": True})

@app.route("/fechar_ticket_multi/<path:id_ticket>", methods=["POST"])
def fechar_ticket_multi(id_ticket):

    from urllib.parse import unquote
    id_ticket = unquote(id_ticket)

    dados = request.json
    fechamentos = dados.get("fechamentos", [])

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        tickets = json.load(f)

    agora = datetime.now().strftime("%d/%m/%Y %H:%M")

    atualizado = False

    for t in tickets:
        if str(t.get("id_ticket")) == str(id_ticket):

            # ✅ BLOQUEIA SE JÁ FECHADO
            if not t.get("aberto", True):
                print("⚠️ ticket já fechado:", id_ticket)
                continue

            fechamento = next(
                (f for f in fechamentos if f["servico"] == t["servico"]),
                None
            )

            if fechamento:
                t["aberto"] = False
                t["data_fechamento"] = agora
                t["responsabilidade"] = fechamento.get("responsabilidade")
                t["parte_rede"] = fechamento.get("parte")
                t["causa"] = fechamento.get("causa")
                t["solucao"] = fechamento.get("solucao")
                t["sumario"] = fechamento.get("sumario")

                atualizado = True

    if not atualizado:
        return jsonify({"erro": "nenhum ticket atualizado"}), 404

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(tickets, f, indent=2, ensure_ascii=False)

    return jsonify({"ok": True})


@app.route("/relatorios")
def tela_relatorios():
    return render_template("tela_relatorios.html")

@app.route("/relatorios_dados", methods=["POST"])
def relatorios_dados():

    dados = request.json

    d_ini = dados.get("data_inicio")
    d_fim = dados.get("data_fim")

    cidade = dados.get("cidade")
    servico = dados.get("servico")
    evento = dados.get("evento")
    responsavel = dados.get("responsavel")

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        lista = json.load(f)

    resultado = []

    for t in lista:

        data_inicio = t.get("data_inicio")

        if not data_inicio:
            continue

        try:
            dt = datetime.strptime(data_inicio, "%d/%m/%Y %H:%M")
            iso = dt.strftime("%Y-%m-%d")
        except:
            continue

        if not (iso >= d_ini and iso <= d_fim):
            continue

        if cidade and t.get("cidade") != cidade:
            continue

        if servico and t.get("servico") != servico:
            continue

        if evento and t.get("evento") != evento:
            continue

        if responsavel and t.get("responsabilidade") != responsavel:
            continue

        resultado.append(t)

    return jsonify(resultado)

    


