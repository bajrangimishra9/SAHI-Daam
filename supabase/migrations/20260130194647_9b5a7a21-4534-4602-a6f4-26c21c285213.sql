-- Create private bucket for supplier documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-docs','supplier-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Helper: can current user access a storage path?
CREATE OR REPLACE FUNCTION public.can_access_supplier_doc_path(_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.supplier_documents d
    JOIN public.supplier_profiles sp ON sp.id = d.supplier_id
    WHERE d.storage_path = _path
      AND (
        sp.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
  )
$$;

-- Storage policies (do not modify storage schema beyond policies)
DROP POLICY IF EXISTS "Supplier docs read" ON storage.objects;
CREATE POLICY "Supplier docs read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'supplier-docs'
  AND public.can_access_supplier_doc_path(name)
);

DROP POLICY IF EXISTS "Supplier docs insert" ON storage.objects;
CREATE POLICY "Supplier docs insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'supplier-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Supplier docs update" ON storage.objects;
CREATE POLICY "Supplier docs update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'supplier-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'supplier-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Supplier docs delete" ON storage.objects;
CREATE POLICY "Supplier docs delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'supplier-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
