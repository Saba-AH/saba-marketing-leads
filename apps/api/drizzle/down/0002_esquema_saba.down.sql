-- Estas tablas son las de la app principal en Supabase, anteriores a este
-- repo: nunca se sueltan si alguna tiene datos. Para un reset local con filas:
-- `npm run db:reset` (recrea el volumen) en vez de `db:rollback`.
DO $$
DECLARE
  tables text[] := ARRAY[
    'assets',
    'products',
    'payments',
    'liabilities',
    'profiles',
    'product_specifications',
    'categories',
    'product_categories',
    'brands',
    'product_variants',
    'variant_inventory',
    'product_variant_attributes',
    'product_variant_attribute_values',
    'venezuela_cities',
    'applications',
    'user_documents',
    'application_documents',
    'notifications',
    'application_rejection_reasons',
    'email_confirmations',
    'installments',
    'exchange_rates',
    'payment_methods',
    'purchases',
    'purchase_items',
    'providers',
    'accounts',
    'inventory_movements',
    'appointment_slots',
    'appointments',
    'slot_defaults',
    'inventory_items',
    'expense_categories',
    'expenses',
    'inflow_categories',
    'inflows',
    'settings',
    'payment_interest_rules',
    'product_payment_options',
    'inventory_item_checklists',
    'inventory_item_checklist_items',
    'product_images',
    'overdue_reminder_logs',
    'application_nudge_logs',
    'payments_installments',
    'inventory_movements_backup',
    'support_categories',
    'support_tickets',
    'support_ticket_messages',
    'purchase_expenses',
    'client_verifications',
    'inflow_cxp_settlements',
    '_bak_inventory_movements_orphans',
    'dashboard_visits',
    'expense_cxc_settlements',
    'purchase_invoices',
    'birthday_sms_log',
    'chat_conversations',
    'chat_messages',
    'client_payment_score_history',
    'eeff_cobrado_monthly',
    'eeff_proyectado_monthly',
    'payroll_payments',
    'eeff_cobrado_weekly',
    'eeff_proyectado_weekly',
    'cuotas_facturacion_vs_cobranza_weekly',
    'overdue_receivables_v2_detail',
    'overdue_receivables_summary',
    'overdue_receivables_monthly',
    'collections_weekly_summary',
    'collection_calls',
    'mobile_notifications',
    'user_push_tokens',
    'user_render_permissions',
    'vacation_requests',
    'terms_and_conditions',
    'pl_summary_buckets',
    'income_outcome_daily',
    'installments_monthly_performance_daily',
    'overdue_receivables_daily_summary',
    'overdue_receivables_daily_monthly',
    'overdue_receivables_daily_installment_lines',
    'product_trends_daily_meta',
    'product_trends_daily_movements',
    'product_trends_daily_initial_payments',
    'product_trends_daily_model_sales',
    'product_trends_daily_top_street',
    'product_trends_daily_model_stock',
    'payments_trends_daily_meta',
    'payments_trends_daily_rows',
    'applications_trends_daily_meta',
    'applications_trends_daily_rows',
    'products_sold_by_month_summary',
    'system_logs',
    'balance_summary_scopes',
    'utilidad_summary_scopes',
    'products_to_buy_summary_scopes',
    'cxc_user_summary_cache',
    'collection_sos_cases',
    'collections_summary_scopes'
  ];
  t text;
  has_rows boolean;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    CONTINUE WHEN to_regclass(format('public.%I', t)) IS NULL;
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I)', t) INTO has_rows;
    IF has_rows THEN
      RAISE EXCEPTION '% tiene datos: no se revierte para no perderlos', t;
    END IF;
  END LOOP;

  -- Un solo DROP con todas: Postgres resuelve las FKs entre ellas sin CASCADE.
  EXECUTE (
    SELECT 'DROP TABLE IF EXISTS ' || string_agg(format('public.%I', name), ', ')
    FROM unnest(tables) AS name
  );
END $$;

DROP SEQUENCE IF EXISTS public.venezuela_cities_id_seq;
DROP SEQUENCE IF EXISTS public.appointment_slots_id_seq;
DROP SEQUENCE IF EXISTS public.support_ticket_seq;
DROP SEQUENCE IF EXISTS public.birthday_sms_log_id_seq;
DROP SEQUENCE IF EXISTS public.product_trends_daily_movements_id_seq;
DROP SEQUENCE IF EXISTS public.product_trends_daily_model_sales_id_seq;
