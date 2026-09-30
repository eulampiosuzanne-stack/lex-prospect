(() => {
  const L=window.Lex,{esc,badge}=L;
  const socialPage=(title,sub,actions='')=>L.page(title,sub,actions);
  async function scripts(){return L.q('posts_content_scripts',q=>q.select('*').order('created_at',{ascending:false}).limit(100))}
  async function items(){return L.q('posts_items',q=>q.select('*,posts_content_scripts(tema,roteiro,legenda,hashtags,tipo_post)').order('horario_agendado',{ascending:true}).limit(200))}
  const stateBadge=s=>{const t=String(s||'rascunho').toLowerCase();return badge(s||'rascunho',/aprov/.test(t)?'ok':/reprov|erro/.test(t)?'error':/agend/.test(t)?'info':'warn')};
  L.route('social/conteudos','Conteúdos',async()=>{
    L.$('#view').innerHTML=socialPage('Conteúdos','Gere somente Feed ou Reels. Todo material passa por revisão.')+'<section class="grid"><form id="content-form" class="card span-4"><label>Tema</label><input name="tema" required><label>Objetivo</label><select name="objetivo"><option>Educar</option><option>Informar</option><option>Relacionamento</option><option>Autoridade</option></select><label>Formato</label><select name="tipo_post"><option value="feed">Feed</option><option value="reels">Reels</option></select><button class="primary full">Gerar roteiro</button><p id="content-status" class="status-line"></p></form><div id="content-list" class="span-8">'+L.loading()+'</div></section>';
    try{renderScripts(await scripts())}catch(e){L.$('#content-list').innerHTML=L.empty('Não foi possível carregar: '+e.message)}
  });
  function renderScripts(rows){
    L.state.scripts=rows||[];L.$('#content-list').innerHTML=rows?.length?'<div class="list">'+rows.map(x=>'<article class="list-item"><div><b>'+esc(x.tema||'Sem tema')+'</b><p>'+esc((x.tipo_post||'').toUpperCase())+' · '+esc(L.date(x.created_at))+'</p></div><div class="actions">'+stateBadge(x.status)+'<button data-script="'+esc(x.id)+'">Abrir</button></div></article>').join('')+'</div>':L.empty('Nenhum conteúdo criado.');
  }
  L.route('social/aprovacao','Central de Aprovação',async()=>{
    L.$('#view').innerHTML=socialPage('Central de Aprovação','Revisar e aprovar não publica nas redes sociais.')+L.loading();
    try{
      const rows=await items();L.state.items=rows||[];
      L.$('#view').innerHTML=socialPage('Central de Aprovação','Revisar e aprovar não publica nas redes sociais.')+(rows?.length?'<div class="list">'+rows.map(x=>'<article class="list-item"><div><b>'+esc(x.posts_content_scripts?.tema||'Sem tema')+'</b><p>'+esc((x.tipo_post||'').toUpperCase())+' · '+esc(L.date(x.horario_agendado))+'</p></div><div class="actions">'+stateBadge(x.status)+'<button data-post="'+esc(x.id)+'">Abrir publicação</button></div></article>').join('')+'</div>':L.empty('Nenhuma publicação aguardando revisão.'));
    }catch(e){L.$('#view').innerHTML=socialPage('Central de Aprovação','Revisar e aprovar não publica nas redes sociais.')+L.empty('Não foi possível carregar: '+e.message)}
  });
  L.route('programacao','Programação',async()=>{
    L.$('#view').innerHTML=socialPage('Programação','Lista e calendário de Feed e Reels. Stories não são publicados.')+L.loading();
    try{
      const rows=(await items()).filter(x=>['feed','reels'].includes(String(x.tipo_post).toLowerCase()));L.state.items=rows;
      const now=new Date(),days=Array.from({length:14},(_,i)=>new Date(now.getFullYear(),now.getMonth(),now.getDate()+i));
      const key=d=>d.toISOString().slice(0,10);
      L.$('#view').innerHTML=socialPage('Programação','Lista e calendário de Feed e Reels. Stories não são publicados.')+
        '<section class="card"><div class="calendar">'+days.map(d=>'<div class="day"><small>'+d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})+'</small>'+rows.filter(x=>x.horario_agendado&&key(new Date(x.horario_agendado))===key(d)).map(x=>'<div class="event">'+esc((x.tipo_post||'').toUpperCase())+' · '+esc(x.posts_content_scripts?.tema||'Conteúdo')+'</div>').join('')+'</div>').join('')+'</div></section>'+
        '<section style="margin-top:14px">'+(rows.length?'<div class="list">'+rows.map(x=>'<article class="list-item"><div><b>'+esc(x.posts_content_scripts?.tema||'Sem tema')+'</b><p>'+esc((x.tipo_post||'').toUpperCase())+' · '+esc(L.date(x.horario_agendado))+'</p></div><button data-post="'+esc(x.id)+'">Abrir</button></article>').join('')+'</div>':L.empty('Nenhum Feed ou Reel programado.'))+'</section>';
    }catch(e){L.$('#view').innerHTML=socialPage('Programação','Lista e calendário de Feed e Reels.')+L.empty('Não foi possível carregar: '+e.message)}
  });
  L.route('social/campanhas','Campanhas',async()=>{
    L.$('#view').innerHTML=socialPage('Campanhas','Crie rascunhos; nenhuma campanha é publicada automaticamente.','<button id="new-campaign" class="primary">Nova campanha</button>')+L.loading();
    try{
      const rows=await L.q('campanhas',q=>q.select('*').order('created_at',{ascending:false}).limit(100));L.state.campaigns=rows||[];
      L.$('#view').innerHTML=socialPage('Campanhas','Crie rascunhos; nenhuma campanha é publicada automaticamente.','<button id="new-campaign" class="primary">Nova campanha</button>')+(rows?.length?'<div class="list">'+rows.map(x=>'<article class="list-item"><div><b>'+esc(x.nome||'Campanha')+'</b><p>'+esc(x.canal||'canal não informado')+' · '+esc(L.date(x.created_at))+'</p></div>'+stateBadge(x.status)+'</article>').join('')+'</div>':L.empty('Nenhuma campanha criada.'));
    }catch(e){L.$('#view').innerHTML=socialPage('Campanhas','Crie rascunhos; nenhuma campanha é publicada automaticamente.','<button id="new-campaign" class="primary">Nova campanha</button>')+L.empty('Não foi possível carregar: '+e.message)}
  });
  L.route('social/conexoes','Conexões Meta',async()=>{
    L.$('#view').innerHTML=socialPage('Conexões Meta','Estado real das contas sociais autorizadas.','<button id="connect-meta" class="primary">Conectar Meta / Instagram</button>')+L.loading();
    try{
      const rows=await L.q('posts_social_accounts',q=>q.select('*').limit(30));L.$('#view').innerHTML=socialPage('Conexões Meta','Estado real das contas sociais autorizadas.','<button id="connect-meta" class="primary">Conectar Meta / Instagram</button>')+(rows?.length?'<div class="list">'+rows.map(x=>'<article class="list-item"><div><b>'+esc(x.plataforma||'Conta social')+'</b><p>'+esc(x.username||x.account_name||'Conta conectada')+'</p></div>'+stateBadge(x.status)+'</article>').join('')+'</div>':L.empty('Nenhuma conta Meta / Instagram conectada.'));
    }catch(e){L.$('#view').innerHTML=socialPage('Conexões Meta','Estado real das contas sociais autorizadas.','<button id="connect-meta" class="primary">Conectar Meta / Instagram</button>')+L.empty('Não foi possível carregar: '+e.message)}
  });
  function postModal(x){
    const s=x.posts_content_scripts||{};
    L.modal('Detalhes da publicação','<dl class="detail-grid"><dt>Tema</dt><dd>'+esc(s.tema||'Não informado')+'</dd><dt>Formato</dt><dd>'+esc((x.tipo_post||s.tipo_post||'').toUpperCase())+'</dd><dt>Roteiro</dt><dd>'+esc(s.roteiro||'Não informado')+'</dd><dt>Legenda</dt><dd>'+esc(x.legenda||s.legenda||'Não informada')+'</dd><dt>Mídia</dt><dd>'+(x.midia_url?'<a class="btn" href="'+esc(x.midia_url)+'" target="_blank" rel="noopener">Abrir mídia</a>':'Não anexada')+'</dd><dt>Data e horário</dt><dd>'+esc(L.date(x.horario_agendado))+'</dd><dt>Status</dt><dd>'+stateBadge(x.status)+'</dd></dl><div class="actions" style="margin-top:18px"><button data-edit-post="'+esc(x.id)+'">Editar</button><button class="danger" data-status-post="'+esc(x.id)+'" data-status="reprovado">Reprovar</button><button class="primary" data-status-post="'+esc(x.id)+'" data-status="aprovado">Aprovar sem publicar</button></div>');
  }
  function editModal(x){
    L.modal('Editar publicação','<form id="post-edit" data-id="'+esc(x.id)+'"><label>Data e horário</label><input name="horario_agendado" type="datetime-local" value="'+(x.horario_agendado?new Date(x.horario_agendado).toISOString().slice(0,16):'')+'"><label>Legenda</label><textarea name="legenda">'+esc(x.legenda||x.posts_content_scripts?.legenda||'')+'</textarea><label>URL da mídia</label><input name="midia_url" type="url" value="'+esc(x.midia_url||'')+'"><button class="primary full">Salvar alterações</button></form>');
  }
  document.addEventListener('click',async e=>{
    if(e.target.dataset.script){const x=(L.state.scripts||[]).find(v=>String(v.id)===e.target.dataset.script);if(x)L.modal('Conteúdo','<dl class="detail-grid"><dt>Tema</dt><dd>'+esc(x.tema)+'</dd><dt>Formato</dt><dd>'+esc((x.tipo_post||'').toUpperCase())+'</dd><dt>Roteiro</dt><dd>'+esc(x.roteiro||'Não informado')+'</dd><dt>Legenda</dt><dd>'+esc(x.legenda||'Não informada')+'</dd><dt>Status</dt><dd>'+stateBadge(x.status)+'</dd></dl>')}
    if(e.target.dataset.post){const x=(L.state.items||[]).find(v=>String(v.id)===e.target.dataset.post);if(x)postModal(x)}
    if(e.target.dataset.editPost){const x=(L.state.items||[]).find(v=>String(v.id)===e.target.dataset.editPost);if(x)editModal(x)}
    if(e.target.dataset.statusPost){try{const status=e.target.dataset.status,patch={status};if(status==='aprovado')Object.assign(patch,{aprovado_por:L.session.user.email,aprovado_em:new Date().toISOString(),requer_aprovacao:true});const {error}=await L.db.from('posts_items').update(patch).eq('id',e.target.dataset.statusPost);if(error)throw error;L.closeModal();L.toast(status==='aprovado'?'Aprovado. Nenhuma publicação foi feita.':'Publicação reprovada.');dispatchEvent(new HashChangeEvent('hashchange'))}catch(err){L.toast(err.message,true)}}
    if(e.target.id==='new-campaign')L.modal('Nova campanha','<form id="campaign-form"><label>Nome</label><input name="nome" required><label>Público</label><input name="publico" required><label>Região</label><input name="regiao"><label>Mensagem ou objetivo</label><textarea name="mensagem" required></textarea><button class="primary full">Salvar como rascunho</button></form>');
    if(e.target.id==='connect-meta')location.href=L.URL+'/functions/v1/instagram-oauth-start';
  });
  document.addEventListener('submit',async e=>{
    if(e.target.id==='content-form'){e.preventDefault();const st=L.$('#content-status'),data=Object.fromEntries(new FormData(e.target));st.textContent='Gerando roteiro…';try{await L.api('generate-post-script',{body:data});st.textContent='Roteiro salvo para revisão.';renderScripts(await scripts())}catch(err){st.textContent='Não foi possível gerar: '+err.message}}
    if(e.target.id==='campaign-form'){e.preventDefault();const d=Object.fromEntries(new FormData(e.target));try{const {error}=await L.db.from('campanhas').insert({nome:d.nome,canal:'social',status:'rascunho',configuracao:{publico:d.publico,regiao:d.regiao,mensagem:d.mensagem}});if(error)throw error;L.closeModal();L.toast('Campanha salva como rascunho.');dispatchEvent(new HashChangeEvent('hashchange'))}catch(err){L.toast(err.message,true)}}
    if(e.target.id==='post-edit'){e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.horario_agendado=d.horario_agendado?new Date(d.horario_agendado).toISOString():null;d.midia_url=d.midia_url||null;try{const {error}=await L.db.from('posts_items').update(d).eq('id',e.target.dataset.id);if(error)throw error;L.closeModal();L.toast('Publicação atualizada.');dispatchEvent(new HashChangeEvent('hashchange'))}catch(err){L.toast(err.message,true)}}
  });
})();
