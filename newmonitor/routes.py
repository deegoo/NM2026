
from flask import render_template,  url_for, flash, request, jsonify, send_from_directory, session, redirect, url_for, request, Response
from newmonitor import app, login_manager
from newmonitor.ticket_generator import gerar_id_ticket
from werkzeug.utils import secure_filename
from datetime import datetime
from fastapi import FastAPI
from requests_ntlm import HttpNtlmAuth
from time import time
from flask_login import login_required, UserMixin, login_required, current_user, login_user, logout_user

from newmonitor import app, db
from newmonitor.models import Usuario


import json
import os
import time
import requests

UPLOAD_PATH = "newmonitor/static/uploads"
DATA_PATH = "newmonitor/data/tickets.json"

def ler_tickets():
    if not os.path.exists(DATA_PATH):
        return []
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)

def salvar_tickets(dados):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

# lista_usuarios = ["Usuario1", "Usuario2", "Usuario3"]
# ############################################
# #
# ##########################################

# # Banco de dados temporário
# USUARIOS_DB = {
#     "1": {"username": "Edson", "password": "Noc@2026"},
#     "2": {"username": "Rodrigo", "password": "Noc@2026"},
#     "3": {"username": "Ednilton", "password": "Noc@2026"},
#     "4": {"username": "Cleiton", "password": "Noc@2026"},
#     "5": {"username": "Danilo", "password": "Noc@2026"},
#     "6": {"username": "Ane", "password": "Noc@2026"},
#     "7": {"username": "Eder", "password": "Noc@2026"},
#     "8": {"username": "Carlos", "password": "Noc@2026"},
#     "9": {"username": "Marcel", "password": "Noc@2026"},
#     "10": {"username": "Rose", "password": "Noc@2026"},
#     "11": {"username": "Marcio", "password": "Noc@2026"},
#     "12": {"username": "Robert", "password": "Noc@2026"},
#     "13": {"username": "Raphael", "password": "Noc@2026"},
#     "14": {"username": "Adimilson", "password": "Noc@2026"},
#     "15": {"username": "Fabiano", "password": "Noc@2026"},

# }

# class User(UserMixin):
#     def __init__(self, id, username):
#         self.id = id
#         self.username = username
# O Adaptador fica aqui no topo do arquivo de rotas

class BancoUsuariosAdaptador:
    def get(self, user_id):
        usuario = Usuario.query.get(int(user_id))
        if usuario:
            return {"username": usuario.username, "password": usuario.password}
        return None

    def __getitem__(self, user_id):
        resultado = self.get(user_id)
        if resultado is None:
            raise KeyError(user_id)
        return resultado

USUARIOS_DB = BancoUsuariosAdaptador()

# @app.route aqui para baixo ...

@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))


@app.route('/login', methods=['GET', 'POST'])
def login():
    
    if current_user.is_authenticated:
        return redirect(url_for('home'))

    if request.method == 'POST':
        username_digitado = request.form.get('username')
        senha_digitada = request.form.get('password')
        
        # Busca no banco se existe um usuário com esse username
        usuario_banco = Usuario.query.filter_by(username=username_digitado).first()
        
        # Valida se o usuário existe e se a senha está correta
        if usuario_banco and usuario_banco.password == senha_digitada:
            login_user(usuario_banco) 
            return redirect(url_for('home'))
        
        # Se errou o login, exibe o aviso no HTML
        flash('Usuário ou senha incorretos.')
        
    return render_template('login.html')

@app.route('/logout')
@login_required 
def logout():
    logout_user() 
    flash("Você saiu do sistema com sucesso!") 
    return redirect(url_for('home'))



# 1. ROTA CENTRALIZADA: Lista os usuários e prepara a edição
@app.route('/usuarios')
@login_required
def gerenciar_usuarios():
    # Pega todos os usuários do banco para listar na tabela
    todos_usuarios = Usuario.query.all()
    
    # Verifica se o admin clicou no botão para editar alguém
    usuario_editando = None
    id_para_editar = request.args.get('editar_id', type=int)
    if id_para_editar:
        usuario_editando = Usuario.query.get(id_para_editar)

    return render_template('usuarios.html', 
                           listagem_usuarios=todos_usuarios, 
                           usuario_editando=usuario_editando)

