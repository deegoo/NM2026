from flask import render_template
from newmonitor import app


lista_usuarios = ["Usuario1", "Usuario2", "Usuario3"]

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/registro")
def registro():
    return render_template("registro.html")


