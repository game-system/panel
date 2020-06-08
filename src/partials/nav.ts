import toastr from "toastr";
//@ts-ignore
document.querySelector("#sidebar").insertAdjacentHTML("beforeend",require("./nav.html"))
//@ts-ignore
window.logout_a.addEventListener("click",e=>{
	e.preventDefault()
	toastr.success("Çıkış Yapılıyor","",{positionClass:"toast-top-full-width"})
	//@ts-ignore
	fetch(`${context.apiAddr}/users/logout`,{credentials:"include"})
	.then(()=>{
		setTimeout(()=>{location.pathname="index.html"},300)
	})
})

