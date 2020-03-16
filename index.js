// TODO: validar inputs externos (env vars)
// TODO: tratar erros de autenticação, etc (awaiting eterno)
// TODO: implementar um método para atualizar/refresh as credenciais(?)

// DOCS: https://pptr.dev

const { join } = require('path');
require('dotenv').load({
  path: join(__dirname, '.env'),
});

const PERGAMUM_UFAM_LINKS = {
  login: process.env.PERGAMUM_LOGIN_URI,
  index: process.env.PERGAMUM_INDEX_URI,
};

const matricula = process.env.PERGAMUM_LOGIN;
const senha = process.env.PERGAMUM_PASSWORD;

const puppeteer = require('puppeteer');
const zipObject = require('lodash.zipobject');

/**
 * Dedicated method to page to click and wait for navigation.
 * edit from (c) https://github.com/GoogleChrome/puppeteer/issues/1421
 * @param {puppeteer.Page} page
 * @param {string} selector
 * @param {puppeteer.NavigationOptions} [waitOptions]
 * @returns {Promise<puppeteer.Response>}
 */
async function clickAndWaitNavi(page, selector, waitOptions = {}) {
  return Promise.all([
    page.waitForNavigation(waitOptions),
    page.click(selector),
  ]).then(value => value[0]);
}

/**
 *
 * @param {import('puppeteer').Page} page
 * @param {*} exposed
 * @returns {Promise< {titulo:string, devolucao:string, renovacoes:strin[]}[] >}
 */
async function getTitulosPendentes(page, exposed) {
  const el_conteinerLivrosPendentes = await page.$('.c1');
  const livrosPendentes = await el_conteinerLivrosPendentes.$$eval(
    'a.txt_azul',
    exposed.nodesToString,
  );

  if (livrosPendentes.length <= 0) {
    return [];
  }

  const outrasColunas = await el_conteinerLivrosPendentes.$$eval(
    'td.txt_cinza_10',
    exposed.nodesToString,
  );
  const datasDevolucao_renovacoesLimites = outrasColunas
    .slice(2)
    .filter(str => str.trim());

  const infosLivrosPendentes = livrosPendentes.map((livro, i) => {
    const idx = i + 1 * i;
    const partesData = datasDevolucao_renovacoesLimites[idx].split('/');
    return {
      titulo: livro,
      devolucao: new Date(partesData[2], partesData[1] - 1, partesData[0]), //ISO format: YYYY-MM-DD
      renovacoes: datasDevolucao_renovacoesLimites[idx + 1]
        .split('/')
        .map(n => parseInt(n, 10)),
    };
  });

  return infosLivrosPendentes;
}

/**
 *
 * @param {import('puppeteer').Page} page
 * @param {*} exposed
 * @returns {Promise<void>}
 */
async function renovarTitulosPendentes(page, exposed) {
  const seletoresTitulosInfoPosRenovacao = [
    '.box_azul_left',
    '.box_write_left',
    '.box_vermelho_left',
    '.box_write_vermelho_left',
    '.box_write_c', // em caso de renovação
  ];

  const el_btnsRenovar = await page.$$('.btn_renovar');

  for (let i = 0; i < el_btnsRenovar.length; ++i) {
    if (exposed.ids.includes(i)) {
      await page.goto(PERGAMUM_UFAM_LINKS.index);
      const el_btnsRenovar = await page.$$('.btn_renovar');

      const btnRenovar = el_btnsRenovar[i];
      btnRenovar.click();

      await page.waitForSelector('div[align="left"]');

      const titulosInfos = await page.$$eval(
        seletoresTitulosInfoPosRenovacao.join(','),
        exposed.nodesToString,
      );
      const qtdInfos = titulosInfos.length / 2;
      const renovado = qtdInfos > 3;

      const infos = zipObject(
        titulosInfos.slice(0, qtdInfos).map(t => t.toLowerCase()),
        titulosInfos.slice(qtdInfos),
      );

      exposed.titulosPendentes[i].dadosRenovacao = { renovado, infos };
    }
  }
}

/**
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} tipoTitulos
 * @param {number[]} [arrNumerosRenovar]
 * @returns {Promise<any>}
 */
async function scrap(browser, tipoTitulos, arrNumerosRenovar = []) {
  if (tipoTitulos !== 'pendentes') {
    throw new Error(`'tipoTitulos' inválido!`);
  }

  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    recuperarConteudo = el =>
      el.innerHTML
        .replace(/(\\n|\\t)|(<[^>]+>)|(&nbsp;)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
  });
  const nodesToString = nodes => nodes.map(node => recuperarConteudo(node));

  await page.goto(PERGAMUM_UFAM_LINKS.login);

  await page.type('input[type="text"]', matricula);
  await page.type('input[type="password"]', senha);

  await clickAndWaitNavi(page, 'input[type="submit"]');
  await page.waitForSelector('#Accordion1');

  const titulosPendentes = await getTitulosPendentes(page, { nodesToString });
  if (titulosPendentes.length <= 0) {
    throw new Error(`Nenhum título pendente foi encontrado!`);
  } else {
    if (arrNumerosRenovar) {
      // se o array estiver vazio, renovar tudo
      const ids = arrNumerosRenovar.length
        ? arrNumerosRenovar
        : Array.from(Array(titulosPendentes.length).keys());
      console.log(ids);
      // await renovarTitulosPendentes(page, { nodesToString, titulosPendentes, ids });
    }
    // const dadosAluno = await page.$$eval('#1b td', nodesToString)
    // console.log(dadosAluno)

    // await page.goto(PERGAMUM_UFAM_LINKS.index);
  }

  return titulosPendentes;
}

const start = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    return await scrap(browser, 'pendentes');
  } finally {
    await browser.close();
  }
};

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

start()
  .then(console.log)
  .catch(console.error);
