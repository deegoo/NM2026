import json
import sqlite3

with open(
    "newmonitor/data/fechamentos.json",
    encoding="utf-8"
) as f:

    regras = json.load(f)

conn = sqlite3.connect(
    "/instance/newmonitor.db"
)

cur = conn.cursor()

cur.execute("""
    DELETE FROM regras_fechamento
""")

for r in regras:

    cur.execute("""
        INSERT INTO regras_fechamento (
            servico,
            responsavel,
            parte,
            causa,
            solucao
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        r["servico"],
        r["responsavel"],
        r["parte"],
        r["causa"],
        r["solucao"]
    ))

conn.commit()
conn.close()

print(
    f"✅ {len(regras)} regras migradas"
)