# 2. PROCESSA O CADASTRO
@app.route('/usuarios/cadastrar', methods=['POST'])
@login_required
def cadastrar():
    if not current_user.is_admin:
        flash('Acesso negado!', 'danger')
        return redirect(url_for('home'))
        
    username = request.form.get('username')
    password = request.form.get('password')
    is_admin = True if request.form.get('is_admin') else False # Captura o checkbox
    
    if Usuario.query.filter_by(username=username).first():
        flash('Usuário já existe!', 'danger')
    else:
        novo = Usuario(username=username, password=password, is_admin=is_admin)
        db.session.add(novo)
        db.session.commit()
        flash('Usuário cadastrado com sucesso!', 'success')
        
    return redirect(url_for('gerenciar_usuarios'))

# 3. PROCESSA A EDIÇÃO
@app.route('/usuarios/editar/<int:user_id>', methods=['POST'])
@login_required
def editar_usuario(user_id):
    if not current_user.is_admin:
        flash('Acesso negado!', 'danger')
        return redirect(url_for('home'))
        
    usuario = Usuario.query.get_or_404(user_id)
    usuario.username = request.form.get('username')
    
    nova_senha = request.form.get('password')
    if nova_senha:
        usuario.password = nova_senha
        
    usuario.is_admin = True if request.form.get('is_admin') else False
    
    db.session.commit()
    flash('Usuário atualizado!', 'success')
    return redirect(url_for('gerenciar_usuarios'))

# 4. PROCESSA A EXCLUSÃO
@app.route('/usuarios/deletar/<int:user_id>', methods=['POST'])
@login_required
def deletar_usuario(user_id):
    if not current_user.is_admin:
        flash('Acesso negado!', 'danger')
        return redirect(url_for('home'))
        
    if current_user.id == user_id:
        flash('Você não pode se autoexcluir!', 'danger')
        return redirect(url_for('gerenciar_usuarios'))
        
    usuario = Usuario.query.get_or_404(user_id)
    db.session.delete(usuario)
    db.session.commit()
    flash('Usuário removido!', 'success')
    return redirect(url_for('gerenciar_usuarios'))



@app.route("/")
@login_required
def home():
    return render_template("home.html")

@app.route("/registro")
@login_required
def registro():
    return render_template("registro.html")

@app.route("/abrir_registro")
@login_required
def abrir_registro():
    return render_template("abrir_registro.html", usuario=current_user.username)

@app.route("/consulta_regitro_falha")
@login_required
def consulta_regitro_falha():
    return render_template("consulta_incidentes.html")

@app.route("/fechar_registro")
@login_required
def fechar_registro():
    return render_template("fechar_registro.html")    

@app.route("/registra_ofensor")
@login_required
def registra_ofensor():
    return render_template("registra_ofensor.html") 

@app.route("/abrir", methods=["POST"])
@login_required
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
            json.dump([], f, indent=2, ensure_ascii=False)

    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            lista = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        lista = []

    id_ticket = gerar_id_ticket()
    agora = datetime.now().strftime("%d/%m/%Y %H:%M")

    usuario_logado = current_user.username

    if isinstance(dados, list):

        for t in dados:
            t["id_ticket"] = id_ticket
            t["data_inicio"] = formatar_data_br(t.get("data_inicio"))
            t["data_abertura"] = agora

            t["usuario"] = usuario_logado

            t["status"] = "ABERTO"

        lista.extend(dados)

    else:
        dados["id_ticket"] = id_ticket
        dados["data_inicio"] = formatar_data_br(dados.get("data_inicio"))
        dados["data_abertura"] = agora

        # ✅ FORÇA USUÁRIO (IMPORTANTE)
        dados["usuario"] = usuario_logado

        dados["status"] = "ABERTO"

        lista.append(dados)

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(lista, f, indent=2, ensure_ascii=False)

    return jsonify({
        "ok": True,
        "id_ticket": id_ticket
    })

@app.route("/listar", methods=["GET"])
@login_required
def listar():

    if not os.path.exists(DATA_PATH):
        return jsonify([])

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return jsonify(json.load(f))


@app.route("/fechar", methods=["POST"])
@login_required
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

    if ticket.get("status") != "ABERTO":
        return jsonify({"erro": "Só pode fechar ticket aberto"}), 400

    ticket["status"] = "FECHADO"
    ticket["data_fechamento"] = dados.get("data_final")
    ticket["causa"] = dados.get("causa")
    ticket["solucao"] = dados.get("solucao")

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(lista, f, indent=2, ensure_ascii=False)

    return jsonify({"ok": True})


