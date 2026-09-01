
from flask import render_template,  url_for, flash, request, jsonify, send_from_directory, session, redirect, Response
from newmonitor import app, login_manager, db
from newmonitor.ticket_generator import gerar_id_ticket
from werkzeug.utils import secure_filename
from datetime import datetime
from requests_ntlm import HttpNtlmAuth
from time import time
from flask_login import login_required, UserMixin, current_user, login_user, logout_user
from urllib.parse import unquote

from newmonitor.models import Usuario
from newmonitor.database import (
    get_estrutura,
    get_regras_abertura,
    get_categorias_multicidade,
    salvar_ticket,
    get_ticket,
    get_tickets,
    registrar_atividade,
    get_atividades,
    get_comentarios,
    salvar_comentario,
    salvar_evento_ticket,
    salvar_fase_evento,
    excluir_eventos_ticket,
    excluir_fases_evento,
    get_eventos_ticket,
    get_fases_evento,
    salvar_fechamento_ticket,
    excluir_fechamentos_ticket,
    get_fechamentos_ticket,
    fechar_ticket,
    get_dashboard,
    get_meg_total,
    get_sit_total,
    get_meg_detalhes,
    buscar_tickets,
    get_cidades,
    get_dashboard_usuarios,
    buscar_gestao_tickets,
    cancelar_servico,
    reabrir_servico,
    get_fechamento_servico,
    conectar,
    get_cidades_estrutura,
    get_categorias_cidade,
    get_ofensores_categoria,
    incluir_ofensor,
    excluir_ofensor,
    get_regras_fechamento,
    get_relatorio,
    get_base_assinantes,
    get_regional_por_uf

)

import os
import time
import requests

UPLOAD_PATH = "newmonitor/static/uploads"

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



# Lista os usuários e prepara a edição
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

            dt = datetime.strptime(
                dt_str,
                "%Y-%m-%dT%H:%M"
            )

            return dt.strftime(
                "%d/%m/%Y %H:%M"
            )

        except:
            return dt_str

    dados = request.get_json()
    print(dados)
    if not dados:

        return jsonify({
            "erro": "JSON inválido"
        }), 400

    regras = get_regras_abertura()

    registros = (
        dados
        if isinstance(dados, list)
        else [dados]
    )

    for registro in registros:

        servico = registro.get("servico")
        sintoma = registro.get("sintoma")
        evento = registro.get("evento")

        print("SERVICO =", servico)
        print("SINTOMA =", sintoma)
        print("EVENTO =", evento)

        if servico not in regras:

            print("ERRO SERVICO")

            return jsonify({
                "erro": f"Serviço inválido: {servico}"
            }), 400

        if sintoma not in regras[servico]:
            print("ERRO SINTOMA")

            return jsonify({
                "erro":
                f"Sintoma inválido para {servico}: {sintoma}"
            }), 400

        eventos_validos = regras[servico][sintoma]

        print("EVENTOS VALIDOS =", eventos_validos)

        if evento not in eventos_validos:

            print("ERRO EVENTO")

            return jsonify({
                "erro":
                f"Evento inválido para {servico}/{sintoma}: {evento}"
            }), 400

    id_ticket = gerar_id_ticket()

    agora = datetime.now().strftime(
        "%d/%m/%Y %H:%M"
    )

    usuario_logado = current_user.username

    for registro in registros:

        registro["id_ticket"] = id_ticket

        registro["data_inicio"] = formatar_data_br(
            registro.get("data_inicio")
        )

        registro["data_abertura"] = agora

        registro["usuario"] = usuario_logado

        registro["status"] = "ABERTO"
        
        uf = registro.get("uf", "")

        dados_regional = get_regional_por_uf(uf)

        registro["regional"] = dados_regional["regional"]
        registro["nm_regional_cmv_bi"] = dados_regional["nm_regional_cmv_bi"]

    salvar_ticket(registros)
    
    registrar_atividade(
    id_ticket=id_ticket,
    usuario=usuario_logado,
    acao="ABERTURA",
    detalhes="Ticket aberto"
)

    print("✅ TICKETS SALVOS")

    return jsonify({
        "ok": True,
        "id_ticket": id_ticket
    })

@app.route("/listar", methods=["GET"])
@login_required
def listar():

    return jsonify(
        get_tickets()
    )

@app.route("/ticket/<path:id_ticket>")
@login_required
def visualizar_ticket(id_ticket):

    tickets = get_ticket(id_ticket)

    return render_template(
        "ticket.html",
        tickets=tickets
    )

