// Upload legado desativado: não autenticava o usuário antes de usar privilégios de serviço.
export default async () => new Response(JSON.stringify({ error: "Endpoint desativado" }), {
  status: 410,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
})
