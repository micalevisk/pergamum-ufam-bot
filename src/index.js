'use strict';
// DOCS: https://pptr.dev

require('dotenv-safe').config({
  allowEmptyValues: false,
  sample: '.env.example',
});

// https://stackoverflow.com/a/9849524
process.env.TZ = 'America/Manaus';

const { inspect } = require('util');
const puppeteer = require('puppeteer');

const actions = require('./actions');
const { lastElementFromArr } = require('./utils');

/**
 *
 * @returns {{login:string, password:string}}
 */
function getCredentials() {
  const { PERGAMUM_LOGIN: login, PERGAMUM_PASSWORD: password } = process.env;
  return {
    login,
    password,
  };
}

/**
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string[]} actionsName
 */
async function scrap(browser, actionsName) {
  const page = (await browser.pages())[0]; // reusing the first tab that Puppeteer creates.

  await page.evaluateOnNewDocument(() => {
    // @ts-ignore
    recuperarConteudo = el =>
      el.innerHTML
        .replace(/(\\n|\\t)|(<[^>]+>)|(&nbsp;)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
  });
  // @ts-ignore
  const nodesToString = nodes => nodes.map(node => recuperarConteudo(node));

  const concat = thisVal => Array.prototype.concat.bind(thisVal);

  const { login, password } = getCredentials();

  return ['signIn', ...actionsName].reduce(
    (lastPromise, actionName) =>
      lastPromise.then(result => {
        /** @type {Function & {dropInput:boolean}} */
        const actionFn = actions[actionName];
        return actionFn(page, nodesToString)
          .call(null, lastElementFromArr(result))
          .then(concat(actionFn.dropInput ? [] : result));
      }),
    Promise.resolve([{ login, password }]),
  );

  // The reduce above will do almost the same as:
  // return Promise.resolve([])
  //   .then( x => actions['signIn'](page, nodesToString)({ login, password }).then(concat(x))  )
  //   .then( x => actions[actionsName[0]](page, nodesToString)(lastElement(x)).then(concat(x)) )
  //   .then( x => actions[actionsName[1]](page, nodesToString)(lastElement(x)).then(concat(x)) )
}

process.on('uncaughtException', err => {
  console.error(err);
  process.exit(1);
});
process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(2);
});

(async function start() {

  if (!process.argv[2]) {
    throw new Error('You must define at least one action!');
  }
  const actionsName = process.argv[2].split('|').map(actionName => actionName.trim());

  if (actionsName[0] === 'signIn') {
    // Ensure that this especial action is not the first
    actionsName.shift();
  }

  const availableActionsName = Object.keys(actions);
  actionsName.forEach(actionName => {
    if (!availableActionsName.includes(actionName)) {
      throw new Error(`The action '${actionName}' is not a valid action name.`);
    }
  });

  const browser = await puppeteer.launch({
    headless: process.env.DEBUG !== 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    return await scrap(browser, actionsName);
  } finally {
    await browser.close();
  }

})().then(data => console.log(inspect(data, false, Infinity, true)));
