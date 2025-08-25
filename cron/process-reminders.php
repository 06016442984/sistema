<?php
/**
 * Script para processar lembretes de tarefas
 * Executado via cron job no Hostgator
 * 
 * Configuração no cPanel:
 * */5 * * * * /usr/bin/php /home/usuario/public_html/cron/process-reminders.php
 */

// Configurações
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Definir timezone
date_default_timezone_set('America/Sao_Paulo');

// Incluir autoloader do Composer (Firebase SDK)
require_once __DIR__ . '/../vendor/autoload.php';

use Google\Cloud\Firestore\FirestoreClient;
use Google\Cloud\Core\Timestamp;

class ReminderProcessor {
    private $firestore;
    private $whatsappConfig;
    private $logFile;
    
    public function __construct() {
        $this->logFile = __DIR__ . '/logs/reminders_' . date('Y-m-d') . '.log';
        $this->initializeFirestore();
        $this->loadWhatsAppConfig();
        $this->log("🚀 Iniciando processamento de lembretes...");
    }
    
    private function initializeFirestore() {
        try {
            // Configurar Firebase (ajustar caminho do service account)
            $this->firestore = new FirestoreClient([
                'projectId' => 'SEU_PROJECT_ID_FIREBASE',
                'keyFilePath' => __DIR__ . '/../config/firebase-service-account.json'
            ]);
            $this->log("✅ Firebase conectado com sucesso");
        } catch (Exception $e) {
            $this->log("❌ Erro ao conectar Firebase: " . $e->getMessage());
            exit(1);
        }
    }
    
    private function loadWhatsAppConfig() {
        // Carregar configurações do WhatsApp (ajustar conforme necessário)
        $this->whatsappConfig = [
            'api_url' => 'https://n88n-evolution-api.tijjpa.easypanel.host',
            'api_key' => '05F9D81C8C09-441A-B724-1558572D1281',
            'instance_name' => 'educafit'
        ];
        $this->log("📱 Configurações WhatsApp carregadas");
    }
    
    public function processReminders() {
        try {
            $now = new Timestamp(new DateTime());
            $processed = 0;
            $errors = 0;
            
            // Buscar lembretes pendentes
            $reminders = $this->firestore->collection('task_reminders')
                ->where('sent', '=', false)
                ->where('scheduled_time', '<=', $now)
                ->limit(50)
                ->documents();
            
            $reminderCount = 0;
            foreach ($reminders as $reminder) {
                $reminderCount++;
            }
            
            if ($reminderCount === 0) {
                $this->log("✅ Nenhum lembrete pendente encontrado");
                return;
            }
            
            $this->log("📋 {$reminderCount} lembrete(s) encontrado(s) para processar");
            
            // Processar cada lembrete
            foreach ($reminders as $reminder) {
                try {
                    $reminderData = $reminder->data();
                    $reminderId = $reminder->id();
                    
                    // Buscar dados da tarefa
                    $taskDoc = $this->firestore->collection('tasks')
                        ->document($reminderData['task_id'])
                        ->snapshot();
                    
                    if (!$taskDoc->exists()) {
                        $this->log("⚠️ Tarefa {$reminderData['task_id']} não encontrada");
                        $this->markReminderAsSent($reminderId);
                        continue;
                    }
                    
                    $taskData = $taskDoc->data();
                    
                    // Buscar dados do usuário
                    $userDoc = $this->firestore->collection('profiles')
                        ->document($reminderData['user_id'])
                        ->snapshot();
                    
                    if (!$userDoc->exists()) {
                        $this->log("⚠️ Usuário {$reminderData['user_id']} não encontrado");
                        $this->markReminderAsSent($reminderId);
                        continue;
                    }
                    
                    $userData = $userDoc->data();
                    
                    // Verificar se usuário tem telefone
                    if (empty($userData['telefone'])) {
                        $this->log("⚠️ Usuário {$userData['nome']} não tem telefone");
                        $this->markReminderAsSent($reminderId);
                        continue;
                    }
                    
                    // Buscar dados do projeto
                    $projectDoc = $this->firestore->collection('projects')
                        ->document($taskData['project_id'])
                        ->snapshot();
                    
                    $projectName = $projectDoc->exists() ? 
                        $projectDoc->data()['nome'] : 'Projeto';
                    
                    // Preparar dados para WhatsApp
                    $whatsappData = [
                        'taskId' => $reminderData['task_id'],
                        'taskTitle' => $taskData['titulo'] ?? 'Tarefa',
                        'taskDescription' => $taskData['descricao'] ?? '',
                        'projectName' => $projectName,
                        'priority' => $taskData['prioridade'] ?? 'MEDIA',
                        'deadline' => $taskData['prazo'] ?? null,
                        'assignedUserId' => $reminderData['user_id'],
                        'assignedByName' => 'Sistema de Lembretes',
                        'reminderType' => $reminderData['reminder_type'],
                        'userPhone' => $userData['telefone'],
                        'userName' => $userData['nome']
                    ];
                    
                    $this->log("📱 Enviando lembrete {$reminderData['reminder_type']} para {$userData['nome']}");
                    
                    // Enviar WhatsApp
                    $whatsappResult = $this->sendWhatsApp($whatsappData);
                    
                    if ($whatsappResult['success']) {
                        // Marcar como enviado
                        $this->markReminderAsSent($reminderId);
                        
                        // Log de sucesso
                        $this->logToAudit($reminderData['user_id'], 'reminder_sent', [
                            'reminder_id' => $reminderId,
                            'reminder_type' => $reminderData['reminder_type'],
                            'task_title' => $taskData['titulo'],
                            'whatsapp_result' => $whatsappResult
                        ]);
                        
                        $processed++;
                        $this->log("✅ Lembrete enviado com sucesso para {$userData['nome']}");
                        
                    } else {
                        $errors++;
                        $this->log("❌ Erro ao enviar lembrete: " . $whatsappResult['error']);
                        
                        // Log de erro
                        $this->logToAudit($reminderData['user_id'], 'reminder_failed', [
                            'reminder_id' => $reminderId,
                            'reminder_type' => $reminderData['reminder_type'],
                            'error' => $whatsappResult['error']
                        ]);
                    }
                    
                } catch (Exception $e) {
                    $errors++;
                    $this->log("💥 Erro ao processar lembrete: " . $e->getMessage());
                }
                
                // Pequena pausa entre envios
                usleep(500000); // 0.5 segundos
            }
            
            $this->log("✅ Processamento concluído: {$processed} enviados, {$errors} erros");
            
        } catch (Exception $e) {
            $this->log("💥 Erro geral: " . $e->getMessage());
        }
    }
    
