/* Offline fallback for Il mio spazio: keeps the last successful view available without internet. */
(() => {
  const key='nexa_owner_space_snapshot';
  const snapshot=()=>{
    try{
      localStorage.setItem(key,document.documentElement.outerHTML);
      localStorage.setItem(key+'_time',new Date().toISOString());
    }catch(e){}
  };
  const restore=()=>{
    try{
      const html=localStorage.getItem(key);
      if(html && !document.querySelector('[data-nexa-offline-restored]')){
        document.open();
        document.write(html);
        document.close();
      }
    }catch(e){}
  };
  if(!navigator.onLine){restore();return}
  window.addEventListener('load',()=>setTimeout(snapshot,1800));
  window.addEventListener('offline',snapshot);
})();