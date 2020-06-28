import IziToast from "izitoast";
import { default as cfg, Config } from "../config";
import '../../node_modules/izitoast/dist/css/izitoast.css';
import "@coreui/icons/css/all.min.css";
import '../css/users.css';
import Handlebars from "handlebars"
import { Request, User } from "tombalaApi";
//@ts-ignore
import { Modal } from "@coreui/coreui"

class Users extends Request {
	myData?: User;
	myChildren: User[] = [];
	usersTemplate = fetch(require("../partials/usersTable.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this));
	userDeleteTpl = fetch(require("../partials/deleteUser.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this))
	moneyTransferTpl = fetch(require("../partials/moneyTransfer.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this))
	editUserTpl = fetch(require("../partials/editUser.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this))
	modal: any;
	modalBody?: HTMLElement;
	cfg: Config = {} as Config;
	constructor(c: Config) {
		super(c)
		this.cfg = c;
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
							return Promise.reject(IziToast.error({ title: 'Hata', message: reason }))
						data.date_str = new Date(data.created_at * 1000).toISOString().split("T")[0];
						that.myChildren.unshift(data)
						that.updateChildrenUI()
						return true
					}).then(() => {

						IziToast.success({ title: 'Başarılı', message: 'İşlem Başarılı' })
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
	onMoneyClickHandler(uid: string) {
		const user = this.myChildren.filter(usr => usr.id == uid)[0];
		if (!user) return IziToast.error({ title: 'Hata', message: 'Geçersiz kullanıcı idsi, Lütfen bizi arayın' })
		this.getWallets(user, this.cfg.gameData.map(g=> g.id))
			.catch(() => Promise.reject(IziToast.error({ title: 'Hata', message: 'Network Hatası' })))
			.then(({ success, reason, data }) => {
				if (!success) return Promise.reject(IziToast.error({ title: 'Hata', message: reason }))
				return Promise.all([this.moneyTransferTpl, data])
			})
			.then(([t, data]) => {
				this.modalBody && (this.modalBody.innerHTML = t({ uid, data }))
				this.modal.show();
			})
	}
	updtCredit(uid: string, gameID: number, isReceive: boolean) {
		const user = this.myChildren.filter(usr => usr.id == uid)[0];
		const elems = [].slice.call(document.querySelector('#form_' + gameID)?.querySelectorAll('input')) as HTMLInputElement[];
		if (!elems) return;
		let credit = parseFloat(elems[0].value);

		this.updateCredit(user, isReceive ? Math.abs(credit) * -1 : credit, gameID, elems[1].checked)
			.catch(() => Promise.reject(IziToast.error({ title: 'Hata', message: 'İşlem başarısız' })))
			.then(({ success, reason, data }) => {
				if (!success) return Promise.reject(IziToast.error({ title: 'Hata', message: reason }));
				console.log(data);
			})
	}
	onUserEditClickHandler(uid: string) {
		const user = this.myChildren.filter(usr => usr.id == uid)[0];
		if (!user) return IziToast.error({ title: "Hata", message: "Geçersiz kullanıcı idsi, Lütfen bizi arayın" })
		this.editUserTpl.then((t) => {
			this.modalBody && (this.modalBody.innerHTML = t(user))
			this.modal.show()
			return this.modalBody?.querySelector("#saveUserData") as HTMLElement | undefined
		}).then(el => {
			if (!el) return
			let userInfo: { email: string, phone: string, password: string } = {} as { email: string, phone: string, password: string }
			el.onclick = () => {
				const userInfoElems = this.modalBody?.querySelectorAll('.form-control') as HTMLInputElement[] | undefined;
				if (!userInfoElems) return;
				if (userInfoElems[0]?.value) userInfo.email = userInfoElems[0].value;
				if (userInfoElems[1]?.value) userInfo.phone = userInfoElems[1].value;
				if (userInfoElems[2]?.value) userInfo.password = userInfoElems[2].value;
				this.updateProfile(user, userInfo)
					.catch(() => Promise.reject(IziToast.error({ title: 'Hata', message: 'İşlem başarısız' })))
					.then(({ success, reason }) => {
						if (!success) return Promise.reject(IziToast.error({ title: 'Hata', message: reason }));
						return IziToast.success({ title: 'Başarılı', message: 'İşlem başarıyla gerçekleşti' })
					})
			}
		})
		return null
	}

	onUserDeleteClickHandler(uid: string) {
		const user = this.myChildren.filter(usr => usr.id == uid)[0];
		if (!user) return IziToast.error({ title: "Hata", message: "Geçersiz kullanıcı idsi, Lütfen bizi arayın" })
		this.userDeleteTpl.then((t) => {
			this.modalBody && (this.modalBody.innerHTML = t(user))
			this.modal.show()
			return ["doDeleteUser", "doEnableUser", "doDisableUser"].map(s => this.modalBody?.querySelector("#" + s)) as (HTMLElement | undefined)[]
		}).then(([delel, enableEl, disableEl]) => {
			delel?.addEventListener("click", () => {
				this.deleteChild(user, true)
					.then(({ success, reason }) => {
						if (!success)
							return IziToast.error({ title: 'Hata', message: reason })
						IziToast.success({ title: 'Başarılı', message: 'Silindi' })
						this.myChildren = this.myChildren.filter(u => u.id != uid)
						this.updateChildrenUI()
						this.modal.hide()
						return true
					})
			})
			enableEl?.addEventListener("click", () => {
				this.enableChild(user, true)
					.then(({ success, reason }) => {
						if (!success)
							return IziToast.error({ title: 'Hata', message: reason })
						IziToast.success({ title: 'Başarılı', message: 'Engel Kaldırıldı' });
						this.myChildren.forEach(u => {
							u.id == uid && (u.is_disabled = false)
						})
						this.updateChildrenUI()
						this.modal.hide()
						return true
					})
			})
			disableEl?.addEventListener("click", () => {
				this.disableChild(user, true)
					.then(({ success, reason }) => {
						if (!success)
							return IziToast.error({ title: 'Hata', message: reason })
						IziToast.success({ title: 'Başarılı', message: 'Engellendi' });
						this.myChildren.forEach(u => {
							u.id == uid && (u.is_disabled = true)
						})
						this.updateChildrenUI()
						this.modal.hide()
						return true
					})
			})
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
			.catch(e => Promise.reject(IziToast.error({ title: 'Hata', message: 'internet sorunu' + e })))
			.then(({ success, data, reason }) => {
				if (!success)
					return Promise.reject(IziToast.error({ title: 'Hata', message: reason }));
				if (data.user_type == 'user')
					location.pathname = '/index.html';
				return data;
			})
	}
	async getMyChildren(): Promise<User[]> {
		return this.children()
			.catch(e => Promise.reject(IziToast.error({ title: 'Hata', message: 'internet sorunu' + e })))
			.then(({ success, data, reason }) => {
				if (!success)
					return Promise.reject(IziToast.error({ title: 'Hata', message: reason }));
				return data;
			})
	}
}
cfg().then(c =>
	//@ts-ignore
	window.ctx = new Users(c)
)

