import { compile } from "handlebars";
import { CashAcc, CouponHistory } from "tombalaApi";
export async function loadTpl(
	addr: string
): Promise<HandlebarsTemplateDelegate<any>> {
	const d = await fetch(addr);
	const t = await d.text();
	return compile(t);
}
export const handlebarsHelpers = {
	with_ctx: function(myUid: string, render: any) {
		//@ts-ignore
		let o: CashAcc = this;
		return render.fn(
			o.from !== myUid
				? { credit: o.from_new_credit, uid: o.from, ctx: o, cls: "bg-danger" }
				: { credit: o.to_new_credit, uid: o.to, ctx: o, cls: "bg-success" }
		);
	},
	timefmt: function(val: number) {
		function numFmt(n: number) {
			return n < 10 ? "0" + n : "" + n;
		}
		const d = new Date(val * 1000);
		const month = d.getMonth() + 1;
		const day = d.getDay() + 1;
		return `${d.getFullYear()}/${numFmt(month)}/${numFmt(day)} ${numFmt(
			d.getHours()
		)}:${numFmt(d.getMinutes())}`;
	},
	lockCard: function(numLockCards: number[], numCards: number, opt:any) {
		for (let i = 0; i < numLockCards.length; i++) {
			if (numLockCards[i] == numCards) {
				//@ts-ignore
				return opt.fn(this);
			}
		}
		//@ts-ignore
		return opt.inverse(this);
	},
	translate: function(data: string) {
		switch (data) {
			case "SameCardSameRoomMultiBuy":
				return "api";
			case "SameCardMultiRoomBuy":
				return "çoklu oda";
			case "UserBuysFromSingleTable":
				return "tek masadan";
			case "CardCanBeBoughtFromSingleTable":
				return "kart tek masadan";
			default:
				return data;
		}
	},
	neq:function(a:any,b:any,opt:any){
		return a!=b?opt.fn(this):opt.inverse(this)
	},
	couponCredit:function(cpnLog:CouponHistory){
		return cpnLog.new_credit?cpnLog.new_credit:cpnLog.buy_time_credit
	}
};
//@ts-ignore
handlebarsHelpers["-"] = function(a: number, b: number) {
	return a - b;
};
//@ts-ignore
handlebarsHelpers["+"] = function(a: number, b: number) {
	return a - b;
};
