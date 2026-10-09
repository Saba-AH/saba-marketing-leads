import { formatPhone } from './chat.model';

export interface SabaApplication {
  id: string;
  status: string;
  statusLabel: string;
  active: boolean;
  createdAt: Date;
  product: string | null;
  financedAmount: number | null;
  installmentAmount: number | null;
  frequency: string | null;
}

export interface SabaCustomer {
  id: string;
  name: string;
  idNumber: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  source: string | null;
  customerSince: Date | null;
  applications: SabaApplication[];
}

export interface ChatSabaCustomers {
  noPhone: boolean;
  /** Most likely first. */
  customers: SabaCustomer[];
}

export type ApplicationTone = 'active' | 'rejected' | 'closed' | 'inProgress';

export function applicationTone(application: SabaApplication): ApplicationTone {
  if (application.active) return 'active';
  if (application.status === 'rejected') return 'rejected';
  if (application.status === 'completed') return 'closed';
  return 'inProgress';
}

const FREQUENCIES: Record<string, string> = {
  weekly: 'semanal',
  biweekly: 'quincenal',
  monthly: 'mensual',
};

const dollars = new Intl.NumberFormat('es-VE', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 2,
});

export function formatAmount(amount: number | null): string | null {
  return amount === null ? null : dollars.format(amount);
}

/** "$40,00 semanal"; `null` if Saba has no installment. */
export function formatInstallment(application: SabaApplication): string | null {
  const amount = formatAmount(application.installmentAmount);
  if (!amount) return null;
  const frequency = application.frequency
    ? (FREQUENCIES[application.frequency] ?? application.frequency)
    : null;
  return frequency ? `${amount} ${frequency}` : amount;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** "2026-09-18" → "sept. de 2026": for "Cliente desde". */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('es-VE', {
    timeZone: 'America/Caracas',
    month: 'short',
    year: 'numeric',
  });
}

/** Saba stores `+58…`, `0414…` or `414…`: it is always shown as `+58 414 123 4567`. */
export function formatSabaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (/^0\d{10}$/.test(digits)) return formatPhone(`58${digits.slice(1)}`);
  if (/^4\d{9}$/.test(digits)) return formatPhone(`58${digits}`);
  return digits ? formatPhone(digits) : phone;
}
