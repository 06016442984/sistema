# 🔥 Sistema de Lembretes - Hostgator + Firebase

## 📋 Pré-requisitos

- Hostgator com suporte a PHP 7.4+
- Projeto Firebase configurado
- Acesso SSH ou Terminal no cPanel
- Composer instalado

## 🚀 Instalação

### 1. Preparar Ambiente
```bash
# Executar via SSH ou Terminal cPanel
chmod +x install-dependencies.sh
./install-dependencies.sh
```

### 2. Configurar Firebase

1. **Firebase Console** → Configurações do Projeto → Contas de Serviço
2. **Gerar nova chave privada** (JSON)
3. **Baixar arquivo** e renomear para `firebase-service-account.json`
4. **Upload** para `/cron/config/firebase-service-account.json`

### 3. Configurar Script

Editar `process-reminders.php`:
```php
// Linha 32 - Ajustar Project ID
'projectId' => 'SEU_PROJECT_ID_FIREBASE',

// Linha 33 - Verificar caminho do service account
'keyFilePath' => __DIR__ . '/../config/firebase-service-account.json'

// Linhas 42-46 - Configurar WhatsApp API
$this->whatsappConfig = [
    'api_url' => 'SUA_API_URL',
    'api_key' => 'SUA_API_KEY',
    'instance_name' => 'SUA_INSTANCIA'
];
```

### 4. Configurar Cron Job

**cPanel → Cron Jobs:**
```bash
# A cada 5 minutos
*/5 * * * * /usr/bin/php /home/usuario/public_html/cron/process-reminders.php

# OU a cada minuto (mais responsivo)
* * * * * /usr/bin/php /home/usuario/public_html/cron/process-reminders.php
```

## 📊 Monitoramento

### Logs
- **Localização**: `/cron/logs/reminders_YYYY-MM-DD.log`
- **Rotação**: Diária automática
- **Conteúdo**: Timestamps, sucessos, erros

### Verificar Status
```bash
# Ver logs do dia
tail -f /home/usuario/public_html/cron/logs/reminders_$(date +%Y-%m-%d).log

# Verificar últimas execuções
ls -la /home/usuario/public_html/cron/logs/
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Erro de permissão Firebase**
   - Verificar service account JSON
   - Confirmar Project ID
   - Testar permissões Firestore

2. **Cron não executa**
   - Verificar caminho PHP: `which php`
   - Testar script manual: `php process-reminders.php`
   - Verificar logs cPanel

3. **WhatsApp não envia**
   - Verificar API URL/Key
   - Testar instância ativa
   - Verificar formato telefone

### Teste Manual
```bash
# Executar uma vez para testar
cd /home/usuario/public_html/cron
php process-reminders.php
```

## 📈 Performance

- **Limite**: 50 lembretes por execução
- **Pausa**: 0.5s entre envios
- **Timeout**: 30s por requisição WhatsApp
- **Logs**: Rotação diária automática

## 🔒 Segurança

- Service account com permissões mínimas
- Logs sem dados sensíveis
- Timeout para evitar travamentos
- Validação de dados antes envio

## 📞 Suporte

Em caso de problemas:
1. Verificar logs em `/cron/logs/`
2. Testar execução manual
3. Verificar configurações Firebase
4. Validar API WhatsApp