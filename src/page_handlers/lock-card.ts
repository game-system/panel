import IziToast from "izitoast";
import { default as cfg, Config } from "../config";
import 'izitoast/dist/css/iziToast.min.css';
import "@coreui/icons/css/all.min.css";
import Handlebars from "handlebars"
import { Request, User, TableGroup, } from "tombalaApi";
//@ts-ignore
import { Modal } from "@coreui/coreui"

interface BreadCrumb {
	id: number,
	funcName: string,
	name: string
}

Handlebars.registerHelper('lockCard', function (numLockCards: number[], numCards: number, opt) {
	for (let i = 0; i < numLockCards.length; i++) {
		if (numLockCards[i] == numCards) {
			//@ts-ignore
			return opt.fn(this);
		}
	}
	//@ts-ignore
	return opt.inverse(this);
})

class Users extends Request {
	myData?: User;
	lockCardData: number[] = [];
	breadCrumbs: BreadCrumb[] = [];
	tableGroups: TableGroup[] = [];
	cardTemplate = fetch(require("../partials/card.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this));
	tgforLockTemplate = fetch(require("../partials/tablegroupforlock.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this));
	breadCrumbTemplate = fetch(require("../partials/breadcrumb.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this));
	modal: any;
	con: HTMLElement | null = null;
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
			that.con = document.querySelector('#con');
			that.getMyData()
				.then(d => {
					if (d.user_type != 'seller') Promise.reject(location.pathname = '/users.html');
					return Promise.resolve(that.myData = d)
				})
				.then(() => that.updateUiMydata());

			that.getMyTableGroups().then(a => that.updateTGUI())
			that.updateBreadCrumbUI()
		})
	}
	updateCardData(id: number) {
		const that = this;
		that.getLockedCards(id)
			.catch(er => Promise.reject(IziToast.error({ title: 'Hata', message: er })))
			//@ts-ignore
			.then(({ success, reason, data }) => {
				if (!success)
					return Promise.reject(IziToast.error({ title: 'Hata', message: reason }))
				console.log(data);
				that.lockCardData = data;
				that.breadCrumbs.push({ id, funcName: 'ctx.updateTGUI()', name: 'Masalar' });
				that.updateBreadCrumbUI();
				return that.updateCardUI(id);
			})
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
		that.getGameCards(1)
			.catch(e => Promise.reject(IziToast.error({ title: 'İnternet Hatası', message: e })))
			.then(({ success, reason, data }) => {
				if (!success) Promise.reject(IziToast.error({ title: 'Hata', message: reason }))
				console.log(data);
				return Promise.all([that.cardTemplate, data]);
			})
			.then(([t, data]) => t({ tgID, numLockCards: that.lockCardData, Cards: data }))
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
				if (!success)
					return Promise.reject(IziToast.error({ title: 'Hata', message: reason }))
				that.lockCardData.push(cardID);
				that.updateCardUI(tgID);
				return IziToast.success({ title: 'Başarılı', message: 'İşlem başarıyla gerçekleşti' });
			})
	}
	onUnlockCard(tgID: number, cardID: number) {
		const that = this;
		this.unLockCard(tgID, cardID)
			.catch(er => IziToast.error({ title: 'Hata', message: er }))
			//@ts-ignore
			.then(({ success, reason, data }) => {
				if (!success)
					return Promise.reject(IziToast.error({ title: 'Hata', message: reason }))
				delete that.lockCardData[that.lockCardData.indexOf(cardID)];
				that.updateCardUI(tgID);
				return IziToast.success({ title: 'Başarılı', message: 'İşlem başarıyla gerçekleşti' });
			})
	}
	async getMyTableGroups(): Promise<TableGroup[]> {
		return this.getGameData(1)
			.catch(e => Promise.reject(IziToast.error({ title: 'Hata', message: e })))
			.then(({ success, data, reason }) => {
				if (!success)
					return Promise.reject(IziToast.error({ title: 'Hata', message: reason }))
				return this.tableGroups = data.table_groups;
			})
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
}
cfg().then(c =>
	//@ts-ignore
	window.ctx = new Users(c)
)
