'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { crearLeadSchema } from '@repo/schemas';
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
import { useCrearLead } from '../../application/mutations/useCrearLead.mutation';

type LeadFormInput = z.input<typeof crearLeadSchema>;
type LeadFormOutput = z.output<typeof crearLeadSchema>;

export function LeadForm() {
  const crearLead = useCrearLead();
  const form = useForm<LeadFormInput, unknown, LeadFormOutput>({
    resolver: zodResolver(crearLeadSchema),
    defaultValues: { nombre: '', correo: '', origen: '' },
  });

  async function onSubmit(datos: LeadFormOutput): Promise<void> {
    await crearLead.mutateAsync({
      ...datos,
      origen: datos.origen || undefined,
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
          name="nombre"
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
          name="correo"
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
          name="origen"
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
        <Button type="submit" disabled={crearLead.isPending}>
          Agregar
        </Button>
      </form>
      {crearLead.isError && (
        <p role="alert" className="text-destructive text-sm">
          {crearLead.error.message}
        </p>
      )}
    </Form>
  );
}
