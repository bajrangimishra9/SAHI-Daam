-- Core enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('vendor','supplier','admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE public.verification_status AS ENUM ('pending','verified','rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_request_status') THEN
    CREATE TYPE public.role_request_status AS ENUM ('pending','approved','rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_category') THEN
    CREATE TYPE public.material_category AS ENUM ('civil','electrical','machinery');
  END IF;
END $$;

-- Updated-at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Roles table (separate from profiles) + helper
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  )
$$;

-- Controlled self-select role requests (admin approves)
CREATE TABLE IF NOT EXISTS public.role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  requested_role public.app_role NOT NULL,
  status public.role_request_status NOT NULL DEFAULT 'pending',
  decided_by uuid,
  decided_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE TRIGGER trg_role_requests_updated_at
BEFORE UPDATE ON public.role_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Profiles (general) - created by backend function after signup
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Supplier profile
CREATE TABLE IF NOT EXISTS public.supplier_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL DEFAULT '',
  pincode text NOT NULL DEFAULT '',
  city text,
  service_radius_km int NOT NULL DEFAULT 50,
  discoverable boolean NOT NULL DEFAULT true,
  logistics_notes text,
  verification public.verification_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_pincode ON public.supplier_profiles (pincode);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_discoverable ON public.supplier_profiles (discoverable);
CREATE TRIGGER trg_supplier_profiles_updated_at
BEFORE UPDATE ON public.supplier_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Supplier materials
CREATE TABLE IF NOT EXISTS public.supplier_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.supplier_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category public.material_category NOT NULL,
  brand text,
  grade_strength text,
  unit_base_price numeric(12,2) NOT NULL DEFAULT 0,
  transport_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  bulk_discount_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  monsoon_price_rise_pct numeric(5,2) NOT NULL DEFAULT 0,
  available_stock numeric(14,2),
  delivery_sla text,
  image_paths text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_supplier_materials_supplier_id ON public.supplier_materials (supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_materials_category ON public.supplier_materials (category);
CREATE TRIGGER trg_supplier_materials_updated_at
BEFORE UPDATE ON public.supplier_materials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Supplier documents (store path in storage, not file data)
CREATE TABLE IF NOT EXISTS public.supplier_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.supplier_profiles(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'supplier-docs',
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_supplier_documents_supplier_id ON public.supplier_documents (supplier_id);
CREATE TRIGGER trg_supplier_documents_updated_at
BEFORE UPDATE ON public.supplier_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Vendor profile
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  pincode text NOT NULL DEFAULT '',
  radius_km int NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_pincode ON public.vendor_profiles (pincode);
CREATE TRIGGER trg_vendor_profiles_updated_at
BEFORE UPDATE ON public.vendor_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Admin-configurable ranking weights
CREATE TABLE IF NOT EXISTS public.rules_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  weight numeric(8,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_rules_weights_updated_at
BEFORE UPDATE ON public.rules_weights
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.rules_weights(key, weight)
VALUES
  ('credibility', 0.35),
  ('distance', 0.25),
  ('monsoon', 0.20),
  ('sla', 0.20)
ON CONFLICT (key) DO NOTHING;

-- AI recommendations (per vendor request)
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_user_id uuid NOT NULL,
  material_query text NOT NULL DEFAULT '',
  vendor_pincode text NOT NULL DEFAULT '',
  radius_km int NOT NULL DEFAULT 50,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_vendor_user_id ON public.ai_recommendations (vendor_user_id);

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.role_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rules_weights;

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies
-- user_roles
DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin manage roles" ON public.user_roles;
CREATE POLICY "admin manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- role_requests
DROP POLICY IF EXISTS "create own role request" ON public.role_requests;
CREATE POLICY "create own role request" ON public.role_requests
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "read own role request" ON public.role_requests;
CREATE POLICY "read own role request" ON public.role_requests
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "update role request admin" ON public.role_requests;
CREATE POLICY "update role request admin" ON public.role_requests
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- profiles
DROP POLICY IF EXISTS "read own profile" ON public.profiles;
CREATE POLICY "read own profile" ON public.profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "insert own profile" ON public.profiles;
CREATE POLICY "insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update own profile" ON public.profiles;
CREATE POLICY "update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- supplier_profiles
DROP POLICY IF EXISTS "supplier profile read" ON public.supplier_profiles;
CREATE POLICY "supplier profile read" ON public.supplier_profiles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (discoverable = true AND verification = 'verified')
);

DROP POLICY IF EXISTS "supplier profile upsert own" ON public.supplier_profiles;
CREATE POLICY "supplier profile upsert own" ON public.supplier_profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "supplier profile update own" ON public.supplier_profiles;
CREATE POLICY "supplier profile update own" ON public.supplier_profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- supplier_materials
DROP POLICY IF EXISTS "supplier materials read" ON public.supplier_materials;
CREATE POLICY "supplier materials read" ON public.supplier_materials
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_profiles sp
    WHERE sp.id = supplier_id
      AND (
        sp.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR (sp.discoverable = true AND sp.verification = 'verified')
      )
  )
);

DROP POLICY IF EXISTS "supplier materials write" ON public.supplier_materials;
CREATE POLICY "supplier materials write" ON public.supplier_materials
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_profiles sp
    WHERE sp.id = supplier_id
      AND (sp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.supplier_profiles sp
    WHERE sp.id = supplier_id
      AND (sp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- supplier_documents (private: only supplier owner or admin)
DROP POLICY IF EXISTS "supplier docs read" ON public.supplier_documents;
CREATE POLICY "supplier docs read" ON public.supplier_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_profiles sp
    WHERE sp.id = supplier_id
      AND (sp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

DROP POLICY IF EXISTS "supplier docs write" ON public.supplier_documents;
CREATE POLICY "supplier docs write" ON public.supplier_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_profiles sp
    WHERE sp.id = supplier_id
      AND (sp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.supplier_profiles sp
    WHERE sp.id = supplier_id
      AND (sp.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- vendor_profiles
DROP POLICY IF EXISTS "vendor profile read" ON public.vendor_profiles;
CREATE POLICY "vendor profile read" ON public.vendor_profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "vendor profile upsert" ON public.vendor_profiles;
CREATE POLICY "vendor profile upsert" ON public.vendor_profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "vendor profile update" ON public.vendor_profiles;
CREATE POLICY "vendor profile update" ON public.vendor_profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- rules_weights (admin only)
DROP POLICY IF EXISTS "rules read admin" ON public.rules_weights;
CREATE POLICY "rules read admin" ON public.rules_weights
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "rules write admin" ON public.rules_weights;
CREATE POLICY "rules write admin" ON public.rules_weights
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ai_recommendations (vendor can read own)
DROP POLICY IF EXISTS "ai recs read own" ON public.ai_recommendations;
CREATE POLICY "ai recs read own" ON public.ai_recommendations
FOR SELECT TO authenticated
USING (vendor_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "ai recs insert own" ON public.ai_recommendations;
CREATE POLICY "ai recs insert own" ON public.ai_recommendations
FOR INSERT TO authenticated
WITH CHECK (vendor_user_id = auth.uid());
