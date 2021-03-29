var _ft_originalTitle;
var _ft_title;
var _ft_interval;
var _ft_state;

function flash(title, interval = 1000) {
    if (!_ft_interval) {
        _ft_originalTitle = document.title;
    }

    if (title || interval) {
        clearInterval(_ft_interval);
        if (title) {
            _ft_title = title;
        }
    }

    _ft_state = 0;
    _ft_interval = setInterval(() => {
        document.title = _ft_state ? _ft_title : _ft_originalTitle;
        _ft_state = !_ft_state;
    }, interval);
}

function unflash() {
    if (_ft_interval) {
        clearInterval(_ft_interval);
        document.title = _ft_originalTitle;
    }
}

module.exports = {
    flash,
    unflash,
}
