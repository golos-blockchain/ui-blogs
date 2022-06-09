export default class FloatEditor {
    constructor(float, precision) {
        this._float = float
        this._precision = precision
        if (float === 0) {
            this._str = ''
        } else {
            this.strFloat = float
        }
        this._hasChange = true
    }

    get float() {
        return this._float
    }

    set strFloat(float) {
        this._str = float.toFixed(this._precision)
        const alt = float.toString()
        if (!alt.includes('e') && alt.length < this._str.length) {
            this._str = alt
        }
    }

    get str() {
        return this._str
    }

    get precision() {
        return this._precision
    }

    get hasChange() {
        return this._hasChange
    }

    clone() {
        let res = new FloatEditor(this._float, this._precision)
        res._str = this._str
        res._hasChange = this._hasChange
        return res
    }

    withChange(str) {
        let res = this.clone()
        str = str.trim().replace(/,/g, '.')

        let float = str === '' ? 0 : parseFloat(str)
        if (isNaN(float) || float < 0) {
            res._hasChange = false
        } else {
            res._hasChange = true
            res._float = float
            let str2 = float.toString()
            const idx = str2.indexOf('.')
            if (idx !== -1 && (idx < str2.length - this._precision)) {
                str = float.toFixed(this._precision)
            }
            res._str = str
        }
        return res
    }

    withVirtChange(str) {
        let res = this.clone()
        res.strFloat = str
        return res
    }
}
