const campaignUI={
 async load(){const r=await fetch('/api/admin-campaigns',{credentials:'include'});if(!r.ok)throw new Error('Admin only');return r.json()},
 async save(data){const r=await fetch('/api/admin-campaigns',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(data)});if(!r.ok)throw new Error('Save failed');return r.json()}
};