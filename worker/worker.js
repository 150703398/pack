export default {
  async fetch(request) {
    const url = "https://你的-fastapi-域名/pack"
    return fetch(url, request)
  }
}
