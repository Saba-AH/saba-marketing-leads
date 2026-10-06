-- Esquema de la app principal de Saba, que ya vive en Supabase antes de este
-- repo. Mismo criterio que 0001: IF NOT EXISTS lo crea en Docker (dev y tests)
-- y es un no-op en Supabase.
--
-- Diferencias con el dump de Supabase, para que corra en un Postgres pelado:
--   - Los enums (`USER-DEFINED`) son `text`: el dump no trae sus valores.
--   - Las FKs se agregan al final y solo si la tabla referenciada existe: en
--     Docker no hay `auth.users` ni `stores`, `warehouses`, `dealerships`,
--     `marketing_links`, `marketing_link_clicks` (no vienen en el dump).
--   - `uuid_generate_v4()` pasa a `gen_random_uuid()`.

CREATE SEQUENCE IF NOT EXISTS public.venezuela_cities_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.appointment_slots_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.support_ticket_seq;
CREATE SEQUENCE IF NOT EXISTS public.birthday_sms_log_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.product_trends_daily_movements_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.product_trends_daily_model_sales_id_seq;

CREATE TABLE IF NOT EXISTS public.assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  acquisition_date date NOT NULL,
  description text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assets_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  model character varying NOT NULL,
  year integer NOT NULL,
  price numeric NOT NULL,
  weekly_payment numeric NOT NULL,
  image_url text NOT NULL,
  description text NOT NULL,
  available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  costo numeric NOT NULL DEFAULT 0,
  plazo integer NOT NULL DEFAULT 52,
  cuota_inicial numeric NOT NULL DEFAULT 0,
  sku text DEFAULT ''::text,
  compare_at_price numeric DEFAULT '0'::numeric,
  brand_id uuid,
  name text NOT NULL DEFAULT ''''''::text,
  cost_mode text NOT NULL DEFAULT 'fixed'::text CHECK (cost_mode = ANY (ARRAY['fixed'::text, 'dynamic'::text])),
  cost_method text NOT NULL DEFAULT 'last_purchase'::text CHECK (cost_method = ANY (ARRAY['moving_average'::text, 'last_purchase'::text])),
  cost_scope text NOT NULL DEFAULT 'product'::text CHECK (cost_scope = ANY (ARRAY['product'::text, 'variant'::text])),
  frequency text NOT NULL DEFAULT 'weekly'::text CHECK (frequency = ANY (ARRAY['weekly'::text, 'biweekly'::text, 'monthly'::text])),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  product_type text NOT NULL DEFAULT 'vehicle'::text CHECK (product_type = ANY (ARRAY['vehicle'::text, 'accessory'::text])),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid,
  amount numeric NOT NULL,
  receipt_url text,
  status text NOT NULL DEFAULT 'pending'::text,
  payment_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  exchange_rate numeric,
  exchange_amount numeric,
  payment_method_id uuid,
  payment_type text CHECK (payment_type = ANY (ARRAY['sale'::text, 'purchase'::text, 'conversion'::text, 'conversion_loss'::text, 'direct-sale'::text, 'installment-fee'::text])),
  account_id uuid,
  purchase_id uuid,
  is_initial_payment boolean DEFAULT false,
  payment_number text DEFAULT '''N/A'''::text,
  bs_balance numeric NOT NULL DEFAULT 0,
  parent_payment_id uuid,
  origin_bs_balance_before numeric,
  destination_usd_balance_before numeric,
  unidigital_sent boolean DEFAULT false,
  unidigital_id text,
  amount_with_taxes numeric,
  has_iva boolean DEFAULT false,
  has_igtf boolean DEFAULT false,
  paid_in_bs_from_purchase boolean NOT NULL DEFAULT false,
  bs_rate_from_purchase numeric,
  bs_amount_from_purchase numeric,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  deposit_date date,
  binance_auto_validated_at timestamp with time zone,
  store_id uuid,
  provider_id uuid,
  account_holder_name text,
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.liabilities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric NOT NULL,
  start_date date NOT NULL,
  due_date date,
  type text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT liabilities_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  nombre text NOT NULL,
  apellido text NOT NULL,
  telefono text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  role character varying NOT NULL DEFAULT 'standard'::character varying CHECK (role::text = ANY (ARRAY['admin'::character varying::text, 'cajero'::character varying::text, 'vendedor'::character varying::text, 'standard'::character varying::text])),
  cedula text,
  birth_date date,
  address text DEFAULT ''::text,
  city text DEFAULT ''::text,
  sms_code text,
  sms_verified boolean DEFAULT false,
  email text NOT NULL,
  kyc_verified boolean DEFAULT false,
  occupation text,
  monthly_income numeric,
  email_verified boolean DEFAULT false,
  rif text,
  client_source text,
  accepted_terms_at timestamp with time zone,
  is_seller boolean DEFAULT false,
  monthly_salary numeric,
  is_employee boolean DEFAULT false,
  fecha_ingreso date,
  cargo text,
  dias_vacaciones_acumulados numeric DEFAULT NULL::numeric,
  device_source text NOT NULL DEFAULT 'web'::text,
  oauth_provider text,
  map_address text,
  contact_phone text,
  gender character varying,
  labor_sector text CHECK (labor_sector IS NULL OR (labor_sector = ANY (ARRAY['transporte'::text, 'privado'::text, 'publico'::text]))),
  labor_detail text,
  labor_observation text,
  store_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_specifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  name text NOT NULL,
  data_type character varying NOT NULL DEFAULT 'text'::character varying,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_specifications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id uuid NOT NULL,
  category_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  sku text NOT NULL UNIQUE,
  tipo text NOT NULL,
  precio numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_variants_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.variant_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL,
  talla text NOT NULL,
  cantidad integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT variant_inventory_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_variant_attributes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT product_variant_attributes_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_variant_attribute_values (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_url text,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT product_variant_attribute_values_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.venezuela_cities (
  id integer NOT NULL DEFAULT nextval('venezuela_cities_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  CONSTRAINT venezuela_cities_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  requested_amount numeric,
  initial_deposit numeric,
  term_weeks integer,
  payment_schedule text CHECK (payment_schedule = ANY (ARRAY['weekly'::text, 'biweekly'::text, 'monthly'::text])),
  status text NOT NULL DEFAULT 'missing_address_info'::text,
  phone text,
  id_number text,
  birth_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  current_step text,
  variant_attribute_id uuid,
  variant_value_id uuid,
  contract_url text,
  signed_contract_url text,
  rule_id uuid,
  is_waiting_list boolean DEFAULT false,
  authorization_url text,
  signed_authorization_url text,
  checklist_url text,
  signed_checklist_url text,
  recibo_url text,
  signed_recibo_url text,
  vendedor_id uuid,
  seller_id uuid,
  financed_amount_at_apply numeric,
  promo_active_at_apply boolean,
  promo_financed_amount_at_apply numeric,
  effective_financed_at_apply numeric,
  frequency_at_apply text CHECK (frequency_at_apply = ANY (ARRAY['weekly'::text, 'biweekly'::text, 'monthly'::text])),
  plazo_at_apply integer,
  initial_amount_at_apply numeric,
  cuota_at_apply numeric,
  attended boolean NOT NULL DEFAULT false,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  appointment_from_date date,
  documents_edit_allowed boolean,
  caja_warning_flag boolean NOT NULL DEFAULT false,
  caja_warning_message text,
  caja_warning_at timestamp with time zone,
  caja_warning_by uuid,
  device_type text,
  moto_retiro_autorizacion_url text,
  signed_moto_retiro_autorizacion_url text,
  moto_entrega_inmediata_notificacion_url text,
  signed_moto_entrega_inmediata_notificacion_url text,
  acta_finiquito_contractual_url text,
  signed_acta_finiquito_contractual_url text,
  acta_cierre_unilateral_url text,
  signed_acta_cierre_unilateral_url text,
  contrato_compra_venta_url text,
  signed_contrato_compra_venta_url text,
  intt_date date,
  sale_inspection_number text,
  sale_inspection_date date,
  sale_bs_amount numeric,
  sale_entity text,
  acta_convenio_20_dias_url text,
  signed_acta_convenio_20_dias_url text,
  acta_resolucion_contrato_incumplimiento_url text,
  signed_acta_resolucion_contrato_incumplimiento_url text,
  device_source text DEFAULT 'web'::text,
  seguro_url text,
  carnet_circulacion_url text,
  installments_view_date date,
  ai_analysis_status text,
  ai_analysis_result jsonb,
  approved_by uuid,
  approved_at timestamp with time zone,
  rejected_by uuid,
  rejected_at timestamp with time zone,
  pickup_follow_up_note text,
  pickup_follow_up_note_updated_at timestamp with time zone,
  pickup_follow_up_note_updated_by uuid,
  is_saren_registered boolean NOT NULL DEFAULT false,
  reactivated_by uuid,
  reactivated_at timestamp with time zone,
  store_id uuid,
  juridico_compra_venta_url text,
  signed_juridico_compra_venta_url text,
  juridico_compra_venta_signed boolean NOT NULL DEFAULT false,
  audit_status text NOT NULL DEFAULT 'pending'::text,
  audited_at timestamp with time zone,
  audited_by uuid,
  marketing_link_id uuid,
  marketing_click_id uuid,
  marketing_attributed_at timestamp with time zone,
  attribution_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  finalizadas_sms_sent_at timestamp with time zone,
  penultimate_installment_sms_sent_at timestamp with time zone,
  not_materialized_at timestamp with time zone,
  not_materialized_by uuid,
  provider_ally uuid,
  completion_date timestamp with time zone,
  CONSTRAINT applications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  expiration_date date,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_documents_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.application_documents (
  application_id uuid NOT NULL,
  document_id uuid NOT NULL,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT application_documents_pkey PRIMARY KEY (application_id, document_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  application_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.application_rejection_reasons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT application_rejection_reasons_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.email_confirmations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  product_id uuid,
  attr uuid,
  val uuid,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  application_id uuid,
  rule_id uuid,
  CONSTRAINT email_confirmations_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.installments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  installment_number integer NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  payment_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  parent_installment_id uuid,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT installments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  currency_code text NOT NULL DEFAULT 'USD'::text,
  rate numeric NOT NULL,
  date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  update_date timestamp with time zone,
  source text,
  CONSTRAINT exchange_rates_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  config jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  description text,
  account_id uuid,
  currency text,
  "phoneToReport" text,
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  total_amount numeric NOT NULL,
  currency text DEFAULT 'USD'::text,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  invoice_reference text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  provider_id uuid,
  account_id uuid,
  reference_amount_ves numeric,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  purchase_number text,
  dealership_id uuid,
  warehouse_id uuid,
  is_resale boolean NOT NULL DEFAULT false,
  CONSTRAINT purchases_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL,
  product_id uuid NOT NULL,
  variant_value_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT purchase_items_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.providers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_info jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_resale boolean NOT NULL DEFAULT false,
  subname text,
  CONSTRAINT providers_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  initial_balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_cash boolean DEFAULT false,
  CONSTRAINT accounts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  variant_value_id uuid NOT NULL,
  quantity integer NOT NULL,
  source_type text NOT NULL,
  source_id uuid,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  purchase_id uuid,
  CONSTRAINT inventory_movements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.appointment_slots (
  id integer NOT NULL DEFAULT nextval('appointment_slots_id_seq'::regclass),
  date date NOT NULL,
  slot_type text NOT NULL,
  capacity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  store_id uuid NOT NULL,
  CONSTRAINT appointment_slots_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  application_id uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'scheduled'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  date date NOT NULL,
  slot_type text NOT NULL,
  start_time time without time zone NOT NULL,
  slot_id integer,
  created_by uuid,
  updated_by uuid,
  store_id uuid NOT NULL,
  CONSTRAINT appointments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.slot_defaults (
  slot_type text NOT NULL,
  capacity integer NOT NULL CHECK (capacity >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  store_id uuid NOT NULL,
  CONSTRAINT slot_defaults_pkey PRIMARY KEY (slot_type, store_id)
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  variant_value_id uuid NOT NULL,
  placa text NOT NULL,
  serial_motor text NOT NULL,
  serial_chasis text NOT NULL,
  application_id uuid,
  status text NOT NULL DEFAULT 'available'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  intt_register text,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  year integer,
  insurance boolean NOT NULL DEFAULT false,
  dealership_id uuid,
  warehouse_id uuid,
  purchase_id uuid,
  insurance_type text DEFAULT 'none'::text,
  returned_reason text CHECK (returned_reason IS NULL OR length(btrim(returned_reason)) > 0),
  old_application_id uuid,
  outlet_purchase_sale_amount_usd numeric,
  outlet_cxc_status text,
  returned_unit_status text,
  insurance_paid boolean NOT NULL DEFAULT false,
  insurance_paid_amount numeric,
  insurance_paid_inflow_id uuid,
  is_freeze boolean,
  freeze_at timestamp with time zone,
  freeze_by uuid,
  recovery_outcome text,
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT expense_categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  description text NOT NULL,
  expense_category_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  account_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  exchange_rate numeric,
  exchange_amount numeric,
  is_cxp_payment boolean NOT NULL DEFAULT false,
  is_cxc boolean NOT NULL DEFAULT false,
  cxc_status text,
  cxc_counterparty text,
  cxc_closed_at date,
  created_by uuid,
  updated_by uuid,
  cxc_generates_interest boolean DEFAULT false,
  cxc_interest_rate numeric DEFAULT NULL::numeric,
  cxc_interest_period text CHECK (cxc_interest_period = ANY (ARRAY['daily'::text, 'monthly'::text, 'yearly'::text])),
  dealership_id uuid,
  movement_observations text,
  is_spent boolean NOT NULL DEFAULT false,
  warehouse_id uuid,
  no_cash_movement boolean NOT NULL DEFAULT false,
  store_id uuid,
  CONSTRAINT expenses_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.inflow_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inflow_categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.inflows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  description text NOT NULL,
  inflow_category_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  account_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  inflow_date date NOT NULL DEFAULT CURRENT_DATE,
  exchange_rate numeric,
  exchange_amount numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_cxp boolean NOT NULL DEFAULT false,
  cxp_status text NOT NULL DEFAULT 'open'::text CHECK (cxp_status = ANY (ARRAY['open'::text, 'closed'::text])),
  cxp_closed_at date,
  cxp_counterparty text,
  is_cxc_collection boolean NOT NULL DEFAULT false,
  created_by uuid,
  updated_by uuid,
  cxp_generates_interest boolean DEFAULT false,
  cxp_interest_rate numeric DEFAULT NULL::numeric,
  cxp_interest_period text CHECK (cxp_interest_period = ANY (ARRAY['daily'::text, 'monthly'::text, 'yearly'::text])),
  dealership_id uuid,
  cxp_interest_granularity text CHECK (cxp_interest_granularity IS NULL OR (cxp_interest_granularity = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text, 'semiannual'::text, 'yearly'::text]))),
  movement_observations text,
  warehouse_id uuid,
  no_cash_movement boolean NOT NULL DEFAULT false,
  purchase_id uuid,
  store_id uuid,
  CONSTRAINT inflows_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  accept_ves_payments boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  chat_enabled boolean DEFAULT true,
  sms_verification_enabled boolean DEFAULT true,
  outlet_enabled boolean DEFAULT true,
  all_admins_can_approve_applications boolean DEFAULT false,
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payment_interest_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  frequency text NOT NULL CHECK (frequency = ANY (ARRAY['weekly'::text, 'biweekly'::text, 'monthly'::text])),
  plazo integer NOT NULL,
  percent numeric NOT NULL DEFAULT 0,
  CONSTRAINT payment_interest_rules_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_payment_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  rule_id uuid,
  financed_amount numeric NOT NULL DEFAULT 0,
  display_total_price numeric,
  promo_active boolean NOT NULL DEFAULT false,
  promo_total_price numeric,
  promo_financed_amount numeric,
  promo_starts_at timestamp with time zone,
  promo_ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  is_default boolean NOT NULL DEFAULT false,
  CONSTRAINT product_payment_options_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.inventory_item_checklists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  observations text,
  recibido_por text,
  entregado_por text,
  CONSTRAINT inventory_item_checklists_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.inventory_item_checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL,
  description text NOT NULL,
  is_ok boolean NOT NULL DEFAULT false,
  CONSTRAINT inventory_item_checklist_items_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT product_images_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.overdue_reminder_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_bucket date NOT NULL,
  run_label text NOT NULL,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT overdue_reminder_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.application_nudge_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  nudge_type text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT application_nudge_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payments_installments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  installment_id uuid NOT NULL,
  applied_amount numeric NOT NULL CHECK (applied_amount >= 0::numeric),
  allocation_type text NOT NULL DEFAULT 'normal'::text CHECK (allocation_type = ANY (ARRAY['normal'::text, 'overpay_cascade'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_installments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.inventory_movements_backup (
  id uuid,
  variant_value_id uuid,
  quantity integer,
  source_type text,
  source_id uuid,
  note text,
  created_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.support_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL UNIQUE,
  CONSTRAINT support_categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  client_email text NOT NULL,
  client_name text,
  phone text,
  category_id uuid,
  subject text NOT NULL,
  priority text NOT NULL DEFAULT 'normal'::text,
  status text NOT NULL DEFAULT 'open'::text,
  last_message_at timestamp with time zone NOT NULL DEFAULT now(),
  last_actor text NOT NULL DEFAULT 'client'::text,
  assigned_to uuid,
  source_channel text NOT NULL DEFAULT 'web'::text,
  public_number bigint NOT NULL DEFAULT nextval('support_ticket_seq'::regclass) UNIQUE,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ticket_id uuid NOT NULL,
  author_type text NOT NULL,
  author_user_id uuid,
  body text NOT NULL,
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_ticket_messages_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.purchase_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL,
  description text NOT NULL,
  amount_usd numeric NOT NULL CHECK (amount_usd >= 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT purchase_expenses_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.client_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['approved'::text, 'rejected'::text])),
  reasons text[] DEFAULT '{}'::text[],
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT client_verifications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.inflow_cxp_settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inflow_id uuid NOT NULL,
  expense_id uuid NOT NULL,
  applied_amount_usd numeric NOT NULL CHECK (applied_amount_usd > 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inflow_cxp_settlements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public._bak_inventory_movements_orphans (
  id uuid,
  variant_value_id uuid,
  quantity integer,
  source_type text,
  source_id uuid,
  note text,
  created_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.dashboard_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  path text,
  referrer text,
  locale text,
  timezone text,
  user_agent text,
  screen_w integer,
  screen_h integer,
  device_pixel_ratio numeric,
  session_id uuid,
  app_version text,
  CONSTRAINT dashboard_visits_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.expense_cxc_settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL,
  inflow_id uuid,
  applied_amount_usd numeric NOT NULL CHECK (applied_amount_usd > 0::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  payment_id uuid,
  CONSTRAINT expense_cxc_settlements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.purchase_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL,
  invoice_number text NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  amount_usd numeric NOT NULL CHECK (amount_usd >= 0::numeric),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  amount_bs numeric NOT NULL DEFAULT 0,
  bs_payment_status text NOT NULL DEFAULT 'pending'::text CHECK (bs_payment_status = ANY (ARRAY['pending'::text, 'paid'::text])),
  CONSTRAINT purchase_invoices_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.birthday_sms_log (
  id bigint NOT NULL DEFAULT nextval('birthday_sms_log_id_seq'::regclass),
  profile_id uuid NOT NULL,
  sent_on date NOT NULL,
  ui_status text NOT NULL,
  phone text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT birthday_sms_log_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_session_id text NOT NULL,
  client_name text,
  client_email text,
  status text NOT NULL CHECK (status = ANY (ARRAY['abierto'::text, 'cerrado'::text, 'cerrado_cliente'::text])),
  taken_by uuid,
  taken_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_message_at timestamp with time zone,
  last_client_message_at timestamp with time zone,
  last_admin_message_at timestamp with time zone,
  client_user_id uuid,
  client_phone text,
  CONSTRAINT chat_conversations_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type = ANY (ARRAY['client'::text, 'admin'::text, 'system'::text])),
  sender_admin_id uuid,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  file_url text,
  file_name text,
  file_type text,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.client_payment_score_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month date NOT NULL,
  payment_score numeric NOT NULL,
  payment_rank integer NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT client_payment_score_history_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.eeff_cobrado_monthly (
  year integer NOT NULL,
  month integer NOT NULL,
  month_name text NOT NULL,
  facturacion_inicial numeric NOT NULL DEFAULT 0,
  facturacion_cuotas numeric NOT NULL DEFAULT 0,
  facturacion numeric NOT NULL DEFAULT 0,
  costo_inicial numeric NOT NULL DEFAULT 0,
  costo_cuotas numeric NOT NULL DEFAULT 0,
  costo_prop numeric NOT NULL DEFAULT 0,
  utilidad_bruta numeric NOT NULL DEFAULT 0,
  gastos numeric NOT NULL DEFAULT 0,
  utilidad_neta numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  otros_ingresos numeric DEFAULT 0,
  monto_programado numeric NOT NULL DEFAULT 0,
  CONSTRAINT eeff_cobrado_monthly_pkey PRIMARY KEY (year, month)
);

CREATE TABLE IF NOT EXISTS public.eeff_proyectado_monthly (
  year integer NOT NULL,
  month integer NOT NULL,
  month_name text NOT NULL,
  facturacion_inicial numeric NOT NULL DEFAULT 0,
  facturacion_cuotas numeric NOT NULL DEFAULT 0,
  facturacion numeric NOT NULL DEFAULT 0,
  costo_inicial numeric NOT NULL DEFAULT 0,
  costo_cuotas numeric NOT NULL DEFAULT 0,
  costo_prop numeric NOT NULL DEFAULT 0,
  utilidad_bruta numeric NOT NULL DEFAULT 0,
  gastos numeric NOT NULL DEFAULT 0,
  utilidad_neta numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  otros_ingresos numeric DEFAULT 0,
  monto_programado numeric NOT NULL DEFAULT 0,
  CONSTRAINT eeff_proyectado_monthly_pkey PRIMARY KEY (year, month)
);

CREATE TABLE IF NOT EXISTS public.payroll_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  payment_date date NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount numeric NOT NULL,
  period_type text NOT NULL CHECK (period_type = ANY (ARRAY['15_days'::text, '30_days'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])),
  receipt_url text,
  expense_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  exchange_rate numeric,
  amount_ves numeric,
  CONSTRAINT payroll_payments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.eeff_cobrado_weekly (
  year integer NOT NULL,
  month integer NOT NULL,
  week integer NOT NULL,
  month_name text,
  week_name text,
  facturacion_inicial numeric DEFAULT 0,
  facturacion_cuotas numeric DEFAULT 0,
  facturacion numeric DEFAULT 0,
  costo_inicial numeric DEFAULT 0,
  costo_cuotas numeric DEFAULT 0,
  costo_prop numeric DEFAULT 0,
  utilidad_bruta numeric DEFAULT 0,
  gastos numeric DEFAULT 0,
  utilidad_neta numeric DEFAULT 0,
  otros_ingresos numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  cuotas_lunes numeric DEFAULT 0,
  cuotas_martes numeric DEFAULT 0,
  cuotas_miercoles numeric DEFAULT 0,
  cuotas_jueves numeric DEFAULT 0,
  cuotas_viernes numeric DEFAULT 0,
  cuotas_sabado numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.eeff_proyectado_weekly (
  year integer NOT NULL,
  month integer NOT NULL,
  week integer NOT NULL,
  month_name text,
  week_name text,
  facturacion_inicial numeric DEFAULT 0,
  facturacion_cuotas numeric DEFAULT 0,
  facturacion numeric DEFAULT 0,
  costo_inicial numeric DEFAULT 0,
  costo_cuotas numeric DEFAULT 0,
  costo_prop numeric DEFAULT 0,
  utilidad_bruta numeric DEFAULT 0,
  gastos numeric DEFAULT 0,
  utilidad_neta numeric DEFAULT 0,
  otros_ingresos numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  cuotas_lunes numeric DEFAULT 0,
  cuotas_martes numeric DEFAULT 0,
  cuotas_miercoles numeric DEFAULT 0,
  cuotas_jueves numeric DEFAULT 0,
  cuotas_viernes numeric DEFAULT 0,
  cuotas_sabado numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.cuotas_facturacion_vs_cobranza_weekly (
  year integer NOT NULL,
  month integer NOT NULL,
  week integer NOT NULL,
  month_name text,
  week_name text,
  facturado_lunes numeric DEFAULT 0,
  facturado_martes numeric DEFAULT 0,
  facturado_miercoles numeric DEFAULT 0,
  facturado_jueves numeric DEFAULT 0,
  facturado_viernes numeric DEFAULT 0,
  facturado_sabado numeric DEFAULT 0,
  facturado_total numeric DEFAULT 0,
  cobrado_lunes numeric DEFAULT 0,
  cobrado_martes numeric DEFAULT 0,
  cobrado_miercoles numeric DEFAULT 0,
  cobrado_jueves numeric DEFAULT 0,
  cobrado_viernes numeric DEFAULT 0,
  cobrado_sabado numeric DEFAULT 0,
  cobrado_total numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.overdue_receivables_v2_detail (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  installment_id uuid NOT NULL,
  application_id uuid NOT NULL,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  facturado numeric DEFAULT 0,
  cobrado numeric DEFAULT 0,
  remainder numeric DEFAULT 0,
  days_overdue integer NOT NULL,
  bucket text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT overdue_receivables_v2_detail_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.overdue_receivables_summary (
  application_id uuid NOT NULL,
  user_id uuid,
  seller_id uuid,
  nombre text,
  apellido text,
  email text,
  telefono text,
  cedula text,
  overdue_installments integer NOT NULL DEFAULT 0,
  overdue_amount numeric NOT NULL DEFAULT 0,
  first_due_date date,
  max_days_overdue integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT overdue_receivables_summary_pkey PRIMARY KEY (application_id)
);

CREATE TABLE IF NOT EXISTS public.overdue_receivables_monthly (
  application_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  user_id uuid,
  seller_id uuid,
  nombre text,
  apellido text,
  email text,
  telefono text,
  cedula text,
  overdue_installments integer NOT NULL DEFAULT 0,
  overdue_amount numeric NOT NULL DEFAULT 0,
  first_due_date date,
  max_days_overdue integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT overdue_receivables_monthly_pkey PRIMARY KEY (application_id, year, month)
);

CREATE TABLE IF NOT EXISTS public.collections_weekly_summary (
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  week integer NOT NULL CHECK (week >= 1 AND week <= 5),
  month_name text NOT NULL,
  week_name text NOT NULL,
  por_cobrar numeric NOT NULL DEFAULT 0,
  cobrado numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  uncollectible_installments integer NOT NULL DEFAULT 0,
  uncollectible_amount numeric NOT NULL DEFAULT 0,
  CONSTRAINT collections_weekly_summary_pkey PRIMARY KEY (year, month, week)
);

CREATE TABLE IF NOT EXISTS public.collection_calls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  called_at timestamp with time zone NOT NULL DEFAULT now(),
  call_result text NOT NULL,
  delay_reason text NOT NULL,
  payment_promise_date date,
  payment_promise_amount numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  caller_role text CHECK (caller_role = ANY (ARRAY['seller'::text, 'collection'::text])),
  CONSTRAINT collection_calls_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.mobile_notifications (
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  profile_id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'unread'::text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  updated_at timestamp with time zone,
  title text,
  href text,
  button_label text,
  CONSTRAINT mobile_notifications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  expo_push_token text NOT NULL,
  device_name text,
  platform text,
  created_at date NOT NULL,
  updated_at date NOT NULL,
  CONSTRAINT user_push_tokens_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_render_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  render_permissions text NOT NULL,
  profile_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_render_permissions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.vacation_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  request_date date NOT NULL,
  employee_full_name text NOT NULL,
  employee_cedula text,
  employee_cargo text,
  employee_fecha_ingreso date,
  dias_vacaciones_acumulados numeric,
  dias_bono_vacacional numeric,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_days integer NOT NULL CHECK (total_days > 0),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text])),
  signed_document_path text,
  signed_document_uploaded_at timestamp with time zone,
  approver_name text,
  approver_cargo text,
  approver_fecha date,
  notes text,
  CONSTRAINT vacation_requests_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.terms_and_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  sections jsonb NOT NULL,
  effective_at timestamp with time zone NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT terms_and_conditions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.pl_summary_buckets (
  bucket_type text NOT NULL CHECK (bucket_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])),
  bucket_start date NOT NULL,
  label text NOT NULL,
  revenue_inicial numeric NOT NULL DEFAULT 0,
  revenue_cuotas numeric NOT NULL DEFAULT 0,
  ingresos_otros numeric NOT NULL DEFAULT 0,
  cost_inicial numeric NOT NULL DEFAULT 0,
  cost_cuotas numeric NOT NULL DEFAULT 0,
  expenses numeric NOT NULL DEFAULT 0,
  expenses_by_category jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pl_summary_buckets_pkey PRIMARY KEY (bucket_type, bucket_start)
);

CREATE TABLE IF NOT EXISTS public.income_outcome_daily (
  scope text NOT NULL CHECK (scope = ANY (ARRAY['cash'::text, 'all'::text])),
  day date NOT NULL,
  beginning_balance numeric NOT NULL DEFAULT 0,
  total_inflows numeric NOT NULL DEFAULT 0,
  total_outflows numeric NOT NULL DEFAULT 0,
  net_cash_flow numeric NOT NULL DEFAULT 0,
  ending_balance numeric NOT NULL DEFAULT 0,
  inflows_by_type jsonb NOT NULL DEFAULT '{}'::jsonb,
  outflows_by_type jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT income_outcome_daily_pkey PRIMARY KEY (scope, day)
);

CREATE TABLE IF NOT EXISTS public.installments_monthly_performance_daily (
  month_start date NOT NULL,
  cuotas_programadas numeric NOT NULL DEFAULT 0,
  cuotas_pagadas numeric NOT NULL DEFAULT 0,
  monto_programado numeric NOT NULL DEFAULT 0,
  monto_pagado numeric NOT NULL DEFAULT 0,
  saldo_pendiente numeric NOT NULL DEFAULT 0,
  monto_pagado_efectivo numeric,
  cumplimiento_pct numeric NOT NULL DEFAULT 0,
  uncollectible_installments integer NOT NULL DEFAULT 0,
  uncollectible_amount numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT installments_monthly_performance_daily_pkey PRIMARY KEY (month_start)
);

CREATE TABLE IF NOT EXISTS public.overdue_receivables_daily_summary (
  application_id uuid NOT NULL,
  user_id uuid,
  seller_id uuid,
  nombre text,
  apellido text,
  email text,
  telefono text,
  cedula text,
  overdue_installments numeric NOT NULL DEFAULT 0,
  overdue_amount numeric NOT NULL DEFAULT 0,
  first_due_date date,
  max_days_overdue integer NOT NULL DEFAULT 0,
  category_totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT overdue_receivables_daily_summary_pkey PRIMARY KEY (application_id)
);

CREATE TABLE IF NOT EXISTS public.overdue_receivables_daily_monthly (
  application_id uuid NOT NULL,
  year smallint NOT NULL,
  month smallint NOT NULL CHECK (month >= 1 AND month <= 12),
  user_id uuid,
  seller_id uuid,
  nombre text,
  apellido text,
  email text,
  telefono text,
  cedula text,
  overdue_installments numeric NOT NULL DEFAULT 0,
  overdue_amount numeric NOT NULL DEFAULT 0,
  first_due_date date,
  max_days_overdue integer NOT NULL DEFAULT 0,
  category_totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT overdue_receivables_daily_monthly_pkey PRIMARY KEY (application_id, year, month)
);

CREATE TABLE IF NOT EXISTS public.overdue_receivables_daily_installment_lines (
  installment_id uuid NOT NULL,
  application_id uuid NOT NULL,
  due_date date NOT NULL,
  due_year smallint NOT NULL,
  due_month smallint NOT NULL CHECK (due_month >= 1 AND due_month <= 12),
  installment_number integer NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  remaining numeric NOT NULL DEFAULT 0,
  days_overdue integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT overdue_receivables_daily_installment_lines_pkey PRIMARY KEY (installment_id)
);

CREATE TABLE IF NOT EXISTS public.product_trends_daily_meta (
  id smallint NOT NULL DEFAULT 1 CHECK (id = 1),
  total_purchased numeric NOT NULL DEFAULT 0,
  in_warehouse numeric NOT NULL DEFAULT 0,
  in_street numeric NOT NULL DEFAULT 0,
  on_way numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_trends_daily_meta_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_trends_daily_movements (
  id bigint NOT NULL DEFAULT nextval('product_trends_daily_movements_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL,
  source_type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  source_id text,
  CONSTRAINT product_trends_daily_movements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_trends_daily_initial_payments (
  payment_id uuid NOT NULL,
  payment_date timestamp with time zone NOT NULL,
  CONSTRAINT product_trends_daily_initial_payments_pkey PRIMARY KEY (payment_id)
);

CREATE TABLE IF NOT EXISTS public.product_trends_daily_model_sales (
  id bigint NOT NULL DEFAULT nextval('product_trends_daily_model_sales_id_seq'::regclass),
  payment_date timestamp with time zone NOT NULL,
  product_id uuid,
  product_name text,
  model text,
  CONSTRAINT product_trends_daily_model_sales_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_trends_daily_top_street (
  sort_order integer NOT NULL,
  product_id uuid NOT NULL,
  producto text NOT NULL,
  en_calle numeric NOT NULL DEFAULT 0,
  CONSTRAINT product_trends_daily_top_street_pkey PRIMARY KEY (product_id)
);

CREATE TABLE IF NOT EXISTS public.product_trends_daily_model_stock (
  product_id uuid NOT NULL,
  producto text NOT NULL,
  model text,
  in_warehouse numeric NOT NULL DEFAULT 0,
  in_street numeric NOT NULL DEFAULT 0,
  CONSTRAINT product_trends_daily_model_stock_pkey PRIMARY KEY (product_id)
);

CREATE TABLE IF NOT EXISTS public.payments_trends_daily_meta (
  id smallint NOT NULL DEFAULT 1 CHECK (id = 1),
  row_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_trends_daily_meta_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payments_trends_daily_rows (
  payment_id uuid NOT NULL,
  payment_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  installment_amount numeric NOT NULL DEFAULT 0,
  is_initial_payment boolean NOT NULL DEFAULT false,
  method_code text,
  CONSTRAINT payments_trends_daily_rows_pkey PRIMARY KEY (payment_id)
);

CREATE TABLE IF NOT EXISTS public.applications_trends_daily_meta (
  id smallint NOT NULL DEFAULT 1 CHECK (id = 1),
  row_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT applications_trends_daily_meta_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.applications_trends_daily_rows (
  application_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL,
  ui_status text NOT NULL,
  client_source text,
  approved_at timestamp with time zone,
  initial_paid_at timestamp with time zone,
  moto_assigned_at timestamp with time zone,
  delivered_at timestamp with time zone,
  CONSTRAINT applications_trends_daily_rows_pkey PRIMARY KEY (application_id)
);

CREATE TABLE IF NOT EXISTS public.products_sold_by_month_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  month_key text NOT NULL CHECK (month_key ~ '^\d{4}-(0[1-9]|1[0-2])$'::text),
  product_id uuid,
  product_name text,
  model text,
  brand_id uuid,
  brand_name text,
  variant_value_id uuid,
  variant_label text,
  sold_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  avg_cost numeric,
  CONSTRAINT products_sold_by_month_summary_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  source text NOT NULL,
  event text NOT NULL,
  level text NOT NULL DEFAULT 'info'::text,
  status text,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  duration_ms integer,
  message text,
  data jsonb,
  error_message text,
  error_stack text,
  CONSTRAINT system_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.balance_summary_scopes (
  scope_key text NOT NULL,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT balance_summary_scopes_pkey PRIMARY KEY (scope_key)
);

CREATE TABLE IF NOT EXISTS public.utilidad_summary_scopes (
  scope_key text NOT NULL,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT utilidad_summary_scopes_pkey PRIMARY KEY (scope_key)
);

CREATE TABLE IF NOT EXISTS public.products_to_buy_summary_scopes (
  scope_key text NOT NULL,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_to_buy_summary_scopes_pkey PRIMARY KEY (scope_key)
);

CREATE TABLE IF NOT EXISTS public.cxc_user_summary_cache (
  user_id uuid NOT NULL,
  name text,
  sellers text,
  total_paid numeric NOT NULL DEFAULT 0,
  total_due numeric NOT NULL DEFAULT 0,
  overdue_due numeric NOT NULL DEFAULT 0,
  chain_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  overdue_vencidas numeric NOT NULL DEFAULT 0,
  overdue_atrasadas numeric NOT NULL DEFAULT 0,
  overdue_morosas numeric NOT NULL DEFAULT 0,
  overdue_incobrables numeric NOT NULL DEFAULT 0,
  CONSTRAINT cxc_user_summary_cache_pkey PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS public.collection_sos_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  category text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamp with time zone,
  updated_by uuid,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'finalized'::text])),
  finalized_at timestamp with time zone,
  finalized_by uuid,
  is_reincidente boolean NOT NULL DEFAULT false,
  CONSTRAINT collection_sos_cases_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.collections_summary_scopes (
  scope_key text NOT NULL,
  period_type text NOT NULL CHECK (period_type = ANY (ARRAY['hoy'::text, 'ayer'::text, 'semana_actual'::text, 'mes_actual'::text, 'todos'::text])),
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_vencido numeric NOT NULL DEFAULT 0,
  clientes_count integer NOT NULL DEFAULT 0,
  CONSTRAINT collections_summary_scopes_pkey PRIMARY KEY (scope_key)
);

-- FKs después de crear todas las tablas: hay ciclos (payments ↔ purchases) que
-- no se resuelven ordenando los CREATE. Se saltan las que ya existen (Supabase)
-- y las que apuntan a una tabla ausente (auth.users y compañía en Docker).
DO $$
DECLARE
  fk record;
  referenced text;
BEGIN
  FOR fk IN
    SELECT * FROM (VALUES
      ('products', 'products_brand_id_fkey', 'FOREIGN KEY (brand_id) REFERENCES public.brands(id)'),
      ('payments', 'payments_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('payments', 'payments_method_fkey', 'FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id)'),
      ('payments', 'payments_account_fkey', 'FOREIGN KEY (account_id) REFERENCES public.accounts(id)'),
      ('payments', 'payments_purchase_fkey', 'FOREIGN KEY (purchase_id) REFERENCES public.purchases(id)'),
      ('payments', 'payments_parent_payment_id_fkey', 'FOREIGN KEY (parent_payment_id) REFERENCES public.payments(id)'),
      ('payments', 'payments_store_id_fkey', 'FOREIGN KEY (store_id) REFERENCES public.stores(id)'),
      ('payments', 'payments_provider_id_fkey', 'FOREIGN KEY (provider_id) REFERENCES public.providers(id)'),
      ('profiles', 'profiles_id_fkey', 'FOREIGN KEY (id) REFERENCES auth.users(id)'),
      ('profiles', 'profiles_store_id_fkey', 'FOREIGN KEY (store_id) REFERENCES public.stores(id)'),
      ('product_specifications', 'product_specifications_product_id_fkey', 'FOREIGN KEY (product_id) REFERENCES public.products(id)'),
      ('product_categories', 'product_categories_product_fkey', 'FOREIGN KEY (product_id) REFERENCES public.products(id)'),
      ('product_categories', 'product_categories_category_fkey', 'FOREIGN KEY (category_id) REFERENCES public.categories(id)'),
      ('product_variants', 'product_variants_product_fkey', 'FOREIGN KEY (product_id) REFERENCES public.products(id)'),
      ('variant_inventory', 'variant_inventory_variant_fkey', 'FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)'),
      ('product_variant_attributes', 'product_variant_attributes_product_fkey', 'FOREIGN KEY (product_id) REFERENCES public.products(id)'),
      ('product_variant_attribute_values', 'pvav_attribute_fkey', 'FOREIGN KEY (attribute_id) REFERENCES public.product_variant_attributes(id)'),
      ('applications', 'applications_rule_id_fkey', 'FOREIGN KEY (rule_id) REFERENCES public.payment_interest_rules(id)'),
      ('applications', 'applications_product_id_fkey', 'FOREIGN KEY (product_id) REFERENCES public.products(id)'),
      ('applications', 'applications_variant_attribute_id_fkey', 'FOREIGN KEY (variant_attribute_id) REFERENCES public.product_variant_attributes(id)'),
      ('applications', 'applications_variant_value_id_fkey', 'FOREIGN KEY (variant_value_id) REFERENCES public.product_variant_attribute_values(id)'),
      ('applications', 'applications_provider_ally_fkey', 'FOREIGN KEY (provider_ally) REFERENCES public.providers(id)'),
      ('applications', 'applications_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES public.profiles(id)'),
      ('applications', 'applications_store_id_fkey', 'FOREIGN KEY (store_id) REFERENCES public.stores(id)'),
      ('applications', 'applications_audited_by_fkey', 'FOREIGN KEY (audited_by) REFERENCES public.profiles(id)'),
      ('applications', 'applications_marketing_link_id_fkey', 'FOREIGN KEY (marketing_link_id) REFERENCES public.marketing_links(id)'),
      ('applications', 'applications_marketing_click_id_fkey', 'FOREIGN KEY (marketing_click_id) REFERENCES public.marketing_link_clicks(id)'),
      ('user_documents', 'user_documents_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES public.profiles(id)'),
      ('application_documents', 'application_documents_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('application_documents', 'application_documents_document_id_fkey', 'FOREIGN KEY (document_id) REFERENCES public.user_documents(id)'),
      ('notifications', 'notifications_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES public.profiles(id)'),
      ('notifications', 'notifications_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('application_rejection_reasons', 'application_rejection_reasons_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('application_rejection_reasons', 'application_rejection_reasons_admin_id_fkey', 'FOREIGN KEY (admin_id) REFERENCES auth.users(id)'),
      ('email_confirmations', 'email_confirmations_profile_id_fkey', 'FOREIGN KEY (profile_id) REFERENCES public.profiles(id)'),
      ('email_confirmations', 'email_confirmations_application_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('email_confirmations', 'email_confirmations_product_id_fkey', 'FOREIGN KEY (product_id) REFERENCES public.products(id)'),
      ('email_confirmations', 'email_confirmations_rule_id_fkey', 'FOREIGN KEY (rule_id) REFERENCES public.payment_interest_rules(id)'),
      ('installments', 'installments_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('installments', 'installments_payment_id_fkey', 'FOREIGN KEY (payment_id) REFERENCES public.payments(id)'),
      ('installments', 'installments_parent_installment_id_fkey', 'FOREIGN KEY (parent_installment_id) REFERENCES public.installments(id)'),
      ('payment_methods', 'payment_methods_account_fkey', 'FOREIGN KEY (account_id) REFERENCES public.accounts(id)'),
      ('purchases', 'purchases_payment_fkey', 'FOREIGN KEY (payment_id) REFERENCES public.payments(id)'),
      ('purchases', 'purchases_provider_fkey', 'FOREIGN KEY (provider_id) REFERENCES public.providers(id)'),
      ('purchases', 'purchases_account_fkey', 'FOREIGN KEY (account_id) REFERENCES public.accounts(id)'),
      ('purchases', 'purchases_provider_id_fkey', 'FOREIGN KEY (provider_id) REFERENCES public.providers(id)'),
      ('purchases', 'purchases_dealership_id_fkey', 'FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)'),
      ('purchases', 'purchases_warehouse_id_fkey', 'FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id)'),
      ('purchase_items', 'purchase_items_purchase_fkey', 'FOREIGN KEY (purchase_id) REFERENCES public.purchases(id)'),
      ('purchase_items', 'purchase_items_product_fkey', 'FOREIGN KEY (product_id) REFERENCES public.products(id)'),
      ('purchase_items', 'purchase_items_variant_fkey', 'FOREIGN KEY (variant_value_id) REFERENCES public.product_variant_attribute_values(id)'),
      ('inventory_movements', 'inventory_movements_variant_fkey', 'FOREIGN KEY (variant_value_id) REFERENCES public.product_variant_attribute_values(id)'),
      ('inventory_movements', 'inventory_movements_purchase_id_fkey', 'FOREIGN KEY (purchase_id) REFERENCES public.purchases(id)'),
      ('appointment_slots', 'appointment_slots_store_id_fkey', 'FOREIGN KEY (store_id) REFERENCES public.stores(id)'),
      ('appointments', 'appointments_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES public.profiles(id)'),
      ('appointments', 'appointments_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('appointments', 'appointments_slot_id_fkey', 'FOREIGN KEY (slot_id) REFERENCES public.appointment_slots(id)'),
      ('appointments', 'appointments_store_id_fkey', 'FOREIGN KEY (store_id) REFERENCES public.stores(id)'),
      ('slot_defaults', 'slot_defaults_store_id_fkey', 'FOREIGN KEY (store_id) REFERENCES public.stores(id)'),
      ('inventory_items', 'inventory_items_variant_fkey', 'FOREIGN KEY (variant_value_id) REFERENCES public.product_variant_attribute_values(id)'),
      ('inventory_items', 'inventory_items_app_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('inventory_items', 'inventory_items_dealership_id_fkey', 'FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)'),
      ('inventory_items', 'inventory_items_warehouse_id_fkey', 'FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id)'),
      ('inventory_items', 'inventory_items_purchase_id_fkey', 'FOREIGN KEY (purchase_id) REFERENCES public.purchases(id)'),
      ('inventory_items', 'inventory_items_insurance_paid_inflow_id_fkey', 'FOREIGN KEY (insurance_paid_inflow_id) REFERENCES public.inflows(id)'),
      ('expenses', 'expenses_expense_category_id_fkey', 'FOREIGN KEY (expense_category_id) REFERENCES public.expense_categories(id)'),
      ('expenses', 'expenses_account_id_fkey', 'FOREIGN KEY (account_id) REFERENCES public.accounts(id)'),
      ('expenses', 'expenses_warehouse_id_fkey', 'FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id)'),
      ('expenses', 'expenses_dealership_id_fkey', 'FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)'),
      ('expenses', 'expenses_store_id_fkey', 'FOREIGN KEY (store_id) REFERENCES public.stores(id)'),
      ('inflows', 'inflows_account_id_fkey', 'FOREIGN KEY (account_id) REFERENCES public.accounts(id)'),
      ('inflows', 'inflows_category_fkey', 'FOREIGN KEY (inflow_category_id) REFERENCES public.inflow_categories(id)'),
      ('inflows', 'inflows_warehouse_id_fkey', 'FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id)'),
      ('inflows', 'inflows_purchase_id_fkey', 'FOREIGN KEY (purchase_id) REFERENCES public.purchases(id)'),
      ('inflows', 'inflows_dealership_id_fkey', 'FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)'),
      ('inflows', 'inflows_store_id_fkey', 'FOREIGN KEY (store_id) REFERENCES public.stores(id)'),
      ('product_payment_options', 'product_payment_options_product_id_fkey', 'FOREIGN KEY (product_id) REFERENCES public.products(id)'),
      ('product_payment_options', 'product_payment_options_rule_id_fkey', 'FOREIGN KEY (rule_id) REFERENCES public.payment_interest_rules(id)'),
      ('inventory_item_checklists', 'inventory_item_checklists_created_by_fkey', 'FOREIGN KEY (created_by) REFERENCES auth.users(id)'),
      ('inventory_item_checklists', 'inventory_item_checklists_inventory_item_id_fkey', 'FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id)'),
      ('inventory_item_checklist_items', 'inventory_item_checklist_items_checklist_id_fkey', 'FOREIGN KEY (checklist_id) REFERENCES public.inventory_item_checklists(id)'),
      ('product_images', 'product_images_product_id_fkey', 'FOREIGN KEY (product_id) REFERENCES public.products(id)'),
      ('overdue_reminder_logs', 'overdue_reminder_logs_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('application_nudge_logs', 'application_nudge_logs_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('payments_installments', 'payments_installments_payment_id_fkey', 'FOREIGN KEY (payment_id) REFERENCES public.payments(id)'),
      ('payments_installments', 'payments_installments_installment_id_fkey', 'FOREIGN KEY (installment_id) REFERENCES public.installments(id)'),
      ('support_tickets', 'support_tickets_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES auth.users(id)'),
      ('support_tickets', 'support_tickets_category_id_fkey', 'FOREIGN KEY (category_id) REFERENCES public.support_categories(id)'),
      ('support_tickets', 'support_tickets_assigned_to_fkey', 'FOREIGN KEY (assigned_to) REFERENCES auth.users(id)'),
      ('support_tickets', 'support_tickets_assigned_to_profiles_fkey', 'FOREIGN KEY (assigned_to) REFERENCES public.profiles(id)'),
      ('support_ticket_messages', 'support_ticket_messages_ticket_id_fkey', 'FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id)'),
      ('support_ticket_messages', 'support_ticket_messages_author_user_id_fkey', 'FOREIGN KEY (author_user_id) REFERENCES auth.users(id)'),
      ('purchase_expenses', 'purchase_expenses_purchase_id_fkey', 'FOREIGN KEY (purchase_id) REFERENCES public.purchases(id)'),
      ('client_verifications', 'client_verifications_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES public.profiles(id)'),
      ('client_verifications', 'client_verifications_created_by_fkey', 'FOREIGN KEY (created_by) REFERENCES auth.users(id)'),
      ('inflow_cxp_settlements', 'inflow_cxp_settlements_inflow_id_fkey', 'FOREIGN KEY (inflow_id) REFERENCES public.inflows(id)'),
      ('inflow_cxp_settlements', 'inflow_cxp_settlements_expense_id_fkey', 'FOREIGN KEY (expense_id) REFERENCES public.expenses(id)'),
      ('dashboard_visits', 'dashboard_visits_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES public.profiles(id)'),
      ('expense_cxc_settlements', 'expense_cxc_settlements_expense_id_fkey', 'FOREIGN KEY (expense_id) REFERENCES public.expenses(id)'),
      ('expense_cxc_settlements', 'expense_cxc_settlements_inflow_id_fkey', 'FOREIGN KEY (inflow_id) REFERENCES public.inflows(id)'),
      ('expense_cxc_settlements', 'expense_cxc_settlements_payment_id_fkey', 'FOREIGN KEY (payment_id) REFERENCES public.payments(id)'),
      ('purchase_invoices', 'purchase_invoices_purchase_id_fkey', 'FOREIGN KEY (purchase_id) REFERENCES public.purchases(id)'),
      ('birthday_sms_log', 'birthday_sms_log_profile_id_fkey', 'FOREIGN KEY (profile_id) REFERENCES public.profiles(id)'),
      ('chat_conversations', 'chat_conversations_taken_by_fkey', 'FOREIGN KEY (taken_by) REFERENCES auth.users(id)'),
      ('chat_conversations', 'chat_conversations_client_user_id_fkey', 'FOREIGN KEY (client_user_id) REFERENCES auth.users(id)'),
      ('chat_messages', 'chat_messages_conversation_id_fkey', 'FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id)'),
      ('chat_messages', 'chat_messages_sender_admin_id_fkey', 'FOREIGN KEY (sender_admin_id) REFERENCES auth.users(id)'),
      ('payroll_payments', 'payroll_payments_profile_id_fkey', 'FOREIGN KEY (profile_id) REFERENCES public.profiles(id)'),
      ('payroll_payments', 'payroll_payments_expense_id_fkey', 'FOREIGN KEY (expense_id) REFERENCES public.expenses(id)'),
      ('payroll_payments', 'payroll_payments_created_by_fkey', 'FOREIGN KEY (created_by) REFERENCES auth.users(id)'),
      ('payroll_payments', 'payroll_payments_updated_by_fkey', 'FOREIGN KEY (updated_by) REFERENCES auth.users(id)'),
      ('overdue_receivables_summary', 'overdue_receivables_summary_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('overdue_receivables_summary', 'overdue_receivables_summary_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES public.profiles(id)'),
      ('overdue_receivables_summary', 'overdue_receivables_summary_seller_id_fkey', 'FOREIGN KEY (seller_id) REFERENCES public.profiles(id)'),
      ('overdue_receivables_monthly', 'overdue_receivables_monthly_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('overdue_receivables_monthly', 'overdue_receivables_monthly_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES public.profiles(id)'),
      ('overdue_receivables_monthly', 'overdue_receivables_monthly_seller_id_fkey', 'FOREIGN KEY (seller_id) REFERENCES public.profiles(id)'),
      ('collection_calls', 'fk_collection_calls_application', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('collection_calls', 'fk_collection_calls_created_by', 'FOREIGN KEY (created_by) REFERENCES public.profiles(id)'),
      ('user_push_tokens', 'user_push_tokens_profile_id_fkey', 'FOREIGN KEY (profile_id) REFERENCES public.profiles(id)'),
      ('user_render_permissions', 'user_render_permissions_profile_id_fkey', 'FOREIGN KEY (profile_id) REFERENCES public.profiles(id)'),
      ('vacation_requests', 'vacation_requests_profile_id_fkey', 'FOREIGN KEY (profile_id) REFERENCES public.profiles(id)'),
      ('vacation_requests', 'vacation_requests_created_by_fkey', 'FOREIGN KEY (created_by) REFERENCES public.profiles(id)'),
      ('overdue_receivables_daily_summary', 'overdue_receivables_daily_summary_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('overdue_receivables_daily_monthly', 'overdue_receivables_daily_monthly_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('overdue_receivables_daily_installment_lines', 'overdue_receivables_daily_installment_lines_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('collection_sos_cases', 'collection_sos_cases_application_id_fkey', 'FOREIGN KEY (application_id) REFERENCES public.applications(id)'),
      ('collection_sos_cases', 'collection_sos_cases_created_by_fkey', 'FOREIGN KEY (created_by) REFERENCES public.profiles(id)'),
      ('collection_sos_cases', 'collection_sos_cases_updated_by_fkey', 'FOREIGN KEY (updated_by) REFERENCES public.profiles(id)')
    ) AS t(table_name, constraint_name, definition)
  LOOP
    referenced := substring(fk.definition FROM 'REFERENCES ([a-z_.]+)\(');
    IF to_regclass(referenced) IS NULL THEN
      RAISE NOTICE 'FK % omitida: no existe %', fk.constraint_name, referenced;
      CONTINUE;
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = fk.constraint_name
        AND conrelid = format('public.%I', fk.table_name)::regclass
    ) THEN
      CONTINUE;
    END IF;
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I %s',
      fk.table_name, fk.constraint_name, fk.definition
    );
  END LOOP;
END $$;
