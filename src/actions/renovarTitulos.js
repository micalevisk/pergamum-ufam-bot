const compareDates = require('compare-dates');
const zipObject = require('lodash.zipobject');

const PERGAMUM_UFAM = require('../../links');

/**
 *
 * @param {import('./getTitulosPendentes').TituloPendente[]} titulosPendentes
 * @returns {number[]}
 */
const titulosRenovaveis = titulosPendentes => {
  if (titulosPendentes.length <= 0) {
    throw new Error(`Nenhum título pendente foi encontrado!`);
  }

  const diasMax = 2;
  const todayDate = new Date();
  // Filtrar títulos que irão expirar
  return titulosPendentes.reduce((idxAlmostExp, tituloPendente) => {
    // Título não passível de novas renovações
    if (tituloPendente.renovacoes.qtdFeitas + 1 >= tituloPendente.renovacoes.qtdLimite) {
      return idxAlmostExp;
    }

    const dateWithOffset = compareDates.subtract(tituloPendente.devolucao, diasMax, 'day');
    // Título que expirará daqui a `diasMax` dias
    if (compareDates.isSame(todayDate, dateWithOffset, 'date')) {
      idxAlmostExp.push(tituloPendente.idx);
    }

    return idxAlmostExp;
  }, []);
};

/**
 *
 * @param {import('puppeteer').Page} page Na página 'index', onde os títulos estão listados com o menu de Títulos Pendentes aberto.
 * @param {(nodes: any) => string[]} nodesToString
 * @returns {(args: {titulosPendentes: import('./getTitulosPendentes').TituloPendente[]}) => Promise<any>}
 */
const renovarTitulos = (page, nodesToString) => async ({ titulosPendentes }) => {
  // TODO: usar a página Empréstimos > Renovação para renovar múltiplos exemplares(?)
  const seletoresTitulosInfoPosRenovacao = [
    '.box_azul_left', //
    '.box_write_left', //
    '.box_write_vermelho_left', // TD título ; em caso de renovação falhada
    '.box_vermelho_left', // TD motivo ; em caso de renovação falhada
    '.box_write_c', // TD "Chave de segurança" ; em caso de renovação realizada
  ];

  const el_btnsRenovar = await page.$$('.btn_renovar');

  const idxTitulos = titulosRenovaveis(titulosPendentes);
  const titulosRenovados = [];
  const titulosNaoRenovados = [];
  for (let idxBtnRenovar = 0; idxBtnRenovar < el_btnsRenovar.length; ++idxBtnRenovar) {
    if (!idxTitulos.includes(idxBtnRenovar)) {
      continue;
    }

    await page.goto(PERGAMUM_UFAM.index);
    const el_btnsRenovar = await page.$$('.btn_renovar');

    const btnRenovar = el_btnsRenovar[idxBtnRenovar];
    await btnRenovar.click();

    // Elemento que contém a mensagem "Título(s) renovado(s):"
    await page.waitForSelector('div[align="left"]');

    const titulosInfos = await page.$$eval(
      seletoresTitulosInfoPosRenovacao.join(','),
      nodesToString,
    );

    const qtdInfos = titulosInfos.length / 2;
    const renovado = qtdInfos > 3;
    const infos = zipObject(
      titulosInfos.slice(0, qtdInfos).map(t => t.toLowerCase()),
      titulosInfos.slice(qtdInfos),
    );
    const feedback = {
      idx: idxBtnRenovar,
      infos,
    };
    if (renovado) {
      titulosRenovados.push(feedback);
    } else {
      titulosNaoRenovados.push(feedback);
    }
  }

  return {
    titulosRenovados: titulosRenovados,
    titulosCancelados: titulosNaoRenovados,
  };
};

module.exports = renovarTitulos;
