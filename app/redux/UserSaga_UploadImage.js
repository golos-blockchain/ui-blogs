import tt from 'counterpart';
import { select, takeEvery } from 'redux-saga/effects';
import { signData } from 'golos-lib-js/lib/auth'
import { Signature, hash } from 'golos-lib-js/lib/auth/ecc/index';
import { Asset, fetchEx } from 'golos-lib-js/lib/utils'

const MAX_UPLOAD_IMAGE_SIZE = 1;

export default function* uploadImageWatch() {
    yield takeEvery('user/UPLOAD_IMAGE', uploadImage);
}

const ERRORS_MATCH = [
    ['error uploading', 'user_saga_js.image_upload.error.err_uploading'],
    [
        'signature did not verify',
        'user_saga_js.image_upload.error.signature_did_not_verify',
    ],
    [
        'upload only images',
        'user_saga_js.image_upload.error.upload_only_images',
    ],
    ['upload failed', 'user_saga_js.image_upload.error.upload_failed'],
    [
        'unsupported posting key configuration',
        'user_saga_js.image_upload.error.unsupported_posting_key',
    ],
    [
        'is not found on the blockchain',
        'user_saga_js.image_upload.error.account_is_not_found',
    ],
];

function* uploadImage(action) {
    const { file, dataUrl, filename = 'image.txt', progress, imageSizeLimit = 0 } = action.payload;

    function onError(txt) {
        progress({
            error: txt,
        });
    }

    if (!$STM_Config.images.upload_image) {
        onError('NO_UPLOAD_URL');
        return;
    }

    //

    if (!file && !dataUrl) {
        onError(tt('user_saga_js.error_file_or_data_url_required'));
        return;
    }

    let data, dataBase64;

    if (file) {
        const reader = new (window.FileReader0 || FileReader)();

        data = yield new Promise(resolve => {
            reader.addEventListener('load', () => {
                resolve(new Buffer(reader.result, 'binary'));
            });
            reader.readAsBinaryString(file);
        });
    } else {
        // recover from preview
        dataBase64 = dataUrl.substr(dataUrl.indexOf(',') + 1);
        data = new Buffer(dataBase64, 'base64');
    }

    let postUrl = $STM_Config.images.upload_image

    let golosImages = false
    const user = yield select(state => state.user)
    const switchToGolosImages = async () => {
        const username = user.getIn(['current', 'username']);
        const postingKey = user.getIn([
            'current',
            'private_keys',
            'posting_private',
        ]);
        if (!username || !postingKey) {
            onError(tt('user_saga_js.image_upload.error.login_first'));
            return;
        }
        const signatures = signData(data, {
            posting: postingKey,
        })
        postUrl = new URL('/@' + username + '/' + signatures.posting, $STM_Config.images.img_proxy_prefix).toString();
        golosImages = true
    }

    if (file) {
        if (imageSizeLimit && file.size > imageSizeLimit) {
            onError(tt('user_saga_js.image_upload.error.image_size_is_too_large'));
            return
        }

        if ($STM_Config.images.use_img_proxy !== false) {
            let recommended = false
            try {
                let su = new URL('/start_upload/' + file.size, $STM_Config.images.img_proxy_prefix).toString()
                su = yield fetchEx(su, {
                    timeout: 1500
                })
                su = yield su.json()
                if (su.recommended === 'undefined') {
                    console.warning('image_proxy start_upload:', 'No recommended field:', su)
                    throw new Error('Wrong response')
                }
                recommended = !!su.recommended
            } catch (err) {
                console.error('image_proxy start_upload:', err)
            }
            if (recommended) {
                yield switchToGolosImages()
            }
        }
    }
    const onImgurFail = async (imgurErr) => {
        console.log('onImgurFail - switch to Golos Images..')
        await switchToGolosImages()
        console.log('onImgurFail - ok, sending..')
        xhr.open('POST', postUrl);
        formData.append('fallback', imgurErr)
        xhr.send(formData)
    }

    /**
     * The challenge needs to be prefixed with a constant (both on the server
     * and checked on the client) to make sure the server can't easily make the
     * client sign a transaction doing something else.
     */
    //const prefix = new Buffer('ImageSigningChallenge');
    //const bufSha = hash.sha256(Buffer.concat([prefix, data]));

    const formData = new FormData();

    if (file) {
        formData.append('image', file);
    } else {
        formData.append('name', filename);
        formData.append('image', dataBase64);
    }

    let imgurFailCounter = 0;

    const xhr = new XMLHttpRequest();

    let tm
    let connected
    const clearTm = () => {
        if (tm) clearTimeout(tm)
    }
    const resetTm = () => {
        clearTm()
        tm = setTimeout(() => {
            onError(tt('user_saga_js.image_upload.error.upload_failed'))
            xhr.abort()
        }, connected ? 10000 : 5000)
    }
    resetTm()

    xhr.open('POST', postUrl);
    if (!golosImages) {
        xhr.setRequestHeader('Authorization', 'Client-ID ' + $STM_Config.images.client_id)
    }

    xhr.onloadstart = function () {
        connected = true
        resetTm()
    }

    xhr.onload = async function() {
        clearTm()

        let data;

        try {
            data = JSON.parse(xhr.responseText);
        } catch (err) {
            onError(tt('user_saga_js.image_upload.error.upload_failed'));
            return;
        }

        const success = golosImages ? data.status !== 'err' : data.success;
        //const { url, error } = data;

        if (!success) {
            //if (typeof error === 'string') {
            //    const loverError = error.toLowerCase();

            //    for (let [text, translateId] of ERRORS_MATCH) {
            //        if (loverError.includes(text)) {
            //            onError(tt(translateId));
            //            return;
            //        }
            //    }
            //}

            console.error('Cannot upload image:', xhr.responseText);

            if (!golosImages) {
                if (xhr.responseText.includes('Invalid client')) {
                    ++imgurFailCounter;
                    if (imgurFailCounter < 5) {
                        setTimeout(() => {
                            xhr.open('POST', postUrl);
                            xhr.setRequestHeader('Authorization', 'Client-ID ' + $STM_Config.images.client_id)
                            xhr.send(formData);
                        }, 1000);
                        return
                    }
                }
                if (!xhr.responseText.includes('file type invalid')
                    && !xhr.responseText.includes('We don\'t support that file type!')) {
                    await onImgurFail(xhr.responseText)
                    return
                }
            }

            let err = xhr.responseText
            if (golosImages) {
                if (data.error === 'too_low_account_golos_power') {
                    const need = Asset(data.required)
                    const add = need.minus(Asset(data.power))
                    err = tt('user_saga_js.image_upload.error.low_golos_power_NEED_ADD',
                    {
                        NEED: need.floatString,
                        ADD: add.floatString
                    })
                } else if (data.error === 'too_low_account_reputation') {
                    err = tt('user_saga_js.image_upload.error.low_reputation') + data.required
                }
            }
            onError(err)
        } else {
            let result = {}
            if (!golosImages) {
                result.url = data.data.link;
                result.width = data.data.width;
                result.height = data.data.height;
            } else {
                result.url = data.url;
                result.width = data.meta.width;
                result.height = data.meta.height;
            }
            progress(result);
        }
    };

    xhr.onerror = function(error) {
        clearTm()
        onError(tt('user_saga_js.image_upload.error.server_unavailable'));
        console.error(error);
    };

    xhr.upload.onprogress = function(event) {
        resetTm()
        if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);

            progress({
                percent,
                message: `${tt(
                    'user_saga_js.image_upload.uploading'
                )} ${percent}%`,
            });
        }
    };

    xhr.send(formData);
}
