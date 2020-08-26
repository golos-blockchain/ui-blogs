import {roundDown, roundUp} from "./MarketUtils";

class Order {
    constructor(order, side, sym1, sym2, prec1, prec2) {
        this.side = side;
        this.price = parseFloat(order.real_price);
        this.price = side === 'asks' ? roundUp(this.price, 6) : Math.max(roundDown(this.price, 6), 0.000001);
        this.stringPrice = this.price.toFixed(6);
        this.asset1 = parseInt(order.asset1, 10);
        this.asset2 = parseInt(order.asset2, 10);
        this.sym1 = sym1
        this.sym2 = sym2
        this.prec1 = prec1
        this.prec2 = prec2
        this.date = order.created;
    }

    getAsset1Amount() {
        return this.asset1 / Math.pow(10, this.prec1);
    }

    getStringAsset1() {
        return this.getAsset1Amount().toFixed(this.prec1);
    }

    getPrice() {
        return this.price;
    }

    getStringPrice() {
        return this.stringPrice;
    }

    getAsset2Amount() {
        return this.asset2 / Math.pow(10, this.prec2);
    }

    getStringAsset2() {
        return this.getAsset2Amount().toFixed(this.prec2);
    }

    add(order) {
        return new Order({
            real_price: this.price,
            asset1: this.asset1 + order.asset1,
            asset2: this.asset2 + order.asset2,
            date: this.date
        }, this.type, this.sym1, this.sym2, this.prec1, this.prec2);
    }

    equals(order) {
        return (
            this.getStringAsset2() === order.getStringAsset2() &&
            this.getStringAsset1() === order.getStringAsset1() &&
            this.getStringPrice() === order.getStringPrice()
        );
    }
}

class TradeHistory {

    constructor(fill, sym1, sym2, prec1, prec2) {
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
        this.price = this.type === 'ask' ? roundUp(this.price, 6) : Math.max(roundDown(this.price, 6), 0.000001);
        this.stringPrice = this.price.toFixed(6);
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

module.exports = {
    Order,
    TradeHistory
}
