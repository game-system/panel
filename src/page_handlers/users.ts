import toastr from "toastr";
import cfg from "../config"
import "toastr/build/toastr.min.css";
import "@coreui/icons/css/all.min.css"
import Handlebars from "handlebars"
import { Config, Request, User } from "tombalaApi"
//@ts-ignore
import { Modal } from "@coreui/coreui"

class Users extends Request {
	myData?: User;
	myChildren: User[] = [];
	usersTemplate = fetch(require("../partials/usersTable.hbs")).then(d => d.text()).then(Handlebars.compile);
	userDeleteTpl = fetch(require("../partials/deleteUser.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this))
	moneyTransferTpl = fetch(require("../partials/moneyTransfer.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this))
	editUserTpl = fetch(require("../partials/moneyTransfer.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this))
	modal: any;
	modalBody?: HTMLElement;
	constructor(c: Config) {
		super(c)
		const that = this
		window.addEventListener("DOMContentLoaded", () => {
			const mdlEl = document.getElementById("actionModal") || undefined
			that.modal = new Modal(mdlEl, {})
			that.modalBody = mdlEl?.querySelector(".modal-dialog") || undefined;
			that.getMyData()
				.then(d => that.myData = d)
				.then(() => that.updateUiMydata())
				.then(that.getMyChildren.bind(that))
				.then(children => that.myChildren = children.map(c => {
					c.date_str = new Date(c.created_at * 1000).toISOString().split("T")[0];
					return c
				}))
				.then(that.updateChildrenUI.bind(that))
			that.addNewUserUi()
		})
	}
	addNewUserUi() {
		const that = this;
		const btn = document.getElementById("new_user_btn");
		function handleSubmit(el: HTMLFormElement | null | undefined) {
			return (e: Event) => {
				e.preventDefault();
				const id = (el?.querySelector("input[type='text']") as HTMLInputElement | null);
				const pass = (el?.querySelector("input[type='password']") as HTMLInputElement | null);
				if (!id?.value) return id?.focus()
				if (!pass?.value) return pass?.focus()
				that.addChild({ id: id?.value || "", password: pass?.value || "" } as User)
					.then(({ data, reason, success }) => {
						if (!success)
							return Promise.reject(toastr.error("Hata", reason))
						data.date_str = new Date(data.created_at * 1000).toISOString().split("T")[0];
						that.myChildren.unshift(data)
						that.updateChildrenUI()
						return true
					}).then(() => {
						toastr.success("İşlem Başarılı")
						that.modal.hide()
					})
			}
		}
		btn?.addEventListener("click", () => {
			fetch(require("../partials/addUserModal.hbs"))
				.then(d => d.text())
				.then(d => {
					that.modalBody && (that.modalBody.innerHTML = d)
					const form = that.modalBody?.querySelector("form")
					that.modalBody?.querySelector("#submitNewAddUser")?.addEventListener("click", handleSubmit(form))
					form?.addEventListener("submit", handleSubmit(form))
					that.modal.toggle()
				})
		})

	}
	updateChildrenUI() {
		const that = this;
		const el = document.querySelector("#users_table")
		that.usersTemplate.then(t => {
			return t({
				children: that.myChildren,
			})
		}).then(tpl => {
			el && (el.innerHTML = tpl)
		})
	}
	onMoneyClickHandler(uid:string) {
		const user = this.myChildren.filter(usr => usr.id == uid)[0];
		if (!user) return toastr.error("Hata", "Geçersiz kullanıcı idsi, Lütfen bizi arayın")
			this.moneyTransferTpl.then((t) => {
				this.modalBody&&(this.modalBody.innerHTML = t(user))
				this.modal.show()
				return this.modalBody?.querySelector("#pushMoney") as HTMLElement|undefined
			}).then(el=>{
				if(!el)return
					
			})
			return null
	}
	onUserEditClickHandler(uid:string) {
		console.log(uid)
	}
	onUserDeleteClickHandler(uid:string) {
		const user = this.myChildren.filter(usr => usr.id == uid)[0];
		if (!user) return toastr.error("Hata", "Geçersiz kullanıcı idsi, Lütfen bizi arayın")
			this.userDeleteTpl.then((t) => {
				this.modalBody&&(this.modalBody.innerHTML = t(user))
				this.modal.show()
				return this.modalBody?.querySelector("#doDeleteUser") as HTMLElement|undefined
			}).then(el=>{
				if(!el)return
					el.onclick=()=>{
						this.deleteChild(user,true)
						.then(({success,reason})=>{
								if(!success)
									return toastr.error("HATA",reason+'')
								toastr.success("Silindi")
								this.myChildren=this.myChildren.filter(u=>u.id!=uid)
								this.updateChildrenUI()
								this.modal.hide()
								return true
						})
					}
			})
			return null
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
	async addChildPopUp() { }
}
cfg().then(c =>
		   //@ts-ignore
		   window.ctx = new Users(c)
		  )

