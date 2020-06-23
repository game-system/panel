import * as api from "tombalaApi"

export interface Config extends api.Config {
	gameIds: number[],
}
export default function cfg(): Promise<Config> {
	return Promise.resolve({
		apiAddr: "https://demoapi.liderbingo.com",
		gameIds: [1],
	})
}
