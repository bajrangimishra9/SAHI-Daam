-- Allow admins to create supplier/vendor profiles when approving role requests
DROP POLICY IF EXISTS "supplier profile upsert own" ON public.supplier_profiles;
CREATE POLICY "supplier profile insert" ON public.supplier_profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "vendor profile upsert" ON public.vendor_profiles;
CREATE POLICY "vendor profile insert" ON public.vendor_profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));