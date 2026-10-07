'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { enviarMensajeSchema, type TEnviarMensaje } from '@repo/schemas';
import { Button } from '@repo/ui/components/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form';
import { Textarea } from '@repo/ui/components/textarea';
import { SendHorizontal } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type ComposerInput = z.input<typeof enviarMensajeSchema>;

export function ComposerMensaje({
  onEnviar,
}: {
  /** `true` si se envió; si falló, el texto queda para reintentar. */
  onEnviar: (datos: TEnviarMensaje) => Promise<boolean>;
}): React.JSX.Element {
  const form = useForm<ComposerInput, unknown, TEnviarMensaje>({
    resolver: zodResolver(enviarMensajeSchema),
    defaultValues: { cuerpo: '' },
  });

  async function onSubmit(datos: TEnviarMensaje): Promise<void> {
    if (await onEnviar(datos)) form.reset();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex items-end gap-2"
      >
        <FormField
          control={form.control}
          name="cuerpo"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="sr-only">Mensaje</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Escribe un mensaje… (Enter envía, Shift+Enter salta de línea)"
                  className="max-h-40"
                  rows={1}
                  {...field}
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter' && !evento.shiftKey) {
                      evento.preventDefault();
                      void form.handleSubmit(onSubmit)();
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          aria-label="Enviar"
        >
          <SendHorizontal aria-hidden="true" />
        </Button>
      </form>
    </Form>
  );
}