@app.route("/ticket/<path:id_ticket>")
@login_required
def visualizar_ticket(id_ticket):

    import json

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        lista = json.load(f)

    

    print("URL:", id_ticket)

    for t in lista:
        print("JSON:", t.get("id_ticket"))


    tickets = [t for t in lista if t.get("id_ticket") == id_ticket]

    return render_template("ticket.html", tickets=tickets)




@app.route("/comentar/<path:id_ticket>", methods=["POST"])
@login_required
def comentar(id_ticket):

    print("✅ Entrou na rota comentar")

    os.makedirs(UPLOAD_PATH, exist_ok=True)

    comentario = request.form.get("comentario") or ""

    comentario = comentario.encode("utf-8", "ignore").decode("utf-8")

    comentario = comentario.replace("\n", "<br>")

    usuario_logado = current_user.username

    arquivo = request.files.get("imagem")

    nome_arquivo = None

    if arquivo:
        nome_arquivo = f"{int(time.time() * 1000)}_{secure_filename(arquivo.filename)}"
        caminho = os.path.join(UPLOAD_PATH, nome_arquivo)
        arquivo.save(caminho)

    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            lista = json.load(f)
    except:
        lista = []

    for t in lista:
        if str(t.get("id_ticket")) == str(id_ticket):

            if "logs" not in t:
                t["logs"] = []

            # ✅ LOG COMPLETO COM USUÁRIO
            log = {
                "comentario": comentario,
                "imagem": nome_arquivo,
                "usuario": usuario_logado,
                "data": datetime.now().strftime("%d/%m/%Y %H:%M")
            }

            t["logs"].append(log)

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(lista, f, indent=2, ensure_ascii=False)

    return {"ok": True}

@app.route("/consulta_incidentes")
@login_required
def consulta_incidentes():
    return render_template("consulta_incidentes.html")

@app.route('/data/<path:filename>')
@login_required
def servir_dados(filename):
    return send_from_directory('data', filename)

from urllib.parse import unquote

@app.route("/salvar_evento/<path:id_ticket>", methods=["POST"])
@login_required
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
@login_required
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

            if t.get("status") != "ABERTO":
                print("⚠️ ticket já fechado:", id_ticket)
                continue


            fechamento = next(
                (f for f in fechamentos if f["servico"] == t["servico"]),
                None
            )

            if fechamento:
                t["data_fechamento"] = agora
                t["responsabilidade"] = fechamento.get("responsabilidade")
                t["parte_rede"] = fechamento.get("parte")
                t["causa"] = fechamento.get("causa")
                t["solucao"] = fechamento.get("solucao")
                t["sumario"] = fechamento.get("sumario")
                t["status"] = "FECHADO"

                atualizado = True

    if not atualizado:
        return jsonify({"erro": "nenhum ticket atualizado"}), 404

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(tickets, f, indent=2, ensure_ascii=False)

    return jsonify({"ok": True})


@app.route("/relatorios")
@login_required
def tela_relatorios():
    return render_template("tela_relatorios.html")

@app.route("/relatorios_dados", methods=["POST"])
@login_required
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

@app.route("/api/meg")
@login_required
def api_meg():

    url = "http://10.53.5.77/Arcos/Arcosmeg.aspx"

    usuario = "F183209"
    senha = "Senh@idm01"

    try:
        r = requests.get(
            url,
            auth=HttpNtlmAuth(usuario, senha),
            timeout=10
        )
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    if r.status_code != 200:
        return jsonify({"erro": f"status {r.status_code}"}), 500

    if "<html" in r.text.lower():
        return jsonify({"total": 0, "erro": "falha na autenticação"})

    conteudo = r.content.decode("latin-1")
    conteudo = conteudo.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")

    linhas = conteudo.splitlines()

    total = 0

    for linha in linhas:

        if not linha.strip():
            continue

        partes = linha.split(";")

        for p in partes:
            if "RESIDENCIAL" in p.upper():
                total += 1
                break

    return jsonify({"total": total})

