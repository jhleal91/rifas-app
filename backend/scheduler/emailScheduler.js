const { checkAndSendDrawReminders } = require('../utils/raffleUtils');

// Función para ejecutar las tareas programadas
async function runScheduledTasks() {
  console.log('🕐 Ejecutando tareas programadas de email...');
  
  try {
    // Verificar recordatorios de sorteo
    await checkAndSendDrawReminders();
    
    console.log('✅ Tareas programadas completadas');
  } catch (error) {
    console.error('❌ Error ejecutando tareas programadas:', error);
  }
}

// Ejecutar tareas cada 30 minutos
function startScheduler() {
  console.log('🚀 Iniciando scheduler de emails...');
  
  // Ejecutar inmediatamente
  runScheduledTasks();
  
  // Luego ejecutar cada 30 minutos
  setInterval(runScheduledTasks, 30 * 60 * 1000); // 30 minutos
  
  console.log('⏰ Scheduler configurado para ejecutar cada 30 minutos');
}

module.exports = {
  startScheduler,
  runScheduledTasks
};
