function checkWitnesses() {
    cy.get('tr').should('have.length', 101);

    let nicks = new Set();
    let i = 0;
    cy.get('tr').each($row => {
        if (!i) { // table head
            ++i;
            return;
        }

        let rank = i.toString();
        if (i < 10) rank = '0' + rank;
        cy.wrap($row, noLog).find('td', noLog).each(($cell, index) => {
            if (index === 0) {
                cy.wrap($cell, noLog)
                    .invoke(noLog, 'text')
                    .then(text => {
                        text = text.trim();
                        if (text !== rank) {
                            throw rank;
                        }
                    });
            } else if (index === 1) {
                cy.wrap($cell, noLog)
                    .invoke(noLog, 'text')
                    .then(text => {
                        text = text.trim();
                        if (nicks.has(text)) {
                            throw text + ' witness duplicate in list';
                        }
                        nicks.add(text);
                    });
            }
        });
        ++i;
    }).then(() => {
        cy.areWitnessesExist(nicks);
    });
}

describe('witnesses page', () => {
    it('loads from new tab', () => {
        cy.visit('/~witnesses');

        checkWitnesses();
    })

    it('loads by client navigation', () => {
        cy.visit('/');

        cy.get('.Icon.new\\/more').first().click();

        cy.get('a:contains(\'Голосовать за делегатов\')')
            .first().invoke('removeAttr', 'target');
        cy.get('a:contains(\'Голосовать за делегатов\')')
            .first().click();

        checkWitnesses();
    })

    it('GP drop down menu', () => {
        cy.visit('/~witnesses');

        for (let i = 0; i < 6; ++i) {
            cy.get('.Witnesses__vote-list').eq(i)
                .should('not.have.class', 'show');

            cy.get('.Witnesses__vote-list').eq(i)
                .find('a').first().click();

            cy.get('.Witnesses__vote-list').eq(i)
                .should('have.class', 'show');

            let voteSum = 0;
            let voteSumAgg = 0;
            cy.get('.Witnesses__vote-list').eq(i)
                .within(($voteList) => {
                    cy.get('a').first().invoke('text').then(t => {
                        voteSum = t.trim();
                        voteSum = voteSum.slice(0, -2);
                        voteSum = voteSum.replace(/\s/g, '');
                        voteSum = parseInt(voteSum);
                    })
                    const nextPage = () => {
                        cy.get('ul > li > a').each($li => {
                            const acc = $li[0].childNodes[0];
                            let gp = $li[0].childNodes[1];
                            gp = gp.textContent.trim();
                            if (!gp.endsWith('СГ'))
                                throw gp + ' has wrong format';
                            gp = gp.slice(0, -3).replace(/\s/g, '');
                            if (isNaN(gp))
                                throw gp + ' GP is NaN';
                            voteSumAgg += parseInt(gp);
                        })
                        const hasMore = $voteList.find('.PagedDropdownMenu__paginator:contains(\'Ещ\')').length;
                        if (hasMore) {
                            cy.get('.PagedDropdownMenu__paginator:contains(\'Ещ\')').click();
                            cy.wait(1000).then(nextPage);
                        }
                    };
                    nextPage();
                }).then(() => {
                    if (Math.abs(voteSumAgg - voteSum) > 150) {
                        throw voteSumAgg + ' != ' + voteSum;
                    }

                    cy.get('body').click({ force: true, });

                    cy.get('.Witnesses__vote-list').eq(i)
                        .should('not.have.class', 'show');
                });
        }
    })
})
