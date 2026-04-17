from flask import render_template, url_for
from newmonitor import app


lista_usuarios = ["Usuario1", "Usuario2", "Usuario3"]

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/registro")
def registro():
    return render_template("registro.html")

@app.route("/abrir_registro")
def abrir_registro():
    return render_template("abrir_registro.html")

@app.route("/consulta_regitro_falha")
def consulta_regitro_falha():
    return render_template("consulta_regitro_falha.html")

@app.route("/fechar_registro")
def fechar_registro():
    return render_template("fechar_registro.html")    