#!/bin/bash

# Script para instalar Firebase Admin SDK no Hostgator
# Execute via SSH ou terminal do cPanel

echo "🔥 Instalando Firebase Admin SDK para PHP..."

# Navegar para o diretório do projeto
cd /home/usuario/public_html

# Instalar Composer se não existir
if [ ! -f "composer.phar" ]; then
    echo "📦 Baixando Composer..."
    curl -sS https://getcomposer.org/installer | php
fi

# Criar composer.json se não existir
if [ ! -f "composer.json" ]; then
    echo "📝 Criando composer.json..."
    cat > composer.json << 'EOF'
{
    "require": {
        "google/cloud-firestore": "^1.0",
        "google/cloud-core": "^1.0"
    }
}
EOF
fi

# Instalar dependências
echo "⬇️ Instalando dependências..."
php composer.phar install --no-dev --optimize-autoloader

# Criar estrutura de diretórios
echo "📁 Criando estrutura de diretórios..."
mkdir -p cron/logs
mkdir -p cron/config

# Definir permissões
echo "🔐 Configurando permissões..."
chmod 755 cron/
chmod 755 cron/logs/
chmod 600 cron/config/

echo "✅ Instalação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Baixar service account JSON do Firebase Console"
echo "2. Renomear para firebase-service-account.json"
echo "3. Colocar em cron/config/"
echo "4. Configurar cron job no cPanel:"
echo "   */5 * * * * /usr/bin/php /home/usuario/public_html/cron/process-reminders.php"