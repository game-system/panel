import { Config } from "tombalaApi"
export default function cfg(): Promise<Config> {
	return Promise.resolve({
		apiAddr:"https://demoapi.liderbingo.com"
	})
}
