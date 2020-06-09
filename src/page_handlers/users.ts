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
	modal: any;
	modalBody?: HTMLElement;
	constructor(c: Config) {
		super(c)
		const that = this
		window.addEventListener("DOMContentLoaded", () => {
			const mdlEl= document.getElementById("actionModal") || undefined
			that.modal = new Modal(mdlEl, {})
			that.modalBody=mdlEl?.querySelector(".modal-dialog")||undefined;
			that.getMyData()
				.then(d => that.myData = d)
				.then(() => that.updateUiMydata())
				.then(that.getMyChildren.bind(that))
				.then(children => that.myChildren = children.map(c => {
					c.date_str = new Date(c.created_at * 1000).toISOString().split("T")[0];
					return c
				}))
				.then(that.updateChildrenData.bind(that))
			that.addNewUserUi()
		})
	}
	addNewUserUi() {
		const that = this;
		const btn = document.getElementById("new_user_btn");
		function handleSubmit(el: HTMLFormElement | null|undefined) {
			return (e: Event) => {
				e.preventDefault();
				const id= (el?.querySelector("input[type='text']") as HTMLInputElement|null);
				const pass = (el?.querySelector("input[type='password']") as HTMLInputElement|null);
				if(!id?.value) return id?.focus()
				if(!pass?.value) return pass?.focus()
				that.addChild({id:id?.value||"",password:pass?.value||""} as User)
				.then(({data,reason,success})=>{
					if(!success)
						return Promise.reject(toastr.error("Hata",reason))
					data.date_str=new Date(data.created_at*1000).toISOString().split("T")[0];
					that.myChildren.unshift(data)
					that.updateChildrenData()
					return true
				}).then(()=>{
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
	updateChildrenData() {
		const that = this;
		const el = document.querySelector("#users_table")
		that.usersTemplate.then(t => {
			return t(that.myChildren)
		}).then(tpl => {
			el && (el.innerHTML = tpl)
			that.modalBody&&new UsersTableButtonActivities(that.myChildren,that.modalBody,that.modal)
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
	async addChildPopUp() { }
}
cfg().then(c =>
	//@ts-ignore
	window.context = new Users(c)
)

class UsersTableButtonActivities{
	deleters:HTMLElement[] = [].slice.call(document.querySelectorAll(".sil_btn"));
	editers:HTMLElement[] = [].slice.call(document.querySelectorAll(".editle_btn"));
	money_opers:HTMLElement[] = [].slice.call(document.querySelectorAll(".para_at_btn"));
	users:User[]=[]
	tpl=fetch(require("../partials/deleteUser.hbs")).then(d=>d.text()).then(Handlebars.compile.bind(this))
	constructor(u:User[],modalEl:HTMLElement,modal:any){
		this.users=u
		this.editers.forEach(e=>{
			e.addEventListener("click",()=>{
				console.log(`editing ${e.dataset.user}`)
			})
		})
		this.money_opers.forEach(e=>{
			e.addEventListener("click",()=>{
				console.log(`money ${e.dataset.user}`)
			})
		})
		this.deleters.forEach(e=>{
			e.addEventListener("click",()=>{
				const user = u.filter(usr=>usr.id==e.dataset.user)[0];
				if (!user)return toastr.error("Hata","Geçersiz kullanıcı idsi, Lütfen bizi arayın")
					this.tpl.then((t)=>{
						modalEl.innerHTML=t(user)
						modal.show()
					})
			return null
			})
		})
	}
}
