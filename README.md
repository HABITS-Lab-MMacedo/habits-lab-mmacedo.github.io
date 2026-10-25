# HABITS Lab — website

Site do HABITS Lab (Constructor University), publicado com GitHub Pages em
**https://habits-lab-mmacedo.github.io**.

Feito em Jekyll, que o GitHub Pages compila sozinho: não precisa instalar nada,
basta editar os arquivos e dar push.

## Publicar pela primeira vez

1. Na organização `HABITS-Lab-MMacedo`, crie um repositório **público** chamado
   `habits-lab-mmacedo.github.io`.
2. Envie estes arquivos para a branch `main`:
   ```bash
   cd habits-site
   git init -b main
   git add .
   git commit -m "Initial lab website"
   git remote add origin https://github.com/HABITS-Lab-MMacedo/habits-lab-mmacedo.github.io.git
   git push -u origin main
   ```
3. Em **Settings → Pages**, em *Build and deployment*, escolha
   **Deploy from a branch**, branch `main`, pasta `/ (root)`.
4. Em 1–2 minutos o site aparece no endereço acima. O progresso fica na aba **Actions**.

## Onde editar cada coisa

| O que | Arquivo |
|---|---|
| Nome, descrição, e-mail, redes, menu | `_config.yml` |
| Pessoas (foto + GIF) | `_data/people.yml` e imagens em `assets/img/people/` |
| Temas de pesquisa | `_data/research.yml` |
| Publicações | `_data/publications.yml` |
| Prazos de conferências | `_data/deadlines.yml` |
| Disciplinas e material | `_data/teaching.yml` |
| Notícias | um arquivo `.md` por notícia em `_posts/` |
| Texto da página "Join us" | `join.md` |
| Cores e fontes | topo de `assets/css/main.css` |

### Adicionar uma pessoa com GIF

1. Coloque `nome.jpg` (foto estática) e `nome.gif` (animada) em `assets/img/people/`.
   Imagens quadradas ficam melhores; tente manter o GIF abaixo de ~2 MB.
2. Em `_data/people.yml`, adicione no grupo certo:
   ```yaml
   - name: Nome Sobrenome
     role: PhD Student
     topic: assunto da pesquisa
     photo: /assets/img/people/nome.jpg
     gif: /assets/img/people/nome.gif
     link: https://site-pessoal-ou-scholar
   ```
No computador, o GIF toca quando o mouse passa por cima; no celular ele toca
sozinho. Para deixar todos sempre animados, mude `people_gif_mode: always` no `_config.yml`.

Dica para gravar o GIF: um vídeo curto (2–3 s) de cada pessoa acenando,
convertido com [ezgif.com](https://ezgif.com/video-to-gif) em 400×400.

### Adicionar uma notícia

Crie `_posts/2026-11-20-titulo-curto.md`:
```markdown
---
title: Paper aceito no ICWSM 2027!
tags: [paper]
---
Texto da notícia em Markdown.
```

### Adicionar um prazo de conferência

Em `_data/deadlines.yml`:
```yaml
- name: NetSci 2027
  full: International School and Conference on Network Science
  url: https://...
  location: Cidade, País
  area: Network Science
  conference: June 1–5, 2027
  deadlines:
    - { label: Abstract, date: "2027-01-20" }
```
O horário padrão é 23:59 AoE (UTC−12). Para outro fuso use `time: "17:00"` e `tz: 1` (CET), por exemplo.
A contagem regressiva e a ordem são calculadas no navegador, então o site não precisa ser recompilado quando um prazo passa.

## Tema claro / escuro

O botão no canto superior direito alterna entre claro e escuro e lembra a escolha.
Sem escolha, o site segue o tema do sistema operacional.

## Testar localmente (opcional)

```bash
gem install bundler jekyll
bundle install
bundle exec jekyll serve
```
e abra http://localhost:4000.

## O que ainda falta preencher

- [ ] Significado da sigla HABITS e tagline final (`_config.yml`)
- [ ] E-mail oficial do lab (`_config.yml`)
- [ ] Fotos/GIFs e membros reais (`_data/people.yml`) — os atuais são exemplos
- [ ] Publicações reais (`_data/publications.yml`) — as atuais são exemplos
- [ ] Revisar os textos dos temas de pesquisa com a PI (`_data/research.yml`)
