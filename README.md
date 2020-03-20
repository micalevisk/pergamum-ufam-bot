# pergamum-ufam-bot
![workflow run](https://github.com/micalevisk/pergamum-ufam-bot/workflows/Run/badge.svg?event=push)

## Features

- [x] listar títulos pendentes (nome, quantidades de renovações e data de devolução)
- [x] renovar títulos pendentes passíveis de renovação com empréstimos que irão expirar em `n` dias
  + [x] retornar o nome do título e se houve sucesso ou falha (com o motivo)
  + [ ] opção de enviar recibo por email para cada tentativa de renovação


```bash
npm install
cp .env.example .env # and setup your credentials in the `.env` file
DEBUG=true npm start 'signIn | getTitulosPendentes | renovarTitulos'
```

Exemplo de saída pro caso de renovação feita:
```
[
  { username: 'MICAEL LEVI LIMA CAVALCANTE' },
  {
    titulosPendentes: [
      {
        idx: 0,
        nome: 'Metodologia de pesquisa para ciência da computação / 2009 - Livros',
        devolucao: 2020-03-31T04:00:00.000Z,
        renovacoes: { qtdFeitas: 2, qtdLimite: 99 }
      }
    ]
  },
  {
    titulosRenovados: [
      {
        idx: 0,
        infos: {
          'código': '379634',
          'título': 'Metodologia de pesquisa para ciência da computação',
          'data de devolução': '31/03/2020 00:00:00',
          'chave de segurança': '3796342439343721'
        }
      }
    ],
    titulosCancelados: []
  }
]
```

Exemplo de saída ao tentar renovar o mesmo exemplar anterior:
```
[
  { username: 'MICAEL LEVI LIMA CAVALCANTE' },
  {
    titulosPendentes: [
      {
        idx: 0,
        nome: 'Metodologia de pesquisa para ciência da computação / 2009 - Livros',
        devolucao: 2020-03-31T04:00:00.000Z,
        renovacoes: { qtdFeitas: 3, qtdLimite: 99 }
      }
    ]
  },
  {
    titulosRenovados: [],
    titulosCancelados: [
      {
        idx: 0,
        infos: {
          'código': '379634',
          'título': 'Metodologia de pesquisa para ciência da computação',
          motivo: 'Renovação Cancelada. Exemplar já está renovado.'
        }
      }
    ]
  }
]
```

Exemplo de saída quando não há títulos a serem renovados:
```
[
  { username: 'MICAEL LEVI LIMA CAVALCANTE' },
  {
    titulosPendentes: [
      {
        idx: 0,
        nome: 'Metodologia de pesquisa para ciência da computação / 2009 - Livros',
        devolucao: 2020-03-31T04:00:00.000Z,
        renovacoes: { qtdFeitas: 3, qtdLimite: 99 }
      }
    ]
  },
  { titulosRenovados: [], titulosCancelados: [] }
]
```
