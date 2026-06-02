#!/bin/bash

BASE="$HOME/Documents/UTFPR/Sistemas Distribuídos/SD-Avaliacao-IV-Rest/projeto-promocoes"
LOGS="$HOME/Documents/UTFPR/Sistemas Distribuídos/SD-Avaliacao-IV-Rest/logs"

mkdir -p "$LOGS"

echo "Iniciando RabbitMQ..."
brew services start rabbitmq
sleep 3

echo "Iniciando MS Promotion..."
cd "$BASE/promotion" && python3 promotion.py > "$LOGS/promotion.log" 2>&1 &
sleep 2

echo "Iniciando MS Ranking..."
cd "$BASE/ranking" && python3 ranking.py > "$LOGS/ranking.log" 2>&1 &
sleep 1

echo "Iniciando MS Notification..."
cd "$BASE/notification" && python3 notification.py > "$LOGS/notification.log" 2>&1 &
sleep 1

echo "Iniciando MS Gateway..."
cd "$BASE/gateway" && python3 api.py > "$LOGS/gateway.log" 2>&1 &
sleep 1

echo "Abrindo frontend..."
open "$HOME/Documents/UTFPR/Sistemas Distribuídos/SD-Avaliacao-IV-Rest/frontend/front.html"

echo ""
echo "Todos os servicos rodando!"
echo "Logs em: $LOGS/"
echo ""
echo "Para parar tudo: ./parar.sh"
