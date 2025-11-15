const { query } = require('../config/database');
const emailService = require('../config/email');

// Verificar si una rifa está agotada y enviar notificación
async function checkAndNotifySoldOut(rifaId) {
  try {
    console.log(`🔍 Verificando si la rifa ${rifaId} está agotada...`);
    
    // Obtener información de la rifa
    const rifaResult = await query(`
      SELECT 
        r.*,
        u.nombre as creador_nombre,
        u.email as creador_email,
        COUNT(DISTINCT ev.elemento) as elementos_vendidos,
        COUNT(DISTINCT p.id) as total_participantes
      FROM rifas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN elementos_vendidos ev ON r.id = ev.rifa_id
      LEFT JOIN participantes p ON r.id = p.rifa_id AND p.estado = 'confirmado'
      WHERE r.id = $1
      GROUP BY r.id, u.nombre, u.email
    `, [rifaId]);

    if (rifaResult.rows.length === 0) {
      console.log('❌ Rifa no encontrada');
      return false;
    }

    const rifa = rifaResult.rows[0];
    const elementosVendidos = parseInt(rifa.elementos_vendidos) || 0;
    const cantidadElementos = parseInt(rifa.cantidad_elementos);

    console.log(`📊 Rifa: ${rifa.nombre}`);
    console.log(`📊 Elementos vendidos: ${elementosVendidos}/${cantidadElementos}`);

    // Verificar si está agotada
    if (elementosVendidos >= cantidadElementos) {
      console.log('🎉 ¡Rifa agotada! Enviando notificación...');
      
      // Verificar si ya se envió la notificación
      const notificationResult = await query(`
        SELECT * FROM rifa_notifications 
        WHERE rifa_id = $1 AND tipo = 'sold_out'
      `, [rifaId]);

      if (notificationResult.rows.length === 0) {
        // Enviar email de notificación
        const emailResult = await emailService.sendRaffleSoldOut(rifa);
        
        if (emailResult.success) {
          // Registrar que se envió la notificación
          await query(`
            INSERT INTO rifa_notifications (rifa_id, tipo, fecha_envio, status)
            VALUES ($1, 'sold_out', CURRENT_TIMESTAMP, 'sent')
          `, [rifaId]);
          
          console.log('✅ Notificación de rifa agotada enviada');
          return true;
        } else {
          console.error('❌ Error enviando notificación de rifa agotada:', emailResult.error);
          return false;
        }
      } else {
        console.log('ℹ️ Notificación de rifa agotada ya enviada anteriormente');
        return true;
      }
    } else {
      console.log('ℹ️ Rifa aún no está agotada');
      return false;
    }

  } catch (error) {
    console.error('❌ Error verificando rifa agotada:', error);
    return false;
  }
}

// Verificar rifas que necesitan recordatorio de sorteo
async function checkAndSendDrawReminders() {
  try {
    console.log('🔍 Verificando rifas que necesitan recordatorio de sorteo...');
    
    // Buscar rifas con sorteo en la próxima hora
    const rifasResult = await query(`
      SELECT 
        r.*,
        u.nombre as creador_nombre,
        u.email as creador_email
      FROM rifas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.fecha_sorteo IS NOT NULL 
        AND r.fecha_sorteo BETWEEN NOW() AND NOW() + INTERVAL '1 hour'
        AND r.activa = true
    `);

    console.log(`📊 Encontradas ${rifasResult.rows.length} rifas con sorteo en la próxima hora`);

    for (const rifa of rifasResult.rows) {
      // Verificar si ya se envió el recordatorio
      const reminderResult = await query(`
        SELECT * FROM rifa_notifications 
        WHERE rifa_id = $1 AND tipo = 'draw_reminder'
      `, [rifa.id]);

      if (reminderResult.rows.length === 0) {
        console.log(`⏰ Enviando recordatorio para rifa: ${rifa.nombre}`);
        
        const emailResult = await emailService.sendDrawReminder(rifa);
        
        if (emailResult.success) {
          // Registrar que se envió el recordatorio
          await query(`
            INSERT INTO rifa_notifications (rifa_id, tipo, fecha_envio, status)
            VALUES ($1, 'draw_reminder', CURRENT_TIMESTAMP, 'sent')
          `, [rifa.id]);
          
          console.log(`✅ Recordatorio enviado para rifa: ${rifa.nombre}`);
        } else {
          console.error(`❌ Error enviando recordatorio para rifa ${rifa.nombre}:`, emailResult.error);
        }
      } else {
        console.log(`ℹ️ Recordatorio ya enviado para rifa: ${rifa.nombre}`);
      }
    }

  } catch (error) {
    console.error('❌ Error verificando recordatorios de sorteo:', error);
  }
}

module.exports = {
  checkAndNotifySoldOut,
  checkAndSendDrawReminders
};
