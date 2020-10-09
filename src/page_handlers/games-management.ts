//@ts-ignore
import { Modal } from "@coreui/coreui";
import "@coreui/icons/css/all.min.css";
import { registerHelper } from "handlebars";
import IziToast from "izitoast";
import "izitoast/dist/css/iziToast.css";
import { Err, Request, Table, TableGroup, User, Wallet, GameDetails } from "tombalaApi";
import { loadTpl, handlebarsHelpers } from "../utils";
import { Config, default as cfg } from "./config";
import translateError from "./errMessagesTR";
import Socket from "./socket";
registerHelper(handlebarsHelpers);

class Games extends Request{
  listGamesHbs = loadTpl(require("../partials/list-games-management.hbs"));
  editGameHbs = loadTpl(require("../partials/editGame.hbs"));
  deleteGameHbs = loadTpl(require("../partials/deleteGame.hbs"));
  cfg: Config = {} as Config;
  myData?: User;
  modal:any;
  modalBody?: HTMLElement;
  games:{name:string,id:number,time:number,open:boolean}[]=[{name:'tombala 135',id:1,time:45,open:false},
    {name:'slot',id:2,time:30,open: true}];
  constructor(c: Config) {
    super(c);
    this.cfg = c;
    this.getMyData()
      .then(d => {
        return Promise.resolve(this.myData = d)
      })
      .then(() => this.updateUiMydata());
    window.addEventListener('load',()=>{
      this.listGames();
      const mdlEl = document.getElementById("actionModal") || undefined;
      this.modal = new Modal(mdlEl, {});
      this.modalBody = mdlEl?.querySelector(".modal-dialog") || undefined;
    })
  }
  onGameEditClickHandler(id:number) {
  const game=this.games.find(e=>e.id==id);
    this.editGameHbs
      .then(t => {
        this.modalBody && (this.modalBody.innerHTML = t({  game }));
        this.modal.show();
        return this.modalBody?.querySelector("#saveUserData") as | HTMLElement | undefined;
      })
      .then(el => {
        if (!el) return;
      //  el.onclick = () => this.updateUserInfo(user);
        const form: HTMLFormElement | null | undefined = this.modalBody?.querySelector("form");
        form?.addEventListener("keypress", (e) => {
          if (e.keyCode == 13 || e.keyCode == 10) {
            //this.updateUserInfo(user);
          }
        });
      });
    return null;
  }
  onUserDeleteClickHandler(id: number) {
    const game=this.games.find(e=>e.id==id);
    this.deleteGameHbs
      .then(t => {
        this.modalBody && (this.modalBody.innerHTML = t(game));
        this.modal.show();
          const delel=this.modalBody?.querySelector("#doDeleteGame") as (HTMLElement | undefined);
        delel?.addEventListener("click", () => {
          IziToast.success(({title:'Başarılı',message:'Oldu bu iş'}));
          this.modal.hide();
          /*this.deleteChild(user, true).then(({ success, reason }) => {
            if (!success) {
              const [title, msg] = translateError(reason as Err);
              return Promise.reject(
                IziToast.error({ title, message: msg || "" })
              );
            }
            IziToast.success({ title: "Başarılı", message: "Silindi" });
            //his.myChildren = this.myChildren.filter(u => u.id != uid);
            //this.updateChildrenUI();
            this.modal.hide();
            return true;
          });*/
        });
      });
    return null;
  }
  private listGames(){
    const games=this.games;
    const el = document.querySelector("#games") || null;
    this.listGamesHbs.then(function (t) {
      return t({games});
    }).then(html=>  el && (el.innerHTML = html));
  }
  private async getMyData(): Promise<User> {
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
  updateGameopenClose(gameId:number,v:boolean){
    this.games.forEach(e=>{
      if(e.id==gameId) e.open=v;
    })
    this.listGames();
  }
  updateUiMydata() {
    const that = this;
    const me_id_el = document.querySelector("#me_id");
    me_id_el && (me_id_el.innerHTML = that.myData?.id || "")
  }
}

cfg().then(
  c =>
    //@ts-ignore
    (window.ctx = new Games(c))
);
