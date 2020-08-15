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
registerHelper(handlebarsHelpers);
interface Windw extends Window {
	resetsPlace: HTMLElement;
}
const windw: Windw = window as any;

class Users extends Request {
	myData?: User;
	wallets: Wallet[] = [];
	creditTemplate = loadTpl(require("../partials/credit.hbs"));
	accTpl = loadTpl(require("../partials/resets.hbs"));
	modal: any;
	modalBody?: HTMLElement;
	cfg: Config = {} as Config;
	constructor(c: Config) {
		super(c);
		this.cfg = c;
		const that = this;
		window.addEventListener("DOMContentLoaded", () => {
			const mdlEl = document.getElementById("actionModal") || undefined;
			that.modal = new Modal(mdlEl, {});
			that.modalBody = mdlEl?.querySelector(".modal-dialog") || undefined;
			that
				.getMyData()
				.then(d => (that.myData = d))
				.then(() => that.updateUiMydata());
			that.initWallet();
			this.render_resets();
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
					return Promise.reject(setTimeout(() => location.pathname='index.html', 1000));
				}
				if (data.user_type == "user") location.pathname = "/index.html";
				return data;
			});
	}
	async render_resets() {
		Promise.all([
			this.resetAccountingList(),
			this.accTpl
		])
			.then(([d, tpl]) => {
				windw.resetsPlace.innerHTML = tpl(d)
			})
			.then(() => {
				new DataTable("#resets-table");
			});
	}
}
cfg().then(
	c =>
		//@ts-ignore
		(window.ctx = new Users(c))
);
