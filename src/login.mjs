export const AUTH_SERVER = "https://totalrecall.erezsh.com"


const REGISTER_ENDPOINT = AUTH_SERVER + "/register"

export async function register(user, password) {
	const req = await fetch(REGISTER_ENDPOINT + "/" + user + "?password=" + encodeURIComponent(password))
	return await req.json()
}