@app.route("/api/sit")
@login_required
def api_sit():

    url = "http://10.53.5.77/Arcos/Arcossit.aspx"

    usuario = "F183209"
    senha = "Senh@idm01"

    try:
        r = requests.get(
            url,
            auth=HttpNtlmAuth(usuario, senha),
            timeout=10
        )
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    if r.status_code != 200:
        return jsonify({"erro": f"status {r.status_code}"}), 500

    # ✅ fallback se login falhar
    if "<html" in r.text.lower():
        return jsonify({"total": 0, "erro": "falha na autenticação"})

    # ✅ trata CSV (igual MEG)
    conteudo = r.content.decode("latin-1")
    conteudo = conteudo.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")

    linhas = conteudo.splitlines()

    total = 0

    for linha in linhas:

        if not linha.strip():
            continue

        # ✅ limpeza da linha (mesmo padrão que funcionou)
        linha = linha.strip().replace("\r", "")

        partes = linha.split(";")

        for p in partes:
            if "NOC RES MON" in p.upper():
                total += 1
                break

    return jsonify({"total": total})

@app.route("/meg_detalhe")
@login_required
def meg_detalhe():
    return render_template("meg_detalhe.html")

@app.route("/api/meg_detalhe")
@login_required
def api_meg_detalhe():

    url = "http://10.53.5.77/Arcos/Arcosmeg.aspx"

    usuario = "F183209"
    senha = "Senh@idm01"

    r = requests.get(
        url,
        auth=HttpNtlmAuth(usuario, senha),
        timeout=10
    )

    conteudo = r.content.decode("utf-8", errors="replace")

    conteudo = conteudo.replace("<br />", "\n") \
                       .replace("<br/>", "\n") \
                       .replace("<br>", "\n")

    linhas = conteudo.split("\n")

    def eh_rede_residencial(partes):
        for i in range(len(partes)):
            valor = partes[i].strip().upper()

            if valor == "RESIDENCIAL":
                if i + 1 < len(partes):
                    prox = partes[i + 1].strip().upper()

                    if prox == "TRUE":
                        anterior = partes[i - 1].strip() if i - 1 >= 0 else ""

                        if anterior == "":
                            return True
        return False

    # =========================
    # AGRUPAMENTO POR MEG
    # =========================
    megs = {}

    for linha in linhas:

        if not linha.strip():
            continue

        partes = linha.split(";")

        if len(partes) < 5:
            continue

        numero = partes[0]

        if numero not in megs:
            megs[numero] = {
                "linhas": [],
                "residencial": False
            }

        megs[numero]["linhas"].append(partes)

        if not megs[numero]["residencial"]:
            if eh_rede_residencial(partes):
                megs[numero]["residencial"] = True

    # =========================
    # FILTRO FINAL
    # =========================
    resultado = []

    for numero, dados in megs.items():

        if not dados["residencial"]:
            continue

        partes_residencial = None

        for l in dados["linhas"]:
            if eh_rede_residencial(l):
                partes_residencial = l
                break

        if not partes_residencial:
            continue

        evento = partes_residencial[9] if len(partes_residencial) > 9 else ""
        previsao = partes_residencial[14] if len(partes_residencial) > 14 else ""
        status = partes_residencial[15] if len(partes_residencial) > 15 else ""

        resultado.append({
            "numero": numero,
            "evento": evento,
            "previsao": previsao,
            "status": status
        })

    return jsonify(resultado)

@app.route("/ticket/<path:id_ticket>/acao", methods=["POST"])
@login_required
def acao_ticket(id_ticket):

    from urllib.parse import unquote
    id_ticket = unquote(id_ticket)

    dados = ler_tickets()

    body = request.json or {}

    acao = body.get("acao")
    servico = body.get("servico")

    if not acao:
        return jsonify({"erro": "Ação não informada"}), 400

    if not servico:
        return jsonify({"erro": "Serviço não informado"}), 400

    atualizado = False

    for t in dados:
        if (
            str(t.get("id_ticket")) == str(id_ticket)
            and t.get("servico") == servico
        ):

            status_atual = (t.get("status") or "").strip().upper()

            # ================= CANCELAR =================
            if acao == "cancelar":

                if status_atual == "CANCELADO":
                    return jsonify({"msg": "Já cancelado"}), 400

                t["status"] = "CANCELADO"
                t["data_cancelamento"] = datetime.now().strftime("%d/%m/%Y %H:%M")
                t["cancelado_por"] = current_user.username

                atualizado = True

            # ================= REABRIR =================
            elif acao == "reabrir":

                if status_atual != "FECHADO":
                    return jsonify({"msg": "Só pode reabrir fechado"}), 400

                t["status"] = "ABERTO"
                t["data_reabertura"] = datetime.now().strftime("%d/%m/%Y %H:%M")
                t["reaberto_por"] = current_user.username

                # limpa fechamento
                t["data_fechamento"] = None
                t["causa"] = None
                t["solucao"] = None

                atualizado = True

            # ================= FECHAR =================
            elif acao == "fechar":

                if status_atual != "ABERTO":
                    return jsonify({"msg": "Só pode fechar aberto"}), 400

                if not t.get("evento_detalhe"):
                    return jsonify({"msg": "Preencha o evento antes de fechar"}), 400

                t["status"] = "FECHADO"
                t["data_fechamento"] = datetime.now().strftime("%d/%m/%Y %H:%M")

                atualizado = True

            else:
                return jsonify({"erro": "Ação inválida"}), 400

    if not atualizado:
        return jsonify({"erro": "Registro não encontrado (id + serviço)"}), 404

    salvar_tickets(dados)

    return jsonify({"ok": True, "acao": acao})