@app.route("/comentar/<path:id_ticket>", methods=["POST"])
@login_required
def comentar(id_ticket):

    print("✅ Entrou na rota comentar")

    os.makedirs(UPLOAD_PATH, exist_ok=True)

    comentario = request.form.get("comentario") or ""

    comentario = comentario.encode(
        "utf-8",
        "ignore"
    ).decode("utf-8")

    comentario = comentario.replace(
        "\n",
        "<br>"
    )

    arquivo = request.files.get("imagem")

    nome_arquivo = None

    if arquivo and arquivo.filename:

        nome_arquivo = (
            f"{int(time.time() * 1000)}_"
            f"{secure_filename(arquivo.filename)}"
        )

        caminho = os.path.join(
            UPLOAD_PATH,
            nome_arquivo
        )

        arquivo.save(caminho)

    salvar_comentario(
        id_ticket=id_ticket,
        usuario=current_user.username,
        comentario=comentario,
        imagem=nome_arquivo
    )

    return jsonify({
        "ok": True
    })

@app.route("/consulta_incidentes")
@login_required
def consulta_incidentes():
    return render_template("consulta_incidentes.html")

@app.route('/data/<path:filename>')
@login_required
def servir_dados(filename):
    return send_from_directory('data', filename)


@app.route("/salvar_evento/<path:id_ticket>", methods=["POST"])
@login_required
def salvar_evento(id_ticket):

    

    id_ticket = unquote(id_ticket)

    dados = request.json

    print("✅ ID recebido:", id_ticket)
    print("📦 dados:", dados)

    inicio_evento = dados.get("inicio_evento")

    eventos = dados.get(
        "eventos",
        []
    )

    excluir_eventos_ticket(id_ticket)

    excluir_fases_evento(id_ticket)

    for evento in eventos:

        cidade = evento.get("cidade")
        servico = evento.get("servico")
        final_evento = evento.get("final_evento")
        vc_evento = evento.get("vc_evento", 0)
        minutos_ponderados = evento.get("minutos_ponderados", 0)
        base_cidade = evento.get("base_cidade",0)
        assinantes_impactados = evento.get("assinantes_impactados",0)
        
        salvar_evento_ticket(
            id_ticket=id_ticket,
            cidade=cidade,
            servico=servico,
            inicio_evento=inicio_evento,
            final_evento=final_evento,
            vc_evento=vc_evento,
            minutos_ponderados=minutos_ponderados,
            base_cidade=base_cidade,
            assinantes_impactados=assinantes_impactados
        )

        for fase in evento.get("fases", []):

            salvar_fase_evento(
                id_ticket=id_ticket,
                cidade=cidade,
                servico=servico,
                tempo=fase.get("tempo", 0),
                impacto=fase.get("impacto", 0)
            )

    registrar_atividade(
        id_ticket=id_ticket,
        usuario=current_user.username,
        acao="EVENTO",
        detalhes="Evento registrado"
    )

    print("✅ evento salvo no SQLite")
    print("✅ fim salvar_evento")

    return jsonify({
        "ok": True
    })

@app.route("/fechar_ticket_multi/<path:id_ticket>", methods=["POST"])
@login_required
def fechar_ticket_multi(id_ticket):

    id_ticket = unquote(id_ticket)

    dados = request.json

    fechamentos = dados.get(
        "fechamentos",
        []
    )

    excluir_fechamentos_ticket(
        id_ticket
    )
    
    tecnologia_acesso = dados.get(
    "tecnologia_acesso"
    )

    isolamento_olt_cmts = dados.get(
        "isolamento_olt_cmts",
        0
    )

    for fechamento in fechamentos:

        salvar_fechamento_ticket(
            id_ticket=id_ticket,
            servico=fechamento.get("servico"),
            responsabilidade=fechamento.get("responsabilidade"),
            parte=fechamento.get("parte"),
            causa=fechamento.get("causa"),
            solucao=fechamento.get("solucao"),
            sumario=fechamento.get("sumario"),
            causa_raiz=fechamento.get("causa_raiz"),
            isolamento_olt_cmts=isolamento_olt_cmts,
            tecnologia_acesso=tecnologia_acesso
        )
    fechar_ticket(id_ticket)

    registrar_atividade(
        id_ticket=id_ticket,
        usuario=current_user.username,
        acao="FECHAMENTO",
        detalhes="Ticket fechado"
    )

    return jsonify({
        "ok": True
    })


@app.route("/relatorios")
@login_required
def tela_relatorios():
    return render_template("tela_relatorios.html")

@app.route("/api/meg")
@login_required
def api_meg():
    return jsonify({
        "total": get_meg_total()
    })

    

