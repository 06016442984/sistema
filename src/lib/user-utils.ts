import { UserRole } from '@/types/database';
import { UserWithRoles } from '@/hooks/use-users';

export const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'SUPERVISORA':
      return 'Supervisora';
    case 'NUTRICIONISTA':
      return 'Nutricionista';
    case 'AUX_ADM':
      return 'Aux. Adm';
    default:
      return role;
  }
};

export const getRoleBadgeColor = (role: UserRole) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800';
    case 'SUPERVISORA':
      return 'bg-blue-100 text-blue-800';
    case 'NUTRICIONISTA':
      return 'bg-green-100 text-green-800';
    case 'AUX_ADM':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getUserKitchenAccess = (user: UserWithRoles) => {
  if (!user.user_kitchen_roles || user.user_kitchen_roles.length === 0) {
    return { count: 0, summary: 'Sem acesso' };
  }

  // Agrupar por cozinha
  const kitchenGroups = user.user_kitchen_roles.reduce((acc, role) => {
    const kitchenId = role.kitchen_id;
    const kitchenName = role.kitchens?.nome || 'Cozinha';
    
    if (!acc[kitchenId]) {
      acc[kitchenId] = {
        name: kitchenName,
        roles: []
      };
    }
    acc[kitchenId].roles.push(role.role);
    return acc;
  }, {} as Record<string, { name: string; roles: UserRole[] }>);

  const kitchenCount = Object.keys(kitchenGroups).length;
  const totalRoles = user.user_kitchen_roles.length;

  return {
    count: kitchenCount,
    totalRoles,
    groups: kitchenGroups,
    summary: `${kitchenCount} cozinha${kitchenCount > 1 ? 's' : ''} • ${totalRoles} função${totalRoles > 1 ? 'ões' : ''}`
  };
};

export const formatPhone = (phone: string) => {
  if (!phone) return '-';
  
  // Se já está formatado, retornar como está
  if (phone.includes('(') || phone.includes('-')) {
    return phone;
  }
  
  // Formatar número brasileiro
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length === 13 && numbers.startsWith('55')) {
    return `+55 (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
  }
  
  return phone;
};

export const formatWorkSchedule = (horaInicio?: string, horaFim?: string) => {
  if (!horaInicio || !horaFim) {
    return {
      display: 'Não configurado',
      hours: 0,
      className: 'text-red-600'
    };
  }

  // Converter para formato de exibição
  const inicio = horaInicio.substring(0, 5); // HH:MM
  const fim = horaFim.substring(0, 5); // HH:MM
  
  // Calcular horas trabalhadas
  const inicioDate = new Date(`2000-01-01T${horaInicio}`);
  const fimDate = new Date(`2000-01-01T${horaFim}`);
  const diffMs = fimDate.getTime() - inicioDate.getTime();
  const hours = diffMs / (1000 * 60 * 60);

  return {
    display: `${inicio} - ${fim}`,
    hours: hours,
    className: hours >= 8 ? 'text-green-600' : hours >= 6 ? 'text-yellow-600' : 'text-orange-600'
  };
};