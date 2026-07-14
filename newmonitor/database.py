import sqlite3
import os
import requests

from requests_ntlm import HttpNtlmAuth
from datetime import datetime

DB_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "instance",
        "newmonitor.db"
    )
)


def conectar():

    conn = sqlite3.connect(
        DB_PATH,
        timeout=30
    )

    conn.row_factory = sqlite3.Row

    return conn


def get_estrutura():
    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT cidade, categoria, ofensor
        FROM estrutura
        ORDER BY cidade, categoria, ofensor
    """)

    rows = cur.fetchall()
    conn.close()

    estrutura = {}

    for row in rows:
        cidade = row["cidade"]
        categoria = row["categoria"]
        ofensor = row["ofensor"]

        if cidade not in estrutura:
            estrutura[cidade] = {}

        if categoria not in estrutura[cidade]:
            estrutura[cidade][categoria] = []
        if ofensor not in estrutura[cidade][categoria]:
            estrutura[cidade][categoria].append(ofensor)

    return estrutura


def get_regras_abertura():
    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT servico, sintoma, evento
        FROM regras_abertura
        ORDER BY servico, sintoma, evento
    """)

    rows = cur.fetchall()
    conn.close()

    regras = {}

    for row in rows:

        servico = row["servico"]
        sintoma = row["sintoma"]
        evento = row["evento"]

        if servico not in regras:
            regras[servico] = {}

        if sintoma not in regras[servico]:
            regras[servico][sintoma] = []
        if evento not in regras[servico][sintoma]:
            regras[servico][sintoma].append(evento)

    return regras

def get_categorias_multicidade():

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT categoria
        FROM categorias_multicidade
        ORDER BY categoria
    """)

    rows = cur.fetchall()

    conn.close()

    return [row["categoria"] for row in rows]


def salvar_ticket(registros):

    print("📦 REGISTROS PARA SALVAR:")
    print(registros)
    conn = conectar()
    cur = conn.cursor()

    for ticket in registros:

        cur.execute("""
            INSERT INTO tickets (
                id_ticket,
                cidade,
                servico,
                sintoma,
                evento,
                categoria,
                ofensor,
                descricao,
                data_inicio,
                data_abertura,
                chamado_operadora,
                outage,
                status,
                usuario
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        """, (
            ticket["id_ticket"],
            ticket["cidade"],
            ticket["servico"],
            ticket.get("sintoma"),
            ticket.get("evento"),
            ticket.get("categoria"),
            ticket.get("ofensor"),
            ticket.get("descricao"),
            ticket.get("data_inicio"),
            ticket.get("data_abertura"),
            ticket.get("chamado_operadora"),
            ticket.get("outage"),
            ticket.get("status"),
            ticket.get("usuario")
        ))

    conn.commit()
    conn.close()
    print("✅ salvar_ticket executado")

def get_ticket(id_ticket):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM tickets
        WHERE id_ticket = ?
        ORDER BY cidade, servico
    """, (id_ticket,))

    rows = cur.fetchall()

    conn.close()

    return [dict(row) for row in rows]


def get_tickets():

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM tickets
        ORDER BY id DESC
    """)

    rows = cur.fetchall()

    conn.close()

    return [dict(row) for row in rows]


def registrar_atividade(
    id_ticket,
    usuario,
    acao,
    detalhes=None
):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO atividades_ticket (
            id_ticket,
            data,
            usuario,
            acao,
            detalhes
        )
        VALUES (
            ?, ?, ?, ?, ?
        )
    """, (
        id_ticket,
        datetime.now().strftime("%d/%m/%Y %H:%M"),
        usuario,
        acao,
        detalhes
    ))

    conn.commit()
    conn.close()
    
def get_atividades(id_ticket):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM atividades_ticket
        WHERE id_ticket = ?
        AND acao NOT IN (
        'FECHAMENTO',
        'EDICAO_FECHAMENTO'
        )
        ORDER BY id DESC
    """, (id_ticket,))

    rows = cur.fetchall()

    conn.close()

    return [dict(row) for row in rows]


def get_comentarios(id_ticket):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM comentarios_ticket
        WHERE id_ticket = ?
        ORDER BY id DESC
    """, (id_ticket,))

    rows = cur.fetchall()

    conn.close()

    return [dict(row) for row in rows]


