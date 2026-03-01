
-- Drop overly permissive policy and replace with auth-based one
DROP POLICY "Service can update payments" ON public.payments;

-- Only allow updates on own payments (service role bypasses RLS anyway)
CREATE POLICY "Users can view updated own payments" ON public.payments
  FOR UPDATE USING (user_id = auth.uid());
