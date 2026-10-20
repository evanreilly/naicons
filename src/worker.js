export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/naicons" && !url.pathname.startsWith("/naicons/"))
      return new Response("Not found", { status: 404 });
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    );
    if (url.pathname.endsWith(".zip"))
      response.headers.set(
        "Content-Disposition",
        'attachment; filename="naicons.zip"',
      );
    return response;
  },
};
