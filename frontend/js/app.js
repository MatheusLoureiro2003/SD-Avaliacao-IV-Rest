const API        = 'http://localhost:5001';
const CATEGORIAS = ['livros', 'jogos', 'eletronicos', 'roupas', 'alimentos'];
const HOT_SCORE  = 5;

function gerarClientId() {
  let id = localStorage.getItem('promo_client_id');
  if (!id) {
    id = 'user-' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem('promo_client_id', id);
  }
  return id;
}

const app = angular.module('promoApp', []);

// ---------------------------------------------------------------
// Controller principal — controla abas e client_id
// ---------------------------------------------------------------
app.controller('AppCtrl', function($scope) {
  this.aba        = 'cliente';
  this.clientId   = gerarClientId();
  this.interesses = {};  // { categoria: true/false } — compartilhado entre lista e gerenciar
  this.notificacoes = []
  var source = new EventSource(API + '/event/' + this.clientId)
  source.addEventListener('message', event => {
          let data = JSON.parse(event.data);
          $scope.$apply(() => {
      this.notificacoes.push(data);
    })}, false);
});

// ---------------------------------------------------------------
// Componente: lista-promocoes
//   Responsável por listar todas as promoções e disparar votos.
// ---------------------------------------------------------------
app.component('listaPromocoes', {
  bindings: { interesses: '<' },
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">Promoções para você</h5>
        <button class="btn btn-outline-secondary btn-sm" ng-click="$ctrl.carregar()" ng-disabled="$ctrl.carregando">
          <span ng-if="$ctrl.carregando" class="spinner-border spinner-border-sm me-1"></span>
          Atualizar
        </button>
      </div>

      <div ng-if="$ctrl.erro" class="alert alert-danger">{{$ctrl.erro}}</div>

      <div ng-if="!$ctrl.carregando && $ctrl.filtradas().length === 0 && !$ctrl.erro"
           class="alert alert-info">
        Nenhuma promoção para exibir. Registre interesse em categorias abaixo para ver promoções aqui, ou aguarde um hot deal. 🔥
      </div>

      <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
        <div class="col" ng-repeat="p in $ctrl.filtradas()">
          <promocao-card promo="p" on-votar="$ctrl.votar(promo, tipo)"></promocao-card>
        </div>
      </div>

      <div ng-if="$ctrl.feedback" class="alert alert-success mt-3">{{$ctrl.feedback}}</div>
    </div>
  `,
  controller: function($http, $timeout) {
    const $ctrl = this;
    $ctrl.promocoes  = [];
    $ctrl.carregando = false;
    $ctrl.erro       = '';
    $ctrl.feedback   = '';

    $ctrl.filtradas = function() {
      return $ctrl.promocoes.filter(function(p) {
        const votos = p.votos || {};
        const score = (votos.positivos || 0) - (votos.negativos || 0);
        const isHot = score >= HOT_SCORE;
        const temInteresse = $ctrl.interesses && $ctrl.interesses[p.categoria];
        return isHot || temInteresse;
      });
    };

    $ctrl.$onInit = function() { $ctrl.carregar(); };

    $ctrl.carregar = function() {
      $ctrl.carregando = true;
      $ctrl.erro = '';
      $http.get(API + '/promocoes')
        .then(function(res) {
          $ctrl.promocoes = res.data;
        }, function() {
          $ctrl.erro = 'Não foi possível conectar ao servidor. Verifique se api.py está rodando.';
        })
        .finally(function() { $ctrl.carregando = false; });
    };

    $ctrl.votar = function(promo, tipo) {
      $http.post(API + '/promocoes/' + promo.id + '/votar', { voto: tipo })
        .then(function() {
          $ctrl.feedback = 'Voto "' + tipo + '" registrado!';
          $timeout(function() {
            $ctrl.feedback = '';
            $ctrl.carregar();
          }, 1200);
        }, function() {
          $ctrl.erro = 'Erro ao registrar voto.';
        });
    };
  }
});

// ---------------------------------------------------------------
// Componente: promocao-card
//   Exibe os dados de uma única promoção e emite eventos de voto.
// ---------------------------------------------------------------
app.component('promocaoCard', {
  bindings: {
    promo:   '<',
    onVotar: '&'
  },
  template: `
    <div class="card h-100 shadow-sm" ng-class="{'card-hot': $ctrl.isHot()}">
      <div class="card-header d-flex justify-content-between align-items-center">
        <strong class="text-truncate me-2">{{$ctrl.promo.titulo}}</strong>
        <span ng-if="$ctrl.isHot()" class="badge badge-hot text-white text-nowrap">🔥 HOT DEAL</span>
      </div>
      <div class="card-body d-flex flex-column">
        <p class="card-text text-muted small flex-grow-1">{{$ctrl.promo.descricao || '—'}}</p>

        <span class="badge bg-secondary mb-2 align-self-start">{{$ctrl.promo.categoria}}</span>

        <div class="mb-3">
          <span class="text-decoration-line-through text-muted small me-2">
            R$ {{$ctrl.promo.preco_original | number:2}}
          </span>
          <span class="fs-5 fw-bold text-success">R$ {{$ctrl.promo.preco_promocional | number:2}}</span>
          <span class="badge bg-danger ms-1">-{{$ctrl.desconto()}}%</span>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-success"
                  ng-click="$ctrl.onVotar({promo: $ctrl.promo, tipo: 'positivo'})">
            👍 {{$ctrl.promo.votos.positivos || 0}}
          </button>
          <button class="btn btn-sm btn-outline-danger"
                  ng-click="$ctrl.onVotar({promo: $ctrl.promo, tipo: 'negativo'})">
            👎 {{$ctrl.promo.votos.negativos || 0}}
          </button>
          <span class="ms-auto small"
                ng-class="$ctrl.score() >= 0 ? 'score-pos' : 'score-neg'">
            score {{$ctrl.score() >= 0 ? '+' : ''}}{{$ctrl.score()}}
          </span>
        </div>
      </div>
    </div>
  `,
  controller: function() {
    const $ctrl = this;

    $ctrl.score = function() {
      const v = $ctrl.promo && $ctrl.promo.votos || {};
      return (v.positivos || 0) - (v.negativos || 0);
    };

    $ctrl.isHot = function() { return $ctrl.score() >= HOT_SCORE; };

    $ctrl.desconto = function() {
      const p = $ctrl.promo;
      if (!p || !p.preco_original) return 0;
      return Math.round(100 * (1 - p.preco_promocional / p.preco_original));
    };
  }
});

// ---------------------------------------------------------------
// Componente: formulario-cadastro
//   Formulário da loja para cadastrar uma nova promoção.
// ---------------------------------------------------------------
app.component('formularioCadastro', {
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-7">
        <div class="card shadow-sm">
          <div class="card-header"><strong>Cadastrar nova promoção</strong></div>
          <div class="card-body">
            <form name="formCad" ng-submit="$ctrl.cadastrar()" novalidate>

              <div class="mb-3">
                <label class="form-label">Título <span class="text-danger">*</span></label>
                <input type="text" class="form-control" ng-model="$ctrl.form.titulo"
                       ng-class="{'is-invalid': formCad.$submitted && !$ctrl.form.titulo}" required />
                <div class="invalid-feedback">Campo obrigatório.</div>
              </div>

              <div class="mb-3">
                <label class="form-label">Descrição</label>
                <textarea class="form-control" ng-model="$ctrl.form.descricao" rows="2"></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label">E-mail da loja <span 
              class="text-danger">*</span></label>
                <input type="email" class="form-control" 
              ng-model="$ctrl.form.email"
                      ng-class="{'is-invalid': formCad.$submitted && 
              !$ctrl.form.email}" required />
                <div class="invalid-feedback">Campo obrigatório.</div>
              </div>

              <div class="mb-3">
                <label class="form-label">Categoria <span class="text-danger">*</span></label>
                <select class="form-select" ng-model="$ctrl.form.categoria"
                        ng-class="{'is-invalid': formCad.$submitted && !$ctrl.form.categoria}" required>
                  <option value="">Selecione...</option>
                  <option ng-repeat="c in $ctrl.categorias" value="{{c}}">{{c}}</option>
                </select>
                <div class="invalid-feedback">Campo obrigatório.</div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Preço original (R$) <span class="text-danger">*</span></label>
                  <input type="number" step="0.01" min="0.01" class="form-control"
                         ng-model="$ctrl.form.preco_original" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Preço promocional (R$) <span class="text-danger">*</span></label>
                  <input type="number" step="0.01" min="0.01" class="form-control"
                         ng-model="$ctrl.form.preco_promocional" required />
                </div>
              </div>

              <div ng-if="$ctrl.alerta" class="alert"
                   ng-class="$ctrl.sucesso ? 'alert-success' : 'alert-danger'">
                {{$ctrl.alerta}}
              </div>

              <button type="submit" class="btn btn-primary w-100" ng-disabled="$ctrl.enviando">
                <span ng-if="$ctrl.enviando" class="spinner-border spinner-border-sm me-1"></span>
                Publicar promoção
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  controller: function($http, $scope) {
    const $ctrl   = this;
    $ctrl.categorias = CATEGORIAS;
    $ctrl.form    = {};
    $ctrl.enviando = false;
    $ctrl.alerta  = '';
    $ctrl.sucesso = false;

    $ctrl.cadastrar = function() {
      const f = $ctrl.form;
      if (!f.titulo || !f.categoria || !f.preco_original || !f.preco_promocional) {
        $ctrl.alerta  = 'Preencha todos os campos obrigatórios.';
        $ctrl.sucesso = false;
        return;
      }
      if (Number(f.preco_promocional) >= Number(f.preco_original)) {
        $ctrl.alerta  = 'O preço promocional deve ser menor que o preço original.';
        $ctrl.sucesso = false;
        return;
      }
      if (!f.titulo || !f.categoria || !f.preco_original ||!f.preco_promocional || !f.email) { 
        $ctrl.alerta  = 'Preencha todos os campos obrigatórios.';
        $ctrl.sucesso = false;
        return;
      }

      $ctrl.enviando = true;
      $ctrl.alerta   = '';

      const payload = {
        titulo:            f.titulo,
        descricao:         f.descricao || '',
        categoria:         f.categoria,
        preco_original:    Number(f.preco_original),
        preco_promocional: Number(f.preco_promocional),
        email:             f.email,
      };

      $http.post(API + '/promocoes', payload)
        .then(function(res) {
          $ctrl.alerta  = 'Promoção publicada! ID: ' + res.data.id;
          $ctrl.sucesso = true;
          $ctrl.form    = {};
          if ($scope.formCad) {
            $scope.formCad.$setPristine();
            $scope.formCad.$setUntouched();
          }
        }, function() {
          $ctrl.alerta  = 'Erro ao cadastrar promoção. Verifique se o servidor está rodando.';
          $ctrl.sucesso = false;
        })
        .finally(function() { $ctrl.enviando = false; });
    };
  }
});

// ---------------------------------------------------------------
// Componente: gerenciar-interesses
//   Permite ao cliente registrar e cancelar interesse por categoria.
// ---------------------------------------------------------------
app.component('gerenciarInteresses', {
  bindings: { clientId: '<', interesses: '<' },
  template: `
    <div>
      <h5 class="mb-1">Interesses por categoria</h5>
      <p class="client-id-badge mb-3">ID do cliente: <code>{{$ctrl.clientId}}</code></p>

      <div class="d-flex flex-wrap gap-2 mb-3">
        <button ng-repeat="c in $ctrl.categorias"
                class="btn btn-sm interesse-btn"
                ng-class="$ctrl.interesses[c] ? 'btn-primary' : 'btn-outline-secondary'"
                ng-click="$ctrl.toggle(c)"
                ng-disabled="$ctrl.pendente[c]">
          <span ng-if="$ctrl.pendente[c]" class="spinner-border spinner-border-sm me-1"></span>
          {{c}}
          <span ng-if="$ctrl.interesses[c]"> ✓</span>
        </button>
      </div>

      <div ng-if="$ctrl.alerta" class="alert alert-sm"
           ng-class="$ctrl.sucesso ? 'alert-success' : 'alert-danger'">
        {{$ctrl.alerta}}
      </div>
    </div>
  `,
  controller: function($http, $timeout) {
    const $ctrl    = this;
    $ctrl.categorias = CATEGORIAS;
    $ctrl.pendente = {};
    $ctrl.alerta   = '';
    $ctrl.sucesso  = false;

    $ctrl.toggle = function(cat) {
      $ctrl.pendente[cat] = true;
      $ctrl.alerta = '';

      if ($ctrl.interesses[cat]) {
        $http.delete(API + '/categorias/interesse/' + cat + '?client_id=' + $ctrl.clientId)
          .then(function() {
            $ctrl.interesses[cat] = false;
            $ctrl.alerta  = 'Interesse em "' + cat + '" removido.';
            $ctrl.sucesso = true;
          }, function() {
            $ctrl.alerta  = 'Erro ao remover interesse em "' + cat + '".';
            $ctrl.sucesso = false;
          })
          .finally(function() {
            $ctrl.pendente[cat] = false;
            $timeout(function() { $ctrl.alerta = ''; }, 2500);
          });
      } else {
        $http.post(API + '/categorias/interesse', { client_id: $ctrl.clientId, categoria: cat })
          .then(function() {
            $ctrl.interesses[cat] = true;
            $ctrl.alerta  = 'Interesse em "' + cat + '" registrado!';
            $ctrl.sucesso = true;
          }, function() {
            $ctrl.alerta  = 'Erro ao registrar interesse em "' + cat + '".';
            $ctrl.sucesso = false;
          })
          .finally(function() {
            $ctrl.pendente[cat] = false;
            $timeout(function() { $ctrl.alerta = ''; }, 2500);
          });
      }
    };
  }
});
