"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone } from 'lucide-react';
import type { Instance } from '@/hooks/use-whatsapp-config';

interface InstanceListProps {
  instances: Instance[];
  selectedInstanceName: string;
  onSelectInstance: (instanceName: string) => void;
}

export function InstanceList({ instances, selectedInstanceName, onSelectInstance }: InstanceListProps) {
  const getStatusColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'open': return 'bg-green-600';
      case 'close': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (state: string) => {
    switch (state.toLowerCase()) {
      case 'open': return 'Conectado';
      case 'close': return 'Desconectado';
      default: return 'Desconhecido';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Smartphone className="h-6 w-6 text-green-600" />
          Instâncias WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent>
        {instances.length === 0 ? (
          <div className="text-center py-8">
            <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Teste a conexão para ver as instâncias</p>
          </div>
        ) : (
          <div className="space-y-3">
            {instances.map((instance, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border-2 transition-all ${
                  instance.name === selectedInstanceName 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-gray-50 border-gray-200 hover:border-blue-200'
                }`}
                onClick={() => onSelectInstance(instance.name)}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-medium">
                      {instance.name}
                      {instance.name === selectedInstanceName && (
                        <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">SELECIONADA</span>
                      )}
                      {instance.state === 'open' && (
                        <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">ATIVA</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">Clique para selecionar</p>
                  </div>
                </div>
                <Badge className={getStatusColor(instance.state)}>
                  {getStatusText(instance.state)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}