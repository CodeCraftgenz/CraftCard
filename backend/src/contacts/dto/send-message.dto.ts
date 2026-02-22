import { z } from 'zod';

export const sendMessageSchema = z.object({
  senderName: z.string().min(2, 'Nome deve ter no minimo 2 caracteres').max(100),
  senderEmail: z.string().email('Email invalido').optional().nullable(),
  message: z.string().min(5, 'Mensagem deve ter no minimo 5 caracteres').max(1000, 'Mensagem deve ter no maximo 1000 caracteres'),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
