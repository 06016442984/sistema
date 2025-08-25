"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface PriorityCardProps {
  type: 'alta' | 'media' | 'baixa';
  title: string;
  icon: React.ReactNode;
  enabled: boolean;
  frequency: number;
  times: string[];
  description: string[];
  onToggle: (enabled: boolean) => void;
  colorClasses: {
    border: string;
    header: string;
    title: string;
    badge?: string;
  };
}

export function PriorityCard({
  type,
  title,
  icon,
  enabled,
  frequency,
  times,
  description,
  onToggle,
  colorClasses
}: PriorityCardProps) {
  return (
    <Card className={colorClasses.border}>
      <CardHeader className={colorClasses.header}>
        <CardTitle className={`flex items-center gap-2 ${colorClasses.title}`}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Ativo</Label>
            <Switch 
              checked={enabled}
              onCheckedChange={onToggle}
            />
          </div>
          
          <div>
            <Label>Frequência por dia</Label>
            <Badge 
              variant={type === 'alta' ? 'destructive' : 'secondary'} 
              className={`ml-2 ${colorClasses.badge || ''}`}
            >
              {frequency}x ao dia
            </Badge>
          </div>
          
          <div>
            <Label>Momentos</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {times.map((time, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {time}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            {description.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}