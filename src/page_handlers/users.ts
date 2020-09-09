import IziToast from "izitoast";
import { default as cfg, Config } from "./config";
import "izitoast/dist/css/iziToast.min.css";
import "@coreui/icons/css/all.min.css";
import "../css/users.css";
import { registerHelper } from "handlebars";
import { Request, User, Wallet, Err } from "tombalaApi";
//@ts-ignore
import { Modal } from "@coreui/coreui";
import translateError from "./errMessagesTR";
import { DataTable } from "simple-datatables";
import "simple-datatables/dist/style.css";
import { loadTpl, handlebarsHelpers } from "../utils";
import swal from "sweetalert2";
import Socket from "./socket";
registerHelper(handlebarsHelpers);
class Users extends Request {
	myData?: User;
	wallets: Wallet[] = [];
	myChildren: User[] = [];
	addUserTemplate = loadTpl(require("../partials/addUserModal.hbs"));
	noteTemplate = loadTpl(require("../partials/userNote.hbs"));
	usersTemplate = loadTpl(require("../partials/usersTable.hbs"));
	userDeleteTpl = loadTpl(require("../partials/deleteUser.hbs"));
	creditTemplate = loadTpl(require("../partials/credit.hbs"));
	moneyTransferTpl = loadTpl(require("../partials/moneyTransfer.hbs"));
	editUserTpl = loadTpl(require("../partials/editUser.hbs"));
	couponHistoryTpl = loadTpl(require("../partials/couponHistory.hbs"));
	modal: any;
	modalBody?: HTMLElement;
	cfg: Config = {} as Config;
	constructor(c: Config) {
		super(c);
		this.cfg = c;
		const that = this;
		const socket = new Socket(c);
		window.addEventListener("DOMContentLoaded", () => {
			const mdlEl = document.getElementById("actionModal") || undefined;
			that.modal = new Modal(mdlEl, {});
			that.modalBody = mdlEl?.querySelector(".modal-dialog") || undefined;
			that
				.getMyData()
				.then(d => that.myData = d)
				.then(() => that.updateUiMydata())
				.then(that.getMyChildren.bind(that))
				.then(
					children =>
						(that.myChildren = children.map(c => {
							c.date_str = new Date(c.created_at * 1000)
								.toISOString()
								.split("T")[0];
							return c;
						}))
				)
				.then(that.updateChildrenUI.bind(that));
			that.addNewUserUi();
			that.initWallet();
		});
	}
	initWallet() {
		const that = this;
		Promise.all(that.cfg.gameIds.map(this.getGameData.bind(this)))
			.catch(e =>
				Promise.reject(IziToast.error({ title: "Hata", message: e + "" }))
			)
			.then(data => {
				data.forEach(d => {
					if (d.success) {
						that.wallets.push(d.data.wallet);
					}
				});
				that.updateUserCreditUI();
			});
	}
	addNewUserUi() {
		const that = this;
		document.querySelector("#new_user_btn")?.addEventListener("click", () => {
			const userType = sessionStorage.getItem('user_type');
			this.addUserTemplate
				.then(d => d({ note: (userType != 'seller' ? true : false) }))
				.then(d => {
					that.modalBody && (that.modalBody.innerHTML = d);
					const form: HTMLFormElement | null | undefined = that.modalBody?.querySelector("form");
					that.modalBody?.querySelector("#submitNewAddUser")?.addEventListener("click", () => this.handleSumbit(form));
					form?.addEventListener("keypress", (e) => {
						if (e.keyCode == 13 || e.keyCode == 10) {
							this.handleSumbit(form)
						}
					});
					that.modal.toggle();
				});
		});
	}
	private handleSumbit(el: HTMLFormElement | null | undefined) {
		console.log(el);
		const that = this;
		const id = el?.querySelector("input[type='text']") as HTMLInputElement | null;
		const pass = el?.querySelector("input[type='password']") as HTMLInputElement | null;
		const note = el?.querySelector('textarea') as HTMLInputElement | null;
		if (!id?.value) return id?.focus();
		if (!pass?.value) return pass?.focus();
		if (note && !note?.value) return note?.focus();
		that.addChild({
			id: id?.value || "",
			password: pass?.value || "",
			note: note?.value || '',
		} as User)
			.then(({ data, reason, success }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					return Promise.reject(IziToast.error({ title, message: msg || "" }));
				}
				data.date_str = new Date(data.created_at * 1000).toISOString().split("T")[0];
				that.myChildren.unshift(data);
				that.updateChildrenUI();
				return true;
			})
			.then(() => {
				IziToast.success({ title: "Başarılı", message: "İşlem Başarılı" });
				that.modal.hide();
			});
	}
	updateUserCreditUI() {
		const el: HTMLElement | null = document.querySelector("#credits") || null;
		if (this.myData?.user_type == 'seller' || this.myData?.user_type == 'user') return;
		this.creditTemplate
			.then(t => t({ wallets: this.wallets }))
			.then(html => el && (el.innerHTML = html));
	}
	updateChildrenUI() {
		const that = this;
		const el = document.querySelector("#users-table-el");
		that.usersTemplate
			.then(t => {
				return t({
					children: that.myChildren.sort((a, b) => (a.id < b.id) ? -1 : (a.id > b.id) ? 1 : 0),
					is_seller: that.myData?.user_type === "seller"
				});
			})
			.then(tpl => {
				el && (el.innerHTML = tpl);
				new DataTable(el, { perPageSelect: [10, 20, 50, 70, 100], perPage: 100 });
			});
	}
	onMoneyClickHandler(uid: string) {
		const user = this.myChildren.filter(usr => usr.id == uid)[0];
		if (!user)
			return IziToast.error({
				title: "Hata",
				message: "Geçersiz kullanıcı idsi, Lütfen bizi arayın"
			});
		this.getWallets(user, ['tombala'])
			.catch(() =>
				Promise.reject(
					IziToast.error({ title: "Hata", message: "Network Hatası" })
				)
			)
			.then(({ success, reason, data }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					return Promise.reject(IziToast.error({ title, message: msg || "" }));
				}
				return Promise.all([this.moneyTransferTpl, data]);
			})
			.then(([t, data]) => {
				swal.fire({
					title: `<strong>Para Transferi: ${uid}</strong>`,
					html: t({ uid, data }),
					showCloseButton: false,
					showCancelButton: true,
					showConfirmButton: false,
					focusConfirm: false,
					cancelButtonText: 'Kapat',
				});
				const forms = [].slice.call(document.querySelector('#tableForms')?.querySelectorAll('form')) as HTMLFormElement[];
				forms.forEach((e, i) => {
					e.addEventListener('keypress', (el) => {
						if (el.keyCode == 13 || el.keyCode == 10) {
							this.updtCredit(uid, data[i].game_type, false);
							el.preventDefault();
						}
					})
				})
			});
	}
	updtCredit(uid: string, game_type: string, isReceive: boolean) {
		const that = this;
		const user = this.myChildren.filter(usr => usr.id == uid)[0];
		const elems = [].slice.call(document.querySelector("#form_" + game_type)?.querySelectorAll("input")) as HTMLInputElement[];
		if (!elems || !elems.length || elems.length < 2) return;
		let credit = parseFloat(elems[0].value);
		this.updateCredit(
			user,
			isReceive ? Math.abs(credit) * -1 : credit,
			game_type,
			elems[1].checked
		)
			.catch(() => Promise.reject(IziToast.error({ title: "Hata", message: "İşlem başarısız" })))
			.then(({ success, reason }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					return Promise.reject(IziToast.error({ title, message: msg || "" }));
				}
				const index = that.wallets.reduce((stt, curr, i) => (curr.game_type == game_type ? i : stt), -1);
				if (index === -1) return Promise.reject("");
				that.wallets[index][elems[1].checked ? "bonus_balance" : "balance"] -= isReceive ? Math.abs(credit) * -1 : credit;
				that.updateUserCreditUI();
				return Promise.resolve("")
			});
		swal.close();
	}
	onNoteClickHandler(uid: string, note: string) {
		this.noteTemplate
			.then(t => {
				swal.fire({
					title: `<strong>Kullanıcı: ${uid}</strong>`,
					html: t({ uid, note }),
					showCloseButton: false,
					showConfirmButton: false,
					showCancelButton: true,
					focusConfirm: false,
					cancelButtonText: 'Kapat',
				})

			})
	}
	updateNote(id: string) {
		const noteElem: HTMLInputElement | null = document.querySelector('#user-note');
		const note = noteElem?.value;
		this.updateProfile({ id } as User, { note })
			.catch(() =>
				Promise.reject(
					IziToast.error({ title: "Hata", message: "İşlem başarısız" })
				)
			)
			.then(({ success, reason }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					return Promise.reject(
						IziToast.error({ title, message: msg || "" })
					);
				}
				return IziToast.success({
					title: "Başarılı",
					message: "İşlem başarıyla gerçekleşti"
				});
			});
	}
	onUserEditClickHandler(uid: string) {
		const user = this.myChildren.filter(usr => usr.id == uid)[0];
		const admin = this.myData;
		if (!user)
			return IziToast.error({ title: "Hata", message: "Geçersiz kullanıcı idsi, Lütfen bizi arayın" });
		this.editUserTpl
			.then(t => {
				this.modalBody && (this.modalBody.innerHTML = t({ admin, user }));
				this.modal.show();
				return this.modalBody?.querySelector("#saveUserData") as | HTMLElement | undefined;
			})
			.then(el => {
				if (!el) return;
				el.onclick = () => this.updateUserInfo(user);
				const form: HTMLFormElement | null | undefined = this.modalBody?.querySelector("form");
				form?.addEventListener("keypress", (e) => {
					if (e.keyCode == 13 || e.keyCode == 10) {
						this.updateUserInfo(user);
					}
				});
			});
		return null;
	}
	updateUserInfo(user: User) {
		let userInfo: {
			email: string;
			phone: string;
			password: string;
			acc_reset_passwd: string;
		} = {} as {
			email: string;
			phone: string;
			password: string;
			acc_reset_passwd: string;
		};
		const userInfoElems = this.modalBody?.querySelectorAll(".form-control") as HTMLInputElement[] | undefined;
		if (!userInfoElems) return;
		if (userInfoElems[0]?.value) userInfo.email = userInfoElems[0].value;
		if (userInfoElems[1]?.value) userInfo.phone = userInfoElems[1].value;
		if (userInfoElems[2]?.value) userInfo.password = userInfoElems[2].value;
		if (userInfoElems[3]?.value) userInfo.acc_reset_passwd = userInfoElems[3].value;
		this.updateProfile(user, userInfo)
			.catch(() => Promise.reject(IziToast.error({ title: "Hata", message: "İşlem başarısız" })))
			.then(({ success, reason }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					return Promise.reject(
						IziToast.error({ title, message: msg || "" })
					);
				}
				this.modal.hide();
				this.myChildren.map(e => (e.id == user.id) ? Object.assign(e, userInfo) : '');
				return IziToast.success({
					title: "Başarılı",
					message: "İşlem başarıyla gerçekleşti"
				});
			});
	}
	onUserCouponHistoryClick(uid: string) {
		const user = this.myChildren.filter(usr => usr.id == uid)[0];
		const admin = this.myData;
		if (!user)
			return IziToast.error({
				title: "Hata",
				message: "Geçersiz kullanıcı idsi, Lütfen bizi arayın"
			});
		const d = new Date();
		Promise.all([this.couponHistoryTpl, this.tombalaCouponHistory(user.id, d.getUTCFullYear(), d.getUTCMonth() + 1)])
			.then(([t, data]) => {
				// this.modalBody && (this.modalBody.innerHTML = t({ admin, user, history: data.data }));
				swal.fire({
					title: "Kupon Geçmişi",
					html: t({ admin, user, history: data.data }),
					width: "100%",
					onRender: () => {
						new DataTable("#cpn-history")
					}
				})
			})
	}

	onUserDeleteClickHandler(uid: string) {
		const user = this.myChildren.filter(usr => usr.id == uid)[0];
		if (!user)
			return IziToast.error({
				title: "Hata",
				message: "Geçersiz kullanıcı idsi, Lütfen bizi arayın"
			});
		this.userDeleteTpl
			.then(t => {
				this.modalBody && (this.modalBody.innerHTML = t(user));
				this.modal.show();
				return ["doDeleteUser", "doEnableUser", "doDisableUser"].map(s =>
					this.modalBody?.querySelector("#" + s)
				) as (HTMLElement | undefined)[];
			})
			.then(([delel, enableEl, disableEl]) => {
				delel?.addEventListener("click", () => {
					this.deleteChild(user, true).then(({ success, reason }) => {
						if (!success) {
							const [title, msg] = translateError(reason as Err);
							return Promise.reject(
								IziToast.error({ title, message: msg || "" })
							);
						}
						IziToast.success({ title: "Başarılı", message: "Silindi" });
						this.myChildren = this.myChildren.filter(u => u.id != uid);
						this.updateChildrenUI();
						this.modal.hide();
						return true;
					});
				});
				enableEl?.addEventListener("click", () => {
					this.enableChild(user, true).then(({ success, reason }) => {
						if (!success) {
							const [title, msg] = translateError(reason as Err);
							return Promise.reject(
								IziToast.error({ title, message: msg || "" })
							);
						}
						IziToast.success({
							title: "Başarılı",
							message: "Engel Kaldırıldı"
						});
						this.myChildren.forEach(u => {
							u.id == uid && (u.is_disabled = false);
						});
						this.updateChildrenUI();
						this.modal.hide();
						return true;
					});
				});
				disableEl?.addEventListener("click", () => {
					this.disableChild(user, true).then(({ success, reason }) => {
						if (!success) {
							const [title, msg] = translateError(reason as Err);
							return Promise.reject(
								IziToast.error({ title, message: msg || "" })
							);
						}
						IziToast.success({ title: "Başarılı", message: "Engellendi" });
						this.myChildren.forEach(u => {
							u.id == uid && (u.is_disabled = true);
						});
						this.updateChildrenUI();
						this.modal.hide();
						return true;
					});
				});
			});
		return null;
	}
	updateUiMydata() {
		const that = this;
		const me_id_el = document.querySelector("#me_id");
		me_id_el && (me_id_el.innerHTML = that.myData?.id || "");
	}
	async getMyData(): Promise<User> {
		return this.me()
			.catch(e =>
				Promise.reject(
					IziToast.error({ title: "Hata", message: "internet sorunu" + e })
				)
			)
			.then(({ success, data, reason }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					IziToast.error({ title, message: msg || "" });
					return Promise.reject(setTimeout(() => location.pathname = 'index.html', 1000));
				}
				if (data.user_type == "user") location.pathname = "/index.html";
				return data;
			});
	}
	async getMyChildren(): Promise<User[]> {
		return this.children()
			.catch(e =>
				Promise.reject(
					IziToast.error({ title: "Hata", message: "internet sorunu" + e })
				)
			)
			.then(({ success, data, reason }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					return Promise.reject(IziToast.error({ title, message: msg || "" }));
				}
				return data;
			});
	}
}
cfg().then(
	c =>
		//@ts-ignore
		(window.ctx = new Users(c))
);
