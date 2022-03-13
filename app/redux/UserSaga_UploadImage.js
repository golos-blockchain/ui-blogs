import tt from 'counterpart';
import { select, takeEvery } from 'redux-saga/effects';
import { signData } from 'golos-lib-js/lib/auth'
import { Signature, hash } from 'golos-lib-js/lib/auth/ecc/index';

const MAX_UPLOAD_IMAGE_SIZE = 1024 * 1024;

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
    const { file, dataUrl, filename = 'image.txt', progress, useGolosImages = false } = action.payload;

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
        const reader = new FileReader();

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
    if (file && file.size > MAX_UPLOAD_IMAGE_SIZE) {
        if (useGolosImages && $STM_Config.images.use_img_proxy !== false) {
            const user = yield select(state => state.user);
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
        } else {
            onError(tt('user_saga_js.image_upload.error.image_size_is_too_large'));
            return;
        }
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

    xhr.open('POST', postUrl);
    if (!golosImages) {
        xhr.setRequestHeader('Authorization', 'Client-ID ' + $STM_Config.images.client_id)
    }

    xhr.onload = function() {
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

            let repeat = false;
            if (!golosImages) {
                if (xhr.responseText.includes('Invalid client')) {
                    ++imgurFailCounter;
                    if (imgurFailCounter < 5) {
                        repeat = true;
                        setTimeout(() => {
                            xhr.open('POST', postUrl);
                            xhr.setRequestHeader('Authorization', 'Client-ID ' + $STM_Config.images.client_id)
                            xhr.send(formData);
                        }, 1000);
                    }
                }
            }
            if (!repeat) {
                onError(xhr.responseText);
            }
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
        onError(tt('user_saga_js.image_upload.error.server_unavailable'));
        console.error(error);
    };

    xhr.upload.onprogress = function(event) {
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