def salvar_comentario (
    id_ticket, 
    usuario, 
    comentario, 
    imagem=None
):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO comentarios_ticket (
            id_ticket,
            data,
            usuario,
            comentario,
            imagem
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        id_ticket,
        datetime.now().strftime("%d/%m/%Y %H:%M"),
        usuario,
        comentario,
        imagem
    ))

    conn.commit()
    conn.close()
    

def salvar_evento_ticket(
    id_ticket,
    cidade,
    servico,
    inicio_evento,
    final_evento,
    vc_evento
):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO eventos_ticket (
            id_ticket,
            cidade,
            servico,
            inicio_evento,
            final_evento,
            vc_evento
        )
        VALUES (
            ?, ?, ?, ?, ?, ?
        )
    """, (
        id_ticket,
        cidade,
        servico,
        inicio_evento,
        final_evento,
        vc_evento
    ))

    conn.commit()
    conn.close()

def salvar_fase_evento(
    id_ticket,
    cidade,
    servico,
    tempo,
    impacto
):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO fases_evento (
            id_ticket,
            cidade,
            servico,
            tempo,
            impacto
        )
        VALUES (
            ?, ?, ?, ?, ?
        )
    """, (
        id_ticket,
        cidade,
        servico,
        tempo,
        impacto
    ))

    conn.commit()
    conn.close()

def get_eventos_ticket(id_ticket):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM eventos_ticket
        WHERE id_ticket = ?
        ORDER BY cidade, servico
    """, (id_ticket,))

    rows = cur.fetchall()

    conn.close()

    return [dict(row) for row in rows]

def get_fases_evento(id_ticket):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM fases_evento
        WHERE id_ticket = ?
        ORDER BY cidade, servico, id
    """, (id_ticket,))

    rows = cur.fetchall()

    conn.close()

    return [dict(row) for row in rows]


def excluir_eventos_ticket(id_ticket):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM eventos_ticket
        WHERE id_ticket = ?
    """, (id_ticket,))

    conn.commit()
    conn.close()
    
def excluir_fases_evento(id_ticket):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM fases_evento
        WHERE id_ticket = ?
    """, (id_ticket,))

    conn.commit()
    conn.close()
    
def salvar_fechamento_ticket(
    id_ticket,
    servico,
    responsabilidade,
    parte,
    causa,
    solucao,
    sumario,    
    causa_raiz=None,
    isolamento_olt_cmts=0
):

    conn = conectar()
    cur = conn.cursor()
    
    cur.execute("""
    SELECT
        sintoma,
        evento
    FROM tickets
    WHERE id_ticket = ?
      AND servico = ?
""", (
    id_ticket,
    servico
    ))

    ticket = cur.fetchone()

    if not ticket:
        conn.close()
        return

    sintoma = (
        ticket["sintoma"] or ""
    ).upper()

    evento = (
        ticket["evento"] or ""
    ).upper()

    if (
        sintoma == "MANOBRA"
        and evento == "PROGRAMADA"
    ):
        natureza = "MANUTENÇÃO PROGRAMADA"
    else:
        natureza = "MANUTENÇÃO EMERGENCIAL"

    cur.execute("""
        INSERT INTO fechamentos_ticket (
            id_ticket,
            servico,
            responsabilidade,
            parte,
            causa,
            solucao,
            sumario,
            natureza,
            causa_raiz,
            isolamento_olt_cmts
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        id_ticket,
        servico,
        responsabilidade,
        parte,
        causa,
        solucao,
        sumario,
        natureza,
        causa_raiz,
        isolamento_olt_cmts
    ))

    conn.commit()
    conn.close()
    
def excluir_fechamentos_ticket(id_ticket):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM fechamentos_ticket
        WHERE id_ticket = ?
    """, (id_ticket,))

    conn.commit()
    conn.close()

