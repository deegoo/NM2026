import json
import os
from datetime import datetime
from filelock import FileLock

ARQUIVO_CONTADOR = "data/contador.json"
LOCK_FILE = "data/contador.lock"


def gerar_id_ticket():
    ano = str(datetime.now().year)

    os.makedirs("data", exist_ok=True)

    with FileLock(LOCK_FILE):

        if not os.path.exists(ARQUIVO_CONTADOR):
            with open(ARQUIVO_CONTADOR, "w") as f:
                json.dump({}, f)

        with open(ARQUIVO_CONTADOR, "r") as f:
            dados = json.load(f)

        numero = dados.get(ano, 0) + 1
        dados[ano] = numero

        with open(ARQUIVO_CONTADOR, "w") as f:
            json.dump(dados, f, indent=2)

    return f"{numero}/{ano}"