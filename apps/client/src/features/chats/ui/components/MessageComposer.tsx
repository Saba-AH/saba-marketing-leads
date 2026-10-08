'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { sendMessageSchema, type TSendMessage } from '@repo/schemas';
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

type ComposerInput = z.input<typeof sendMessageSchema>;

export function MessageComposer({
  onSend,
  onTyping,
}: {
  /** `true` if it was sent; if it failed, the text stays so it can be retried. */
  onSend: (data: TSendMessage) => Promise<boolean>;
  onTyping?: () => void;
}): React.JSX.Element {
  const form = useForm<ComposerInput, unknown, TSendMessage>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: { body: '' },
  });

  async function onSubmit(data: TSendMessage): Promise<void> {
    if (await onSend(data)) form.reset();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex items-end gap-2"
      >
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="sr-only">Mensaje</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Escribe un mensaje… (Enter envía, Shift+Enter salta de línea)"
                  className="max-h-40"
                  rows={1}
                  {...field}
                  onChange={(event) => {
                    field.onChange(event);
                    onTyping?.();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
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
