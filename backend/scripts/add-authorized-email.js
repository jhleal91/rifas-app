#!/usr/bin/env node

/**
 * Script para agregar un email a la lista de emails autorizados
 * Uso: node scripts/add-authorized-email.js tu-email@gmail.com
 */

const fs = require('fs');
const path = require('path');

const emailToAdd = process.argv[2];

if (!emailToAdd) {
  console.error('❌ Error: Debes proporcionar un email');
  console.log('Uso: node scripts/add-authorized-email.js tu-email@gmail.com');
  process.exit(1);
}

// Validar formato de email básico
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(emailToAdd)) {
  console.error('❌ Error: El formato del email no es válido');
  process.exit(1);
}

const emailConfigPath = path.join(__dirname, '../config/email.js');

try {
  // Leer el archivo
  let content = fs.readFileSync(emailConfigPath, 'utf8');
  
  // Buscar la línea con AUTHORIZED_EMAILS
  const authorizedEmailsRegex = /const AUTHORIZED_EMAILS = \[([^\]]+)\];/;
  const match = content.match(authorizedEmailsRegex);
  
  if (!match) {
    console.error('❌ Error: No se pudo encontrar AUTHORIZED_EMAILS en el archivo');
    process.exit(1);
  }
  
  // Extraer emails existentes
  const existingEmails = match[1]
    .split(',')
    .map(e => e.trim().replace(/['"]/g, ''))
    .filter(e => e);
  
  // Verificar si el email ya está en la lista
  if (existingEmails.includes(emailToAdd)) {
    console.log(`ℹ️  El email ${emailToAdd} ya está en la lista de autorizados`);
    process.exit(0);
  }
  
  // Agregar el nuevo email
  existingEmails.push(emailToAdd);
  
  // Crear nueva línea
  const newEmailsList = existingEmails.map(e => `'${e}'`).join(', ');
  const newLine = `const AUTHORIZED_EMAILS = [${newEmailsList}];`;
  
  // Reemplazar en el contenido
  content = content.replace(authorizedEmailsRegex, newLine);
  
  // Escribir el archivo
  fs.writeFileSync(emailConfigPath, content, 'utf8');
  
  console.log(`✅ Email ${emailToAdd} agregado a la lista de autorizados`);
  console.log(`📧 Emails autorizados: ${existingEmails.join(', ')}`);
  console.log(`\n💡 Reinicia el servidor para que los cambios surtan efecto`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

