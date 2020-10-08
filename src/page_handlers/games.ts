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
  listGamesHbs = loadTpl(require("../partials/listGames.hbs"));
  cfg: Config = {} as Config;
  myData?: User;
  games:{name:string,id:number,open:boolean}[]=[{name:'tombala',id:1,open:false},{name:'slot',id:2,open: true}];
  constructor(c: Config) {
    super(c);
    this.cfg = c;
    this.getMyData()
      .then(d => {
        if (d.user_type != 'seller') Promise.reject(location.pathname = '/users.html');
        return Promise.resolve(this.myData = d)
      })
      .then(() => this.updateUiMydata());
    this.listGames();
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
