"use client";

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Edit3, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { Profile } from '@/types/database';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  texto: string;
  criado_em: string;
  profiles: Profile;
}

interface TaskCommentsProps {
  taskId: string;
  canComment?: boolean;
}

export function TaskComments({ taskId, canComment = true }: TaskCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          profiles(*)
        `)
        .eq('task_id', taskId)
        .order('criado_em', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          author_id: user.id,
          texto: newComment.trim(),
        }]);

      if (error) throw error;

      setNewComment('');
      loadComments();
      toast.success('Comentário adicionado!');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('task_comments')
        .update({ texto: editText.trim() })
        .eq('id', commentId);

      if (error) throw error;

      setEditingComment(null);
      setEditText('');
      loadComments();
      toast.success('Comentário atualizado!');
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      toast.error('Erro ao editar comentário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      loadComments();
      toast.success('Comentário excluído!');
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      toast.error('Erro ao excluir comentário');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (comment: TaskComment) => {
    setEditingComment(comment.id);
    setEditText(comment.texto);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentários ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de Comentários */}
        <ScrollArea className="h-80">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhum comentário ainda</p>
              <p className="text-sm">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {comment.profiles.nome.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{comment.profiles.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(comment.criado_em)}
                        </p>
                      </div>
                    </div>

                    {user?.id === comment.author_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(comment)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Edite seu comentário..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleEditComment(comment.id)}
                          disabled={loading}
                        >
                          Salvar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{comment.texto}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Adicionar Novo Comentário */}
        {canComment && user && (
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              rows={3}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleAddComment}
                disabled={loading || !newComment.trim()}
                size="sm"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Enviando...' : 'Comentar'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}