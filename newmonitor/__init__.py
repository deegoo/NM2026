from flask import Flask
from flask_login import LoginManager 
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'gkhjdfbdkc&%$#@15976532bgFdTsA'

app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(app.instance_path, 'newmonitor.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

DATA_PATH = "newmonitor/data/tickets.json"

login_manager = LoginManager()
login_manager.init_app(app)

login_manager.login_view = 'login' 
login_manager.login_message = 'Por favor, faça login para acessar esta página.'
login_manager.login_message_category = 'info'

from newmonitor import routes # importtação das rotas e modelos sempre no final 
from newmonitor import models
from newmonitor.models import Usuario

# Garante que a pasta 'instance' exista antes de criar o banco
os.makedirs(app.instance_path, exist_ok=True)

# cria o banco
with app.app_context():
    db.create_all()  # Cria TODAS as tabelas que estiverem no models.py de uma vez só!
    # Injeta um usuário padrão se o banco estiver totalmente zerado
    if Usuario.query.count() == 0:
        usuario_admin = Usuario(username="admin", password="admin@password")
        db.session.add(usuario_admin)
        db.session.commit()
        print(" Usuário 'admin' criado automaticamente!")

