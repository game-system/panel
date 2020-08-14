import IziToast from "izitoast";
import { default as cfg, Config } from "./config";
import "izitoast/dist/css/iziToast.min.css";
import "@coreui/icons/css/all.min.css";
import "../css/users.css";
import { Request, User, Wallet, Err } from "tombalaApi";
//@ts-ignore
import { Modal } from "@coreui/coreui";
import translateError from "./errMessagesTR";
import { loadTpl, handlebarsHelpers } from "../utils";
import { registerHelper } from "handlebars";
import { DataTable } from "simple-datatables";
import "simple-datatables/dist/style.css";
import swal, { SweetAlertOptions } from "sweetalert2"
import Socket from "./socket";
registerHelper(handlebarsHelpers);
interface Windw extends Window {
	accPlace: HTMLElement;
	sifirlabtn: HTMLElement;
}
const windw: Windw = window as any;

class Users extends Request {
	myData?: User;
	wallets: Wallet[] = [];
	creditTemplate = loadTpl(require("../partials/credit.hbs"));
	accTpl = loadTpl(require("../partials/cash_acc.hbs"));
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
				.then(d => (that.myData = d))
				.then(() => that.updateUiMydata());
			that.initWallet();
			this.render_accounting();
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
	updateUserCreditUI() {
		if (this.myData?.user_type == 'seller' || this.myData?.user_type == 'user') return;
		const el: HTMLElement | null = document.querySelector("#credits") || null;
		this.creditTemplate
			.then(t => t({ wallets: this.wallets }))
			.then(html => el && (el.innerHTML = html));
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
					Promise.reject(location.pathname='/index.html');
				}
				if (data.user_type == "user") location.pathname = "/index.html";
				return data;
			});
	}
	async render_accounting() {
		const date = new Date();
		Promise.all([
			this.getCashAccounting(date.getUTCFullYear(), date.getUTCMonth() + 1),
			this.accTpl
		])
			.then(([d, tpl]) => {
				const income =
					d.data?.since_reset.reduce((o, c) => {
						const newAmount = o + c.amount;
						return c.from === this.myData?.id && !c.is_bonus ? newAmount : o;
					}, 0) || 0;
				const expense =
					d.data?.since_reset.reduce((o, c) => {
						const newAmount = o + c.amount;
						return c.from !== this.myData?.id && !c.is_bonus ? newAmount : o;
					}, 0) || 0;
				const bonus_income =
					d.data?.since_reset.reduce((o, c) => {
						const newAmount = o + c.amount;
						return c.from === this.myData?.id && c.is_bonus ? newAmount : o;
					}, 0) || 0;
				const bonus_expense =
					d.data?.since_reset.reduce((o, c) => {
						const newAmount = o + c.amount;
						return c.from !== this.myData?.id && c.is_bonus ? newAmount : o;
					}, 0) || 0;
				return (windw.accPlace.innerHTML = tpl({
					expense,
					income,
					profit: income - expense,
					bonus_income,
					bonus_expense,
					bonus_profit: bonus_income - bonus_expense,
					uname: this.myData?.id,
					data: d
				}));
			})
			.then(() => {
				new DataTable("#accounting-table");
				windw.sifirlabtn.addEventListener("click", () => {
					const options: SweetAlertOptions = {
						title: "SIFIRLAMA PAROLASI",
						input: "password",
						showLoaderOnConfirm: true,
						confirmButtonText: "SIFIRLA",
						preConfirm: async (v) => {
							return this.resetAccounting(v)
						}
					}
					swal.fire(options).then(d => {
						const { success, reason } = d.value;
						success ? swal.fire("Başarılı", "", "success").then(() => this.render_accounting()) : swal.fire("Hata", translateError(reason).filter(d => d).join(","), "error")
					})
				});
			});
	}
}
cfg().then(
	c =>
		//@ts-ignore
		(window.ctx = new Users(c))
);
