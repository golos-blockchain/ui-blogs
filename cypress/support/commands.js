import golos from 'golos-lib-js';

Cypress.Commands.add('areWitnessesExist', async (witnesses) => {
    for (let nick of witnesses) {
        const wtn = await golos.api.getWitnessByAccount(nick);
        if (!wtn || !wtn.owner) throw 'No witness ' + nick;
    }
});