    private function sendWhatsApp($data) {
        try {
            // Formatar telefone (remover caracteres especiais)
            $phone = preg_replace('/[^0-9]/', '', $data['userPhone']);
            
            // Adicionar código do país se necessário
            if (strlen($phone) === 11 && substr($phone, 0, 1) !== '55') {
                $phone = '55' . $phone;
            }
            
            // Montar mensagem
            $message = $this->buildWhatsAppMessage($data);
            
            // Dados para API
            $postData = [
                'number' => $phone,
                'text' => $message
            ];
            
            // Configurar cURL
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $this->whatsappConfig['api_url'] . '/message/sendText/' . $this->whatsappConfig['instance_name'],
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($postData),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'apikey: ' . $this->whatsappConfig['api_key']
                ]
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($error) {
                return ['success' => false, 'error' => 'cURL Error: ' . $error];
            }
            
            if ($httpCode !== 200) {
                return ['success' => false, 'error' => 'HTTP ' . $httpCode . ': ' . $response];
            }
            
            $result = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                return ['success' => false, 'error' => 'Invalid JSON response'];
            }
            
            return ['success' => true, 'data' => $result];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    private function buildWhatsAppMessage($data) {
        $reminderTypes = [
            'DELEGACAO' => '📋 Nova Tarefa Atribuída',
            'INICIO_JORNADA' => '🌅 Lembrete - Início do Dia',
            'MEIO_JORNADA' => '☀️ Lembrete - Meio do Dia',
            'FIM_JORNADA' => '🌆 Lembrete - Final do Dia'
        ];
        
        $priorityEmojis = [
            'ALTA' => '🔴',
            'MEDIA' => '🟡',
            'BAIXA' => '🟢'
        ];
        
        $title = $reminderTypes[$data['reminderType']] ?? '📋 Lembrete de Tarefa';
        $priorityEmoji = $priorityEmojis[$data['priority']] ?? '🟡';
        
        $message = "*{$title}*\n\n";
        $message .= "👋 Olá, {$data['userName']}!\n\n";
        $message .= "📝 *Tarefa:* {$data['taskTitle']}\n";
        $message .= "📁 *Projeto:* {$data['projectName']}\n";
        $message .= "{$priorityEmoji} *Prioridade:* {$data['priority']}\n";
        
        if (!empty($data['deadline'])) {
            $deadline = date('d/m/Y', strtotime($data['deadline']));
            $message .= "📅 *Prazo:* {$deadline}\n";
        }
        
        if (!empty($data['taskDescription'])) {
            $message .= "\n📋 *Descrição:*\n{$data['taskDescription']}\n";
        }
        
        $message .= "\n---\n";
        $message .= "🤖 *Mensagem automática do sistema*";
        
        return $message;
    }
    
    private function markReminderAsSent($reminderId) {
        try {
            $this->firestore->collection('task_reminders')
                ->document($reminderId)
                ->update([
                    ['path' => 'sent', 'value' => true],
                    ['path' => 'sent_at', 'value' => new Timestamp(new DateTime())]
                ]);
        } catch (Exception $e) {
            $this->log("❌ Erro ao marcar lembrete como enviado: " . $e->getMessage());
        }
    }
    
    private function logToAudit($userId, $action, $payload) {
        try {
            $this->firestore->collection('audit_logs')->add([
                'user_id' => $userId,
                'recurso' => 'task_reminder',
                'acao' => $action,
                'payload' => $payload,
                'criado_em' => new Timestamp(new DateTime())
            ]);
        } catch (Exception $e) {
            $this->log("❌ Erro ao salvar log de auditoria: " . $e->getMessage());
        }
    }
    
    private function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] {$message}\n";
        
        // Criar diretório de logs se não existir
        $logDir = dirname($this->logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        // Escrever no arquivo de log
        file_put_contents($this->logFile, $logMessage, FILE_APPEND | LOCK_EX);
        
        // Também exibir no console (para debug)
        echo $logMessage;
    }
}

// Executar processamento
try {
    $processor = new ReminderProcessor();
    $processor->processReminders();
} catch (Exception $e) {
    error_log("Erro fatal no processamento de lembretes: " . $e->getMessage());
    exit(1);
}

?>