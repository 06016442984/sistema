import { supabase } from '@/lib/supabase';
import { UserKitchenRole } from '@/types/database';

export async function getUserKitchenRoles(userId: string): Promise<(UserKitchenRole & { kitchens: any })[]> {
  try {
    const { data, error } = await supabase
      .from('user_kitchen_roles')
      .select(`
        *,
        kitchens(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao carregar roles do usuário:', error);
    return [];
  }
}

export async function checkUserPermission(
  userId: string, 
  kitchenId: string, 
  requiredRoles: string[]
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_kitchen_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('kitchen_id', kitchenId)
      .single();

    if (error || !data) return false;
    return requiredRoles.includes(data.role);
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_kitchen_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'ADMIN');

    if (error) return false;
    return (data || []).length > 0;
  } catch (error) {
    console.error('Erro ao verificar se usuário é admin:', error);
    return false;
  }
}