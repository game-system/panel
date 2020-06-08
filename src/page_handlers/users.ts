import toastr from "toastr";
import cfg from "../config"
import "toastr/build/toastr.min.css";
import HandleBars from "handlebars"
import { Config, Request, User } from "tombalaApi"

class Users extends Request {
	myData?: User;
	myChildren: User[] = [];
	usersTemplate = fetch(require("../partials/usersTable.hbs")).then(d => d.text()).then(HandleBars.compile);
	constructor(c: Config) {
		super(c)
		const that = this
		window.addEventListener("DOMContentLoaded", () => {
			that.getMyData()
				.then(d => that.myData = d)
				.then(() => that.updateUiMydata())
				.then(that.getMyChildren.bind(that))
				.then(children => that.myChildren = children.map(c => {
					c.date_str = new Date(c.created_at * 1000).toISOString().split("T")[0];
					return c
				}))
				.then(that.updateChildrenData.bind(that))

		})
	}
	updateChildrenData() {
		const that = this;
		const el = document.querySelector("#users_table")
		that.usersTemplate.then(t => {
			return t(that.myChildren)
		}).then(tpl => {
			el && (el.innerHTML = tpl)
		})
	}
	updateUiMydata() {
		const that = this;
		const me_id_el = document.querySelector("#me_id");
		me_id_el && (me_id_el.innerHTML = that.myData?.id || "")
	}
	async getMyData(): Promise<User> {
		return this.me()
			.catch(e => Promise.reject(toastr.error("internet sorunu", e)))
			.then(({ success, data, reason }) => {
				if (!success)
					return Promise.reject(toastr.error("Hata", reason));
				return data;
			})
	}

	async getMyChildren(): Promise<User[]> {
		return this.children()
			.catch(e => Promise.reject(toastr.error("internet sorunu", e)))
			.then(({ success, data, reason }) => {
				if (!success)
					return Promise.reject(toastr.error("Hata", reason));
				return data;
			})
	}
}
cfg().then(c =>
	//@ts-ignore
	window.context = new Users(c)
)
