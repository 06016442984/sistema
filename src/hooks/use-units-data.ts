/*
================================================================================
| FICHEIRO 1: O "CÉREBRO" DA PÁGINA DE UNIDADES                                |
| CAMINHO: src/hooks/use-units-data.ts                                         |
================================================================================
*/
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

type Unit = Database['public']['Tables']['units']['Row'];

export function useUnitsData() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<Unit[]>([]);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUnits(data || []);
    } catch (error: any) {
      toast.error('Falha ao carregar as unidades.', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return { loading, units, fetchUnits };
}


/*
================================================================================
| FICHEIRO 2: O FORMULÁRIO PARA ADICIONAR/EDITAR UNIDADES                      |
| CAMINHO: src/components/units/unit-dialog.tsx                                |
================================================================================
*/
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const unitSchema = z.object({
  name: z.string().min(2, { message: "O nome da unidade é obrigatório." }),
});

type UnitFormData = z.infer<typeof unitSchema>;

interface UnitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUnitCreated: () => void;
}

export function UnitDialog({ isOpen, onClose, onUnitCreated }: UnitDialogProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
  });

  const onSubmit = async (data: UnitFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilizador não autenticado.");

      const { error } = await supabase.from('units').insert({
        name: data.name,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Unidade criada com sucesso!");
      onUnitCreated();
      handleClose();
    } catch (error: any) {
      toast.error("Falha ao criar a unidade.", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Nova Unidade</DialogTitle>
          <DialogDescription>
            Adicione uma nova unidade de negócio (ex: Academia).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input id="name" {...register("name")} className="col-span-3 bg-slate-800 border-slate-700" />
            {errors.name && <p className="col-span-4 text-red-500 text-xs text-right">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" className="btn-premium" disabled={isSubmitting}>
              {isSubmitting ? 'A criar...' : 'Criar Unidade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


/*
================================================================================
| FICHEIRO 3: A PÁGINA ONDE IRÁ GERIR AS UNIDADES                              |
| CAMINHO: src/app/units/page.tsx                                              |
================================================================================
*/
"use client";

import { useState } from 'react';
import { useUnitsData } from '@/hooks/use-units-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2 } from 'lucide-react';
import { UnitDialog } from '@/components/units/unit-dialog';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function UnitsSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="border rounded-lg border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-slate-800">
              <TableHead><Skeleton className="h-5 w-3/4" /></TableHead>
              <TableHead><Skeleton className="h-5 w-1/4" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-slate-800">
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function UnitsPage() {
  const { loading, units, fetchUnits } = useUnitsData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const supabase = createClient();

  const handleDelete = async (unitId: string) => {
    if (!confirm("Tem a certeza que quer apagar esta unidade? Esta ação não pode ser desfeita.")) {
      return;
    }
    try {
      const { error } = await supabase.from('units').delete().eq('id', unitId);
      if (error) throw error;
      toast.success("Unidade apagada com sucesso!");
      fetchUnits();
    } catch (error: any) {
      toast.error("Falha ao apagar a unidade.", { description: error.message });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Unidades</h1>
            <p className="text-slate-400">
              Gira as suas unidades de negócio.
            </p>
          </div>
          <Button className="btn-premium" onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Unidade
          </Button>
        </div>

        <Card className="shadow-lg border-slate-800 bg-slate-900/50">
          <CardContent className="p-0">
            {loading ? (
              <UnitsSkeleton />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-slate-800">
                      <TableHead className="text-white">Nome da Unidade</TableHead>
                      <TableHead className="text-white text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.id} className="border-b border-slate-800 last:border-b-0">
                        <TableCell className="font-medium text-slate-200">{unit.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(unit.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <UnitDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUnitCreated={fetchUnits}
      />
    </>
  );
}
