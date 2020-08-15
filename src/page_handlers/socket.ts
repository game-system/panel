import { default as cfg, Config } from "./config";
import { Request, Err } from "tombalaApi";



export default class Socket extends Request {

  ws: WebSocket;
  cfg: Config = {} as Config;
  constructor(c: Config) {
    super(c);
    this.cfg = c;
    this.ws = new WebSocket(`${this.cfg.webSocket}/${sessionStorage.getItem('sock_token')}`);
    this.socketEventHandler();
  }
  private socketEventHandler() {
    this.ws.onmessage = ({ data }) => {
      const sep = data.indexOf(',');
      const event = data.slice(0, sep);
      const dt = data.slice(sep + 1);
      if (event == 'close' && dt == 'another login') {
        this.logout().catch(() => location.pathname = 'index.html').then(() => location.pathname = 'index.html');
      }
    }
  }
}



