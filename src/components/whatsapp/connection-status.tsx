"use client";

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  apiUrl: string;
}

export function ConnectionStatus({ isConnected, apiUrl }: ConnectionStatusProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <Wifi className="h-6 w-6 text-green-600" />
            ) : (
              <WifiOff className="h-6 w-6 text-red-600" />
            )}
            <div>
              <CardTitle>Status da Conexão</CardTitle>
              <CardDescription>{apiUrl}</CardDescription>
            </div>
          </div>
          <Badge className={isConnected ? 'bg-green-600' : 'bg-red-600'}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}