@app.route("/api/sit")
@login_required
def api_sit():
        return jsonify({
        "total": get_sit_total()
    })

@app.route("/meg_detalhe")
@login_required
def meg_detalhe():
    return render_template("meg_detalhe.html")



@app.route("/api/meg_detalhe")
@login_required
def api_meg_detalhe():

    return jsonify(
        get_meg_detalhes()
    )


@app.route("/ticket/<path:id_ticket>/acao", methods=["POST"])
@login_required
def acao_ticket(id_ticket):

    id_ticket = unquote(id_ticket)

    body = request.json or {}

    acao = body.get("acao")
    servico = body.get("servico")

    if not acao:
        return jsonify({
            "erro": "Ação não informada"
        }), 400

    if not servico:
        return jsonify({
            "erro": "Serviço não informado"
        }), 400

    if acao == "cancelar":

        cancelar_servico(
            id_ticket,
            servico,
            current_user.username
        )

    elif acao == "reabrir":

        reabrir_servico(
            id_ticket,
            servico,
            current_user.username
        )

    else:

        return jsonify({
            "erro": "Ação inválida"
        }), 400

    return jsonify({
        "ok": True,
        "acao": acao
    })



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

    return jsonify(
        buscar_gestao_tickets(
            termo=request.args.get("term"),
            data_inicio=request.args.get("data_inicio"),
            data_fim=request.args.get("data_fim")
        )
    )

@app.route("/dashboard_usuarios_view")
@login_required
def dashboard_usuarios_view():
    return render_template("dashboard_usuarios.html")

@app.route("/api/estrutura")
@login_required
def api_estrutura():

    return jsonify(get_estrutura())


@app.route("/api/regras_abertura")
@login_required
def api_regras_abertura():

    return jsonify(get_regras_abertura())

@app.route("/api/categorias_multicidade")
@login_required
def api_categorias_multicidade():

    return jsonify(
        get_categorias_multicidade()
    )

@app.route("/api/atividade/<path:id_ticket>")
@login_required
def api_atividade(id_ticket):

    return jsonify(
        get_atividades(id_ticket)
    )


@app.route("/api/tickets")
@login_required
def api_tickets():

    return jsonify(
        get_tickets()
    )
    
@app.route("/api/comentarios/<path:id_ticket>")
@login_required
def api_comentarios(id_ticket):

    return jsonify(
        get_comentarios(id_ticket)
    )
    
@app.route("/api/eventos/<path:id_ticket>")
@login_required
def api_eventos(id_ticket):
    
    print("ID RECEBIDO:", repr(id_ticket))

    return jsonify({
        "eventos": get_eventos_ticket(id_ticket),
        "fases": get_fases_evento(id_ticket)
    })
    
@app.route("/api/fechamentos/<path:id_ticket>")
@login_required
def api_fechamentos(id_ticket):

    return jsonify({
        "fechamentos": get_fechamentos_ticket(id_ticket)
    })
    

@app.route("/api/dashboard")
@login_required
def api_dashboard():

    return jsonify(
        get_dashboard()
    )


@app.route("/api/consulta")
@login_required
def api_consulta():

    return jsonify(
        buscar_tickets(
            ticket=request.args.get("ticket"),
            cidade=request.args.get("cidade"),
            data_inicio=request.args.get("data_inicio"),
            data_fim=request.args.get("data_fim")
        )
    )

@app.route("/api/cidades")
@login_required
def api_cidades():

    return jsonify(
        get_cidades()
    )

@app.route("/dashboard_usuarios")
@login_required
def dashboard_usuarios():

    return jsonify(
        get_dashboard_usuarios()
    )
    
@app.route("/api/fechamento")
@login_required
def api_fechamento():

    id_ticket = request.args.get("id_ticket")
    servico = request.args.get("servico")

    return jsonify(
        get_fechamento_servico(
            id_ticket,
            servico
        )
    )
    
    
@app.route("/api/fechamento_servico")
@login_required
def api_fechamento_servico():

    return jsonify(
        get_fechamento_servico(
            request.args.get("id_ticket"),
            request.args.get("servico")
        )
    )

