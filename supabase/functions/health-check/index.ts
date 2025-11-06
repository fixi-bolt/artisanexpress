import { createClient } from "npm:@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  const headers = {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
  };

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !key) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
          timestamp: new Date().toISOString(),
        }),
        { status: 500, headers }
      );
    }

    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const start = Date.now();

    // ✅ Appeler la fonction RPC health_check (plus léger et sécurisé)
    const { data, error, status } = await supabase
      .rpc('health_check');

    const latency_ms = Date.now() - start;

    if (error) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: error.message,
          status,
          latency_ms,
          timestamp: new Date().toISOString(),
        }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Database connection healthy',
        latency_ms,
        database_info: data,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers }
    );
  }
});
