import golos from 'golos-lib-js';

Cypress.Commands.add('tryLogin', (login, password) => {
    cy.get('a:contains("Войти")').first().click();
    if (login !== undefined)
        cy.get('input[name="username"]').type(login);
    if (password !== undefined)
        cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]:contains("Войти")').click();
});

Cypress.Commands.add('areWitnessesExist', async (witnesses) => {
    for (let nick of witnesses) {
        const wtn = await golos.api.getWitnessByAccount(nick);
        if (!wtn || !wtn.owner) throw 'No witness ' + nick;
    }
});
