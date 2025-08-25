"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Users, 
  Calendar,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Kitchen {
  id: string;
  nome: string;
  codigo: string;
  endereco: string | null;
  ativo: boolean;
  criado_em: string;
  criado_por: string | null;
}

export default function KitchensPage() {
  const { user } = useAuth();
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchKitchens();
    }
  }, [user]);

  const fetchKitchens = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('kitchens')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cozinhas:', error);
        toast.error('Erro ao carregar cozinhas');
        return;
      }

      setKitchens(data || []);
    } catch (error) {
      console.error('Erro ao buscar cozinhas:', error);
      toast.error('Erro ao carregar cozinhas');
    } finally {
      setLoading(false);
    }
  };

  const filteredKitchens = kitchens.filter(kitchen =>
    kitchen.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kitchen.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kitchen.endereco && kitchen.endereco.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold gradient-text">
            Cozinhas
          </h1>
          <p className="text-slate-400">
            Gerencie todas as unidades de cozinha do sistema
          </p>
        </div>
        
        <Button className="btn-premium">
          <Plus className="h-4 w-4 mr-2" />
          Nova Cozinha
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, código ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Badge className="badge-primary">
                {filteredKitchens.length} cozinha{filteredKitchens.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kitchens Grid */}
      {filteredKitchens.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchTerm ? 'Nenhuma cozinha encontrada' : 'Nenhuma cozinha cadastrada'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Comece criando sua primeira cozinha'
              }
            </p>
            {!searchTerm && (
              <Button className="btn-premium">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Cozinha
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKitchens.map((kitchen, index) => (
            <Card 
              key={kitchen.id} 
              className="glass-card hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-white text-lg">
                      {kitchen.nome}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Código: {kitchen.codigo}
                    </CardDescription>
                  </div>
                  <Badge className="badge-success">
                    Ativa
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {kitchen.endereco && (
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{kitchen.endereco}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Criada em {new Date(kitchen.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <Users className="h-4 w-4" />
                  <span>0 usuários ativos</span>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}