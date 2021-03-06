import IziToast from "izitoast";
import { default as cfg, Config } from "./config";
import 'izitoast/dist/css/iziToast.min.css';
import "@coreui/icons/css/all.min.css";
import Handlebars from "handlebars"
import { Request, User, TableGroup, Wallet, Err, GameDetails } from "tombalaApi";
//@ts-ignore
import { Modal } from "@coreui/coreui"
import translateError from "./errMessagesTR";
import { loadTpl, handlebarsHelpers } from "../utils";
import Socket from './socket';

interface BreadCrumb {
	id: number,
	funcName: string,
	name: string
}

Handlebars.registerHelper(handlebarsHelpers)

class Users extends Request {
	gameDetails: GameDetails[] = [];
	myData?: User;
	wallets: Wallet[] = [];
	lockCardData: number[] = [];
	breadCrumbs: BreadCrumb[] = [];
	tableGroups: TableGroup[] = [];
	creditTemplate = loadTpl(require("../partials/credit.hbs"))
	cardTemplate = loadTpl(require("../partials/card.hbs"))
	tgforLockTemplate = loadTpl(require("../partials/tablegroupforlock.hbs"))
	breadCrumbTemplate = loadTpl(require("../partials/breadcrumb.hbs"))
	gameIdSelectorTpl = loadTpl(require("../partials/gameid_selector.hbs"))
	modal: any;
	con: HTMLElement | null = null;
	modalBody?: HTMLElement;
	cfg: Config = {} as Config;
	selectedGameId?: number;
	constructor(c: Config) {
		super(c)
		this.cfg = c;
		const that = this
		const socket = new Socket(c);
		window.addEventListener("DOMContentLoaded", () => {
			const mdlEl = document.getElementById("actionModal") || undefined;
			that.modal = new Modal(mdlEl, {})
			that.modalBody = mdlEl?.querySelector(".modal-dialog") || undefined;
			that.con = document.querySelector('#con');
			that.getMyData()
				.then(d => {
					if (d.user_type != 'seller') Promise.reject(location.pathname = '/users.html');
					return Promise.resolve(that.myData = d)
				})
				.then(() => that.updateUiMydata());

			that.updateBreadCrumbUI();
			that.initWallet();
		})
	}
	loadGameIdSelector() {
		this.gameIdSelectorTpl.then(tpl => {
			const holder: HTMLElement = (window as any).gameIdSelectorHolder;
			holder.innerHTML = tpl({ gameDetails: this.gameDetails })
			this.selectedGameId = this.gameDetails[0].id;
			if (this.selectedGameId) {
				this.getMyTableGroups()
					.then(() => this.updateTGUI());
			}
			holder.querySelector("select")?.addEventListener("change", e => {
				this.selectedGameId = parseInt((e.target as HTMLSelectElement)?.value)
				if (this.selectedGameId) {
					this
						.getMyTableGroups()
						.then(() => this.updateTGUI());
				}
			})
		})
	}
	initWallet() {
		const that = this;
		Promise.all(this.cfg.gameIds.map(that.getGameData.bind(this)))
			.catch(e =>Promise.reject(IziToast.error({ title: "Hata", message: e + "" })))
			.then(data => {
				if (data[0].success) {
					that.wallets.push(data[0].data.wallet);
					this.loadGameIdSelector();
					data.forEach(d =>this.gameDetails.push(d.data.game_details));
				}
				that.updateUserCreditUI();
			});
	}
	updateCardData(id: number) {
		const that = this;
		that.getLockedCards(id)
			.catch(er => Promise.reject(IziToast.error({ title: 'Hata', message: er })))
			//@ts-ignore
			.then(({ success, reason, data }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					return Promise.reject(IziToast.error({ title, message: msg || '' }));
				}
				that.lockCardData = data;
				that.breadCrumbs.push({ id, funcName: 'ctx.updateTGUI()', name: 'Masalar' });
				that.updateBreadCrumbUI();
				return that.updateCardUI(id);
			})
	}
	updateLockCardPieceUI() {
		const el: HTMLElement | null = document.querySelector('#lock-card-piece') || null;
		el && (el.innerHTML = this.lockCardData.length + '');
		console.log(this.lockCardData.length, this.lockCardData);
	}
	updateUserCreditUI() {
		if (this.myData?.user_type == 'seller' || this.myData?.user_type == 'user') return;
		const el: HTMLElement | null = document.querySelector('#credits') || null;
		this.creditTemplate
			.then(t => t({ wallets: this.wallets }))
			.then(html => el && (el.innerHTML = html))
	}
	updateTGUI() {
		const that = this;
		that.breadCrumbs = [];//GEÇİCİ ÇÖZÜM
		that.updateBreadCrumbUI();
		this.tgforLockTemplate
			.then(t => t({ tableGroups: this.tableGroups }))
			.then(tpl => that.con && (that.con.innerHTML = tpl));
	}
	updateBreadCrumbUI() {
		const bcCon = document.querySelector('#breadcrumb-con')
		this.breadCrumbTemplate
			.then(t => t({ bcElems: this.breadCrumbs }))
			.then(tpl => bcCon && (bcCon.innerHTML = tpl));
	}
	updateCardUI(tgID: number) {
		const that = this;
		that.getGameCards(this.selectedGameId || 1)
			.catch(e => Promise.reject(IziToast.error({ title: 'İnternet Hatası', message: e })))
			.then(({ success, reason, data }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					return Promise.reject(IziToast.error({ title, message: msg || '' }));
				}
				return Promise.all([that.cardTemplate, data]);
			})
			.then(([t, data]) => t({ tgID, numLockCards: that.lockCardData, Cards: data, lockCardPiece: that.lockCardData.length }))
			.then(tpl => that.con && (that.con.innerHTML = tpl));
	}
	updateUiMydata() {
		const that = this;
		const me_id_el = document.querySelector("#me_id");
		me_id_el && (me_id_el.innerHTML = that.myData?.id || "")
	}
	onLockCard(tgID: number, cardID: number) {
		const that = this;
		this.lockCard(tgID, cardID)
			.catch(er => IziToast.error({ title: 'Hata', message: er }))
			//@ts-ignore
			.then(({ success, reason, data }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					return Promise.reject(IziToast.error({ title, message: msg || '' }));
				}
				that.lockCardData.push(cardID);
				that.updateCardUI(tgID);
				that.updateLockCardPieceUI();
				return IziToast.success({ title: 'Başarılı', timeout: 1000, });
			})
	}
	onUnlockCard(tgID: number, cardID: number) {
		const that = this;
		this.unLockCard(tgID, cardID)
			.catch(er => IziToast.error({ title: 'Hata', message: er }))
			//@ts-ignore
			.then(({ success, reason, data }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					return Promise.reject(IziToast.error({ title, message: msg || '' }));
				}
				that.lockCardData.splice(that.lockCardData.indexOf(cardID), 1);
				that.updateCardUI(tgID);
				that.updateLockCardPieceUI();
				return IziToast.success({ title: 'Başarılı', timeout: 1000, });
			})
	}
	async getMyTableGroups(): Promise<TableGroup[]> {
		return this.getGameData(this.selectedGameId || 1)
			.catch(e => Promise.reject(IziToast.error({ title: 'Hata', message: e })))
			.then(({ success, data, reason }) => {
				if (!success) {
					const [title, msg] = translateError(reason as Err);
					return Promise.reject(IziToast.error({ title, message: msg || '' }));
				}
				return this.tableGroups = data.table_groups;
			})
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
}
cfg().then(c =>
	//@ts-ignore
	window.ctx = new Users(c)
)
