/* =========================================================
   MODAL DE AGENDAMENTO — Beneficência Portuguesa de Santo André
   ---------------------------------------------------------
   Como abrir: qualquer link/botão com  data-agendar
   (opcional: data-especialidade="Pediatria" ou data-tipo="exame")
   ou um link para  #agendar
   ========================================================= */
(function () {
  'use strict';

  /* ================= CONFIGURAÇÃO ================= */
  var CONFIG = {
    // Endereço da API que recebe o agendamento (POST JSON).
    // Enquanto estiver vazio, o modal funciona em MODO DEMONSTRAÇÃO.
    endpoint: '',
    // Endereço da API que devolve os horários livres:
    //   GET {disponibilidade}?tipo=consulta&item=Pediatria&data=2026-10-20  ->  ["08:00","08:30",...]
    // Enquanto estiver vazio, os horários são simulados.
    disponibilidade: '',
    telefone: '(11) 2198-5200',
    telefoneHref: 'tel:+551121985200',
    diasAFrente: 60
  };

  var ESPECIALIDADES = ['Angiologia','Cardiologia','Cirurgia Buco-Maxilo-Facial','Cirurgia Cardíaca','Cirurgia de Cabeça e Pescoço','Cirurgia de Mão','Cirurgia Geral','Cirurgia Plástica','Cirurgia Torácica','Cirurgia Vascular','Clínica Médica','Dermatologia','Endocrinologia','Gastroenterologia','Geriatria','Ginecologia e Obstetrícia','Mastologia','Nefrologia','Neurocirurgia','Neurologia','Oftalmologia','Ortopedia e Traumatologia','Otorrinolaringologia','Pediatria','Proctologia','Reumatologia','Traumatologia de Face'];
  var EXAMES = ['Exames laboratoriais','Raio-X','Tomografia computadorizada','Exames radiológicos contrastados','Exames oftalmológicos','Outros exames complementares'];
  var CONVENIOS = ['Allianz','Amil Individual','Amil Empresas','Bradesco','Cabesp','Economus','Hapvida NotreDame','Hapvida NotreDame Intermédica','Mediservice','Mediservice (Porto Seguro, Care Plus, Abertta, FAPES)','Omint','Porto Seguro Saúde'];

  var MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var SEMANA = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];

  /* ================= ÍCONES ================= */
  var ic = function (d, s) { s = s || 22; return '<svg aria-hidden="true" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var I = {
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    esq: '<path d="m15 6-6 6 6 6"/>', dir: '<path d="m9 6 6 6-6 6"/>',
    esteto: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
    lab: '<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7 15h10"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    cartao: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    ok: '<path d="M20 6 9 17l-5-5"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    baixar: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'
  };

  /* ================= ESTADO ================= */
  var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  var limite = new Date(hoje); limite.setDate(limite.getDate() + CONFIG.diasAFrente);
  var st, mesVisto, passo, dlg, gatilho;

  function novoEstado() {
    st = { tipo: 'consulta', item: '', pagamento: 'convenio', convenio: '', carteirinha: '', data: null, hora: '',
      nome: '', nascimento: '', cpf: '', telefone: '', email: '', responsavel: '', respCpf: '', obs: '', aceite: false };
    mesVisto = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    passo = 1;
  }

  /* ================= UTILITÁRIOS ================= */
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var dataLonga = function (d) { return SEMANA[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear(); };
  var idade = function (s) {
    if (!s) return null; var n = new Date(s + 'T00:00:00'); if (isNaN(n)) return null;
    var a = hoje.getFullYear() - n.getFullYear(); var m = hoje.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) a--; return a;
  };
  function cpfValido(v) {
    v = (v || '').replace(/\D/g, ''); if (v.length !== 11 || /^(\d)\1+$/.test(v)) return false;
    for (var t = 9; t < 11; t++) { var s = 0; for (var i = 0; i < t; i++) s += +v[i] * (t + 1 - i); if (((s * 10) % 11) % 10 !== +v[t]) return false; }
    return true;
  }
  var mascaraCpf = function (v) { v = v.replace(/\D/g, '').slice(0, 11); return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); };
  var mascaraTel = function (v) { v = v.replace(/\D/g, '').slice(0, 11); if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3'); if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3'); if (v.length > 2) return v.replace(/(\d{2})(\d+)/, '($1) $2'); return v; };

  /* ---------- Disponibilidade simulada (determinística) ---------- */
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
  function gradeDoDia(d) {
    var dow = d.getDay(); if (dow === 0) return [];
    var fim = dow === 6 ? 12 : 17.5, h = [], t;
    for (t = 7.5; t <= fim; t += 0.5) { if (t >= 12 && t < 13.5) continue; h.push(pad(Math.floor(t)) + ':' + (t % 1 ? '30' : '00')); }
    return h;
  }
  function horariosSimulados(d) {
    var chave = st.tipo + '|' + st.item + '|' + iso(d);
    if (hash(chave + 'dia') < 0.18) return []; // dia lotado
    var agora = new Date();
    return gradeDoDia(d).map(function (h) {
      var livre = hash(chave + h) > 0.45;
      if (iso(d) === iso(agora)) { var p = h.split(':'); if (+p[0] * 60 + +p[1] <= agora.getHours() * 60 + agora.getMinutes() + 60) livre = false; }
      return { hora: h, livre: livre };
    });
  }
  function horarios(d) {
    if (d < hoje || d > limite) return Promise.resolve([]);
    if (CONFIG.disponibilidade) {
      var u = CONFIG.disponibilidade + '?tipo=' + encodeURIComponent(st.tipo) + '&item=' + encodeURIComponent(st.item) + '&data=' + iso(d);
      return fetch(u).then(function (r) { return r.json(); }).then(function (livres) {
        return gradeDoDia(d).map(function (h) { return { hora: h, livre: livres.indexOf(h) > -1 }; });
      }).catch(function () { return []; });
    }
    return Promise.resolve(horariosSimulados(d));
  }
  function statusDia(d) {
    if (d < hoje || d > limite || d.getDay() === 0) return 'fechado';
    if (CONFIG.disponibilidade) return 'livre';
    var l = horariosSimulados(d).filter(function (x) { return x.livre; }).length;
    return l === 0 ? 'fechado' : (l <= 4 ? 'poucos' : 'livre');
  }

  /* ================= MONTAGEM DO MODAL ================= */
  function opcoes(lista, sel, vazio) {
    return '<option value="">' + vazio + '</option>' + lista.map(function (x) { return '<option' + (x === sel ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('');
  }

  function criar() {
    dlg = document.createElement('dialog');
    dlg.className = 'ag-dialog';
    dlg.setAttribute('aria-labelledby', 'ag-titulo');
    dlg.innerHTML =
      '<div class="ag-topo"><h2 id="ag-titulo">' + ic(I.cal) + 'Agendar consulta ou exame</h2>' +
      '<button type="button" class="ag-fechar" data-ag="fechar" aria-label="Fechar">' + ic(I.x, 20) + '</button></div>' +
      '<ol class="ag-etapas" aria-label="Etapas"><li>Atendimento</li><li>Data e horário</li><li>Seus dados</li><li>Confirmação</li></ol>' +
      '<div class="ag-corpo" id="ag-corpo"></div>' +
      '<div class="ag-rodape"><span class="ag-tel">Prefere ligar? <a href="' + CONFIG.telefoneHref + '">' + CONFIG.telefone + '</a></span>' +
      '<div class="ag-acoes"><button type="button" class="ag-btn sec" data-ag="voltar">' + ic(I.esq, 18) + 'Voltar</button>' +
      '<button type="button" class="ag-btn pri" data-ag="avancar">Continuar' + ic(I.dir, 18) + '</button></div></div>';
    document.body.appendChild(dlg);

    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) { fechar(); return; }
      var b = e.target.closest('[data-ag]'); if (!b) return;
      var a = b.getAttribute('data-ag');
      if (a === 'fechar') fechar();
      else if (a === 'voltar') irPara(passo - 1);
      else if (a === 'avancar') avancar();
      else if (a === 'mes-ant') { mesVisto.setMonth(mesVisto.getMonth() - 1); desenharCalendario(); }
      else if (a === 'mes-prox') { mesVisto.setMonth(mesVisto.getMonth() + 1); desenharCalendario(); }
      else if (a === 'dia') { st.data = new Date(+b.dataset.t); st.hora = ''; desenharCalendario(); desenharHorarios(); }
      else if (a === 'hora') { st.hora = b.dataset.h; desenharHorarios(); }
      else if (a === 'editar') irPara(+b.dataset.p);
      else if (a === 'ics') baixarIcs();
      else if (a === 'novo') { novoEstado(); render(); }
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); fechar(); });
    dlg.addEventListener('close', function () { document.body.classList.remove('ag-aberto'); if (gatilho) gatilho.focus(); });
  }

  function render() {
    var c = document.getElementById('ag-corpo');
    var etapas = dlg.querySelectorAll('.ag-etapas li');
    etapas.forEach(function (li, i) { li.className = i + 1 < passo ? 'feita' : (i + 1 === passo ? 'atual' : ''); if (i + 1 === passo) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    dlg.querySelector('.ag-etapas').hidden = passo === 5;
    var voltar = dlg.querySelector('[data-ag="voltar"]'), avan = dlg.querySelector('[data-ag="avancar"]');
    voltar.hidden = passo === 1 || passo === 5;
    avan.hidden = passo === 5;
    avan.innerHTML = passo === 4 ? ic(I.ok, 18) + 'Confirmar agendamento' : 'Continuar' + ic(I.dir, 18);

    if (passo === 1) c.innerHTML = passo1();
    if (passo === 2) { c.innerHTML = passo2(); desenharCalendario(); desenharHorarios(); }
    if (passo === 3) c.innerHTML = passo3();
    if (passo === 4) c.innerHTML = passo4();
    if (passo === 5) c.innerHTML = passo5();
    c.scrollTop = 0;
    ligarCampos();
  }

  /* ---------- Passo 1: atendimento ---------- */
  function passo1() {
    var lista = st.tipo === 'consulta' ? ESPECIALIDADES : EXAMES;
    return '<section class="ag-passo ativo"><h3>Que tipo de atendimento você precisa?</h3><p class="ag-sub">Escolha o tipo, a especialidade ou o exame e a forma de pagamento.</p>' +
      '<div class="ag-tipos" role="radiogroup" aria-label="Tipo de atendimento">' +
      '<label class="ag-tipo"><input type="radio" name="ag-tipo" value="consulta"' + (st.tipo === 'consulta' ? ' checked' : '') + '><span><i>' + ic(I.esteto) + '</i><span class="ag-tipo-txt"><b>Consulta</b><small>Com um médico especialista</small></span></span></label>' +
      '<label class="ag-tipo"><input type="radio" name="ag-tipo" value="exame"' + (st.tipo === 'exame' ? ' checked' : '') + '><span><i>' + ic(I.lab) + '</i><span class="ag-tipo-txt"><b>Exame</b><small>Laboratório e imagem</small></span></span></label></div>' +
      '<div class="ag-grid">' +
      '<div class="ag-campo inteiro" data-campo="item"><label for="ag-item">' + (st.tipo === 'consulta' ? 'Especialidade' : 'Exame') + ' <em>*</em></label>' +
      '<select id="ag-item" data-k="item">' + opcoes(lista, st.item, 'Selecione') + '</select><span class="ag-erro">Selecione ' + (st.tipo === 'consulta' ? 'a especialidade' : 'o exame') + '.</span></div>' +
      (st.tipo === 'exame' ? '<p class="ag-dica inteiro" style="margin:-6px 0 0">Tenha em mãos o pedido médico. Ele será solicitado no dia do exame.</p>' : '') +
      '<div class="ag-campo" data-campo="pagamento"><label for="ag-pag">Forma de atendimento <em>*</em></label>' +
      '<select id="ag-pag" data-k="pagamento"><option value="convenio"' + (st.pagamento === 'convenio' ? ' selected' : '') + '>Convênio</option><option value="particular"' + (st.pagamento === 'particular' ? ' selected' : '') + '>Particular</option></select></div>' +
      (st.pagamento === 'convenio'
        ? '<div class="ag-campo" data-campo="convenio"><label for="ag-conv">Convênio <em>*</em></label><select id="ag-conv" data-k="convenio">' + opcoes(CONVENIOS, st.convenio, 'Selecione o convênio') + '</select><span class="ag-erro">Selecione o convênio.</span></div>' +
          '<div class="ag-campo inteiro" data-campo="carteirinha"><label for="ag-cart">Número da carteirinha <em>*</em></label><input id="ag-cart" data-k="carteirinha" inputmode="numeric" autocomplete="off" value="' + esc(st.carteirinha) + '" placeholder="Número impresso na carteirinha do convênio"><span class="ag-erro">Informe o número da carteirinha.</span></div>'
        : '<div class="ag-campo"><span class="ag-dica" style="padding-top:30px">Os valores do atendimento particular são informados pela central.</span></div>') +
      '</div></section>';
  }

  /* ---------- Passo 2: data e horário ---------- */
  function passo2() {
    return '<section class="ag-passo ativo"><h3>Escolha a data e o horário</h3><p class="ag-sub">' + esc(st.item) + ' · datas disponíveis nos próximos ' + CONFIG.diasAFrente + ' dias.</p>' +
      '<div class="ag-agenda"><div class="ag-cal" id="ag-cal"></div><div class="ag-horarios" id="ag-horarios" aria-live="polite"></div></div>' +
      '<span class="ag-erro" id="ag-erro-data" style="margin-top:12px">Escolha um dia e um horário para continuar.</span></section>';
  }
  function desenharCalendario() {
    var box = document.getElementById('ag-cal'); if (!box) return;
    var ano = mesVisto.getFullYear(), mes = mesVisto.getMonth();
    var primeiro = new Date(ano, mes, 1).getDay(), total = new Date(ano, mes + 1, 0).getDate();
    var podeAnt = new Date(ano, mes, 1) > new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    var podeProx = new Date(ano, mes + 1, 1) <= limite;
    var h = '<div class="ag-cal-topo"><button type="button" data-ag="mes-ant" aria-label="Mês anterior"' + (podeAnt ? '' : ' disabled') + '>' + ic(I.esq, 18) + '</button>' +
      '<strong aria-live="polite">' + MESES[mes] + ' ' + ano + '</strong>' +
      '<button type="button" data-ag="mes-prox" aria-label="Próximo mês"' + (podeProx ? '' : ' disabled') + '>' + ic(I.dir, 18) + '</button></div>' +
      '<div class="ag-semana" aria-hidden="true"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div><div class="ag-dias">';
    for (var i = 0; i < primeiro; i++) h += '<span></span>';
    for (var d = 1; d <= total; d++) {
      var dt = new Date(ano, mes, d), s = statusDia(dt), cls = 'ag-dia';
      var sel = st.data && iso(st.data) === iso(dt);
      if (iso(dt) === iso(hoje)) cls += ' hoje';
      if (s !== 'fechado') {
        cls += ' livre' + (s === 'poucos' ? ' poucos' : '') + (sel ? ' sel' : '');
        h += '<button type="button" class="' + cls + '" data-ag="dia" data-t="' + dt.getTime() + '" aria-label="' + dataLonga(dt) + (s === 'poucos' ? ', poucos horários' : ', horários disponíveis') + '"' + (sel ? ' aria-pressed="true"' : '') + '>' + d + '</button>';
      } else {
        h += '<span class="' + cls + '" aria-hidden="true">' + d + '</span>';
      }
    }
    h += '</div><div class="ag-legenda"><span><i style="background:#1FAE6E"></i>Disponível</span><span><i style="background:#E9A92B"></i>Poucos horários</span><span><i style="background:#D5DCEB"></i>Indisponível</span></div>';
    box.innerHTML = h;
  }
  function desenharHorarios() {
    var box = document.getElementById('ag-horarios'); if (!box) return;
    if (!st.data) { box.innerHTML = '<div class="ag-vazio">' + ic(I.cal, 28) + '<p style="margin:10px 0 0">Selecione um dia disponível no calendário para ver os horários.</p></div>'; return; }
    var d = st.data;
    horarios(d).then(function (lista) {
      var livres = lista.filter(function (x) { return x.livre; });
      var h = '<h4>' + dataLonga(d).replace(/^./, function (c) { return c.toUpperCase(); }) + '</h4><p>' + livres.length + ' horário' + (livres.length === 1 ? '' : 's') + ' disponíve' + (livres.length === 1 ? 'l' : 'is') + '</p>';
      if (!livres.length) { box.innerHTML = h + '<div class="ag-vazio">Não há horários livres neste dia. Escolha outra data.</div>'; return; }
      [['Manhã', function (x) { return +x.hora.slice(0, 2) < 12; }], ['Tarde', function (x) { return +x.hora.slice(0, 2) >= 12; }]].forEach(function (p) {
        var g = lista.filter(p[1]); if (!g.length) return;
        h += '<div class="ag-periodo">' + p[0] + '</div><div class="ag-slots">' + g.map(function (x) {
          return '<button type="button" class="ag-slot' + (st.hora === x.hora ? ' sel' : '') + '" data-ag="hora" data-h="' + x.hora + '"' + (x.livre ? '' : ' disabled aria-label="' + x.hora + ' indisponível"') + (st.hora === x.hora ? ' aria-pressed="true"' : '') + '>' + x.hora + '</button>';
        }).join('') + '</div>';
      });
      box.innerHTML = h;
    });
  }

  /* ---------- Passo 3: dados ---------- */
  function campo(id, k, rotulo, attrs, erro, cls) {
    return '<div class="ag-campo ' + (cls || '') + '" data-campo="' + k + '"><label for="' + id + '">' + rotulo + (erro ? ' <em>*</em>' : '') + '</label><input id="' + id + '" data-k="' + k + '" value="' + esc(st[k]) + '" ' + attrs + '>' + (erro ? '<span class="ag-erro">' + erro + '</span>' : '') + '</div>';
  }
  function passo3() {
    var id = idade(st.nascimento), menor = id !== null && id < 18;
    return '<section class="ag-passo ativo"><h3>Dados do paciente</h3><p class="ag-sub">Preencha com os dados de quem será atendido.</p><div class="ag-grid">' +
      campo('ag-nome', 'nome', 'Nome completo', 'autocomplete="name"', 'Informe o nome completo.', 'inteiro') +
      campo('ag-nasc', 'nascimento', 'Data de nascimento', 'type="date" autocomplete="bday" max="' + iso(hoje) + '"', 'Informe uma data de nascimento válida.') +
      campo('ag-cpf', 'cpf', 'CPF', 'inputmode="numeric" autocomplete="off" placeholder="000.000.000-00"', 'Informe um CPF válido.') +
      campo('ag-tel', 'telefone', 'Celular (WhatsApp)', 'type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(11) 90000-0000"', 'Informe um celular com DDD.') +
      campo('ag-email', 'email', 'E-mail', 'type="email" autocomplete="email" placeholder="voce@email.com"', 'Informe um e-mail válido.') +
      (menor ? '<div class="ag-bloco" id="ag-resp"><p>Paciente menor de idade: informe o responsável legal</p>' +
        campo('ag-resp-nome', 'responsavel', 'Nome do responsável', 'autocomplete="off"', 'Informe o nome do responsável.') +
        campo('ag-resp-cpf', 'respCpf', 'CPF do responsável', 'inputmode="numeric" autocomplete="off" placeholder="000.000.000-00"', 'Informe um CPF válido.') + '</div>' : '') +
      '<div class="ag-campo inteiro"><label for="ag-obs">Observações <span style="font-weight:500;color:#8A97B8">(opcional)</span></label><textarea id="ag-obs" data-k="obs" maxlength="400" placeholder="Ex.: preferência por médico, necessidade de acessibilidade">' + esc(st.obs) + '</textarea></div>' +
      '<label class="ag-check" data-campo="aceite"><input type="checkbox" data-k="aceite"' + (st.aceite ? ' checked' : '') + '><span>Autorizo o uso dos meus dados para o agendamento e para receber a confirmação por telefone, WhatsApp ou e-mail, conforme a <a href="#" style="color:#1638A8;font-weight:700">Política de Privacidade</a> (LGPD).</span></label>' +
      '</div></section>';
  }

  /* ---------- Passo 4: revisão ---------- */
  function linha(icone, rot, val, p) {
    return '<div class="ag-resumo-linha"><i>' + ic(icone, 20) + '</i><div><small>' + rot + '</small><b>' + val + '</b></div>' + (p ? '<button type="button" data-ag="editar" data-p="' + p + '">Alterar</button>' : '') + '</div>';
  }
  function resumo(editavel) {
    var e = editavel;
    return '<div class="ag-resumo">' +
      linha(st.tipo === 'consulta' ? I.esteto : I.lab, st.tipo === 'consulta' ? 'Consulta' : 'Exame', esc(st.item), e && 1) +
      linha(I.cal, 'Data e horário', dataLonga(st.data).replace(/^./, function (c) { return c.toUpperCase(); }) + ' às ' + st.hora, e && 2) +
      linha(I.cartao, 'Atendimento', st.pagamento === 'convenio' ? esc(st.convenio) + ' · carteirinha ' + esc(st.carteirinha) : 'Particular', e && 1) +
      linha(I.user, 'Paciente', esc(st.nome) + '<br><span style="font-weight:500;color:#4A5878;font-size:14px">' + esc(st.telefone) + ' · ' + esc(st.email) + '</span>', e && 3) +
      linha(I.pin, 'Local', 'Av. Portugal, 530 — Jardim Bela Vista, Santo André - SP') +
      '</div>';
  }
  function passo4() {
    return '<section class="ag-passo ativo"><h3>Confira seu agendamento</h3><p class="ag-sub">Revise as informações antes de confirmar.</p>' + resumo(true) +
      '<div class="ag-aviso">' + ic(I.info, 20) + '<span>Chegue com 15 minutos de antecedência e traga documento com foto' + (st.pagamento === 'convenio' ? ', carteirinha do convênio' : '') + (st.tipo === 'exame' ? ', pedido médico' : '') + '. Alguns convênios exigem autorização prévia.</span></div></section>';
  }

  /* ---------- Passo 5: sucesso ---------- */
  function passo5() {
    return '<section class="ag-passo ativo ag-sucesso"><span class="ag-sucesso-icone">' + ic(I.ok, 40) + '</span><h3>Agendamento solicitado!</h3>' +
      '<p class="ag-sub" style="margin:0">Enviaremos a confirmação para ' + esc(st.telefone) + ' e ' + esc(st.email) + '.</p>' +
      '<div class="ag-protocolo"><small>Protocolo</small><b>' + st.protocolo + '</b></div>' + resumo(false) +
      '<ul class="ag-lembrete"><li>' + ic(I.relogio, 18) + 'Chegue 15 minutos antes do horário.</li><li>' + ic(I.doc, 18) + 'Traga documento com foto' + (st.pagamento === 'convenio' ? ' e carteirinha do convênio' : '') + (st.tipo === 'exame' ? ' e o pedido médico' : '') + '.</li><li>' + ic(I.info, 18) + 'Para cancelar ou remarcar, ligue para ' + CONFIG.telefone + '.</li></ul>' +
      (CONFIG.endpoint ? '' : '<p class="ag-demo">Modo demonstração: este agendamento não foi enviado ao hospital.</p>') +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px"><button type="button" class="ag-btn pri" data-ag="ics">' + ic(I.baixar, 18) + 'Adicionar à agenda</button><button type="button" class="ag-btn sec" data-ag="fechar">Concluir</button></div></section>';
  }

  /* ================= CAMPOS E VALIDAÇÃO ================= */
  function ligarCampos() {
    dlg.querySelectorAll('input[name="ag-tipo"]').forEach(function (r) {
      r.addEventListener('change', function () { st.tipo = r.value; st.item = ''; st.data = null; st.hora = ''; render(); dlg.querySelector('input[name="ag-tipo"]:checked').focus(); });
    });
    dlg.querySelectorAll('[data-k]').forEach(function (el) {
      var k = el.getAttribute('data-k');
      var ev = el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date' ? 'change' : 'input';
      el.addEventListener(ev, function () {
        if (k === 'cpf' || k === 'respCpf') el.value = mascaraCpf(el.value);
        if (k === 'telefone') el.value = mascaraTel(el.value);
        st[k] = el.type === 'checkbox' ? el.checked : el.value;
        var c = el.closest('[data-campo]'); if (c) c.classList.remove('erro');
        if (k === 'pagamento') { render(); document.getElementById('ag-pag').focus(); }
        if (k === 'item') { st.data = null; st.hora = ''; }
        if (k === 'nascimento') {
          var temBloco = !!document.getElementById('ag-resp'), id = idade(st.nascimento), menor = id !== null && id < 18;
          if (menor !== temBloco) { render(); document.getElementById('ag-nasc').focus(); }
        }
      });
    });
  }
  function marcar(k, ok) { var c = dlg.querySelector('[data-campo="' + k + '"]'); if (c) c.classList.toggle('erro', !ok); return ok; }
  function validar() {
    var ok = true, primeiro = null;
    var t = function (k, cond) { var r = marcar(k, cond); if (!r && !primeiro) primeiro = k; ok = ok && r; };
    if (passo === 1) {
      t('item', !!st.item);
      if (st.pagamento === 'convenio') { t('convenio', !!st.convenio); t('carteirinha', st.carteirinha.replace(/\D/g, '').length >= 4); }
    }
    if (passo === 2) {
      ok = !!(st.data && st.hora);
      document.getElementById('ag-erro-data').style.display = ok ? 'none' : 'block';
      if (!ok) document.getElementById('ag-erro-data').scrollIntoView({ block: 'nearest' });
    }
    if (passo === 3) {
      var id = idade(st.nascimento);
      t('nome', st.nome.trim().split(/\s+/).length >= 2);
      t('nascimento', id !== null && id >= 0 && id < 130);
      t('cpf', cpfValido(st.cpf));
      t('telefone', st.telefone.replace(/\D/g, '').length >= 10);
      t('email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(st.email));
      if (id !== null && id < 18) { t('responsavel', st.responsavel.trim().split(/\s+/).length >= 2); t('respCpf', cpfValido(st.respCpf)); }
      var ac = dlg.querySelector('[data-campo="aceite"]'); ac.classList.toggle('erro', !st.aceite); if (!st.aceite) { ok = false; if (!primeiro) primeiro = 'aceite'; }
    }
    if (primeiro) { var el = dlg.querySelector('[data-campo="' + primeiro + '"] input, [data-campo="' + primeiro + '"] select'); if (el) el.focus(); }
    return ok;
  }

  /* ================= NAVEGAÇÃO ================= */
  function irPara(n) { if (n < 1) return; passo = n; render(); var h = dlg.querySelector('.ag-passo h3'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
  function avancar() {
    if (!validar()) return;
    if (passo === 2 && !st.data) return;
    if (passo < 4) { if (passo === 1 && !st.data) { mesVisto = new Date(hoje.getFullYear(), hoje.getMonth(), 1); } irPara(passo + 1); return; }
    enviar();
  }
  function enviar() {
    var btn = dlg.querySelector('[data-ag="avancar"]');
    btn.disabled = true; btn.textContent = 'Enviando…';
    st.protocolo = 'BP' + iso(new Date()).replace(/-/g, '').slice(2) + '-' + String(Math.floor(1000 + Math.random() * 9000));
    var dados = { protocolo: st.protocolo, tipo: st.tipo, item: st.item, data: iso(st.data), hora: st.hora, pagamento: st.pagamento,
      convenio: st.convenio, carteirinha: st.carteirinha, paciente: { nome: st.nome, nascimento: st.nascimento, cpf: st.cpf, telefone: st.telefone, email: st.email },
      responsavel: st.responsavel ? { nome: st.responsavel, cpf: st.respCpf } : null, observacoes: st.obs, consentimentoLGPD: st.aceite };
    var p = CONFIG.endpoint
      ? fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json().catch(function () { return {}; }); })
      : new Promise(function (r) { setTimeout(r, 700); });
    p.then(function (resp) {
      if (resp && resp.protocolo) st.protocolo = resp.protocolo;
      btn.disabled = false; irPara(5);
    }).catch(function () {
      btn.disabled = false; render();
      var corpo = document.getElementById('ag-corpo');
      corpo.insertAdjacentHTML('afterbegin', '<div class="ag-aviso" role="alert" style="margin:0 0 16px;background:#FFF4F2;color:#7A1A10">' + ic(I.info, 20) + '<span>Não foi possível concluir o agendamento agora. Tente novamente ou ligue para ' + CONFIG.telefone + '.</span></div>');
    });
  }
  function baixarIcs() {
    var p = st.hora.split(':'), ini = new Date(st.data); ini.setHours(+p[0], +p[1]);
    var fim = new Date(ini.getTime() + 30 * 60000);
    var f = function (d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00'; };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Beneficencia Portuguesa Santo Andre//Agendamento//PT', 'BEGIN:VEVENT',
      'UID:' + st.protocolo + '@beneficenciasantoandre.com.br', 'DTSTAMP:' + f(new Date()), 'DTSTART;TZID=America/Sao_Paulo:' + f(ini), 'DTEND;TZID=America/Sao_Paulo:' + f(fim),
      'SUMMARY:' + (st.tipo === 'consulta' ? 'Consulta - ' : 'Exame - ') + st.item, 'LOCATION:Beneficência Portuguesa\\, Av. Portugal\\, 530 - Santo André - SP',
      'DESCRIPTION:Protocolo ' + st.protocolo + '. Chegue 15 minutos antes. Dúvidas: ' + CONFIG.telefone,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete do agendamento', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'agendamento-' + st.protocolo + '.ics';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ================= ABRIR / FECHAR ================= */
  function abrir(opts) {
    if (!dlg) criar();
    novoEstado();
    opts = opts || {};
    if (opts.tipo === 'exame') st.tipo = 'exame';
    if (opts.item) st.item = opts.item;
    render();
    document.body.classList.add('ag-aberto');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    var f = dlg.querySelector(st.item ? '#ag-pag' : '#ag-item'); if (f) f.focus();
  }
  function fechar() {
    if (passo > 1 && passo < 5 && !confirm('Deseja sair? Os dados preenchidos serão perdidos.')) return;
    if (dlg.close) dlg.close(); else dlg.removeAttribute('open');
    document.body.classList.remove('ag-aberto');
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-agendar], a[href="#agendar"]'); if (!a) return;
    e.preventDefault(); gatilho = a;
    var gaveta = document.getElementById('gaveta');
    if (gaveta && gaveta.classList.contains('aberta')) { var f = gaveta.querySelector('[data-fechar].btn-icone'); if (f) f.click(); }
    abrir({ tipo: a.getAttribute('data-tipo'), item: a.getAttribute('data-especialidade') || a.getAttribute('data-exame') });
  });
  if (location.hash === '#agendar') window.addEventListener('load', function () { abrir(); });
  window.BPAgendamento = { abrir: abrir, config: CONFIG };
})();
