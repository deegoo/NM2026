from flask import Flask

app = Flask(__name__)

DATA_PATH = "newmonitor/data/tickets.json"

from newmonitor import routes # importtação das rotas no final pq elas precisam do app(@app) rodando para funcionar