import { supabase } from '../Supabase/supabaseClient';

export async function sendEmail(template, to, data) {
  if (!to || !to.includes('@')) return;
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { template, to, data },
    });
    if (error) console.error('[sendEmail]', template, '->', to, error);
  } catch (err) {
    console.error('[sendEmail] invoke failed:', template, err);
  }
}

export async function getAdminEmails(idnegocios) {
  try {
    const { data } = await supabase
      .from('usuario')
      .select('email')
      .eq('idnegocios', idnegocios)
      .eq('rol', 'admin')
      .is('deleted_at', null);
    return (data || []).map(u => u.email).filter(Boolean);
  } catch {
    return [];
  }
}
