import {compile} from "handlebars"
export async function loadTpl(addr: string): Promise<HandlebarsTemplateDelegate<any>> {
	const d = await fetch(addr);
	const t = await d.text();
	return compile(t);
}
