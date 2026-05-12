/* global process */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_FILE = path.join(__dirname, '.env');
const BACKUP_FILE = path.join(__dirname, '.env.backup');

function showUsage() {
    console.log("Uso: node switch-env.js [development|production|status]\n");
    console.log("Comandos:");
    console.log("  development  - Cambiar a entorno de desarrollo");
    console.log("  production   - Cambiar a entorno de producción");
    console.log("  status       - Mostrar entorno actual\n");
    console.log("Ejemplos:");
    console.log("  node switch-env.js development");
    console.log("  node switch-env.js production");
    console.log("  node switch-env.js status");
}

function getCurrentEnv() {
    if (!fs.existsSync(ENV_FILE)) return 'unknown';
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    if (/^ENV=development/m.test(content)) return 'development';
    if (/^ENV=production/m.test(content)) return 'production';
    return 'unknown';
}

function updateEnvFile(envName) {
    let content = fs.readFileSync(ENV_FILE, 'utf8');

    if (envName === 'development') {
        content = content.replace(/^ENV=.*/m, 'ENV=development');
        content = content.replace(/^#ENV=development/m, 'ENV=development');
        content = content.replace(/^ENV=production/m, '#ENV=production');

        if (/^VITE_ENV=/m.test(content)) {
            content = content.replace(/^VITE_ENV=.*/m, 'VITE_ENV=development');
        } else {
            content += '\nVITE_ENV=development\n';
        }
    } else if (envName === 'production') {
        content = content.replace(/^ENV=.*/m, 'ENV=production');
        content = content.replace(/^ENV=development/m, '#ENV=development');
        content = content.replace(/^#ENV=production/m, 'ENV=production');

        if (/^VITE_ENV=/m.test(content)) {
            content = content.replace(/^VITE_ENV=.*/m, 'VITE_ENV=production');
        } else {
            content += '\nVITE_ENV=production\n';
        }
    }

    fs.writeFileSync(ENV_FILE, content, 'utf8');
}

function switchToDevelopment() {
    console.log("🔄 Cambiando a entorno de DESARROLLO...");

    if (!fs.existsSync(BACKUP_FILE)) {
        fs.copyFileSync(ENV_FILE, BACKUP_FILE);
        console.log("💾 Backup creado: .env.backup");
    }

    updateEnvFile('development');

    console.log("✅ Entorno cambiado a DESARROLLO");
    console.log("🌐 URLs de desarrollo:");
    console.log("   - Admin: dev.admin.novagendas.com");
    console.log("   - Tiendas: dev.[subdominio].novagendas.com");
    console.log("   - Base de datos: umrwowgzxiysncqmiepa.supabase.co");
}

function switchToProduction() {
    console.log("🔄 Cambiando a entorno de PRODUCCIÓN...");

    updateEnvFile('production');

    console.log("✅ Entorno cambiado a PRODUCCIÓN");
    console.log("🌐 URLs de producción:");
    console.log("   - Admin: admin.novagendas.com");
    console.log("   - Tiendas: [subdominio].novagendas.com");
    console.log("   - Base de datos: aulddrljywoigivxugqf.supabase.co");
}

function showStatus() {
    const currentEnv = getCurrentEnv();
    console.log("📊 Estado del entorno:");
    console.log(`   Entorno actual: ${currentEnv.toUpperCase()}`);

    if (currentEnv === 'development') {
        console.log("   🌐 URLs: dev.*.novagendas.com");
        console.log("   🗄️  Base de datos: Desarrollo (umrwowgzxiysncqmiepa)");
    } else if (currentEnv === 'production') {
        console.log("   🌐 URLs: *.novagendas.com");
        console.log("   🗄️  Base de datos: Producción (aulddrljywoigivxugqf)");
    } else {
        console.log("   ⚠️  Entorno desconocido o no configurado");
    }

    if (fs.existsSync(BACKUP_FILE)) {
        console.log("   💾 Backup disponible: .env.backup");
    }
}

if (!fs.existsSync(ENV_FILE)) {
    console.error("❌ Error: Archivo .env no encontrado");
    process.exit(1);
}

const command = process.argv[2];

switch (command) {
    case 'development':
    case 'dev':
        switchToDevelopment();
        break;
    case 'production':
    case 'prod':
        switchToProduction();
        break;
    case 'status':
        showStatus();
        break;
    default:
        if (command) {
            console.error(`❌ Error: Comando '${command}' no reconocido\n`);
        }
        showUsage();
        if (command) process.exit(1);
        break;
}
