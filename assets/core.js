(() => {
  'use strict';
  const SUPABASE_URL='https://jnctyowjstchfofqfhnm.supabase.co', KEY='sb_publishable_ZBPR_AtzIi2kYH8XO1Jffg_iKnCdE0X';
  const Lex=window.Lex={URL:SUPABASE_URL,KEY,routes:{},session:null,db:null,state:{health:null}};
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=v=>v?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Não informado';
  const badge=(v,type='')=>'<span class="badge '+type+'">'+esc(v)+'</span>';
  Object.assign(Lex,{$,$$,esc,date,badge});
  Lex.toast=(msg,error=false)=>{const el=$('#toast');el.textContent=msg;el.className='toast show'+(error?' error':'');clearTimeout(Lex.toast.timer);Lex.toast.timer=setTimeout(()=>el.className='toast',4500)};
  Lex.modal=(title,html)=>{$('#modal-title').textContent=title;$('#modal-body').innerHTML=html;$('#modal').showModal()};
  Lex.closeModal=()=>$('#modal').close();
  Lex.loading=()=>'<div class="list"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';
  Lex.empty=(text)=>'<div class="empty">'+esc(text)+'</div>';
  Lex.api=async(fn,{method='POST',body}={})=>{
    if(!Lex.session)throw new Error('Sessão necessária.');
    const r=await fetch(SUPABASE_URL+'/functions/v1/'+fn,{method,cache:'no-store',headers:{apikey:KEY,Authorization:'Bearer '+Lex.session.access_token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const raw=await r.text();let data={};try{data=raw?JSON.parse(raw):{}}catch{data={message:raw}}
    if(!r.ok)throw new Error(data.error||data.message||('Erro HTTP '+r.status));return data;
  };
  Lex.q=async(table,run)=>{const result=await run(Lex.db.from(table));if(result.error)throw result.error;return result.data};
  Lex.page=(title,subtitle,actions='')=>'<header class="page-head"><div><p class="eyebrow">LEX PROSPECT</p><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p></div><div class="actions">'+actions+'</div></header>';
  Lex.route=(path,title,render)=>Lex.routes[path]={title,render};
  Lex.navigate=path=>location.hash='#/'+path.replace(/^#?\/?/,'');
  Lex.store=(key,value)=>{localStorage.setItem('lex:'+key,JSON.stringify(value))};
  Lex.load=(key,fallback=[])=>{try{return JSON.parse(localStorage.getItem('lex:'+key))??fallback}catch{return fallback}};
  Lex.download=(name,rows)=>{
    if(!rows.length)return Lex.toast('Não há dados para exportar.',true);
    const cols=[...new Set(rows.flatMap(Object.keys))], cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
    const csv=[cols.map(cell).join(';'),...rows.map(r=>cols.map(c=>cell(r[c])).join(';'))].join('\n');
    const a=document.createElement('a');a.href=window.URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download=name;a.click();window.URL.revokeObjectURL(a.href);
  };
  const statusFrom=(v)=>{
    const raw=JSON.stringify(v??'').toLowerCase();
    if(/missing|ausente|sem credencial|not configured|não configur/.test(raw))return ['Sem credencial','warn'];
    if(/error|erro|failed|falha/.test(raw))return ['Erro','error'];
    if(v===true||/ok|active|ativo|connected|conectado|healthy/.test(raw))return ['Ativo','ok'];
    return ['Não configurado',''];
  };
  Lex.health=async(force=false)=>{
    if(Lex.state.health&&!force)return Lex.state.health;
    try{Lex.state.health=await Lex.api('prospect-health',{method:'GET'})}catch(e){Lex.state.health={_error:e.message}}
    return Lex.state.health;
  };

  Lex.route('painel','Painel',async()=>{
    $('#view').innerHTML=Lex.page('Painel','Estado real da operação e dos fluxos conectados.')+Lex.loading();
    const defs=[['campanhas','Campanhas'],['posts_content_scripts','Conteúdos'],['posts_items','Publicações'],['prospect_conversations','Conversas']];
    const counts=await Promise.all(defs.map(async([table,label])=>{try{const {count,error}=await Lex.db.from(table).select('*',{count:'exact',head:true});return {label,value:error?'Indisponível':count}}catch{return {label,value:'Indisponível'}}}));
    $('#view').innerHTML=Lex.page('Painel','Estado real da operação e dos fluxos conectados.','<button data-go="motores">Ver motores</button>')+
      '<section class="grid">'+counts.map(x=>'<article class="card metric span-3"><small>'+esc(x.label)+'</small><strong>'+esc(x.value)+'</strong></article>').join('')+
      '<article class="card span-8"><h2>Começar uma tarefa</h2><div class="actions"><button data-go="extracao/maps">Extrair leads</button><button data-go="crm/consultoria">Abrir CRM</button><button data-go="social/conteudos">Criar conteúdo</button><button data-go="social/campanhas">Nova campanha</button></div></article>'+
      '<article class="card span-4"><h2>Publicação segura</h2><p class="muted">Conteúdos são gerados, revisados e aprovados. Aprovar nunca publica automaticamente.</p></article></section>';
  });

  Lex.route('motores','Motores e APIs',async()=>{
    $('#view').innerHTML=Lex.page('Motores e APIs','Diagnóstico real de credenciais e integrações.','<button id="refresh-health">Atualizar diagnóstico</button>')+Lex.loading();
    const health=await Lex.health(true), tests=health.tests||health;
    const rows=[
      ['Google Places','Credencial',tests.google_places||tests.google],['OpenAI','Credencial',tests.openai],['Groq','Credencial',tests.groq],['Meta','Credencial OAuth',tests.meta],['Instagram','Conta social',tests.instagram],
      ['Extração de leads','prospect-extractor',tests.extractor||tests.google_places],['Saúde da prospecção','prospect-health',health._error?{error:health._error}:true],
      ['Agente Lex','lex-agent',tests.lex_agent||tests.groq||tests.openai],['Atendimento IA','prospect-chat-agent',tests.chat_agent||tests.groq||tests.openai],['Social Media IA','generate-post-script',tests.social_ai||tests.groq||tests.openai],
      ['Publicação Instagram','social-publish-instagram',tests.instagram],['Meta / Instagram OAuth','instagram-oauth-start',tests.meta],['MCP Lex Prospect','lex-prospect-mcp',tests.mcp]
    ];
    $('#view').innerHTML=Lex.page('Motores e APIs','Diagnóstico real de credenciais e integrações.','<button id="refresh-health">Atualizar diagnóstico</button>')+
      '<div class="table-wrap"><table><thead><tr><th>Motor</th><th>Função</th><th>Estado</th><th>Detalhe</th></tr></thead><tbody>'+rows.map(([name,fn,v])=>{const s=statusFrom(v);return '<tr><td><b>'+esc(name)+'</b></td><td>'+esc(fn)+'</td><td>'+badge(s[0],s[1])+'</td><td>'+esc(typeof v==='object'?v?.message||v?.error||v?.detail||'Resposta recebida':v===undefined?'Sem informação do diagnóstico':'Verificado')+'</td></tr>'}).join('')+'</tbody></table></div>';
  });

  Lex.route('agente','Agente Lex',async()=>{
    $('#view').innerHTML=Lex.page('Agente Lex','Assistente com resposta da função lex-agent.')+'<section class="card"><div id="agent-log" class="chat"><div class="bubble">Olá. Como posso ajudar na operação?</div></div><form id="agent-form" class="chat-send"><input id="agent-input" required placeholder="Digite sua solicitação"><button class="primary">Enviar</button></form><p id="agent-status" class="status-line"></p></section>';
  });
  Lex.route('atendimento','Atendimento',async()=>{
    $('#view').innerHTML=Lex.page('Atendimento','Conversas reais registradas na operação.')+Lex.loading();
    try{const rows=await Lex.q('prospect_conversations',q=>q.select('*').order('last_message_at',{ascending:false}).limit(50));$('#view').innerHTML=Lex.page('Atendimento','Conversas reais registradas na operação.')+(rows?.length?'<div class="list">'+rows.map(x=>'<article class="list-item"><div><b>'+esc(x.contact_name||x.phone||'Contato')+'</b><p>'+esc(x.channel||'canal não informado')+' · '+date(x.last_message_at)+'</p></div>'+badge(x.status||'aberta','info')+'</article>').join('')+'</div>':Lex.empty('Nenhuma conversa registrada.'))}catch(e){$('#view').innerHTML=Lex.page('Atendimento','Conversas reais registradas na operação.')+Lex.empty('Não foi possível carregar: '+e.message)}
  });
  Lex.route('agente/config','Configuração da agente',async()=>{
    $('#view').innerHTML=Lex.page('Configuração da agente','Ajustes reais salvos na tabela de agentes.')+Lex.loading();
    try{const rows=await Lex.q('agentes',q=>q.select('*').limit(20));$('#view').innerHTML=Lex.page('Configuração da agente','Ajustes reais salvos na tabela de agentes.')+(rows?.length?'<div class="list">'+rows.map(x=>'<article class="card"><form class="agent-config" data-id="'+esc(x.id)+'"><label>Nome</label><input name="nome" value="'+esc(x.nome)+'"><label>Função</label><input name="funcao" value="'+esc(x.funcao)+'"><label>Orientações</label><textarea name="prompt">'+esc(x.prompt)+'</textarea><label><input name="ativo" type="checkbox" '+(x.ativo?'checked':'')+'> Agente ativa</label><button class="primary">Salvar configuração</button></form></article>').join('')+'</div>':Lex.empty('Nenhum agente cadastrado.'))}catch(e){$('#view').innerHTML=Lex.page('Configuração da agente','Ajustes reais salvos na tabela de agentes.')+Lex.empty('Não foi possível carregar: '+e.message)}
  });
  ['preventivo','estrategico','prospectivo'].forEach(kind=>{
    const titles={preventivo:'Preventivo',estrategico:'Estratégico',prospectivo:'Prospectivo ético'};
    Lex.route('inteligencia/'+kind,titles[kind],async()=>{
      const saved=Lex.load('inteligencia:'+kind,{termos:'',regiao:'',observacoes:''});
      $('#view').innerHTML=Lex.page(titles[kind],'Monitoramento informativo, sem contato automático e com revisão humana.')+'<section class="card"><form id="intel-form" data-kind="'+kind+'"><label>Classes, assuntos ou termos</label><textarea name="termos" placeholder="Um por linha">'+esc(saved.termos)+'</textarea><div class="form-grid"><div><label>Região</label><input name="regiao" value="'+esc(saved.regiao)+'"></div><div><label>Finalidade</label><input value="Análise interna e ética" disabled></div></div><label>Observações</label><textarea name="observacoes">'+esc(saved.observacoes)+'</textarea><button class="primary">Salvar configuração neste navegador</button></form></section>';
    });
  });

  async function renderRoute(){
    if(!Lex.session)return;
    const path=(location.hash.replace(/^#\//,'')||'painel').split('?')[0], route=Lex.routes[path]||Lex.routes.painel;
    $('#page-title').textContent=route.title;$$('#nav a').forEach(a=>a.classList.toggle('active',a.hash==='#/'+path));$('#sidebar').classList.remove('open');
    try{await route.render()}catch(e){$('#view').innerHTML=Lex.page(route.title,'')+Lex.empty('Erro ao carregar esta área: '+e.message)}
    $('#view').focus({preventScroll:true});window.scrollTo(0,0);
  }
  async function setSession(session){
    Lex.session=session;$('#auth').hidden=!!session;$('#app').hidden=!session;
    if(session){
      $('#session-email').textContent=session.user?.email||'';
      if(/access_token=|refresh_token=|error_description=/.test(location.hash)||new URLSearchParams(location.search).has('code')){
        history.replaceState(null,'',location.pathname+'#/painel');
      }
      await renderRoute();
    }
  }
  function showAuthError(){
    const hash=new URLSearchParams(location.hash.replace(/^#/,'')),query=new URLSearchParams(location.search);
    const message=hash.get('error_description')||query.get('error_description')||query.get('error');
    if(message)$('#login-status').textContent='Não foi possível concluir este link: '+decodeURIComponent(message)+'. Solicite um novo link uma única vez.';
  }
  document.addEventListener('click',async e=>{
    const go=e.target.closest('[data-go]');if(go)Lex.navigate(go.dataset.go);
    if(e.target.id==='menu')$('#sidebar').classList.toggle('open');
    if(e.target.id==='refresh-health'){Lex.state.health=null;renderRoute()}
  });
  document.addEventListener('submit',async e=>{
    if(e.target.id==='login-form'){e.preventDefault();const st=$('#login-status'),email=$('#login-email').value.trim(),button=e.submitter||$('button[type="submit"]',e.target);button.disabled=true;st.textContent='Enviando link seguro…';const {error}=await Lex.db.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+'/',shouldCreateUser:false}});button.disabled=false;st.textContent=error?'Não foi possível enviar: '+error.message:'Link enviado. Toque apenas uma vez no e-mail mais recente.';return}
    if(e.target.id==='agent-form'){e.preventDefault();const input=$('#agent-input'),msg=input.value.trim();if(!msg)return;$('#agent-log').insertAdjacentHTML('beforeend','<div class="bubble me">'+esc(msg)+'</div>');input.value='';$('#agent-status').textContent='Agente trabalhando…';try{const out=await Lex.api('lex-agent',{body:{message:msg,conversation_id:Lex.state.agentConversation||null}});Lex.state.agentConversation=out.conversation_id;$('#agent-log').insertAdjacentHTML('beforeend','<div class="bubble">'+esc(out.answer||out.message||'Resposta recebida sem conteúdo.')+'</div>');$('#agent-log').scrollTop=$('#agent-log').scrollHeight;$('#agent-status').textContent=''}catch(err){$('#agent-status').textContent='Erro: '+err.message}return}
    if(e.target.matches('.agent-config')){e.preventDefault();const f=e.target,data=Object.fromEntries(new FormData(f));data.ativo=f.ativo.checked;try{const {error}=await Lex.db.from('agentes').update(data).eq('id',f.dataset.id);if(error)throw error;Lex.toast('Configuração salva.')}catch(err){Lex.toast(err.message,true)}return}
    if(e.target.id==='intel-form'){e.preventDefault();Lex.store('inteligencia:'+e.target.dataset.kind,Object.fromEntries(new FormData(e.target)));Lex.toast('Configuração salva neste navegador.')}
  });
  addEventListener('hashchange',renderRoute);
  addEventListener('DOMContentLoaded',async()=>{
    Lex.db=supabase.createClient(SUPABASE_URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit',storage:window.localStorage}});
    $('#logout').onclick=async()=>{await Lex.db.auth.signOut();await setSession(null);Lex.toast('Sessão encerrada.')};
    Lex.db.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>{setSession(session).catch(error=>Lex.toast('Erro ao restaurar a sessão: '+error.message,true))},0)});
    showAuthError();
    const {data:{session},error}=await Lex.db.auth.getSession();
    if(error)$('#login-status').textContent='Não foi possível restaurar a sessão: '+error.message;
    await setSession(session);
    if(!session&&!location.hash)location.hash='#/painel';
    document.addEventListener('visibilitychange',async()=>{if(document.visibilityState!=='visible')return;const {data}=await Lex.db.auth.getSession();if(data.session&&!Lex.session)await setSession(data.session)});
    if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
  });
})();
