import IziToast from "izitoast";
import { default as cfg, Config } from "../config";
import '../../node_modules/izitoast/dist/css/izitoast.css';
import "@coreui/icons/css/all.min.css";
import Handlebars from "handlebars"
import { Request, User } from "tombalaApi";
//@ts-ignore
import { Modal } from "@coreui/coreui"
import { DH_UNABLE_TO_CHECK_GENERATOR } from "constants";

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
	cardTemplate = fetch(require("../partials/card.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this));
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
			that.updateCardData();
		})
	}
	updateCardData() {
		const that = this;
		that.getCardData(1)
			.catch(er => Promise.reject(IziToast.error({ title: 'Hata', message: er })))
			.then(({ success, reason, data }) => {
				if (!success)
					return Promise.reject(IziToast.error({ title: 'Hata', message: reason }))
				that.lockCardData = data;
				return that.updateCardUI();
			})

	}
	updateCardUI() {
		const that = this;
		const cardCon = document.querySelector('#card-con');
		this.cardTemplate
			.then((t) => t({ numLockCards: that.lockCardData, numCards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] }))
			.then(tpl => cardCon && (cardCon.innerHTML = tpl));
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
			.then(({ success, reason, data }) => {
				if (!success)
					return Promise.reject(IziToast.error({ title: 'Hata', message: reason }))
				that.lockCardData.push(cardID);
				that.updateCardUI();
				return IziToast.success({ title: 'Başarılı', message: 'İşlem başarıyla gerçekleşti' });
			})
	}
	onUnlockCard(tgID: number, cardID: number) {
		const that = this;
		this.unLockCard(tgID, cardID)
			.catch(er => IziToast.error({ title: 'Hata', message: er }))
			.then(({ success, reason, data }) => {
				if (!success)
					return Promise.reject(IziToast.error({ title: 'Hata', message: reason }))
				delete that.lockCardData[that.lockCardData.indexOf(cardID)];
				that.updateCardUI();
				return IziToast.success({ title: 'Başarılı', message: 'İşlem başarıyla gerçekleşti' });
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

