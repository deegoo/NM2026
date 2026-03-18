from flask import Flask

app = Flask(__name__)


from newmonitor import routes # importtação das rotas no final pq elas precisam do app(@app) rodando para funcionar