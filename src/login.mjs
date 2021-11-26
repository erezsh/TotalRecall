export const AUTH_SERVER = "https://totalrecall.erezsh.com"

const REGISTER_ENDPOINT = AUTH_SERVER + "/register"

export async function register(user, password) {
	let req
	try {
		req = await fetch(REGISTER_ENDPOINT + "/" + user + "?password=" + encodeURIComponent(password))
	} catch (e) {
		throw {status: 'error', message: `Could not reach regitration server (${AUTH_SERVER})`}
	}
	return await req.json()
}