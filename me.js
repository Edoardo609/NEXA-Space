export const access='public';
export const methods=['GET'];
export default async function(req,res){res.json({signedIn:false,user:null,profile:null});}