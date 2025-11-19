/**
 * Script para actualizar todas las URLs hardcodeadas a usar configuración centralizada
 * Ejecutar: node scripts/update-api-urls.js
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/components/ParticipateRaffle.js',
  'src/components/AdvertiserPortal.js',
  'src/components/AdCarousel.js',
  'src/components/NumeroChecker.js',
  'src/components/AdvertiserDashboard.js',
  'src/components/CreatorPlans.js',
  'src/components/StripeConnectButton.js',
  'src/components/RatingComponent.js',
  'src/components/AllCuponesPage.js',
  'src/components/CuponesSection.js',
  'src/components/BusinessProfile.js',
  'src/components/SponsoredBusinessesSection.js',
  'src/components/AdBanner.js',
  'src/components/ParticipantesPage.js',
  'src/components/RifaManagement.js',
  'src/components/modals/ParticipantRegisterModal.js',
  'src/components/RifaPreview.js',
  'src/components/ParticipanteView.js',
  'src/App.js'
];

const replacements = [
  {
    pattern: /const API_BASE = ['"]http:\/\/localhost:5001\/api['"];?/g,
    replacement: "import { API_BASE } from '../config/api';"
  },
  {
    pattern: /const API_BASE = ['"]http:\/\/localhost:5001\/api['"];?\n/g,
    replacement: "import { API_BASE } from '../config/api';\n"
  }
];

console.log('🔄 Actualizando URLs hardcodeadas...\n');

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo no encontrado: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Verificar si ya tiene el import
  if (content.includes("from '../config/api'") || content.includes("from '../../config/api'")) {
    console.log(`✓ ${file} ya está actualizado`);
    return;
  }
  
  // Buscar y reemplazar
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Actualizado: ${file}`);
  } else {
    console.log(`⚠️  No se encontró patrón en: ${file}`);
  }
});

console.log('\n✅ Proceso completado!');
console.log('\n⚠️  IMPORTANTE: Revisa manualmente los archivos actualizados para verificar que los imports estén correctos.');

