const _ = require('../utils');
const PERGAMUM_UFAM = require('../../links');

/**
 *
 * @param {import('puppeteer').Page} page Numa página qualquer.
 * @param {(nodes: any) => string[]} nodesToString
 * @returns {(args: {login:string, password:string}) => Promise<{username:string}>}
 */
const signIn = (page, nodesToString) => async ({ login, password }) => {
  await page.goto(PERGAMUM_UFAM.login);

  await page.type('input[type="text"]', login);
  await page.type('input[type="password"]', password);

  await page.click('input[type="submit"]');

  const promiseResult = await Promise.race([
    // Está na página 'index' pois existe o painel que contém o nome do usuário que acabou de logar
    _.wrapPromiseResultWithId('SUCCESS', page.waitForSelector('#nome > strong')),
    // Está na página inicial pois houve erro de autenticação
    _.wrapPromiseResultWithId('ERROR', page.waitForSelector('#alert_login')),
  ]);

  if (promiseResult.id === 'ERROR') {
    const el_alert = promiseResult.value;
    if (el_alert !== null) {
      // erro ao logar
      const text = await _.getAttrForElement(page, el_alert, 'textContent');
      throw new Error(text.trim());
    }

    throw new Error('erro ao entrar!');
  }

  const el_nome = promiseResult.value;
  const username = await _.getAttrForElement(page, el_nome, 'textContent');

  return {
    username,
  };
};

signIn.dropInput = true;

module.exports = signIn;
