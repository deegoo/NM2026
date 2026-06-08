import csv
import json

saida = []

with open("newmonitor/data/Fechamentos_Consolidado edit(FECHAMENTOS).csv", encoding="utf-8") as f:
    reader = csv.reader(f, delimiter=",")

    for row in reader:

        if len(row) < 6:
            continue

        servico = row[0]
        responsavel = row[1]
        parte = row[2]
        nat = row[3]
        causa = row[4]
        solucao = row[5]

        # ✅ normaliza natureza
        natureza = "MANUTENÇÃO EMERGENCIAL"
        if "PROGRAMADA" in nat.upper():
            natureza = "MANUTENÇÃO PROGRAMADA"

        saida.append({
            "servico": servico.strip(),
            "responsavel": responsavel.strip(),
            "parte": parte.strip(),
            "causa": causa.strip(),
            "solucao": solucao.strip(),
            "natureza": natureza
        })

with open("newmonitor/data/fechamentos.json", "w", encoding="utf-8") as f:
    json.dump(saida, f, ensure_ascii=False, indent=2)

print(f"✅ fechamentos.json gerado com {len(saida)} registros")
