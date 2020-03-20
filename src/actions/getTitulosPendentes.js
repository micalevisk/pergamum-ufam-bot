/**
 * @typedef {{idx:number, nome:string, devolucao: Date, renovacoes:{qtdFeitas:number, qtdLimite:number}}} TituloPendente
 *
 * @param {import('puppeteer').Page} page Na página 'index', onde os títulos estão listados.
 * @param {(nodes: any) => string[]} nodesToString
 * @returns {() => Promise<{titulosPendentes: TituloPendente[]}>}
 */
const getTitulosPendentes = (page, nodesToString) => async args => {
  const el_menuTitulosPendentes = await page.waitForSelector('#Accordion1 > div > div');
  await el_menuTitulosPendentes.click(); // Abrir o menu 'Títulos pendentes'

  const el_conteinerLivrosPendentes = await page.waitForSelector('.c1');
  const nomeTitulosPendentes = await el_conteinerLivrosPendentes.$$eval(
    'a.txt_azul',
    nodesToString,
  );

  /** @type {TituloPendente[]} */
  const titulosPendentes = [];
  const response = {
    titulosPendentes,
  };

  if (nomeTitulosPendentes.length <= 0) {
    return response;
  }

  const outrasColunas = await el_conteinerLivrosPendentes.$$eval('td.txt_cinza_10', nodesToString);
  const datasDevolucao_renovacoesLimites = outrasColunas.slice(2).filter(str => str.trim());

  for (let idx = 0; idx < nomeTitulosPendentes.length; ++idx) {
    const idxRelative = idx + 1 * idx;
    const partesData = datasDevolucao_renovacoesLimites[idxRelative].split('/', 3); // DD-MM-YYYY
    const [qtdFeitas, qtdLimite] = datasDevolucao_renovacoesLimites[idxRelative + 1]
      .split('/', 2)
      .map(n => Number.parseInt(n, 10));

    titulosPendentes.push({
      idx,
      nome: nomeTitulosPendentes[idx],
      devolucao: new Date(
        Number.parseInt(partesData[2], 10),
        Number.parseInt(partesData[1], 10) - 1,
        Number.parseInt(partesData[0], 10),
      ),
      renovacoes: { qtdFeitas, qtdLimite },
    });
  }

  return response;
};

module.exports = getTitulosPendentes;
