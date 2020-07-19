import * as api from "tombalaApi"

export interface Config extends api.Config {
	gameData: {
		id: number,
		numCards: number
	}[]
}
export default function cfg(): Promise<Config> {
	return Promise.resolve({
		apiAddr: location.href.indexOf("192.168") > -1 || location.href.indexOf("localhost") > -1 ?
			"http://192.168.1.115:9999" : "https://demoapi.liderbingo.com",
		gameData: [
			{ id: 1, numCards: 150 }
			, { id: 2, numCards: 135 }
		],
	})
}

