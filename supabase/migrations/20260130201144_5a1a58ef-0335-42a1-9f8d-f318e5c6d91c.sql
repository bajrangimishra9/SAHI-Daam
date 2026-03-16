-- Admin allowlist (domains + optional exact emails)
CREATE TABLE IF NOT EXISTS public.admin_allowlist_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_allowlist_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_allowlist_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_allowlist_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage allowlist
DROP POLICY IF EXISTS "admin allowlist domains admin" ON public.admin_allowlist_domains;
CREATE POLICY "admin allowlist domains admin" ON public.admin_allowlist_domains
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin allowlist emails admin" ON public.admin_allowlist_emails;
CREATE POLICY "admin allowlist emails admin" ON public.admin_allowlist_emails
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SECURITY DEFINER helper (reads JWT email claim)
CREATE OR REPLACE FUNCTION public.can_self_assign_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH e AS (
    SELECT lower(coalesce(auth.jwt() ->> 'email','')) AS email
  )
  SELECT EXISTS (
    SELECT 1 FROM e
    JOIN public.admin_allowlist_emails ae ON ae.email = e.email
  )
  OR EXISTS (
    SELECT 1
    FROM e
    JOIN public.admin_allowlist_domains ad
      ON split_part(e.email, '@', 2) = lower(ad.domain)
  )
$$;

-- Demo-friendly role granting: users can self-insert vendor/supplier roles; admin only if allowlisted
DROP POLICY IF EXISTS "admin manage roles" ON public.user_roles;
CREATE POLICY "admin manage roles" ON public.user_roles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin delete roles" ON public.user_roles;
CREATE POLICY "admin delete roles" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "self grant role" ON public.user_roles;
CREATE POLICY "self grant role" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    role IN ('vendor','supplier')
    OR (role = 'admin' AND public.can_self_assign_admin())
  )
);

-- Seed temporary allowlist based on your message
INSERT INTO public.admin_allowlist_domains(domain)
VALUES ('gmail.com'), ('outlook.com')
ON CONFLICT (domain) DO NOTHING;

INSERT INTO public.admin_allowlist_emails(email)
VALUES ('bajrangi9@outlook.com')
ON CONFLICT (email) DO NOTHING;
