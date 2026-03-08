import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEBHOOK_AUTH_KEY = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_KEY') ?? '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Webhook認証
    const authHeader = req.headers.get('Authorization');
    if (WEBHOOK_AUTH_KEY && authHeader !== `Bearer ${WEBHOOK_AUTH_KEY}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();
    const event = payload.event;

    if (!event) {
      return new Response(JSON.stringify({ error: 'No event in payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const appUserId = event.app_user_id;
    const eventType = event.type;
    const productId = event.product_id ?? '';

    // product_id からプラン判定
    const plan = productId.includes('yearly') || productId.includes('annual')
      ? 'basic_yearly'
      : 'basic_monthly';

    const periodEnd = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;
    const periodStart = event.purchase_date_ms
      ? new Date(event.purchase_date_ms).toISOString()
      : null;

    let status: string | null = null;

    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
      case 'UNCANCELLATION':
        status = 'active';
        break;
      case 'CANCELLATION':
        status = 'cancelled';
        break;
      case 'EXPIRATION':
        status = 'expired';
        break;
      case 'BILLING_ISSUE':
        // 請求問題発生 - まだactiveのまま
        console.warn('Billing issue for user:', appUserId);
        break;
      default:
        console.log('Unhandled RevenueCat event:', eventType);
    }

    if (status) {
      const updateData: Record<string, unknown> = {
        status,
        plan: status === 'active' ? plan : null,
        revenuecat_customer_id: event.original_app_user_id ?? appUserId,
        updated_at: new Date().toISOString(),
      };

      if (periodStart) updateData.current_period_start = periodStart;
      if (periodEnd) updateData.current_period_end = periodEnd;

      // status がexpired/cancelledの場合、planをfreeに戻す
      if (status === 'expired') {
        updateData.status = 'free';
        updateData.plan = null;
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('user_id', appUserId);

      if (error) {
        console.error('Failed to update subscription:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
