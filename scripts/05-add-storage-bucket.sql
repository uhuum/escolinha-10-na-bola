-- Use DROP IF EXISTS to prevent policy duplication errors
-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for receipts bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'receipts' AND auth.uid() = owner);