@app.route("/gestao_tickets")
@login_required
def gestao_tickets():
    return render_template("gestao_tickets.html")

@app.route("/ticket_aberto")
@login_required
def ticket_aberto():
    return render_template("ticket_aberto.html")

@app.route("/buscar")
@login_required
def buscar():

    termo = request.args.get("term", "").lower()
    data_inicio = request.args.get("data_inicio")
    data_fim = request.args.get("data_fim")

    dados = ler_tickets()

    resultado = []

    for t in dados:

        # ✅ FILTRO TEXTO
        match_texto = (
            termo in str(t.get("id_ticket","")).lower()
            or termo in str(t.get("cidade","")).lower()
            or termo in str(t.get("servico","")).lower()
            or termo in str(t.get("descricao","")).lower()
        ) if termo else True

        # ✅ FILTRO DATA
        match_data = True

        data_abertura = t.get("data_abertura")

        if data_abertura:

            try:
                from datetime import datetime

                dt_ticket = datetime.strptime(data_abertura, "%d/%m/%Y %H:%M")

                if data_inicio:
                    dt_inicio = datetime.strptime(data_inicio, "%Y-%m-%d")
                    if dt_ticket < dt_inicio:
                        match_data = False

                if data_fim:
                    dt_fim = datetime.strptime(data_fim, "%Y-%m-%d")
                    dt_fim = dt_fim.replace(hour=23, minute=59, second=59)

                    if dt_ticket > dt_fim:
                        match_data = False

            except:
                pass

        if match_texto and match_data:
            resultado.append(t)

    return jsonify(resultado)


@app.route("/stream")
def stream():

    def gerar():
        while True:
            dados = ler_tickets()  # mesma função do /listar

            payload = json.dumps(dados)

            yield f"data: {payload}\n\n"

            time.sleep(30)  # envia a cada 30s

    return Response(gerar(), mimetype="text/event-stream")

@app.route("/dashboard_usuarios_view")
@login_required
def dashboard_usuarios_view():
    return render_template("dashboard_usuarios.html")

@app.route("/dashboard_usuarios")
@login_required
def dashboard_usuarios():

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        tickets = json.load(f)

    usuarios = {}

    for t in tickets:
        user = t.get("usuario", "N/A")

        if user not in usuarios:

            usuarios[user] = {
                "abertos": 0,
                "fechados": 0,
                "updates": 0,
                "cancelados": 0
            }

        status = (t.get("status") or "").upper()

        if status == "ABERTO":
            usuarios[user]["abertos"] += 1
        elif status == "FECHADO":
            usuarios[user]["fechados"] += 1
        elif status == "CANCELADO":

            # 🔥 pega quem CANCELou no último log
            logs = t.get("logs", [])

            if logs:
                ultimo_log = logs[-1]
                usuario_cancelou = ultimo_log.get("usuario", user)
            else:
                usuario_cancelou = user

            if usuario_cancelou not in usuarios:
                usuarios[usuario_cancelou] = {
                    "abertos": 0,
                    "fechados": 0,
                    "updates": 0,
                    "cancelados": 0
                }

            usuarios[usuario_cancelou]["cancelados"] += 1

        # logs
        for log in t.get("logs", []):
            u = log.get("usuario", user)

            if u not in usuarios:
                usuarios[u] = {
                    "abertos": 0,
                    "fechados": 0,
                    "updates": 0,
                    "cancelados": 0
                }

            usuarios[u]["updates"] += 1

    return jsonify(usuarios)