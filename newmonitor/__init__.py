from flask import Flask
from flask_login import LoginManager 

app = Flask(__name__)
app.config['SECRET_KEY'] = 'gkhjdfbdkc&%$#@15976532bgFdTsA' 

DATA_PATH = "newmonitor/data/tickets.json"

login_manager = LoginManager()
login_manager.init_app(app)

login_manager.login_view = 'login' 
login_manager.login_message = 'Por favor, faça login para acessar esta página.'
login_manager.login_message_category = 'info'

from newmonitor import routes # importtação das rotas no final pq elas precisam do app(@app) rodando para funcionar
