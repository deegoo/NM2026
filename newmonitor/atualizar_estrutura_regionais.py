from database import (
    conectar,
    get_regional_por_uf
)

conn = conectar()
cur = conn.cursor()

cur.execute("""
    SELECT DISTINCT uf
    FROM estrutura
    WHERE uf IS NOT NULL
      AND uf <> ''
      AND uf <> '0'
""")

ufs = [row["uf"] for row in cur.fetchall()]

for uf in ufs:

    dados = get_regional_por_uf(uf)

    cur.execute("""
        UPDATE estrutura
        SET
            regional = ?,
            nm_regional_cmv_bi = ?
        WHERE uf = ?
    """, (
        dados["regional"],
        dados["nm_regional_cmv_bi"],
        uf
    ))

    print(
        f"{uf} -> "
        f"{dados['regional']} -> "
        f"{dados['nm_regional_cmv_bi']}"
    )

conn.commit()
conn.close()

print("✅ Atualização concluída")