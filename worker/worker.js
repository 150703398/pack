export default {
  async fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
        }
      })
    }

    const url = new URL(req.url)
    const target = "https://YOUR_FASTAPI_DOMAIN/pack"

    const res = await fetch(target, {
      method: "POST",
      body: await req.text(),
      headers: {
        "Content-Type": "application/json"
      }
    })

    return new Response(await res.text(), {
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    })
  }
}
