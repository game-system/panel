import * as api from "tombalaApi"

export interface Config extends api.Config {
	webSocket: String,
	gameIds: number[]
}
export default function cfg(): Promise<Config> {
	return Promise.resolve({
		apiAddr: location.href.indexOf("192.168") > -1 || location.href.indexOf("localhost") > -1 ? "http://api:9999" : "https://demoapi.liderbingo.com",
		webSocket: location.href.indexOf("localhost") > -1 || location.href.indexOf("192.168") > -1 ? "ws://sock:10000" : "wss://demosock.liderbingo.com",
		gameIds: [1, 2, 3, 4]
	})
}
