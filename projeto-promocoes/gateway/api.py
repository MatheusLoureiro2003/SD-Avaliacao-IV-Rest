# Funçao de GET /promocoes:
#   É um endpoint HTTP — uma porta de entrada para o mundo externo. Quando implementado com Flask ou FastAPI, significa:
#   1. O Gateway sobe um servidor web
#   2. O navegador faz uma requisição: GET http://localhost:5001/promocoes
#   3. O servidor recebe, chama gateway.listar_promocoes() internamente
#   4. Serializa o resultado como JSON e devolve ao navegador

from flask import Flask, jsonify
from gateway import Gateway

servidorWeb = Flask(__name__)
gw  = Gateway()

@servidorWeb.route('/promocoes', methods=['GET'])
def listar():
    return jsonify(gw.listar_promocoes())

#  O decorador @app.route registra a URL /promocoes
#  jsonify(...) pega a listar_promocoes() retorna e transforma em JSON válido para o navegador

if __name__ == '__main__':
    servidorWeb.run(host='0.0.0.0', port=5001)