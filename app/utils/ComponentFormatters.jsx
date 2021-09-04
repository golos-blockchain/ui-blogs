import React from 'react'

export const authorNameAndRep = (author, authorRepFn) => <span>
    <strong>{author}</strong>
    {authorRepFn != null && <span style={{fontWeight: 'normal'}}> ({authorRepFn})</span>}
</span>
