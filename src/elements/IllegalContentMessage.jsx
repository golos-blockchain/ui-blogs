import React from 'react';
import tt from 'counterpart';

const IllegalContentMessage = () =>  {
	return (
		<div className="row">
			<div className="column small-12">
				<br />
				<p>{tt('g.hide_content')}</p>
			</div>
		</div>
	)
}

export default IllegalContentMessage
