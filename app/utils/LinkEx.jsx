import React from 'react'
import { Link } from 'react-router'

export const isExternal = (url) => {
	return /^(.*?):\/\//.test(url)
}

class LinkEx extends React.Component {
	render() {
		const { props } = this
		const { to, children } = props
		if (isExternal(to)) {
			const href = to
			const rel = props.rel || 'noopener noreferrer'
			return <a href={href} rel={rel} {...props}>{children}</a>
		}
		return <Link {...props}>{children}</Link>
	}
}

export default LinkEx
