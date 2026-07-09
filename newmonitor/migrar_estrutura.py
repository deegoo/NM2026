import json
import sqlite3

DB = r"../instance/newmonitor.db"

with open("data/estrutura.json", encoding="utf-8") as f:
    estrutura = json.load(f)

conn = sqlite3.connect(DB)
cur = conn.cursor()

contador = 0

for cidade, categorias in estrutura.items():

    for categoria, ofensores in categorias.items():

        for ofensor in ofensores:

            cur.execute("""
                INSERT INTO estrutura
                (cidade, categoria, ofensor)
                VALUES (?, ?, ?)
            """, (
                cidade,
                categoria,
                ofensor
            ))

            contador += 1

conn.commit()
conn.close()

print(f"✅ {contador} registros inseridos")