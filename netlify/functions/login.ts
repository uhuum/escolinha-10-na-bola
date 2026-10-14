// Login legado encerrado. A autenticação oficial é feita pelo Supabase Auth em /api/auth/login.
export default async () => new Response(JSON.stringify({ error: "Endpoint desativado" }), {
  status: 410,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
})
