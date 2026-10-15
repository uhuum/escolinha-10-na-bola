import { createClient } from "@supabase/supabase-js"
import { sendWebPush, isTrustedPushEndpoint, isValidPushKeys } from "../../lib/push/server"

export const config = { schedule: "* * * * *" }

type Device = { id: string; auth_user_id: string; role: "admin"; endpoint: string; p256dh: string; auth_key: string }
type Delivery = { id: number; sent_at: string | null }

export default async () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Banco indisponível")
  const db = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const { data:events,error:claimError } = await db.rpc("claim_enrollment_push_events",{p_limit:25})
  if (claimError) throw claimError
  if (!events?.length) return new Response(JSON.stringify({events:0}),{status:200})
  const { data:devices,error:deviceError } = await db.from("push_subscriptions")
    .select("id,auth_user_id,role,endpoint,p256dh,auth_key").eq("role","admin")
  if (deviceError) throw deviceError
  let sent=0,failed=0,skipped=0

  for(const event of events as {request_id:string}[]) {
    const eventKey="admin-new-enrollment-"+event.request_id
    const title="Nova matrícula recebida"
    const body="Uma ficha foi enviada. Abra o SIGA para conferir sua situação."
    const href="/enrollments/"+event.request_id
    let successful=true

    for(const device of (devices||[]) as Device[]) {
      try {
        if(!isTrustedPushEndpoint(device.endpoint)||!isValidPushKeys(device.p256dh,device.auth_key)) {
          await db.from("push_subscriptions").delete().eq("id",device.id)
          continue
        }
        const {data:inserted,error:insertError}=await db.from("push_notification_deliveries")
          .insert({event_key:eventKey,subscription_id:device.id,auth_user_id:device.auth_user_id,
            role:"admin",title,body,href}).select("id,sent_at").single()
        let delivery=inserted as Delivery|null
        if(insertError) {
          if(insertError.code!=="23505") throw insertError
          const {data:prior,error:lookupError}=await db.from("push_notification_deliveries")
            .select("id,sent_at").eq("event_key",eventKey).eq("subscription_id",device.id).single()
          if(lookupError) throw lookupError
          delivery=prior as Delivery
        }
        if(!delivery) throw new Error("Reserva de push indisponível")
        if(delivery.sent_at) {skipped++;continue}
        const response=await sendWebPush(device,{id:eventKey,title,body,href})
        if(response.ok) {
          const {error:markError}=await db.from("push_notification_deliveries")
            .update({sent_at:new Date().toISOString()}).eq("id",delivery.id)
          if(markError) throw markError
          sent++
        } else if(response.status===404||response.status===410) {
          await db.from("push_subscriptions").delete().eq("id",device.id)
        } else {
          successful=false
          failed++
          console.error("[SIGA] Provedor push recusou matrícula:",response.status)
        }
      } catch(err) {
        successful=false
        failed++
        console.error("[SIGA] Falha no envio de matrícula:",err)
      }
    }

    const {error:finishError}=await db.rpc("finish_enrollment_push_event",{
      p_request_id:event.request_id,p_success:successful
    })
    if(finishError) throw finishError
  }

  console.log("[SIGA] Novas matrículas:",{events:events.length,sent,failed,skipped})
  return new Response(JSON.stringify({events:events.length,sent,failed,skipped}),{
    status:200,headers:{"Content-Type":"application/json"}
  })
}
