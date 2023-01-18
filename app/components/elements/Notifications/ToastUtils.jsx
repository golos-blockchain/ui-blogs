import React from 'react'
import { toast } from 'react-hot-toast'
import tt from 'counterpart'

export function showToast(content, opts = {}) {
    toast((t) => <React.Fragment><div className='toast-content'>
                {content}
            </div>
            <div className='toast-action' onClick={e => {
                toast.dismiss(t.id)
            }}>
                {opts.action || tt('g.dismiss')}
            </div>
        </React.Fragment>, {
        duration: opts.dismissAfter || 5000,
        style: {
            padding: '0px',
            'width': '100%'
        },
        ariaProps: {
            style: {
                'margin': '0px',
                'border-radius': '8px',
                'max-width': '28rem',
                'width': '100%'
            }
        }
    })
}

export function showCustomToast(content, opts = {}) {
    toast(content, {
        duration: opts.dismissAfter || 5000,
    })
}
