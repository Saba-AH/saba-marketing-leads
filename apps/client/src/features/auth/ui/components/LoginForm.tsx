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
import { useLogin } from '../../application/mutations/useLogin.mutation';
import { LoginError } from '../../domain/loginError';
import { useTurnstile } from '../hooks/useTurnstile';
import { PasswordField } from './PasswordField';

/** The CAPTCHA is not a form field: the widget provides it. */
const credentialsSchema = loginSchema.omit({ captchaToken: true });
type CredentialsInput = z.input<typeof credentialsSchema>;
type CredentialsOutput = z.output<typeof credentialsSchema>;

export function LoginForm({ next }: { next: string }): React.JSX.Element {
  const router = useRouter();
  const login = useLogin();
  const captcha = useTurnstile();
  const form = useForm<CredentialsInput, unknown, CredentialsOutput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: CredentialsOutput): Promise<void> {
    if (!captcha.token) return;
    try {
      await login.mutateAsync({
        ...data,
        captchaToken: captcha.token,
      });
      router.replace(next);
    } catch {
      form.resetField('password');
      captcha.reset();
    }
  }

  const sending = login.isPending || login.isSuccess;
  const error = login.error;

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {error && (
          <AlertBanner
            message={error.message}
            variant={error instanceof LoginError ? error.type : 'error'}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  autoComplete="email"
                  autoFocus
                  className="h-11"
                  disabled={sending}
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <PasswordField disabled={sending} {...field} />
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
          disabled={sending || !captcha.token}
          type="submit"
        >
          {sending ? (
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
