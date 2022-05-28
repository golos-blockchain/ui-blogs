import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver'
import tt from 'counterpart';

export default class KeyFile {
    constructor(username, privateKeys) {
        this.fileName = 'keys-' + username + '.pdf';
        this.pdf = new jsPDF();
        let { pdf } = this;

        /*"file_title": "Ключи от аккаунта @",
        "file_desc": "Это приватные ключи, которые дают доступ к вашему аккаунту. Храните этот файл в надежном месте.",
        "password_desc": "Пароль (используйте для входа на форум): ",
        "posting_desc": "Posting-ключ (также подходит в качестве пароля на форуме): ",
        "active_desc": "Active-ключ: ",
        "owner_desc": "Owner-ключ: ",
        "memo_desc": "Memo-ключ: "*/

        pdf.setFontSize(28);
        pdf.text(10, 20, tt('key_file.file_title') + username);

        pdf.setFontSize(10);
        pdf.text(10, 30, tt('key_file.file_desc'));

        pdf.setFontSize(12);
        pdf.text(10, 40, tt('key_file.password_desc'));
        pdf.text(10, 45, privateKeys.password);

        pdf.text(10, 55, tt('key_file.posting_desc'));
        pdf.text(10, 60, privateKeys.posting);

        pdf.text(10, 70, tt('key_file.active_desc'));
        pdf.text(10, 75, privateKeys.active);

        pdf.text(10, 85, tt('key_file.owner_desc'));
        pdf.text(10, 90, privateKeys.owner);

        pdf.text(10, 100, tt('key_file.memo_desc'));
        pdf.text(10, 105, privateKeys.memo);
    }

    save = () => {
        // Fix Firefox 98 bug
        if (navigator.userAgent.toLowerCase().includes('firefox')) {
            console.warn('KeyFile: Firefox detected - using alternative PDF save way...')
            let blob = this.pdf.output('blob')
            blob = blob.slice(0, blob.size, 'application/octet-stream')
            saveAs(blob, this.fileName)
            return
        }
        this.pdf.save(this.fileName);
    };
}
