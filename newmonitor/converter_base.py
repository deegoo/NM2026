import csv
import json

entrada = "newmonitor/data/base.csv"
saida = "newmonitor/data/base_clientes.json"

estrutura = {}

with open(entrada, encoding="utf-8") as f:
    reader = csv.reader(f)

    for row in reader:
        if not row or len(row) < 3:
            continue

        servico = row[0].strip().upper()
        cidade = row[1].strip().upper()
        valor = int(row[2])

        if servico not in estrutura:
            estrutura[servico] = {
                "base_brasil": 0,
                "cidades": {}
            }

        if cidade == "BRASIL":
            estrutura[servico]["base_brasil"] = valor
        else:
            estrutura[servico]["cidades"][cidade] = valor

with open(saida, "w", encoding="utf-8") as f:
    json.dump(estrutura, f, ensure_ascii=False, indent=2)

print("✅ JSON gerado corretamente")