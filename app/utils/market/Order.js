import { roundDown, roundUp } from 'app/utils/market/utils'

class Order {
    constructor(order, side, sym1, sym2, prec1, prec2, currentSeller) {
        this.side = side;
        this.price = parseFloat(order.real_price);
        this.price = side === 'asks' ? roundUp(this.price, 8) : Math.max(roundDown(this.price, 8), 0.00000001);
        this.stringPrice = this.price.toFixed(8);
        this.asset1 = parseInt(order.asset1, 10);
        this.asset2 = parseInt(order.asset2, 10);
        this.sym1 = sym1
        this.sym2 = sym2
        this.prec1 = prec1
        this.prec2 = prec2
        this.asset1cur = 0;
        this.asset2cur = 0;
        this.idsToCancel = [];
        this.date = order.created;
        this.seller = order.seller;
        if (this.seller === currentSeller) {
            this.asset1cur = this.asset1;
            this.asset2cur = this.asset2;
            this.idsToCancel.push(order.orderid);
        }
        this.currentSeller = currentSeller; // for copying
    }

    getAsset1Amount() {
        return this.asset1 / Math.pow(10, this.prec1);
    }

    getStringAsset1() {
        return this.getAsset1Amount().toFixed(this.prec1);
    }

    getAsset1CurAmount() {
        return this.asset1cur / Math.pow(10, this.prec1);
    }

    getStringAsset1Cur() {
        return this.getAsset1CurAmount().toFixed(this.prec1);
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

    getAsset2CurAmount() {
        return this.asset2cur / Math.pow(10, this.prec2);
    }

    getStringAsset2Cur() {
        return this.getAsset2CurAmount().toFixed(this.prec2);
    }

    add(order) {
        let newOrder = new Order({
            real_price: this.price,
            asset1: this.asset1 + order.asset1,
            asset2: this.asset2 + order.asset2,
            date: this.date,
            seller: this.seller
        }, this.type, this.sym1, this.sym2, this.prec1, this.prec2, this.currentSeller);
        newOrder.asset1cur = this.asset1cur + order.asset1cur;
        newOrder.asset2cur = this.asset2cur + order.asset2cur;
        newOrder.idsToCancel = [...this.idsToCancel, ...order.idsToCancel];
        return newOrder;
    }

    equals(order) {
        return (
            this.getStringAsset2() === order.getStringAsset2() &&
            this.getStringAsset1() === order.getStringAsset1() &&
            this.getStringAsset2Cur() === order.getStringAsset2Cur() &&
            this.getStringAsset1Cur() === order.getStringAsset1Cur() &&
            this.getStringPrice() === order.getStringPrice()
        );
    }
}

module.exports = Order
