(() => {
  const L=window.Lex, {esc,badge}=L;
  const configs={
    maps:{title:'Google Maps',source:'google_maps',desc:'Busca empresas por segmento e região. Requer credencial do Google Places.',q:'Segmento ou atividade',loc:true},
    cnpj:{title:'Empresas / CNPJ',source:'cnpj',desc:'Consulta empresas por atividade, CNAE ou nome.',q:'CNAE, atividade ou empresa',loc:true},
    grupos:{title:'Grupos',source:'groups',desc:'Pesquisa ética de grupos públicos. Não realiza disparo em massa.',q:'Tema do grupo',loc:false}
  };
  Object.entries(configs).forEach(([key,c])=>L.route('extracao/'+key,c.title,async()=>{
    L.$('#view').innerHTML=L.page(c.title,c.desc)+
      '<section class="grid"><form id="extract-form" class="card span-4" data-source="'+c.source+'"><label>'+c.q+'</label><input name="query" required><label '+(c.loc?'':'hidden')+'>Região<input name="location" '+(c.loc?'required':'')+'></label><button class="primary full">Buscar leads</button><p id="extract-status" class="status-line"></p></form><div class="card span-8"><div class="actions"><button id="export-extraction">Exportar resultados</button></div><div id="extract-results">'+L.empty('Faça uma busca para visualizar resultados reais.')+'</div></div></section>';
  }));
  L.route('extracao/importar','Importar planilha',async()=>{
    L.$('#view').innerHTML=L.page('Importar planilha','Pré-visualize CSV antes de usar os dados. Nenhum disparo é feito.')+'<section class="card"><label>Arquivo CSV</label><input id="csv-file" type="file" accept=".csv,text/csv"><p class="muted">Colunas recomendadas: nome, empresa, telefone, email, origem.</p><div id="csv-preview">'+L.empty('Nenhum arquivo selecionado.')+'</div></section>';
  });
  L.route('listas','Minhas listas',async()=>{
    const rows=L.load('listas',[]);L.state.currentExport=rows;
    L.$('#view').innerHTML=L.page('Minhas listas','Resultados salvos explicitamente neste navegador.','<button id="export-extraction">Exportar CSV</button>')+(rows.length?table(rows):L.empty('Nenhuma lista salva neste navegador.'));
  });
  L.route('historico','Histórico de buscas',async()=>{
    const rows=L.load('historico',[]);
    L.$('#view').innerHTML=L.page('Histórico de buscas','Registro das buscas realizadas neste navegador.')+(rows.length?'<div class="list">'+rows.map(x=>'<article class="list-item"><div><b>'+esc(x.query)+'</b><p>'+esc(x.source)+' · '+esc(x.location||'sem região')+'</p></div><span>'+esc(L.date(x.at))+'</span></article>').join('')+'</div>':L.empty('Nenhuma busca realizada neste navegador.'));
  });
  function normalize(data){
    const rows=data?.leads||data?.results||data?.data||[];return Array.isArray(rows)?rows:rows?[rows]:[];
  }
  function table(rows){
    const cols=[...new Set(rows.flatMap(x=>Object.keys(x||{})))].slice(0,7);
    return '<div class="table-wrap"><table><thead><tr>'+cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+cols.map(c=>'<td>'+esc(typeof r[c]==='object'?JSON.stringify(r[c]):r[c])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  }
  document.addEventListener('submit',async e=>{
    if(e.target.id!=='extract-form')return;e.preventDefault();const f=e.target,st=L.$('#extract-status'),fd=Object.fromEntries(new FormData(f));st.textContent='Consultando motor de extração…';
    try{
      const out=await L.api('prospect-extractor',{body:{source:f.dataset.source,query:fd.query,location:fd.location||undefined}});
      const rows=normalize(out);L.state.currentExport=rows;
      const history=L.load('historico',[]);history.unshift({source:f.dataset.source,query:fd.query,location:fd.location||'',at:new Date().toISOString(),total:rows.length||out.total||0});L.store('historico',history.slice(0,100));
      L.$('#extract-results').innerHTML=rows.length?table(rows):L.empty(out.notice||out.message||'A busca terminou sem resultados.');
      st.textContent=(rows.length||out.total||0)+' resultado(s).';
      if(rows.length)L.$('#extract-results').insertAdjacentHTML('afterbegin','<div class="actions" style="margin-bottom:10px"><button id="save-list">Salvar em Minhas listas</button></div>');
    }catch(err){st.textContent='Não foi possível buscar: '+err.message;L.$('#extract-results').innerHTML=L.empty(err.message)}
  });
  document.addEventListener('click',e=>{
    if(e.target.id==='export-extraction')L.download('lex-prospect-leads.csv',L.state.currentExport||[]);
    if(e.target.id==='save-list'){const old=L.load('listas',[]),map=new Map([...old,...(L.state.currentExport||[])].map((x,i)=>[x.id||x.email||x.phone||JSON.stringify(x)||i,x]));L.store('listas',[...map.values()]);L.toast('Resultados salvos em Minhas listas.')}
  });
  document.addEventListener('change',e=>{
    if(e.target.id!=='csv-file')return;const file=e.target.files[0];if(!file)return;const reader=new FileReader();
    reader.onload=()=>{const lines=String(reader.result).split(/\r?\n/).filter(Boolean),sep=lines[0]?.includes(';')?';':',',heads=(lines.shift()||'').split(sep).map(x=>x.trim()),rows=lines.map(line=>Object.fromEntries(line.split(sep).map((v,i)=>[heads[i]||('coluna_'+i),v.trim()])));L.state.currentExport=rows;L.$('#csv-preview').innerHTML=rows.length?'<div class="actions" style="margin:10px 0"><button id="save-list">Salvar em Minhas listas</button><button id="export-extraction">Exportar CSV</button></div>'+table(rows):L.empty('O arquivo está vazio.')};reader.readAsText(file);
  });
})();
