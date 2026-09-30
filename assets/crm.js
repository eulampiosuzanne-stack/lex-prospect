(() => {
  const L=window.Lex,{esc,badge}=L;
  async function conversations(){
    return L.q('prospect_conversations',q=>q.select('*').order('last_message_at',{ascending:false}).limit(200));
  }
  L.route('crm/consultoria','Funil de Consultoria',async()=>{
    L.$('#view').innerHTML=L.page('Funil de Consultoria','Conversas reais organizadas por estado.','<button id="export-crm">Exportar contatos</button>')+L.loading();
    try{
      const rows=await conversations();L.state.crmRows=rows||[];
      const buckets=[['Novos',x=>!x.status||/new|novo|abert/i.test(x.status)],['Em atendimento',x=>/progress|atend|qualif/i.test(x.status)],['Concluídos',x=>/closed|conclu|convert/i.test(x.status)]];
      L.$('#view').innerHTML=L.page('Funil de Consultoria','Conversas reais organizadas por estado.','<button id="export-crm">Exportar contatos</button>')+'<div class="kanban">'+buckets.map(([title,fn])=>'<section class="column"><h3>'+title+'</h3>'+(rows.filter(fn).map(card).join('')||L.empty('Vazio'))+'</section>').join('')+'</div>';
    }catch(e){L.$('#view').innerHTML=L.page('Funil de Consultoria','Conversas reais organizadas por estado.')+L.empty('Não foi possível carregar o funil: '+e.message)}
  });
  function card(x){return '<article class="lead"><b>'+esc(x.contact_name||x.phone||'Contato')+'</b><small>'+esc(x.channel||'canal não informado')+'</small><small>'+esc(L.date(x.last_message_at))+'</small></article>'}
  ['parceiros','apoio'].forEach(kind=>L.route('crm/'+kind,kind==='parceiros'?'Parceiros':'Rede de Apoio',async()=>{
    const title=kind==='parceiros'?'Parceiros':'Rede de Apoio',rows=L.load('crm:'+kind,[]);
    L.$('#view').innerHTML=L.page(title,'Diretório privado, sem contato automático.','<button id="add-directory" data-kind="'+kind+'">Adicionar contato</button>')+
      (rows.length?'<div class="list">'+rows.map((x,i)=>'<article class="list-item"><div><b>'+esc(x.nome)+'</b><p>'+esc(x.area)+' · '+esc(x.contato)+'</p></div><button class="danger" data-remove-directory="'+i+'" data-kind="'+kind+'">Remover</button></article>').join('')+'</div>':L.empty('Nenhum contato cadastrado neste diretório.'));
  }));
  document.addEventListener('click',e=>{
    if(e.target.id==='export-crm')L.download('lex-prospect-crm.csv',(L.state.crmRows||[]).map(x=>({nome:x.contact_name,telefone:x.phone,canal:x.channel,status:x.status,ultima_interacao:x.last_message_at})));
    if(e.target.id==='add-directory')L.modal('Adicionar contato','<form id="directory-form" data-kind="'+e.target.dataset.kind+'"><label>Nome</label><input name="nome" required><label>Área ou especialidade</label><input name="area" required><label>Contato</label><input name="contato"><button class="primary full">Salvar</button></form>');
    if(e.target.dataset.removeDirectory!==undefined){const key='crm:'+e.target.dataset.kind,rows=L.load(key,[]);rows.splice(Number(e.target.dataset.removeDirectory),1);L.store(key,rows);L.navigate('crm/'+e.target.dataset.kind);setTimeout(()=>dispatchEvent(new HashChangeEvent('hashchange')),0)}
  });
  document.addEventListener('submit',e=>{
    if(e.target.id!=='directory-form')return;e.preventDefault();const key='crm:'+e.target.dataset.kind,rows=L.load(key,[]);rows.push(Object.fromEntries(new FormData(e.target)));L.store(key,rows);L.closeModal();L.toast('Contato adicionado.');L.navigate('crm/'+e.target.dataset.kind);setTimeout(()=>dispatchEvent(new HashChangeEvent('hashchange')),0);
  });
})();
