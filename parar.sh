#!/bin/bash

echo "Parando servicos Python..."
pkill -f "promotion.py"
pkill -f "ranking.py"
pkill -f "notification.py"
pkill -f "api.py"

echo "Parando RabbitMQ..."
brew services stop rabbitmq

echo "Tudo parado."
