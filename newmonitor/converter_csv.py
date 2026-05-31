import csv
import json
from collections import defaultdict

estrutura = defaultdict(lambda: defaultdict(set))

with open("data/entrada.csv", encoding="utf-8-sig") as f:  # ✅ remove BOM automaticamente
    reader = csv.DictReader(f)

    for row in reader:
        # ✅ normalização segura das chaves
        cidade = row.get("cidade") or row.get("Cidade")
        categoria = row.get("categoria") or row.get("Categoria")
        ofensor = row.get("ofensor") or row.get("Ofensor")

        if not cidade or not categoria or not ofensor:
            print("❌ Linha ignorada:", row)
            continue

        cidade = cidade.strip().upper()
        categoria = categoria.strip()
        ofensor = ofensor.strip()

        estrutura[cidade][categoria].add(ofensor)

estrutura_final = {
    c: {cat: sorted(list(ofs)) for cat, ofs in cats.items()}
    for c, cats in estrutura.items()
}

with open("data/estrutura.json", "w", encoding="utf-8") as f:
    json.dump(estrutura_final, f, ensure_ascii=False, indent=2)

print("✅ JSON gerado com sucesso")