def get_fechamentos_ticket(id_ticket):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            f.*,
            e.inicio_evento,
            e.final_evento
        FROM fechamentos_ticket f

        LEFT JOIN eventos_ticket e
            ON f.id_ticket = e.id_ticket
            AND f.servico = e.servico

        WHERE f.id_ticket = ?
        ORDER BY f.servico
    """, (id_ticket,))

    rows = cur.fetchall()

    resultado = []

    for row in rows:

        item = dict(row)

        item["interrupcao"] = None

        try:

            inicio = row["inicio_evento"]
            fim = row["final_evento"]

            if inicio and fim:

                dt_inicio = datetime.strptime(
                    inicio,
                    "%d/%m/%Y %H:%M"
                )

                dt_fim = datetime.strptime(
                    fim,
                    "%d/%m/%Y %H:%M"
                )

                item["interrupcao"] = int(
                    (
                        dt_fim -
                        dt_inicio
                    ).total_seconds() / 60
                )

        except Exception:
            pass

        resultado.append(item)

    conn.close()

    return resultado

def fechar_ticket(id_ticket):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        UPDATE tickets
        SET status = 'FECHADO'
        WHERE id_ticket = ?
    """, (id_ticket,))

    conn.commit()
    conn.close()

def get_dashboard():

    conn = conectar()
    cur = conn.cursor()

    dashboard = {}

    cur.execute("""
        SELECT COUNT(DISTINCT id_ticket)
        FROM tickets
        WHERE status = 'ABERTO'
    """)

    dashboard["abertos"] = cur.fetchone()[0]
    
    # =========================
    # COM IMPACTO
    # =========================

    cur.execute("""
        SELECT COUNT(DISTINCT id_ticket)
        FROM tickets
        WHERE status = 'ABERTO'
          AND outage IS NOT NULL
          AND TRIM(CAST(outage AS TEXT)) <> ''
    """)

    dashboard["com_impacto"] = cur.fetchone()[0]

    # =========================
    # NÃO TRATADOS
    # =========================

    cur.execute("""
        SELECT
            t.id_ticket,
            MAX(a.data) AS ultima_data,
            MAX(t.evento) AS evento
        FROM tickets t
        LEFT JOIN atividades_ticket a
            ON a.id_ticket = t.id_ticket
        WHERE t.status = 'ABERTO'
        GROUP BY t.id_ticket
    """)

    rows = cur.fetchall()

    agora = datetime.now()

    total = 0
    amarelos = 0
    vermelhos = 0

    for row in rows:

        ultima_data = row["ultima_data"]
        evento = (row["evento"] or "").upper()

        if not ultima_data:
            continue

        try:

            ultima = datetime.strptime(
                ultima_data,
                "%d/%m/%Y %H:%M"
            )

        except Exception:
            continue

        diff_min = (
            agora - ultima
        ).total_seconds() / 60

        # =========================
        # REGRA AVALIAÇÃO
        # =========================

        if "AVALIA" in evento:

            if diff_min >= 1440:

                vermelhos += 1
                total += 1

            elif diff_min >= 720:

                amarelos += 1
                total += 1

        # =========================
        # REGRA PADRÃO
        # =========================

        else:

            if diff_min >= 180:

                vermelhos += 1
                total += 1

            elif diff_min >= 90:

                amarelos += 1
                total += 1

    dashboard["nao_tratados"] = total
    dashboard["nao_tratados_amarelo"] = amarelos
    dashboard["nao_tratados_vermelho"] = vermelhos

    megs = get_meg_detalhes()
    dashboard["meg"] = len(megs)
    dashboard["meg_amarelo"] = False
    dashboard["meg_vermelho"] = False
    agora = datetime.now()

    for meg in megs:

        previsao = meg.get("previsao", "").strip()

        if not previsao:
            continue

        try:

            dt_previsao = datetime.strptime(
                previsao,
                "%d/%m/%Y %H:%M:%S"
            )

        except Exception:

            try:

                dt_previsao = datetime.strptime(
                    previsao,
                    "%d/%m/%Y %H:%M"
                )

            except Exception:
                continue

        diff_min = (
            dt_previsao - agora
        ).total_seconds() / 60

        if diff_min <= 15:

            dashboard["meg_vermelho"] = True

        elif diff_min <= 30:

            dashboard["meg_amarelo"] = True
    
    dashboard["sit"] = get_sit_total()

    conn.close()

    return dashboard

def get_meg_total():

    url = "http://10.53.5.77/Arcos/Arcosmeg.aspx"

    usuario = "F183209"
    senha = "Senh@idm01"

    try:

        r = requests.get(
            url,
            auth=HttpNtlmAuth(usuario, senha),
            timeout=10
        )

    except Exception:

        return 0

    if r.status_code != 200:
        return 0

    if "<html" in r.text.lower():
        return 0

    conteudo = r.content.decode("latin-1")

    conteudo = (
        conteudo
        .replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("<br />", "\n")
    )

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

    return total

