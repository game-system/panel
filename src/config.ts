import { Config } from "tombalaApi"
export default function cfg(): Promise<Config> {
	return Promise.resolve({
		apiAddr:"http://195.201.137.105:9999"
	})
}
