//import toastr from "toastr";
import { default as cfg, Config } from "../config";
import "../../node_modules/toastr/build/toastr.min.css";
import "@coreui/icons/css/all.min.css";
import '../css/tables.css';
import Handlebars from "handlebars";
import { Request, User, TableGroup, Table } from "tombalaApi";
//@ts-ignore
import { Modal } from "@coreui/coreui";

class TableGroupsAndTables extends Request {
  myData?: User;
  myTableGroups: TableGroup[] = [];
  tableGroupsAndTablesTemplate = fetch(require("../partials/tableGroupsAndTables.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this));
  tableTemplate = fetch(require("../partials/addTable.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this));
  editTableGroupTemplate = fetch(require("../partials/editTableGroup.hbs")).then(d => d.text()).then(Handlebars.compile.bind(this));
  delTableGroupTemplate = fetch(require('../partials/deleteTableGroup.hbs')).then(d => d.text()).then(Handlebars.compile.bind(this));
  editTableTemplate = fetch(require('../partials/edittable.hbs')).then(d => d.text()).then(Handlebars.compile.bind(this));
  delTableTemplate = fetch(require('../partials/deleteTable.hbs')).then(d => d.text()).then(Handlebars.compile.bind(this));
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
        .then(() => that.updateUiMydata());
      that.getMyTableGroups()
        .then(d => that.myTableGroups = d)
        .then(() => that.updateTableGroupUI());
      that.addNewTableGroupUi();

    })
  }
  addNewTableGroupUi() {
    const that = this;
    const btn = document.getElementById("new_table_group_btn");
    function handleSubmit(el: HTMLFormElement | null | undefined) {
      return (e: Event) => {
        e.preventDefault();
        const tableGroupName = (el?.querySelector("input[type='text']") as HTMLInputElement | null);
        const checkbox = (el?.querySelector("input[type='checkbox']") as HTMLInputElement | null);
        if (!tableGroupName?.value) return tableGroupName?.focus()
        if (!checkbox) return
        let _data: TableGroup = {
          id: -1,
          game_id: 1,
          name: tableGroupName.value,
          group_type: "SameCardSameRoomMultiBuy",
          is_bonus: checkbox.checked,
          seller_id: '_seller1',
          tables: [] as Table[]
        }
        that.addTableGroup(_data.game_id, _data.name + '', 0, _data.is_bonus)
          .catch(er => Promise.reject(toastr.error(er, 'HATA')))
          .then(({ data, reason, success }) => {
            if (!success)
              return Promise.reject(toastr.error(reason || '', 'HATA'));
            _data.id = data;
            that.myTableGroups.unshift(_data);
            that.updateTableGroupUI();
            return true
          })
      }
    }
    btn?.addEventListener("click", () => {
      fetch(require("../partials/addTableGroup.hbs"))
        .then(d => d.text())
        .then(d => {
          that.modalBody && (that.modalBody.innerHTML = d)
          const form = that.modalBody?.querySelector("form")
          that.modalBody?.querySelector("#submitNewTableGroup")?.addEventListener("click", handleSubmit(form))
          form?.addEventListener("submit", handleSubmit(form))
          that.modal.toggle()
        })
    })
  }
  onTableAddClickHandler(id: number) {
    const that = this;
    const tableGroup = this.myTableGroups.filter(tg => tg.id == id)[0];
    if (!tableGroup) return toastr.error('Böyle bir Masa Grubu bulunamadı', 'HATA');
    that.tableTemplate.then(t => {
      that.modalBody && (that.modalBody.innerHTML = t(tableGroup));
      this.modal.show();
      that.modalBody?.querySelector('#submitNewAddTable')?.addEventListener('click', () => {
        const formInputElems: HTMLInputElement[] = [].slice.call(that.modalBody?.querySelector("form")?.querySelectorAll('input'))
        //@ts-ignore
        let t: Table = {
          id: -1,
          group_id: id,
          name: formInputElems[0].value,
          price: parseInt(formInputElems[1].value),
          c1: parseInt(formInputElems[2].value),
          c2: parseInt(formInputElems[3].value),
          t: parseInt(formInputElems[4].value),
          tulum: parseInt(formInputElems[5].value),
        }
        that.addTable(t.group_id, t.name, t.price, t.c1, t.c2, t.t, t.tulum)
          .catch(er => Promise.reject(toastr.error(er, 'HATA')))
          .then(({ data, reason, success }) => {
            if (!success)
              return Promise.reject(toastr.error(reason || '', 'HATA'));
            t.id = data;
            tableGroup.tables.push(t);
            that.updateTableGroupUI();
            return
          })
      })
    })
  }
  onTableGroupEditClickHandler(id: number) {
    const that = this;
    const tableGroup = this.myTableGroups.filter(tg => tg.id == id)[0];
    that.editTableGroupTemplate.then(t => {
      that.modalBody && (that.modalBody.innerHTML = t(tableGroup));
      this.modal.show();
      this.modalBody?.querySelector('#saveTableGroupData')?.addEventListener('click', () => {
        const name = (that.modalBody?.querySelector('input[type="text"]') as HTMLInputElement).value;
        tableGroup.name = name;
        that.updateTableGroupUI();
      })
    })
  }
  onTableGroupDeleteClickHandler(id: number) {
    const that = this;
    const tableGroup = this.myTableGroups.filter(tg => tg.id == id)[0];
    that.delTableGroupTemplate.then(t => {
      that.modalBody && (that.modalBody.innerHTML = t(tableGroup));
      this.modal.show();
      this.modalBody?.querySelector('#doDeleteTableGroup')?.addEventListener('click', () => {
        that.deleteTableGroup(id)
          .catch(er => Promise.reject(toastr.error(er, 'HATA')))
          .then(({ data, reason, success }) => {
            if (!success)
              return Promise.reject(toastr.error(reason || '', 'HATA'));
            that.updateTableGroupUI();
            return
          })
      })
    })
  }
  onTableEditClickHandler(tableGroupID: number, id: number) {
    const that = this;
    const _table = this.myTableGroups.filter(tg => tg.id == tableGroupID)[0].tables.filter(t => t.id == id)[0];
    that.editTableTemplate.then(t => {
      that.modalBody && (that.modalBody.innerHTML = t(_table));
      this.modal.show();
      this.modalBody?.querySelector('#saveTableGroupData')?.addEventListener('click', () => {

        const formInputElems: HTMLInputElement[] = [].slice.call(that.modalBody?.querySelector("form")?.querySelectorAll('input'));
        let table: Table = {} as Table;
        table.id = id;
        table.group_id = tableGroupID;
        if (formInputElems[0].value) table.name = formInputElems[0].value;
        if (formInputElems[1].value) table.price = parseInt(formInputElems[1].value);
        if (formInputElems[2].value) table.c1 = parseInt(formInputElems[2].value);
        if (formInputElems[3].value) table.c2 = parseInt(formInputElems[3].value);
        if (formInputElems[4].value) table.t = parseInt(formInputElems[4].value);
        if (formInputElems[5].value) table.tulum = parseInt(formInputElems[5].value);
        that.updateTable(id, table)
          .catch(er => Promise.reject(toastr.error(er, 'HATA')))
          .then(({ data, reason, success }) => {
            if (!success)
              return Promise.reject(toastr.error(reason || '', 'HATA'));

            that.updateTableGroupUI();
            return
          })
      })
    })
  }
  onTableDeleteClickHandler(tableGroupID: number, id: number) {
    const that = this;
    const table = this.myTableGroups.filter(tg => tg.id == tableGroupID)[0].tables.filter(t => t.id == id)[0];
    that.delTableTemplate.then(t => {
      that.modalBody && (that.modalBody.innerHTML = t(table));
      this.modal.show();
      this.modalBody?.querySelector('#doDeleteTable')?.addEventListener('click', () => {
        that.deleteTable(id)
          .catch(er => Promise.reject(toastr.error(er, 'HATA')))
          .then(({ data, reason, success }) => {
            if (!success)
              return Promise.reject(toastr.error(reason || '', 'HATA'));
            that.myTableGroups.forEach((tg, index) => {
              if (tg.id == tableGroupID) {
                tg.tables.forEach((t, i) => {
                  if (t.id == id) that.myTableGroups[index].tables.splice(i, 1);
                })
              }

            })
            that.updateTableGroupUI();
            return
          })
      })
    })
  }
  updateTableGroupUI() {
    const that = this;
    const el = document.querySelector("#accordion-table-groups-and-tables")
    that.tableGroupsAndTablesTemplate.then(t => {
      return t({
        tableGroups: that.myTableGroups,
      })
    }).then(tpl => {
      el && (el.innerHTML = tpl)
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
        if (data.user_type == 'user')
          location.pathname = '/index.html';
        return data;
      })
  }
  async getMyTableGroups(): Promise<TableGroup[]> {
    return this.getGameData(1)
      .catch(e => Promise.reject(toastr.error('internet sorunu', e)))
      .then(({ success, data, reason }) => {
        if (!success)
          return Promise.reject(toastr.error(reason + '', 'HATA'))
        return data.table_groups;
      })
  }
}

cfg().then(c =>
  //@ts-ignore
  window.ctx = new TableGroupsAndTables(c)
)

