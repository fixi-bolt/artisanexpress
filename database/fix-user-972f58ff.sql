-- ========================================
-- 🔧 FIX MANUAL USER CREATION
-- For user ID: 972f58ff-b099-47d0-92ec-de3ae442a011
-- ========================================

DO $$
DECLARE
  v_user_id UUID := '972f58ff-b099-47d0-92ec-de3ae442a011';
  v_email TEXT;
  v_user_type TEXT := 'client';
BEGIN
  -- 1️⃣ Get email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION '❌ User % not found in auth.users', v_user_id;
  END IF;

  -- 2️⃣ Create user in public.users
  INSERT INTO public.users (id, email, name, user_type, rating, review_count)
  VALUES (
    v_user_id,
    v_email,
    split_part(v_email, '@', 1),
    v_user_type,
    0.00,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  -- 3️⃣ Create client profile
  INSERT INTO public.clients (id)
  VALUES (v_user_id)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ User % created successfully', v_user_id;

END $$;

-- ========================================
-- ✅ Verification
-- ========================================
SELECT 
  u.id, 
  u.email, 
  u.user_type, 
  c.id IS NOT NULL AS is_client
FROM public.users u
LEFT JOIN public.clients c ON u.id = c.id
WHERE u.id = '972f58ff-b099-47d0-92ec-de3ae442a011';
