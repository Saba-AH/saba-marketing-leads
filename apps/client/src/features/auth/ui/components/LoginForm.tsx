'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@repo/schemas';
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
import { Loader2, LogIn, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AlertBanner } from '@/shared/ui/components/form/AlertBanner';
import { useIniciarSesion } from '../../application/mutations/useIniciarSesion.mutation';
import { LoginError } from '../../domain/loginError';
import { useTurnstile } from '../hooks/useTurnstile';
import { CampoContrasena } from './CampoContrasena';

/** El CAPTCHA no es un campo del formulario: lo entrega el widget. */
const credencialesSchema = loginSchema.omit({ captchaToken: true });
type CredencialesInput = z.input<typeof credencialesSchema>;
type CredencialesOutput = z.output<typeof credencialesSchema>;

export function LoginForm({ next }: { next: string }): React.JSX.Element {
  const router = useRouter();
  const iniciarSesion = useIniciarSesion();
  const captcha = useTurnstile();
  const form = useForm<CredencialesInput, unknown, CredencialesOutput>({
    resolver: zodResolver(credencialesSchema),
    defaultValues: { correo: '', contrasena: '' },
  });

  async function onSubmit(datos: CredencialesOutput): Promise<void> {
    if (!captcha.token) return;
    try {
      await iniciarSesion.mutateAsync({
        ...datos,
        captchaToken: captcha.token,
      });
      router.replace(next);
    } catch {
      form.resetField('contrasena');
      captcha.reset();
    }
  }

  const enviando = iniciarSesion.isPending || iniciarSesion.isSuccess;
  const error = iniciarSesion.error;

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {error && (
          <AlertBanner
            mensaje={error.message}
            variante={error instanceof LoginError ? error.tipo : 'error'}
          />
        )}

        <FormField
          control={form.control}
          name="correo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  autoComplete="email"
                  autoFocus
                  className="h-11"
                  disabled={enviando}
                  placeholder="tu@correo.com"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contrasena"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <CampoContrasena disabled={enviando} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div
          className="flex min-h-[65px] justify-center"
          ref={captcha.containerRef}
        />

        <Button
          className="h-11 w-full"
          disabled={enviando || !captcha.token}
          type="submit"
        >
          {enviando ? (
            <>
              <Loader2 className="animate-spin" />
              Iniciando sesión…
            </>
          ) : (
            <>
              <LogIn />
              Ingresar al panel
            </>
          )}
        </Button>

        <p className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
          <ShieldCheck className="size-3.5 text-brand-700" />
          ¿Olvidaste tu contraseña? Contacta a un administrador.
        </p>
      </form>
    </Form>
  );
}
