import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aulddrljywoigivxugqf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kRI9Xe0UXW9Ma0ecTdQWZQ_6uba91Cm';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createSuperAdmin() {
  console.log("Creando SuperAdmin...");
  const { data, error } = await supabase.auth.signUp({
    email: 'sanabria3210@gmail.com',
    password: 'admin',
  });

  if (error) {
    console.error("Error al crear:", error.message);
  } else {
    console.log("SuperAdmin creado existosamente en Supabase Auth.");
    console.log(data.user?.id);
  }
}

createSuperAdmin();
