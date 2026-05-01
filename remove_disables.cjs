const fs = require('fs');
const files = [
  'src/components/ParticleBackground.jsx',
  'src/components/SuggestionInput.jsx',
  'src/components/layout/Layout.jsx',
  'src/features/agenda/Agenda.jsx',
  'src/features/auth/ResetPassword.jsx',
  'src/features/clients/Clients.jsx',
  'src/features/inventory/Inventory.jsx',
  'src/features/payments/Payments.jsx',
  'src/features/services/Services.jsx',
  'src/features/superadmin/SuperAdminPortal.jsx',
  'src/features/users/Users.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const comment = '/* eslint-disable security/detect-object-injection -- Deshabilitado: El acceso dinámico a objetos en el frontend es seguro y necesario para el estado de React */\n';
    if (content.startsWith(comment)) {
      content = content.replace(comment, '');
      fs.writeFileSync(file, content, 'utf8');
    }
  }
});