def get_sit_total():
    
    url = "http://10.53.5.77/Arcos/Arcossit.aspx"

    usuario = "F183209"
    senha = "Senh@idm01"

    try:

        r = requests.get(
            url,
            auth=HttpNtlmAuth(usuario, senha),
            timeout=10
        )

    except Exception:

        return 0

    if r.status_code != 200:
        return 0

    if "<html" in r.text.lower():
        return 0

    conteudo = r.content.decode("latin-1")

    conteudo = (
        conteudo
        .replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("<br />", "\n")
    )

    linhas = conteudo.splitlines()

    total = 0

    for linha in linhas:

        if not linha.strip():
            continue
        
        linha = linha.strip().replace("\r", "")
        
        partes = linha.split(";")

        for p in partes:

            if "NOC RES MON" in p.upper():

                total += 1
                break

    return total


def get_meg_detalhes():
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

        return any(
            p.strip().upper() == "RESIDENCIAL"
            for p in partes
        )

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

    return resultado

def buscar_tickets(
    ticket=None,
    cidade=None,
    data_inicio=None,
    data_fim=None
):

    conn = conectar()
    cur = conn.cursor()

    sql = """
        SELECT *
        FROM tickets
        WHERE 1=1
    """

    params = []

    if ticket:

        sql += """
            AND id_ticket = ?
        """

        params.append(ticket)

    if cidade:

        sql += """
            AND UPPER(cidade) = UPPER(?)
        """

        params.append(cidade)

    if data_inicio:

        sql += """
            AND substr(data_inicio, 7, 4) ||
                substr(data_inicio, 4, 2) ||
                substr(data_inicio, 1, 2)
                >= ?
        """

        params.append(
            data_inicio.replace("-", "")
        )

    if data_fim:

        sql += """
            AND substr(data_inicio, 7, 4) ||
                substr(data_inicio, 4, 2) ||
                substr(data_inicio, 1, 2)
                <= ?
        """

        params.append(
            data_fim.replace("-", "")
        )

    sql += """
        ORDER BY id DESC
    """

    cur.execute(sql, params)

    rows = cur.fetchall()

    conn.close()

    return [
        dict(row)
        for row in rows
    ]
    
def get_cidades():

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT cidade
        FROM tickets
        WHERE cidade IS NOT NULL
          AND TRIM(cidade) <> ''
        ORDER BY cidade
    """)

    cidades = [
        row["cidade"]
        for row in cur.fetchall()
    ]

    conn.close()

    return cidades

def get_dashboard_usuarios():

    conn = conectar()
    cur = conn.cursor()

    usuarios = {}

    # =========================
    # TICKETS
    # =========================

    cur.execute("""
        SELECT
            usuario,

            SUM(
                CASE
                    WHEN UPPER(status) = 'ABERTO'
                    THEN 1
                    ELSE 0
                END
            ) AS abertos,

            SUM(
                CASE
                    WHEN UPPER(status) = 'FECHADO'
                    THEN 1
                    ELSE 0
                END
            ) AS fechados,

            SUM(
                CASE
                    WHEN UPPER(status) = 'CANCELADO'
                    THEN 1
                    ELSE 0
                END
            ) AS cancelados

        FROM tickets

        GROUP BY usuario
    """)

    for row in cur.fetchall():

        usuario = row["usuario"] or "N/A"

        usuarios[usuario] = {
            "abertos": row["abertos"] or 0,
            "fechados": row["fechados"] or 0,
            "cancelados": row["cancelados"] or 0,
            "updates": 0
        }

    # =========================
    # ATUALIZAÇÕES
    # =========================

    cur.execute("""
        SELECT
            usuario,
            COUNT(*) AS total
        FROM atividades_ticket
        GROUP BY usuario
    """)

    for row in cur.fetchall():

        usuario = row["usuario"] or "N/A"

        if usuario not in usuarios:

            usuarios[usuario] = {
                "abertos": 0,
                "fechados": 0,
                "cancelados": 0,
                "updates": 0
            }

        usuarios[usuario]["updates"] = row["total"]

    conn.close()

    return usuarios

def buscar_gestao_tickets(
    termo=None,
    data_inicio=None,
    data_fim=None
):

    conn = conectar()
    cur = conn.cursor()

    sql = """
        SELECT *
        FROM tickets
        WHERE 1=1
    """

    params = []

    if termo:

        sql += """
            AND (
                LOWER(id_ticket) LIKE ?
                OR LOWER(cidade) LIKE ?
                OR LOWER(servico) LIKE ?
                OR LOWER(IFNULL(descricao,'')) LIKE ?
            )
        """

        busca = f"%{termo.lower()}%"

        params.extend([
            busca,
            busca,
            busca,
            busca
        ])

    if data_inicio:

        sql += """
            AND (
                substr(data_abertura,7,4) ||
                substr(data_abertura,4,2) ||
                substr(data_abertura,1,2)
            ) >= ?
        """

        params.append(
            data_inicio.replace("-", "")
        )

    if data_fim:

        sql += """
            AND (
                substr(data_abertura,7,4) ||
                substr(data_abertura,4,2) ||
                substr(data_abertura,1,2)
            ) <= ?
        """

        params.append(
            data_fim.replace("-", "")
        )

    sql += """
        ORDER BY id DESC
    """

    cur.execute(sql, params)

    rows = cur.fetchall()

    conn.close()

    return [
        dict(row)
        for row in rows
    ]
    
def cancelar_servico(
    id_ticket,
    servico,
    usuario
):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        UPDATE tickets
        SET status = 'CANCELADO'
        WHERE id_ticket = ?
          AND servico = ?
    """, (
        id_ticket,
        servico
    ))

    conn.commit()
    conn.close()

    registrar_atividade(
        id_ticket,
        usuario,
        "CANCELAMENTO",
        f"Serviço {servico} cancelado"
    )

    return True

