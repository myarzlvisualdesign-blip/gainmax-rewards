
-- Payment type enum
CREATE TYPE public.payment_type AS ENUM ('membership', 'topup');

-- Payment status enum
CREATE TYPE public.payment_status AS ENUM ('UNPAID', 'PAID', 'EXPIRED', 'FAILED', 'REFUND');

-- Payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  payment_type public.payment_type NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  fee numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  merchant_ref text NOT NULL,
  tripay_reference text,
  payment_method text,
  payment_url text,
  checkout_url text,
  pay_code text,
  status public.payment_status NOT NULL DEFAULT 'UNPAID',
  membership_level public.membership_level,
  expired_time bigint,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Service role can update (for callback)
CREATE POLICY "Service can update payments" ON public.payments
  FOR UPDATE USING (true) WITH CHECK (true);

-- Updated at trigger
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
