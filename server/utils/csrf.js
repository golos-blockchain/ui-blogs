const csrf = require('csrf')

function CSRF() {
	const tokens = csrf({})

	return async (ctx, next) => {
		ctx.checkCSRF = () => { return false }

		if (!ctx.session) {
			console.warn('CSRF: no ctx.session')
			return
		}

		if (!ctx.session.secret) ctx.session.secret = await tokens.secret()
	
		if (!ctx.state._csrf) ctx.state._csrf = tokens.create(ctx.session.secret)

		ctx.checkCSRF = function (csrf) {
			if (!tokens.verify(this.session.secret, csrf)) {
		        this.status = 403;
		        this.body = 'invalid csrf token';
		        console.log('-- invalid csrf token -->', this.request.method, this.request.url, this.session.uid)
		        return false;
		    }
		    return true;
		}

		return next()
	}
}

module.exports = CSRF
