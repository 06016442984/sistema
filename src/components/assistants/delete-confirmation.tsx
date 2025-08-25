"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Assistant {
  id: string;
  nome: string;
}

interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: Assistant | null;
  onConfirm: () => Promise<void>;
  deleting?: boolean;
}

export function DeleteConfirmation({ 
  open, 
  onOpenChange, 
  assistant, 
  onConfirm,
  deleting = false 
}: DeleteConfirmationProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background-secondary border-glass-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-text-primary">Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription className="text-text-secondary">
            Tem certeza que deseja excluir o assistente "{assistant?.nome}"? 
            Esta ação não pode ser desfeita e todos os arquivos associados também serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="bg-glass-bg border-glass-border text-text-primary hover:bg-glass-bg/80"
            disabled={deleting}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Excluindo...
              </div>
            ) : (
              'Excluir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}