import * as api from "tombalaApi"

export interface Config extends api.Config {
	gameData: {
		id: number,
		numCards: number
	}[]
}
export default function cfg(): Promise<Config> {
	return Promise.resolve({
		apiAddr: "https://demoapi.liderbingo.com",
		gameData: [{ id: 1, numCards: 150 }],
	})
}

