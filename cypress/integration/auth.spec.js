describe('authorization tests', () => {
    it('not logins with wrong password', () => {
        cy.visit('/');
        cy.wait(1000); // without it next line sometimes fails
        cy.tryLogin('lex', 'thewrongpassword');
        cy.get('div.error:contains("Неправильный пароль")');
    })

    it('logins with correct password', () => {
        cy.visit('/');
        cy.wait(1000); // without it next line sometimes fails
        cy.tryLogin(Cypress.env('ACC'), Cypress.env('ACC_POSTING'));
        cy.get('div.error:contains("Неправильный пароль")');
    })
})
