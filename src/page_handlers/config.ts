import * as api from "tombalaApi"

export interface Config extends api.Config {
	gameIds: number[]
}
export default function cfg(): Promise<Config> {
	return Promise.resolve({
		apiAddr: location.href.indexOf("192.168") > -1 || location.href.indexOf("localhost") > -1 ?
			"http://192.168.1.115:9999" : "https://demoapi.liderbingo.com",
		gameIds: [1, 2]
	})
}

