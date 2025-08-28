import React from 'react';

const browserHtml = `
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CNK Web Browser</title>
  <style>
    :root{--bg:#0b0b0c;--fg:#e6edf3;--muted:#9da7b3;--line:#2a2f36;--accent:#8ab4f8}
    *{box-sizing:border-box}
    html,body{height:100%; margin:0; padding:0; overflow:hidden;}
    body{background:var(--bg);color:var(--fg);font:15px system-ui,-apple-system,Segoe UI,Roboto,Ubuntu}
    header{display:flex;gap:8px;align-items:center;padding:10px;border-bottom:1px solid var(--line);background:#0e1116;position:sticky;top:0;z-index:5}
    input[type="text"]{flex:1;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#11161f;color:var(--fg)}
    .btn{appearance:none;border:1px solid var(--line);background:#121722;color:var(--fg);padding:10px 12px;border-radius:10px;cursor:pointer}
    .btn:disabled{opacity:.5;cursor:not-allowed}
    #status{padding:6px 10px;border-bottom:1px solid var(--line);color:var(--muted);font-size:13px;background:#10141a}
    #wrap{position:relative;height:100%; flex-grow: 1;}
    iframe{position:absolute;inset:0;border:0;width:100%;height:100%;background:#0b0b0c}
    #browser-container { display: flex; flex-direction: column; height: 100%; }
  </style>
</head>
<body>
  <div id="browser-container">
    <header>
      <button id="back" class="btn" title="Geri">◀</button>
      <button id="fwd"  class="btn" title="İleri">▶</button>
      <button id="home" class="btn" title="Anasayfa">⌂</button>
      <input id="addr" type="text" placeholder="https://siteadresin.com veya domain.com" />
      <button id="go" class="btn">Git</button>
      <button id="reload" class="btn" title="Yenile">↻</button>
    </header>
    <div id="status">Hazır.</div>
    <div id="wrap">
      <iframe id="view" title="Görüntüleyici" sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals" referrerpolicy="no-referrer"></iframe>
    </div>
  </div>

  <script>
  'use strict';
  (function(){
    const DEFAULT_START = 'https://accounts.google.com/v3/signin/identifier?authuser=0&continue=https%3A%2F%2Fmail.google.com%2Fmail&ec=GAlAFw&hl=tr&service=mail&flowName=GlifWebSignIn&flowEntry=AddSession';
    const $=id=>document.getElementById(id);
    const view=$('view'), addr=$('addr'), back=$('back'), fwd=$('fwd'), reload=$('reload'), home=$('home'), statusEl=$('status');
    const historyStack=[]; let index=-1;

    const setStatus=t=>statusEl.textContent=t;
    const updateNav=()=>{ back.disabled=index<=0; fwd.disabled=index>=historyStack.length-1; };
    const normalize=u=>(u||'').trim()?/^(https?|ftp):\/\//i.test(u.trim())?u.trim():'https://'+u.trim():'';

    function load(u, push=true){
      const ok=normalize(u); if(!ok){setStatus('Geçersiz adres.');return}
      addr.value=ok; setStatus('Yükleniyor: '+ok); view.src=ok;
      if(push){ if(index<0||historyStack[index]!==ok){historyStack.splice(index+1);historyStack.push(ok);index=historyStack.length-1;updateNav()} }
    }

    $('go').onclick=()=>load(addr.value,true);
    addr.addEventListener('keydown',e=>{if(e.key==='Enter')$('go').click()});
    reload.onclick=()=>{if(index>=0)load(historyStack[index],false)};
    home.onclick=()=>load(DEFAULT_START,true);
    back.onclick=()=>{if(index>0){index--;load(historyStack[index],false);updateNav()}};
    fwd.onclick=()=>{if(index<historyStack.length-1){index++;load(historyStack[index],false);updateNav()}};

    load(DEFAULT_START);
  })();
  </script>
</body>
</html>
`;

const EmailPage = () => {
  return (
    <div style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
        <iframe
            srcDoc={browserHtml}
            title="E-posta Web Tarayıcısı"
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
        />
    </div>
  );
};

export default EmailPage;