'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema } from '@repo/schemas';
import { Button } from '@repo/ui/components/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { useCreateLead } from '../../application/mutations/useCreateLead.mutation';

type LeadFormInput = z.input<typeof createLeadSchema>;
type LeadFormOutput = z.output<typeof createLeadSchema>;

export function LeadForm() {
  const createLead = useCreateLead();
  const form = useForm<LeadFormInput, unknown, LeadFormOutput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { name: '', email: '', source: '' },
  });

  async function onSubmit(data: LeadFormOutput): Promise<void> {
    await createLead.mutateAsync({
      ...data,
      source: data.source || undefined,
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origen</FormLabel>
              <FormControl>
                <Input placeholder="web, referido, evento…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createLead.isPending}>
          Agregar
        </Button>
      </form>
      {createLead.isError && (
        <p role="alert" className="text-destructive text-sm">
          {createLead.error.message}
        </p>
      )}
    </Form>
  );
}
