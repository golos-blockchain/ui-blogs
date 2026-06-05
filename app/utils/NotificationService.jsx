import React from 'react';
import { toast } from 'react-hot-toast';
import tt from 'counterpart';

import { isScreenS } from 'app/utils/ScreenSize';
import './NotificationService.scss';

const notifications = new Map();

function showToast(content, opts = {}) {
    const func = opts.type === 'error' ? toast.error :
        opts.type === 'success' ? toast.success :
        opts.type === 'loading' ? toast.loading :
        toast;
    const tid = func(opts.custom ? content : (t) => {
        const onClick = e => {
            removeNotification({ tid: t.id })
        };
        return <React.Fragment><div className='toast-content' onClick={isScreenS() ? onClick : undefined}>
                {content}
            </div>
            <div className='toast-action' onClick={onClick}>
                {opts.action || tt('g.dismiss')}
            </div>
        </React.Fragment>
    }, {
        id: opts.tid || undefined,
        duration: (opts.dismissAfter || 5000),
        style: {
            padding: '0px',
            'padding-left': opts.type ? '15px' : undefined,
        },
        ariaProps: {
            style: {
                'margin': '0px',
                'border-radius': '8px',
                'max-width': '38rem',
                'width': '100%'
            }
        }
    });
    return tid;
}

// if (payload.custom) {
//
// export function showCustomToast(content, opts = {}) {
//     toast(content, {
//         duration: opts.dismissAfter || 5000,
//     })
// }

export function addNotification(opts) {
    const n = {
        action: tt('g.dismiss'),
        dismissAfter: 10000,
        ...opts,
    };
    const { key } = n;
    const exists = notifications.get(key);
    n.tid = showToast(n.message, {
        tid: exists && exists.tid,
        action: opts.action,
        dismissAfter: opts.dismissAfter,
        type: opts.type,
        custom: opts.custom,
    });
    notifications.set(key, n);
}

export function removeNotification({ key, tid, instant } = {}) {
    if (!key) {
        if (!tid) throw new Error('removeNotification requires tid or key');

        for (const [k, v] of notifications.entries()) {
            key = k;
            break;
        }
    }
    const n = notifications.get(key);
    notifications.delete(key);
    if (n && n.tid) {
        (instant ? toast.remove : toast.dismiss)(n.tid);
    }
}
