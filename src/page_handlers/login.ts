import swal from "sweetalert2";
import cfg from "./config"
import { Config, Request } from "tombalaApi";
export default class Login extends Request {
	private loginEl = document.querySelector("#username") as HTMLInputElement;
	private passwordEl = document.querySelector("#password") as HTMLInputElement;
	private form = document.querySelector("#form") as HTMLFormElement;
	private uname: string = this.loginEl.value;
	private password: string = this.passwordEl.value;
	constructor(c: Config) {
		super(c)
		const that = this;
		this.listenInputChanges()
		this.form.onsubmit = function (e) {
			e.preventDefault();
			that.loginUser()
		}
	}
	private listenInputChanges() {
		const that = this;
		this.loginEl.addEventListener("change", () => that.uname = that.loginEl.value)
		this.passwordEl.addEventListener("change", () => that.password = that.passwordEl.value)
	}
	private loginUser() {
		this.login(this.uname, this.password)
			.catch(e => Promise.reject(swal.fire("Error", e.toString(), "error")))
			.then(({ success, reason }) => {
				console.log(reason)
				if (!success) {
					swal.fire("Hata", reason, "error")
				} else {
					this.me()
						.catch(e => Promise.reject(swal.fire('Error', e, 'error')))
						.then(({ success, data, reason }) => {
							if (!success) return swal.fire('İnternet Hatası', reason, 'error');
							if (data.user_type == 'user') {
								return swal.fire('Giriş Başarısız', 'Bu sayfaya giriş yetkiniz yok', 'info');
							}
							sessionStorage.setItem('user_type', data.user_type + '');
							swal.fire("Giriş Başarılı", "", "success")
							setTimeout(() => { location.pathname = "users.html" }, 1000)
						})
				}
			})
	}

}

cfg().then(c =>
	(window as any).context = new Login(c)
)
