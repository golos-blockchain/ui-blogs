import React from 'react';
import tt from 'counterpart';

const IllegalContentMessage = () =>  {
	return (
		<div className="row">
			<div className="column small-12">
				<br />
				<p>
				{tt('illegal_content.unavailable')}&nbsp;{tt('illegal_content.due_to_illegal_content')} правил.
				</p>
			</div>
		</div>
	)
}

export default IllegalContentMessage
