import json
import sqlite3

with open("newmonitor/data/base_clientes.json",encoding="utf-8") as f:

    dados = json.load(f)

conn = sqlite3.connect(
    "instance/newmonitor.db"
)

cur = conn.cursor()

cur.execute(
    "DELETE FROM base_assinantes"
)

for servico, info in dados.items():

    base_brasil = info["base_brasil"]

    for cidade, base_cidade in info["cidades"].items():

        cur.execute("""
            INSERT INTO base_assinantes (
                servico,
                cidade,
                base_cidade,
                base_brasil
            )
            VALUES (?, ?, ?, ?)
        """, (
            servico,
            cidade.upper(),
            base_cidade,
            base_brasil
        ))

conn.commit()
conn.close()

print("✅ migração concluída")