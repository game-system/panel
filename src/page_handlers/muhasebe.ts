import IziToast from "izitoast";
import { default as cfg, Config } from "./config";
import "izitoast/dist/css/iziToast.min.css";
import "@coreui/icons/css/all.min.css";
import "../css/users.css";
import { Request, User, Wallet, Err, CashAcc } from "tombalaApi";
//@ts-ignore
import { Modal } from "@coreui/coreui";
import TranslateError from "./errMessagesTR";
import { loadTpl } from "../utils";
import { registerHelper } from "handlebars";
function numFmt(n: number) {
	return n < 10 ? "0" + n : "" + n
}
registerHelper("timefmt", function(val: number) {
	const d = new Date(val * 1000)
	const month = d.getMonth() + 1
	const day = d.getDay() + 1
	return `${d.getFullYear()}/${numFmt(month)}/${numFmt(day)} ${numFmt(d.getHours())}:${numFmt(d.getMinutes())}`
});
registerHelper("with_ctx", function(myUid: string, render: any) {
	//@ts-ignore
	let o: CashAcc = this
	return render.fn(o.from !== myUid ? { credit: o.from_new_credit, uid: o.from, ctx: o } : { credit: o.to_new_credit, uid: o.to, ctx: o })
})
interface Windw extends Window {
	accPlace: HTMLElement
}
const windw: Windw = window as any;

class Users extends Request {
	myData?: User;
	wallets: Wallet[] = [];
	creditTemplate = loadTpl(require("../partials/credit.hbs"))
	accTpl = loadTpl(require("../partials/cash_acc.hbs"))
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
				.then(() => that.updateUiMydata())
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
					const [title, msg] = TranslateError(reason as Err);
					return Promise.reject(IziToast.error({ title, message: msg || "" }));
				}
				if (data.user_type == "user") location.pathname = "/index.html";
				return data;
			});
	}
	async render_accounting() {
		const date = new Date()
		Promise.all([this.getCashAccounting(date.getUTCFullYear(), date.getUTCMonth() + 1), this.accTpl])
			.then(([d, tpl]) => windw.accPlace.innerHTML = tpl({ uname: this.myData?.id, data: d }))
	}
}
cfg().then(
	c =>
		//@ts-ignore
		(window.ctx = new Users(c))
);
