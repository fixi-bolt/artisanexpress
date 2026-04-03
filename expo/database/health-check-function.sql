-- ============================================================================
-- Fonction RPC ultra-légère pour health check
-- ============================================================================

CREATE OR REPLACE FUNCTION public.health_check()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'postgres_version', version(),
    'database', current_database()
  );
$$;

-- Permettre l'accès anonyme (c'est un health check public)
GRANT EXECUTE ON FUNCTION public.health_check() TO anon, authenticated, service_role;
