import swal from "sweetalert2"
import Config from "../config";
export default class Login extends Config {
	private loginEl = document.querySelector("#username") as HTMLInputElement;
	private passwordEl = document.querySelector("#password") as HTMLInputElement;
	private form = document.querySelector("#form") as HTMLFormElement;
	private uname: String = this.loginEl.value;
	private password: String = this.passwordEl.value;
	constructor() {
		super()
		const that = this;
		this.listenInputChanges()
		this.form.onsubmit = function(e) {
			e.preventDefault();
			that.login()
		}
	}
	private listenInputChanges() {
		const that = this;
		this.loginEl.addEventListener("change", () => that.uname = that.loginEl.value)
		this.passwordEl.addEventListener("change", () => that.password = that.passwordEl.value)
	}
	private login() {
		const that = this;
		fetch(`${that.apiAddr}/users/login`, {
			headers:{
				"content-type":"application/x-www-form-urlencoded"
			},
			method: "POST", credentials: "include"
			, body: `id=${that.uname}&password=${that.password}`
		})
		.catch(e=>Promise.reject(swal.fire("Error",e,"error")))
		.then(d => d.json())
		.then(({success,reason})=>{
			if (!success){
				swal.fire("Hata",reason,"error")
			}else{
				swal.fire("Giriş Başarılı","","success")
				setTimeout(()=>{location.pathname="users.html" },1000)
		}})
	}

}
(window as any).context = new Login();
