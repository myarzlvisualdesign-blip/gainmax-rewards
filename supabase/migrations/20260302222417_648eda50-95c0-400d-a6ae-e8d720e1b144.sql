
-- =============================================
-- FASE 1: FULL MANUAL PAYMENT SYSTEM MIGRATION
-- =============================================

-- 1A. Update payment_status enum
-- First convert column to text to avoid enum casting issues
ALTER TABLE public.payments ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.payments ALTER COLUMN status TYPE text USING status::text;

-- Map old values to new
UPDATE public.payments SET status = 'PENDING' WHERE status IN ('UNPAID', 'EXPIRED', 'FAILED', 'REFUND');
UPDATE public.payments SET status = 'BERHASIL' WHERE status = 'PAID';

-- Drop old enum, create new
DROP TYPE public.payment_status;
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'BERHASIL', 'DITOLAK');

-- Set column back to enum
ALTER TABLE public.payments ALTER COLUMN status TYPE payment_status USING status::payment_status;
ALTER TABLE public.payments ALTER COLUMN status SET DEFAULT 'PENDING'::payment_status;

-- Add new columns to payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS proof_image_url text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_channel text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Make old Tripay columns nullable / drop them
ALTER TABLE public.payments ALTER COLUMN merchant_ref DROP NOT NULL;
ALTER TABLE public.payments DROP COLUMN IF EXISTS tripay_reference;
ALTER TABLE public.payments DROP COLUMN IF EXISTS pay_code;
ALTER TABLE public.payments DROP COLUMN IF EXISTS checkout_url;
ALTER TABLE public.payments DROP COLUMN IF EXISTS payment_url;
ALTER TABLE public.payments DROP COLUMN IF EXISTS expired_time;
ALTER TABLE public.payments DROP COLUMN IF EXISTS fee;
ALTER TABLE public.payments DROP COLUMN IF EXISTS total_amount;

-- 1B. Create membership_packages table
CREATE TABLE public.membership_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level public.membership_level NOT NULL UNIQUE,
  price numeric NOT NULL DEFAULT 0,
  referral_commission numeric NOT NULL DEFAULT 0,
  commission_percentage numeric NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view packages" ON public.membership_packages FOR SELECT USING (true);
CREATE POLICY "Admins can manage packages" ON public.membership_packages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.membership_packages (level, price, referral_commission, commission_percentage, features) VALUES
  ('silver', 25000, 10000, 40, '["Akses affiliate marketplace", "Komisi referral 40%", "Upload produk"]'::jsonb),
  ('gold', 35000, 15000, 42.86, '["Semua fitur Silver", "Komisi referral 42.86%", "Priority support", "Bonus bulanan"]'::jsonb),
  ('diamond', 50000, 20000, 40, '["Semua fitur Gold", "Komisi referral 40%", "Exclusive deals", "VIP support", "Early access"]'::jsonb);

-- 1C. Create site_settings table
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value) VALUES
  ('qris_image_url', ''),
  ('bank_accounts', '[{"name":"SUPERBANK","number":"000087164489","type":"bank"},{"name":"NEOBANK","number":"5859459404602897","type":"bank"},{"name":"GOPAY","number":"083116513445","type":"ewallet"},{"name":"SHOPEEPAY","number":"083116513445","type":"ewallet"},{"name":"DANA","number":"083116513445","type":"ewallet"},{"name":"OVO","number":"087768421811","type":"ewallet"}]');

-- 1D. Create user_products table
CREATE TABLE public.user_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'Umum',
  title text NOT NULL,
  description text,
  image_url text,
  shopee_link text,
  buy_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user products" ON public.user_products FOR SELECT USING (true);
CREATE POLICY "Users can insert own products" ON public.user_products FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own products" ON public.user_products FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own products" ON public.user_products FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all user products" ON public.user_products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 1E. Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 1F. Update withdrawals enum
ALTER TABLE public.withdrawals ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.withdrawals ALTER COLUMN status TYPE text USING status::text;
UPDATE public.withdrawals SET status = 'berhasil' WHERE status = 'approved';
UPDATE public.withdrawals SET status = 'ditolak' WHERE status = 'rejected';
DROP TYPE public.withdrawal_status;
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'berhasil', 'ditolak');
ALTER TABLE public.withdrawals ALTER COLUMN status TYPE withdrawal_status USING status::withdrawal_status;
ALTER TABLE public.withdrawals ALTER COLUMN status SET DEFAULT 'pending'::withdrawal_status;

ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS account_number text;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS account_holder text;

-- 1G. Update referral_commissions
ALTER TABLE public.referral_commissions ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES public.payments(id);

-- 1H. Update profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shopee_affiliate_url text;

-- 1I. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-images', 'proof-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);

-- Storage RLS policies
CREATE POLICY "Auth upload proof images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proof-images');
CREATE POLICY "View proof images" ON storage.objects FOR SELECT USING (bucket_id = 'proof-images');
CREATE POLICY "Auth upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "View product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admin upload site assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "View site assets" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');

-- Triggers
CREATE TRIGGER update_membership_packages_updated_at BEFORE UPDATE ON public.membership_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_products_updated_at BEFORE UPDATE ON public.user_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Security: restrict profile updates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile limited" ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
