import Handlebars from "handlebars"

const navBarTemplate = fetch(require("../partials/nav.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this));

const userType = sessionStorage.getItem('user_type');
//@ts-ignore
navBarTemplate.then(t => t({ seller: userType == 'seller' ? true : false })).then(html => {
	document.querySelector("#sidebar")?.insertAdjacentHTML("beforeend", html);
	document.querySelector('#sidebar')?.classList.add('text-uppercase');
})
//@ts-ignore
window.logout_a?.addEventListener("click", e => {
	e.preventDefault()
	toastr.success("Çıkış Yapılıyor", "", { positionClass: "toast-top-full-width" })
	//@ts-ignore
	fetch(`${ctx.apiAddr}/users/logout`, { credentials: "include" })
	setTimeout(() => { location.pathname = "index.html" }, 300)
})