def reabrir_servico(
    id_ticket,
    servico,
    usuario
):

    conn = conectar()
    cur = conn.cursor()

    # 1. status ABERTO

    cur.execute("""
        UPDATE tickets
        SET status = 'ABERTO'
        WHERE id_ticket = ?
          AND servico = ?
    """, (
        id_ticket,
        servico
    ))

    # 2. apagar fechamento

    cur.execute("""
        DELETE FROM fechamentos_ticket
        WHERE id_ticket = ?
          AND servico = ?
    """, (
        id_ticket,
        servico
    ))

    # 3. apagar evento

    cur.execute("""
        DELETE FROM eventos_ticket
        WHERE id_ticket = ?
          AND servico = ?
    """, (
        id_ticket,
        servico
    ))

    conn.commit()
    conn.close()

    # 4. atividade

    registrar_atividade(
        id_ticket,
        usuario,
        "REABERTURA",
        f"Serviço {servico} reaberto"
    )

    return True


def get_fechamento_servico(
    id_ticket,
    servico
):

    conn = conectar()
    cur = conn.cursor()

    resultado = {
        "fechamento": {},
        "evento": {}
    }

    # =========================
    # FECHAMENTO
    # =========================

    cur.execute("""
        SELECT
            responsabilidade,
            parte,
            causa,
            solucao,
            sumario,            
            natureza,
            causa_raiz,
            isolamento_olt_cmts

        FROM fechamentos_ticket
        WHERE id_ticket = ?
          AND servico = ?
        LIMIT 1
    """, (
        id_ticket,
        servico
    ))

    row = cur.fetchone()

    if row:

        resultado["fechamento"] = {
            "responsabilidade": row["responsabilidade"],
            "parte": row["parte"],
            "causa": row["causa"],
            "solucao": row["solucao"],
            "sumario": row["sumario"],
            "natureza": row["natureza"],
            "causa_raiz": row["causa_raiz"],
            "isolamento_olt_cmts": row["isolamento_olt_cmts"]
        }

    # =========================
    # EVENTO
    # =========================

    cur.execute("""
        SELECT
            inicio_evento,
            final_evento,
            vc_evento
        FROM eventos_ticket
        WHERE id_ticket = ?
          AND servico = ?
        LIMIT 1
    """, (
        id_ticket,
        servico
    ))

    row = cur.fetchone()

    if row:

        resultado["evento"] = {
            "inicio_evento": row["inicio_evento"],
            "final_evento": row["final_evento"],
            "vc_evento": row["vc_evento"]
        }

    conn.close()

    return resultado

