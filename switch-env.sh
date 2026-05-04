#!/bin/bash

# Script para cambiar entre entornos de desarrollo y producción

ENV_FILE=".env"
BACKUP_FILE=".env.backup"

# Función para mostrar uso
show_usage() {
    echo "Uso: $0 [development|production|status]"
    echo ""
    echo "Comandos:"
    echo "  development  - Cambiar a entorno de desarrollo"
    echo "  production   - Cambiar a entorno de producción"
    echo "  status       - Mostrar entorno actual"
    echo ""
    echo "Ejemplos:"
    echo "  $0 development"
    echo "  $0 production"
    echo "  $0 status"
}

# Función para obtener entorno actual
get_current_env() {
    if grep -q "^ENV=development" "$ENV_FILE" 2>/dev/null; then
        echo "development"
    elif grep -q "^ENV=production" "$ENV_FILE" 2>/dev/null; then
        echo "production"
    else
        echo "unknown"
    fi
}

# Función para cambiar a desarrollo
switch_to_development() {
    echo "🔄 Cambiando a entorno de DESARROLLO..."

    # Crear backup si no existe
    if [ ! -f "$BACKUP_FILE" ]; then
        cp "$ENV_FILE" "$BACKUP_FILE"
        echo "💾 Backup creado: $BACKUP_FILE"
    fi

    # Cambiar ENV
    sed -i.bak 's/^ENV=.*/ENV=development/' "$ENV_FILE"
    sed -i.bak 's/^#ENV=development/ENV=development/' "$ENV_FILE"
    sed -i.bak 's/^ENV=production/#ENV=production/' "$ENV_FILE"

    # Cambiar VITE_ENV
    if grep -q "^VITE_ENV=" "$ENV_FILE"; then
        sed -i.bak 's/^VITE_ENV=.*/VITE_ENV=development/' "$ENV_FILE"
    else
        echo "VITE_ENV=development" >> "$ENV_FILE"
    fi

    echo "✅ Entorno cambiado a DESARROLLO"
    echo "🌐 URLs de desarrollo:"
    echo "   - Admin: dev.admin.novagendas.com"
    echo "   - Tiendas: dev.[subdominio].novagendas.com"
    echo "   - Base de datos: umrwowgzxiysncqmiepa.supabase.co"
}

# Función para cambiar a producción
switch_to_production() {
    echo "🔄 Cambiando a entorno de PRODUCCIÓN..."

    # Cambiar ENV
    sed -i.bak 's/^ENV=.*/ENV=production/' "$ENV_FILE"
    sed -i.bak 's/^ENV=development/#ENV=development/' "$ENV_FILE"
    sed -i.bak 's/^#ENV=production/ENV=production/' "$ENV_FILE"

    # Cambiar VITE_ENV
    if grep -q "^VITE_ENV=" "$ENV_FILE"; then
        sed -i.bak 's/^VITE_ENV=.*/VITE_ENV=production/' "$ENV_FILE"
    else
        echo "VITE_ENV=production" >> "$ENV_FILE"
    fi

    echo "✅ Entorno cambiado a PRODUCCIÓN"
    echo "🌐 URLs de producción:"
    echo "   - Admin: admin.novagendas.com"
    echo "   - Tiendas: [subdominio].novagendas.com"
    echo "   - Base de datos: aulddrljywoigivxugqf.supabase.co"
}

# Función para mostrar estado
show_status() {
    local current_env=$(get_current_env)
    echo "📊 Estado del entorno:"
    echo "   Entorno actual: $(echo $current_env | tr '[:lower:]' '[:upper:]')"

    if [ "$current_env" = "development" ]; then
        echo "   🌐 URLs: dev.*.novagendas.com"
        echo "   🗄️  Base de datos: Desarrollo (umrwowgzxiysncqmiepa)"
    elif [ "$current_env" = "production" ]; then
        echo "   🌐 URLs: *.novagendas.com"
        echo "   🗄️  Base de datos: Producción (aulddrljywoigivxugqf)"
    else
        echo "   ⚠️  Entorno desconocido o no configurado"
    fi

    if [ -f "$BACKUP_FILE" ]; then
        echo "   💾 Backup disponible: $BACKUP_FILE"
    fi
}

# Verificar que existe el archivo .env
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Archivo $ENV_FILE no encontrado"
    exit 1
fi

# Procesar argumentos
case "$1" in
    "development"|"dev")
        switch_to_development
        ;;
    "production"|"prod")
        switch_to_production
        ;;
    "status")
        show_status
        ;;
    "")
        show_usage
        ;;
    *)
        echo "❌ Error: Comando '$1' no reconocido"
        echo ""
        show_usage
        exit 1
        ;;
esac