@app.route("/api/editar_fechamento", methods=["POST"])
@login_required
def api_editar_fechamento():

    dados = request.json or {}

    id_ticket = dados.get("id_ticket")
    servico = dados.get("servico")

    if not id_ticket:
        return jsonify({
            "erro": "Ticket não informado"
        }), 400

    if not servico:
        return jsonify({
            "erro": "Serviço não informado"
        }), 400

    conn = conectar()
    cur = conn.cursor()

    # =========================
    # FECHAMENTO
    # =========================

    cur.execute("""
        UPDATE fechamentos_ticket
        SET
            responsabilidade = ?,
            parte = ?,
            causa = ?,
            solucao = ?,
            sumario = ?,
            causa_raiz = ?,
            tecnologia_acesso = ?,
            isolamento_olt_cmts = ?
        WHERE id_ticket = ?
          AND servico = ?
    """, (
        dados.get("responsabilidade"),
        dados.get("parte"),
        dados.get("causa"),
        dados.get("solucao"),
        dados.get("sumario"),
        dados.get("causa_raiz"),
        dados.get("tecnologia_acesso"),
        dados.get("isolamento_olt_cmts", 0),
        id_ticket,
        servico
    ))

    # =========================
    # EVENTO
    # =========================

    cur.execute("""
        UPDATE eventos_ticket
        SET
            inicio_evento = ?,
            final_evento = ?,
            vc_evento = ?
        WHERE id_ticket = ?
          AND servico = ?
    """, (
        dados.get("inicio_evento"),
        dados.get("final_evento"),
        dados.get("vc_evento"),
        id_ticket,
        servico
    ))

    conn.commit()
    conn.close()

    registrar_atividade(
        id_ticket,
        current_user.username,
        "EDICAO_FECHAMENTO",
        f"Serviço {servico}"
    )

    return jsonify({
        "ok": True
    })
    
@app.route("/api/relatorio")
@login_required
def api_relatorio():

    return jsonify(
        get_relatorio(
            data_inicio=request.args.get("data_inicio"),
            data_fim=request.args.get("data_fim"),
            cidade=request.args.get("cidade"),
            servico=request.args.get("servico"),
            evento=request.args.get("evento"),
            responsavel=request.args.get("responsavel"),
            natureza=request.args.get("natureza"),
            causa_raiz=request.args.get("causa_raiz")
        )
    )
    
@app.route("/api/filtros_relatorio")
@login_required
def api_filtros_relatorio():

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT cidade
        FROM tickets
        WHERE cidade IS NOT NULL
          AND cidade != ''
        ORDER BY cidade
    """)
    cidades = [r["cidade"] for r in cur.fetchall()]

    cur.execute("""
        SELECT DISTINCT servico
        FROM tickets
        WHERE servico IS NOT NULL
          AND servico != ''
        ORDER BY servico
    """)
    servicos = [r["servico"] for r in cur.fetchall()]

    cur.execute("""
        SELECT DISTINCT evento
        FROM tickets
        WHERE evento IS NOT NULL
          AND evento != ''
        ORDER BY evento
    """)
    eventos = [r["evento"] for r in cur.fetchall()]

    cur.execute("""
        SELECT DISTINCT responsabilidade
        FROM fechamentos_ticket
        WHERE responsabilidade IS NOT NULL
          AND responsabilidade != ''
        ORDER BY responsabilidade
    """)
    responsaveis = [
        r["responsabilidade"]
        for r in cur.fetchall()
    ]

    conn.close()

    return jsonify({
        "cidades": cidades,
        "servicos": servicos,
        "eventos": eventos,
        "responsaveis": responsaveis
    })

@app.route("/api/ofensores/filtros")
@login_required
def api_ofensores_filtros():

    return jsonify({
        "cidades": get_cidades_estrutura()
    })

@app.route("/api/ofensores/categorias")
@login_required
def api_ofensores_categorias():

    cidade = request.args.get("cidade")

    return jsonify(
        get_categorias_cidade(cidade)
    )

@app.route("/api/ofensores")
@login_required
def api_ofensores():

    cidade = request.args.get("cidade")
    categoria = request.args.get("categoria")

    return jsonify(
        get_ofensores_categoria(
            cidade,
            categoria
        )
    )

@app.route("/api/ofensores", methods=["POST"])
@login_required
def api_incluir_ofensor():

    dados = request.json

    incluir_ofensor(
        cidade=dados["cidade"],
        categoria=dados["categoria"],
        ofensor=dados["ofensor"]
    )

    return jsonify({
        "ok": True
    })

@app.route("/api/ofensores/<int:id_registro>", methods=["DELETE"])
@login_required
def api_excluir_ofensor(id_registro):

    excluir_ofensor(id_registro)

    return jsonify({
        "ok": True
    })
    
@app.route("/api/regras_fechamento")
@login_required
def api_regras_fechamento():

    return jsonify(
        get_regras_fechamento()
    )
    
@app.route("/api/base_assinantes")
@login_required
def api_base_assinantes():

    return jsonify(
        get_base_assinantes()
    )