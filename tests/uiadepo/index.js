const { config, api, broadcast, importNativeLib, memo, } = require('golos-lib-js');

const acc = 'ecurrex-tether';
const accActive = '5JFZC7AtEe1wF2ce6vPAUxDeevzYkPgmtR14z9ZVgvCCtrFAaLw';
const memoIn = 'deposit';
const memoOut = '# This is test of UIA deposit';

config.set('websocket', 'wss://apibeta.golos.today/ws');

api.streamOperations(async (err, op) => {
    if (op[0] === 'transfer' && op[1].to === acc) {
        console.log('Received transfer', op);
        if (op[1].memo === memoIn) {
            console.log('Encoding');
            await importNativeLib();
            const acc2 = await api.getAccountsAsync([op[1].from]);
            let m = memo.encode(accActive, acc2[0].memo_key, memoOut);

            console.log('Sending response');
            broadcast.transfer(accActive, acc, op[1].from,
                '0.001 GOLOS', m, (err, res) => {
                    if (err) {
                        console.error('Cannot send', err);
                        return;
                    }
                    console.log('Response sent');
                });
        }
    }
});

console.log('Started');
console.log('Please send transfer to', acc, 'with memo:', memoIn);