def get_relatorio(
    data_inicio,
    data_fim,
    cidade=None,
    servico=None,
    evento=None,
    responsavel=None,
    natureza=None,
    causa_raiz=None
    
):

    conn = conectar()
    cur = conn.cursor()

    sql = """
        SELECT
            t.id_ticket,
            t.cidade,
            t.servico,
            t.sintoma,
            t.evento,
            t.outage,

            t.data_inicio,
            e.inicio_evento,
            e.final_evento AS data_fim,
            e.vc_evento AS impacto,

            f.responsabilidade,
            f.parte,
            f.natureza,
            f.causa,
            f.solucao,
            f.sumario,
            f.causa_raiz,
            f.isolamento_olt_cmts

        FROM tickets t

        LEFT JOIN eventos_ticket e
            ON t.id_ticket = e.id_ticket
            AND t.servico = e.servico

        LEFT JOIN fechamentos_ticket f
            ON t.id_ticket = f.id_ticket
            AND t.servico = f.servico

        WHERE 1 = 1
    """

    params = []
    
    if natureza:

        sql += """
            AND IFNULL(
                f.natureza,
                ''
            ) = ?
        """

        params.append(natureza)
        
    if causa_raiz:

        sql += """
            AND IFNULL(
                f.causa_raiz,
                ''
            ) = ?
        """

        params.append(causa_raiz)

    if data_inicio:

        sql += """
            AND (
                substr(t.data_inicio,7,4) ||
                substr(t.data_inicio,4,2) ||
                substr(t.data_inicio,1,2)
            ) >= ?
        """

        params.append(
            data_inicio.replace("-", "")
        )

    if data_fim:

        sql += """
            AND (
                substr(t.data_inicio,7,4) ||
                substr(t.data_inicio,4,2) ||
                substr(t.data_inicio,1,2)
            ) <= ?
        """

        params.append(
            data_fim.replace("-", "")
        )

    if cidade:

        sql += """
            AND t.cidade = ?
        """

        params.append(cidade)

    if servico:

        sql += """
            AND t.servico = ?
        """

        params.append(servico)

    if evento:

        sql += """
            AND IFNULL(
                t.evento,
                'SEM EVENTO'
            ) = ?
        """

        params.append(evento)

    if responsavel:

        sql += """
            AND IFNULL(
                f.responsabilidade,
                'N/A'
            ) = ?
        """

        params.append(responsavel)

    sql += """
        ORDER BY t.id DESC
    """

    cur.execute(sql, params)

    rows = cur.fetchall()

    conn.close()

    resultado = []

    for row in rows:

        item = dict(row)

        item["interrupcao"] = ""

        try:

            inicio = row["inicio_evento"]
            fim = row["data_fim"]

            if inicio and fim:

                dt_inicio = datetime.strptime(
                    inicio,
                    "%d/%m/%Y %H:%M"
                )

                dt_fim = datetime.strptime(
                    fim,
                    "%d/%m/%Y %H:%M"
                )

                minutos = int(
                    (
                        dt_fim -
                        dt_inicio
                    ).total_seconds() / 60
                )

                item["interrupcao"] = minutos

        except Exception:
            pass

        resultado.append(item)

    return resultado

def get_cidades_estrutura():

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT cidade
        FROM estrutura
        ORDER BY cidade
    """)

    rows = cur.fetchall()

    conn.close()

    return [
        row["cidade"]
        for row in rows
    ]
    
def get_categorias_cidade(cidade):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT categoria
        FROM estrutura
        WHERE cidade = ?
        ORDER BY categoria
    """, (cidade,))

    rows = cur.fetchall()

    conn.close()

    return [
        row["categoria"]
        for row in rows
    ]
    
def get_ofensores_categoria(
    cidade,
    categoria
):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            ofensor
        FROM estrutura
        WHERE cidade = ?
          AND categoria = ?
        ORDER BY ofensor
    """, (
        cidade,
        categoria
    ))

    rows = cur.fetchall()

    conn.close()

    return [
        dict(row)
        for row in rows
    ]
    
def incluir_ofensor(
    cidade,
    categoria,
    ofensor
):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO estrutura (
            cidade,
            categoria,
            ofensor
        )
        VALUES (?, ?, ?)
    """, (
        cidade,
        categoria,
        ofensor
    ))

    conn.commit()
    conn.close()
    
def excluir_ofensor(id_registro):

    conn = conectar()
    cur = conn.cursor()

    cur.execute("""
        DELETE
        FROM estrutura
        WHERE id = ?
    """, (id_registro,))

    conn.commit()
    conn.close()
    
