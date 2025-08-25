"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';

export default function ContractsSettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">Contratos</h1>
          <p className="text-text-secondary">
            Gerencie contratos e documentos
          </p>
        </div>

        {/* Contracts Configuration */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-text-primary">Gerenciamento de Contratos</CardTitle>
                <CardDescription className="text-text-secondary">
                  Configure templates e processos de contratos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">Gerenciamento de contratos em desenvolvimento...</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}