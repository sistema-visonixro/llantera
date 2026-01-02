#!/bin/bash

# Script para incrementar automáticamente la versión antes de cada deploy
# Uso: ./scripts/update-version.sh [major|minor|patch] "Mensaje del changelog"

VERSION_FILE="public/version.json"

# Determinar el tipo de actualización (por defecto: patch)
UPDATE_TYPE=${1:-patch}
CHANGELOG_MESSAGE=${2:-"Actualización de la aplicación"}

# Leer versión actual
CURRENT_VERSION=$(cat $VERSION_FILE | grep -o '"version": "[^"]*' | grep -o '[^"]*$')

echo "📦 Versión actual: $CURRENT_VERSION"

# Separar versión en componentes
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Incrementar según el tipo
case $UPDATE_TYPE in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "❌ Tipo de actualización inválido. Use: major, minor o patch"
    exit 1
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "✨ Nueva versión: $NEW_VERSION"
echo "📝 Changelog: $CHANGELOG_MESSAGE"

# Crear nuevo archivo version.json
cat > $VERSION_FILE << EOF
{
  "version": "$NEW_VERSION",
  "buildDate": "$BUILD_DATE",
  "changelog": "$CHANGELOG_MESSAGE"
}
EOF

echo "✅ Versión actualizada exitosamente"
echo ""
echo "📌 Siguiente paso: git add $VERSION_FILE && git commit -m \"v$NEW_VERSION: $CHANGELOG_MESSAGE\" && git push"
