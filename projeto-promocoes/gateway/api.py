# Funçao de GET /promocoes:
#   É um endpoint HTTP — uma porta de entrada para o mundo externo. Quando implementado com Flask ou FastAPI, significa:
#   1. O Gateway sobe um servidor web
#   2. O navegador faz uma requisição: GET http://localhost:5001/promocoes
#   3. O servidor recebe, chama gateway.listar_promocoes() internamente
#   4. Serializa o resultado como JSON e devolve ao navegador

from flask import Flask, jsonify, request #O request é o objeto que dá acesso ao corpo JSON da requisição
from flask_cors import CORS
from flask import Flask, render_template, jsonify, request, Response
from queue import Queue
from gateway import Gateway

servidorWeb = Flask(__name__)
CORS(servidorWeb)
gw  = Gateway()

@servidorWeb.route('/promocoes', methods=['GET'])
def listar():
    return jsonify(gw.listar_promocoes())

#  O decorador @app.route registra a URL /promocoes
#  jsonify(...) pega a listar_promocoes() retorna e transforma em JSON válido para o navegador

# ---------------------------------------------------------------
#  Funcao de POST/promocoes: cadastrar pelo HTTP e ver aparecer no GET /promocoes, sem precisar da interfaceGateway.py.
# ---------------------------------------------------------------
#   1. Receber um JSON no corpo da requisição com os dados da promoção
#   2. Chamar gw.cadastrar_promocao(...) passando esses dados
#   3. Retornar o id gerado como confirmação

@servidorWeb.route('/promocoes', methods=['POST'])
def cadastrar():
    dados = request.get_json()
    id_gerado, assinatura = gw.cadastrar_promocao(
        dados['titulo'],
        dados['descricao'],
        dados['categoria'],
        dados['preco_original'],
        dados['preco_promocional'],
        dados.get('email', '')
    )
    return jsonify({'id':id_gerado}), 201

# TESTE
#   curl -X POST http://localhost:5001/promocoes \
#     -H "Content-Type: application/json" \
#     -d '{"titulo":"Notebook","descricao":"Bom","categoria":"eletronicos","preco_original":3000,"preco_promocional":2499}'

# ---------------------------------------------------------------
#  POST /promocoes/<id>/votar — votar em uma promoção existente
# ---------------------------------------------------------------
#   1. Receber o id da promoção pela URL
#   2. Receber o tipo do voto no corpo JSON
#   3. Chamar gw.votar_promocao(...)
#   4. Retornar confirmação

@servidorWeb.route('/promocoes/<id>/votar', methods=['POST'])
def votar(id):
    dados = request.get_json()
    voto = dados['voto']
    gw.votar_promocao(id, voto)

    return jsonify({'ok': True}), 200

# TESTE
# curl -X POST http://localhost:5001/promocoes/SEU-ID-AQUI/votar \
    # -H "Content-Type: application/json" \
    # -d '{"voto": "positivo"}'
    

# ---------------------------------------------------------------
#  POST /interesses/ — registrar interesse em uma categoria de promoçao
# ---------------------------------------------------------------
#   # Body: { "client_id": "abc123", "categoria": "eletronicos" }

@servidorWeb.route('/categorias/interesse', methods=['POST'])
def registrar_interesse():
    dados = request.get_json()
    client_id = dados.get('client_id')
    categoria = dados.get('categoria')

    if not client_id or not categoria:
        return jsonify({'erro': 'client_id e categoria sao obrigatorios'}), 400
    
    gw.registrar_interesse(client_id, categoria)
    return jsonify({'ok': True}), 201

# ---------------------------------------------------------------
#  DELETE /interesses/ — remover interesse em uma categoria de promoçao
# ---------------------------------------------------------------

@servidorWeb.route('/categorias/interesse/<categoria>', methods=['DELETE'])
def cancelar_interesse(categoria):
    client_id = request.args.get('client_id')

    if not client_id:
        return jsonify({'erro': 'client_id é obrigatorio'}), 400

    gw.cancelar_interesse(client_id, categoria)
    return jsonify({'ok': True}), 200

# ---------------------------------------------------------------
#  SSE
# ---------------------------------------------------------------

@servidorWeb.route('/event/<client_id>', methods=['GET'])
def event(client_id):
    gw._sse_queues[client_id] = Queue()
    def listen():
        while True:
            message = gw._sse_queues[client_id].get()
            yield message
    return Response(listen(),mimetype="text/event-stream", headers={'Cache-Control': 'no-cache'})      
if __name__ == '__main__':
    servidorWeb.run(host='0.0.0.0', port=5001, threaded=True)