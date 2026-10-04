import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) throw new Error("Não autenticado.");
    const admin = createClient(url, service);
    const { data: profile } = await admin.from("profiles").select("role,active").eq("id", user.id).single();
    if (!profile?.active || profile.role !== "owner") throw new Error("Somente o Dono pode criar usuários.");
    const body = await req.json();
    if (!body.email || !body.password || !body.username || !body.display_name) throw new Error("Dados incompletos.");
    if (!['admin','seller','support'].includes(body.role)) throw new Error("Cargo inválido.");
    const { data, error } = await admin.auth.admin.createUser({email: body.email,password: body.password,email_confirm: true,user_metadata:{username:body.username,display_name:body.display_name,role:body.role}});
    if (error) throw error;
    return new Response(JSON.stringify({ok:true,id:data.user.id}), {headers:{...cors,"Content-Type":"application/json"}});
  } catch (e) {
    return new Response(JSON.stringify({error:e.message||"Erro ao criar usuário."}), {status:400,headers:{...cors,"Content-Type":"application/json"}});
  }
});
