import toastr from "toastr";
import "toastr/build/toastr.min.css";
import Config from "../config";
import HandleBars from "handlebars"

interface User {
	id: string,
	admin_id?: string,
	seller_id?: string,
	superadmin_id?: string,
	created_at: number,
	is_disabled: boolean,
	is_seamless: boolean,
	user_type?: 'system' | 'superadmin' | 'admin' | 'seller' | 'user',
	date_str?:string
}

interface Response<T> {
	success: boolean,
	reason?: string,
	data: T
}
class Users extends Config {
	me?: User;
	children: User[] = [];
	usersTemplate = fetch(require("../partials/usersTable.hbs")).then(d => d.text()).then(HandleBars.compile);
	constructor() {
		super()
		const that = this
		window.addEventListener("DOMContentLoaded", () => {
			that.getMyData()
				.then(d => that.me = d)
				.then(() => that.updateUiMydata())
				.then(that.getMyChildren.bind(that))
				.then(children => that.children = children.map(c=>{
					c.date_str=new Date(c.created_at*1000).toISOString().split("T")[0];
					return c
				}))
				.then(that.updateChildrenData.bind(that))

		})
	}
	updateChildrenData() {
		const that = this;
		const el = document.querySelector("#users_table")
		that.usersTemplate.then(t => {
			return t(that.children)
		}).then(tpl => {
			el && (el.innerHTML = tpl)
		})
	}
	updateUiMydata() {
		const that = this;
		const me_id_el = document.querySelector("#me_id");
		me_id_el && (me_id_el.innerHTML = that.me?.id || "")
	}
	async getMyData(): Promise<User> {
		const that = this;
		return fetch(`${that.apiAddr}/users/me`, { credentials: "include" })
			.then(d => d.json())
			.catch(e => Promise.reject(toastr.error("internet sorunu", e)))
			.then(({ success, data, reason }: Response<User>) => {
				if (!success)
					return Promise.reject(toastr.error("Hata", reason));
				return data;
			})
	}

	async getMyChildren(): Promise<User[]> {
		const that = this;
		return fetch(`${that.apiAddr}/users/children`, { credentials: "include" })
			.then(d => d.json())
			.catch(e => Promise.reject(toastr.error("internet sorunu", e)))
			.then(({ success, data, reason }: Response<User[]>) => {
				if (!success)
					return Promise.reject(toastr.error("Hata", reason));
				return data;
			})
	}
}
//@ts-ignore
window.context = new Users();
