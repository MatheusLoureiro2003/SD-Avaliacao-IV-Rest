* Avaliação IV - Microsserviços, Sistema de Mensageria, REST, SSE, Chaves assimétricas

Desenvolver uma aplicação web distribuída para gerenciamento e divulgação de promoções de produtos.
A aplicação deve seguir uma arquitetura baseada em microsserviços e orientada a eventos (Event-Driven Architecture). Os microsserviços devem se comunicar de forma assíncrona e desacoplada utilizando RabbitMQ. Não é permitido realizar chamadas diretas entre os microsserviços.

- A aplicação deve possuir:

• frontend web implementado em linguagem diferente do backend;
• comunicação REST entre frontend e backend;
• notificações em tempo real utilizando SSE (Server-Sent Events);
• integração com API externa de envio de e-mails;
• assinatura digital dos eventos publicados pela loja.
• Usuários do tipo loja poderão cadastrar promoções de produtos.
• Usuários consumidores poderão consultar promoções, votar em promoções cadastradas e registrar interesse em categorias específicas para receber notificações em tempo real via SSE.
• Promoções com grande quantidade de votos positivos (definir um limite) devem ser classificadas como promoções em destaque (hot deals).

- Frontend (valor 0,5)

• O frontend deve ser desenvolvido em linguagem diferente daquela utilizada no backend e deve se comunicar com o sistema exclusivamente através de uma API REST.
• O frontend também deve receber notificações sobre promoções do seu interesse através do SSE.
• Os usuários consumidores poderão interagir com a aplicação web para:
1. consultar promoções publicadas;
2. votar positivamente ou negativamente em promoções;
3. registrar interesse em categorias de produtos;
4. cancelar interesse em categorias;
5. receber notificações em tempo real sobre promoções de interesse. As notificações SSE devem ser exibidas automaticamente no navegador sem necessidade de atualização manual da página.

- Loja (valor 0,5)

Consumirá a API do sistema de Promoção para cadastrar promoções e informar o e-mail. A loja receberá notificações por e-mail relacionadas aos destaques de suas promoções. Assinará as mensagens de cadastro de promoções. Somente serão aceitas as promoções das assinaturas validadas.

- Backend (valor 1,5)
O backend será composto por quatro microsserviços independentes, desenvolvidos de forma desacoplada, que se comunicam exclusivamente através do RabbitMQ. (valor 1,0) MS Gateway/API

Responsável por:

• expor a API REST consumida pelo frontend;
• transformar ações dos usuários em eventos publicados no RabbitMQ;
• consumir eventos dos demais microsserviços;
• manter conexões SSE com os clientes;
• encaminhar notificações SSE apenas para os clientes interessados.

- API REST (valor 0,5)
O MS Gateway deve disponibilizar endpoints REST para:
• cadastrar promoções (loja);
• listar promoções publicadas;
• votar em promoções;
• registrar interesse em categorias;
• cancelar interesse em categorias.

- SSE (valor 0,5)
O MS Gateway deve manter conexões SSE com os clientes para envio de notificações em
tempo real.
As notificações SSE devem incluir:
• promoções em destaque (hot deals);
• promoções relacionadas às categorias seguidas pelo usuário.
O serviço deve manter os interesses dos usuários e filtrar os eventos recebidos antes de enviá-los ao navegador.

RabbitMQ Publica os eventos:
• promotion.vote
Consome os eventos:
• promotion.published
• promotion.destaque
• promotion.categoria
• notificação.hotdeal

- MS Promoção (valor 0,2)
Responsável pelo gerenciamento das promoções cadastradas.
O microsserviço:
• consome eventos de novas promoções;
• valida a assinatura digital dos eventos recebidos da loja via MS Gateway;
• registra promoções válidas;
• publica eventos indicando que a promoção foi disponibilizada.

RabbitMQ Consome: 
• promocao.recebida
Publica: promocao.publicada

- MS Ranking
Responsável pelo processamento dos votos associados às promoções.
Ao receber um evento:
• valida a assinatura digital;
• processa o voto;
• atualiza o score da promoção;
• identifica promoções em destaque.

Quando o limite de popularidade for atingido, o serviço deve publicar um evento indicando que a promoção se tornou um hot deal.

RabbitMQ Consome: 
promocao.voto
Publica: promocao.destaque

- (valor 0,3) MS Notificação
Responsável pelo envio de notificações por e-mail relacionadas às promoções.
O microsserviço deve:
• consumir eventos relacionados a promoções publicadas e promoções em
destaque;
• validar as assinaturas digitais;
• identificar os tipos de notificação necessários;
• publicar eventos destinados ao Gateway;
• integrar-se a uma API externa para envio de e-mails.
RabbitMQ
Consome:
• promocao.publicada
• promocao.destaque
Publica:
• promocao.categoria
Atenção: as notificações destinadas aos consumidores serão posteriormente enviadas ao
navegador pelo MS Gateway através de SSE.

- API externa de e-mail
O MS Notificação deve utilizar uma API externa de envio de e-mails para notificar as
lojas responsáveis pelas promoções.
Exemplos de notificações:
• promoção aprovada;
• promoção tornou-se hot deal.
Sugestão de API para envio de e-mail: Resend

Observações:
• Desenvolva uma interface gráfica com recursos de interação apropriados.
• É obrigatória a defesa da aplicação para obter a nota.
• O desenvolvimento do sistema pode ser individual ou em dupla.