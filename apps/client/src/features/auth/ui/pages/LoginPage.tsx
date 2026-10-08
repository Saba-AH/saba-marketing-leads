import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { LoginForm } from '../components/LoginForm';

/** Same design as Saba's staff sign-in (`/saba-panel/ingreso`). */
export function LoginPage({ next }: { next: string }): React.JSX.Element {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted px-4 py-12">
      <Card className="w-full max-w-md rounded-3xl shadow-xl">
        <CardHeader className="space-y-3 pb-6 text-center">
          <img
            alt="Saba"
            className="mx-auto h-9 w-auto"
            height={305}
            src="/logos/logo.png"
            width={1017}
          />
          <CardTitle className="font-bold text-2xl tracking-tight">
            Saba Marketing Leads
          </CardTitle>
          <CardDescription>Acceso para personal autorizado</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          <LoginForm next={next} />
        </CardContent>
      </Card>
    </main>
  );
}
