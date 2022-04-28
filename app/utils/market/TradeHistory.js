import { roundDown, roundUp } from 'app/utils/market/utils'

class TradeHistory {
    constructor(fill, sym1, sym2, prec1, prec2) {
        this.fill =fill;
        this.id = fill.id;
        // Norm date (FF bug)
        var zdate = fill.date;
        if(!/Z$/.test(zdate))
          zdate = zdate + 'Z'

        this.date = new Date(zdate);
        this.type = fill.current_pays.indexOf(sym2) !== -1 ? "bid" : "ask";
        this.color = this.type == "bid" ? "buy-color" : "sell-color";
        if (this.type === "bid") {
            this.asset2 = parseFloat(fill.current_pays.split(" " + sym2)[0]);
            this.asset1 = parseFloat(fill.open_pays.split(" " + sym1)[0]);
        } else {
            this.asset2 = parseFloat(fill.open_pays.split(" " + sym2)[0]);
            this.asset1 = parseFloat(fill.current_pays.split(" " + sym1)[0]);
        }

        this.sym1 = sym1
        this.sym2 = sym2
        this.prec1 = prec1
        this.prec2 = prec2
        this.price = this.asset2 / this.asset1;
        this.price = this.type === 'ask' ? roundUp(this.price, 8) : Math.max(roundDown(this.price, 8), 0.00000001);
        this.stringPrice = this.price.toFixed(8);
    }

    getAsset1Amount() {
        return this.asset1;
    }

    getStringAsset1() {
        return this.getAsset1Amount().toFixed(this.prec1);
    }

    getAsset2Amount() {
        return this.asset2;
    }

    getStringAsset2() {
        return this.getAsset2Amount().toFixed(this.prec2);
    }

    getPrice() {
        return this.price;
    }

    getStringPrice() {
        return this.stringPrice;
    }

    equals(order) {
        return (
            this.getStringAsset2() === order.getStringAsset2() &&
            this.getStringAsset1() === order.getStringAsset1() &&
            this.getStringPrice() === order.getStringPrice()
        );
    }
}

module.exports = TradeHistory
