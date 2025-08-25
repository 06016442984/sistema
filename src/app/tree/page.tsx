"use client";

import { useEffect, useState } from 'react';
import { Users, Crown, Shield, Stethoscope, FileText, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserWithRoles {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  ativo: boolean;
  user_kitchen_roles: {
    role: 'ADMIN' | 'SUPERVISORA' | 'NUTRICIONISTA' | 'AUX_ADM';
    kitchen_id: string;
    kitchens: {
      id: string;
      nome: string;
      codigo: string;
    };
  }[];
}

interface Kitchen {
  id: string;
  nome: string;
  codigo: string;
}

interface HierarchyData {
  ADMIN: UserWithRoles[];
  SUPERVISORA: UserWithRoles[];
  NUTRICIONISTA: UserWithRoles[];
  AUX_ADM: UserWithRoles[];
}

export default function TreePage() {
  const { userRoles } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [selectedKitchen, setSelectedKitchen] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminPermission();
  }, [userRoles]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const checkAdminPermission = () => {
    const hasAdminRole = userRoles.some(role => role.role === 'ADMIN');
    setIsAdmin(hasAdminRole);
    
    if (!hasAdminRole) {
      toast.error('Acesso negado. Apenas administradores podem visualizar a hierarquia.');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Iniciando carregamento de dados da hierarquia...');

      // Primeiro, testar se as tabelas existem
      console.log('Testando acesso às tabelas...');
      
      const { data: testProfiles, error: testProfilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (testProfilesError) {
        console.error('Erro ao acessar tabela profiles:', testProfilesError);
        throw new Error(`Tabela profiles não acessível: ${testProfilesError.message}`);
      }

      const { data: testKitchens, error: testKitchensError } = await supabase
        .from('kitchens')
        .select('id')
        .limit(1);

      if (testKitchensError) {
        console.error('Erro ao acessar tabela kitchens:', testKitchensError);
        throw new Error(`Tabela kitchens não acessível: ${testKitchensError.message}`);
      }

      console.log('Tabelas acessíveis. Carregando unidades...');

      // Carregar unidades primeiro
      const { data: kitchensData, error: kitchensError } = await supabase
        .from('kitchens')
        .select('id, nome, codigo')
        .eq('ativo', true)
        .order('nome');

      if (kitchensError) {
        console.error('Erro ao carregar unidades:', kitchensError);
        throw kitchensError;
      }

      console.log('Unidades carregadas:', kitchensData?.length);
      setKitchens(kitchensData || []);

      // Carregar usuários básicos primeiro
      console.log('Carregando usuários...');
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, ativo')
        .eq('ativo', true)
        .order('nome');

      if (usersError) {
        console.error('Erro ao carregar usuários:', usersError);
        throw usersError;
      }

      console.log('Usuários carregados:', usersData?.length);

      // Carregar roles separadamente
      console.log('Carregando roles dos usuários...');
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_kitchen_roles')
        .select(`
          user_id,
          kitchen_id,
          role,
          kitchens!inner(id, nome, codigo)
        `);

      if (rolesError) {
        console.error('Erro ao carregar roles:', rolesError);
        throw rolesError;
      }

      console.log('Roles carregados:', rolesData?.length);

      // Combinar dados
      const usersWithRoles = (usersData || []).map(user => {
        const userRoles = (rolesData || [])
          .filter(role => role.user_id === user.id)
          .map(role => ({
            role: role.role,
            kitchen_id: role.kitchen_id,
            kitchens: role.kitchens
          }));

        return {
          ...user,
          user_kitchen_roles: userRoles
        };
      }).filter(user => user.user_kitchen_roles.length > 0); // Apenas usuários com roles

      console.log('Usuários com roles:', usersWithRoles.length);
      setUsers(usersWithRoles);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error(`Erro ao carregar dados da hierarquia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHierarchy = (): HierarchyData => {
    const hierarchy: HierarchyData = {
      ADMIN: [],
      SUPERVISORA: [],
      NUTRICIONISTA: [],
      AUX_ADM: []
    };

    users.forEach(user => {
      user.user_kitchen_roles.forEach(role => {
        if (selectedKitchen === 'all' || role.kitchen_id === selectedKitchen) {
          if (!hierarchy[role.role].find(u => u.id === user.id)) {
            hierarchy[role.role].push(user);
          }
        }
      });
    });

    return hierarchy;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return Crown;
      case 'SUPERVISORA':
        return Shield;
      case 'NUTRICIONISTA':
        return Stethoscope;
      case 'AUX_ADM':
        return FileText;
      default:
        return Users;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'SUPERVISORA':
        return 'Supervisora';
      case 'NUTRICIONISTA':
        return 'Nutricionista';
      case 'AUX_ADM':
        return 'Aux. Administrativo';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'from-red-500 to-red-600';
      case 'SUPERVISORA':
        return 'from-blue-500 to-blue-600';
      case 'NUTRICIONISTA':
        return 'from-green-500 to-green-600';
      case 'AUX_ADM':
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const hierarchy = getFilteredHierarchy();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Acesso Restrito
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Apenas administradores podem visualizar a hierarquia organizacional.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Hierarquia Organizacional
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize a estrutura hierárquica da organização
          </p>
        </div>
        
        {/* Filtro por unidade */}
        <div className="w-full sm:w-64">
          <Select value={selectedKitchen} onValueChange={setSelectedKitchen}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Unidades</SelectItem>
              {kitchens.map((kitchen) => (
                <SelectItem key={kitchen.id} value={kitchen.id}>
                  {kitchen.nome} ({kitchen.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{hierarchy.ADMIN.length}</div>
                <div className="text-sm text-muted-foreground">Administradores</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{hierarchy.SUPERVISORA.length}</div>
                <div className="text-sm text-muted-foreground">Supervisoras</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{hierarchy.NUTRICIONISTA.length}</div>
                <div className="text-sm text-muted-foreground">Nutricionistas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{hierarchy.AUX_ADM.length}</div>
                <div className="text-sm text-muted-foreground">Aux. Administrativos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organograma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Estrutura Organizacional
          </CardTitle>
          <CardDescription>
            {selectedKitchen === 'all' 
              ? 'Hierarquia completa de todas as unidades'
              : `Hierarquia da ${kitchens.find(k => k.id === selectedKitchen)?.nome}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Organograma Visual */}
            <div className="flex flex-col items-center space-y-8">
              
              {/* Nível 1 - Administradores */}
              {hierarchy.ADMIN.length > 0 && (
                <div className="relative">
                  <div className="text-center mb-4">
                    <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">
                      Administradores
                    </Badge>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {hierarchy.ADMIN.map((user) => {
                      const Icon = getRoleIcon('ADMIN');
                      return (
                        <Card key={`admin-${user.id}`} className="w-64 shadow-lg border-2 border-red-200">
                          <CardContent className="p-4">
                            <div className={`w-full h-2 bg-gradient-to-r ${getRoleColor('ADMIN')} rounded-t-lg -mt-4 -mx-4 mb-3`}></div>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <Icon className="h-6 w-6 text-red-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{user.nome}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                {user.telefone && (
                                  <p className="text-xs text-gray-500">{user.telefone}</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {user.user_kitchen_roles.map((role, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {role.kitchens.codigo}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {/* Linha conectora para baixo */}
                  {(hierarchy.SUPERVISORA.length > 0 || hierarchy.NUTRICIONISTA.length > 0 || hierarchy.AUX_ADM.length > 0) && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 top-full">
                      <div className="w-px h-8 bg-gray-300"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Nível 2 - Supervisoras */}
              {hierarchy.SUPERVISORA.length > 0 && (
                <div className="relative">
                  <div className="text-center mb-4">
                    <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                      Supervisoras
                    </Badge>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {hierarchy.SUPERVISORA.map((user) => {
                      const Icon = getRoleIcon('SUPERVISORA');
                      return (
                        <Card key={`supervisora-${user.id}`} className="w-64 shadow-lg border-2 border-blue-200">
                          <CardContent className="p-4">
                            <div className={`w-full h-2 bg-gradient-to-r ${getRoleColor('SUPERVISORA')} rounded-t-lg -mt-4 -mx-4 mb-3`}></div>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Icon className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{user.nome}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                {user.telefone && (
                                  <p className="text-xs text-gray-500">{user.telefone}</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {user.user_kitchen_roles.map((role, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {role.kitchens.codigo}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {/* Linha conectora para baixo */}
                  {(hierarchy.NUTRICIONISTA.length > 0 || hierarchy.AUX_ADM.length > 0) && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 top-full">
                      <div className="w-px h-8 bg-gray-300"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Nível 3 - Nutricionistas */}
              {hierarchy.NUTRICIONISTA.length > 0 && (
                <div className="relative">
                  <div className="text-center mb-4">
                    <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                      Nutricionistas
                    </Badge>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {hierarchy.NUTRICIONISTA.map((user) => {
                      const Icon = getRoleIcon('NUTRICIONISTA');
                      return (
                        <Card key={`nutricionista-${user.id}`} className="w-64 shadow-lg border-2 border-green-200">
                          <CardContent className="p-4">
                            <div className={`w-full h-2 bg-gradient-to-r ${getRoleColor('NUTRICIONISTA')} rounded-t-lg -mt-4 -mx-4 mb-3`}></div>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Icon className="h-6 w-6 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{user.nome}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                {user.telefone && (
                                  <p className="text-xs text-gray-500">{user.telefone}</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {user.user_kitchen_roles.map((role, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {role.kitchens.codigo}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {/* Linha conectora para baixo */}
                  {hierarchy.AUX_ADM.length > 0 && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 top-full">
                      <div className="w-px h-8 bg-gray-300"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Nível 4 - Aux. Administrativos */}
              {hierarchy.AUX_ADM.length > 0 && (
                <div className="relative">
                  <div className="text-center mb-4">
                    <Badge className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1">
                      Aux. Administrativos
                    </Badge>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {hierarchy.AUX_ADM.map((user) => {
                      const Icon = getRoleIcon('AUX_ADM');
                      return (
                        <Card key={`aux-adm-${user.id}`} className="w-64 shadow-lg border-2 border-yellow-200">
                          <CardContent className="p-4">
                            <div className={`w-full h-2 bg-gradient-to-r ${getRoleColor('AUX_ADM')} rounded-t-lg -mt-4 -mx-4 mb-3`}></div>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Icon className="h-6 w-6 text-yellow-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{user.nome}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                {user.telefone && (
                                  <p className="text-xs text-gray-500">{user.telefone}</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {user.user_kitchen_roles.map((role, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {role.kitchens.codigo}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mensagem quando não há dados */}
              {Object.values(hierarchy).every(arr => arr.length === 0) && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nenhum usuário encontrado
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedKitchen === 'all' 
                      ? 'Não há usuários cadastrados no sistema.'
                      : 'Não há usuários cadastrados nesta unidade.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}