// Cloudflare Worker: Newsletter signup via Resend
// Deploy: https://dash.cloudflare.com → Workers & Pages → Create Worker
// Set environment variable: RESEND_API_KEY = your key

export default {
  async fetch(request, env) {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    try {
      const { email } = await request.json();

      if (!email || !email.includes('@')) {
        return new Response(JSON.stringify({ error: 'Valid email required' }), { status: 400, headers });
      }

      // Add to Resend Audience
      const audienceId = env.RESEND_AUDIENCE_ID;
      if (audienceId) {
        await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, unsubscribed: false }),
        });
      }

      // Send welcome email
      const fromAddress = env.FROM_EMAIL || 'ZUGO Bike <onboarding@resend.dev>';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: 'Welcome to ZUGO Bike!',
          html: `
            <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://zugobike.com/cdn/shop/files/ZuGo_Logo_BLK_280x_1_230x.png" alt="ZUGO Bike" style="height: 40px;">
              </div>
              <h1 style="font-size: 24px; text-align: center; color: #1c1d1d;">Welcome to the ZUGO Family!</h1>
              <p style="font-size: 15px; line-height: 1.7; color: #555; text-align: center;">
                Thanks for subscribing! You'll be the first to know about new products, exclusive deals, and riding tips.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://zugobike.github.io/ZUGO-APP/" style="display: inline-block; padding: 14px 48px; background: linear-gradient(90deg, #471669, #a22155); color: #fff; text-decoration: none; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">Shop E-Bikes</a>
              </div>
              <p style="font-size: 12px; color: #999; text-align: center; margin-top: 40px;">
                ZUGO Bike — Designed & Engineered in Austin, TX
              </p>
            </div>
          `,
        }),
      });

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Something went wrong' }), { status: 500, headers });
    }
  },
};
