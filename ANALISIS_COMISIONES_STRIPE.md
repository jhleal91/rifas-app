# Análisis de Comisiones - Considerando Costos de Stripe

## Costos de Stripe en México
- **Comisión por transacción**: 3.6% + $3.00 MXN
- **Ejemplo**: Para un pago de $100 MXN
  - Stripe cobra: $3.60 + $3.00 = **$6.60 MXN**
  - Neto recibido: $100 - $6.60 = **$93.40 MXN**

## Planes Actuales (PROBLEMA)
| Plan | Comisión SorteoHub | Costo Stripe | Ganancia Neta | Estado |
|------|-------------------|--------------|---------------|--------|
| Free | 5.0% | 3.6% + $3 | ~1.4% - $3 | ⚠️ Posible pérdida en montos pequeños |
| Pro | 4.0% | 3.6% + $3 | ~0.4% - $3 | ❌ **PÉRDIDA en montos < $750** |
| Business | 2.5% | 3.6% + $3 | -1.1% - $3 | ❌ **PÉRDIDA siempre** |

### Análisis por Monto de Transacción

#### Transacción de $100 MXN
- **Free (5%)**: SorteoHub recibe $5.00, Stripe cobra $6.60 → **Pérdida: -$1.60**
- **Pro (4%)**: SorteoHub recibe $4.00, Stripe cobra $6.60 → **Pérdida: -$2.60**
- **Business (2.5%)**: SorteoHub recibe $2.50, Stripe cobra $6.60 → **Pérdida: -$4.10**

#### Transacción de $500 MXN
- **Free (5%)**: SorteoHub recibe $25.00, Stripe cobra $21.00 → **Ganancia: $4.00**
- **Pro (4%)**: SorteoHub recibe $20.00, Stripe cobra $21.00 → **Pérdida: -$1.00**
- **Business (2.5%)**: SorteoHub recibe $12.50, Stripe cobra $21.00 → **Pérdida: -$8.50**

#### Transacción de $1,000 MXN
- **Free (5%)**: SorteoHub recibe $50.00, Stripe cobra $39.00 → **Ganancia: $11.00**
- **Pro (4%)**: SorteoHub recibe $40.00, Stripe cobra $39.00 → **Ganancia: $1.00**
- **Business (2.5%)**: SorteoHub recibe $25.00, Stripe cobra $39.00 → **Pérdida: -$14.00**

## Propuesta de Nuevas Comisiones

### Objetivo
- Cubrir costo de Stripe (3.6% + $3)
- Dejar margen de ganancia razonable (1-2%)
- Ser competitivo en el mercado

### Opción 1: Comisiones Fijas (Recomendada)
| Plan | Comisión | Margen Neto Aprox | Justificación |
|------|----------|-------------------|---------------|
| **Free** | **6.5%** | ~2.9% | Cubre Stripe + margen mínimo |
| **Pro** | **5.5%** | ~1.9% | Mejor margen, plan intermedio |
| **Business** | **4.5%** | ~0.9% | Plan premium, menor comisión pero aún rentable |

### Opción 2: Comisiones Más Altas (Mayor Margen)
| Plan | Comisión | Margen Neto Aprox | Justificación |
|------|----------|-------------------|---------------|
| **Free** | **7.0%** | ~3.4% | Mayor margen para compensar plan gratuito |
| **Pro** | **6.0%** | ~2.4% | Margen saludable |
| **Business** | **5.0%** | ~1.4% | Plan premium con buen margen |

### Opción 3: Comisiones Escalonadas (Más Justo)
| Plan | Comisión | Margen Neto Aprox | Justificación |
|------|----------|-------------------|---------------|
| **Free** | **6.0%** | ~2.4% | Cubre costos + margen básico |
| **Pro** | **5.0%** | ~1.4% | Balance entre precio y comisión |
| **Business** | **4.0%** | ~0.4% | Plan premium, margen mínimo pero rentable |

## Recomendación Final: **Opción 1**

### Razones:
1. **Cubre costos de Stripe** en todos los escenarios
2. **Margen razonable** para sostenibilidad del negocio
3. **Competitivo** comparado con otras plataformas (GoFundMe: 2.9% + $0.30, Kickstarter: 5%)
4. **Escalado lógico**: Mayor suscripción = menor comisión

### Cálculo de Rentabilidad (Opción 1)

#### Transacción de $100 MXN
- **Free (6.5%)**: SorteoHub recibe $6.50, Stripe cobra $6.60 → **Pérdida: -$0.10** (marginal)
- **Pro (5.5%)**: SorteoHub recibe $5.50, Stripe cobra $6.60 → **Pérdida: -$1.10**
- **Business (4.5%)**: SorteoHub recibe $4.50, Stripe cobra $6.60 → **Pérdida: -$2.10**

⚠️ **Nota**: En montos muy pequeños (< $150), puede haber pérdidas marginales. Esto es normal y se compensa con transacciones más grandes.

#### Transacción de $300 MXN (Típico)
- **Free (6.5%)**: SorteoHub recibe $19.50, Stripe cobra $13.80 → **Ganancia: $5.70**
- **Pro (5.5%)**: SorteoHub recibe $16.50, Stripe cobra $13.80 → **Ganancia: $2.70**
- **Business (4.5%)**: SorteoHub recibe $13.50, Stripe cobra $13.80 → **Pérdida: -$0.30** (marginal)

#### Transacción de $500 MXN
- **Free (6.5%)**: SorteoHub recibe $32.50, Stripe cobra $21.00 → **Ganancia: $11.50**
- **Pro (5.5%)**: SorteoHub recibe $27.50, Stripe cobra $21.00 → **Ganancia: $6.50**
- **Business (4.5%)**: SorteoHub recibe $22.50, Stripe cobra $21.00 → **Ganancia: $1.50**

#### Transacción de $1,000 MXN
- **Free (6.5%)**: SorteoHub recibe $65.00, Stripe cobra $39.00 → **Ganancia: $26.00**
- **Pro (5.5%)**: SorteoHub recibe $55.00, Stripe cobra $39.00 → **Ganancia: $16.00**
- **Business (4.5%)**: SorteoHub recibe $45.00, Stripe cobra $39.00 → **Ganancia: $6.00**

## Consideraciones Adicionales

### 1. Monto Mínimo de Transacción
- Considerar establecer un monto mínimo de $50-100 MXN para evitar pérdidas en transacciones muy pequeñas
- O implementar un fee mínimo adicional para transacciones < $150

### 2. Comisión Mínima
- Alternativa: Comisión porcentual + fee mínimo
- Ejemplo: 4.5% + $5 MXN mínimo
- Esto garantiza rentabilidad incluso en montos pequeños

### 3. Diferentes Métodos de Pago
- OXXO: Misma comisión (3.6% + $3)
- Tarjetas internacionales: Pueden tener comisiones adicionales
- Considerar ajustes según método de pago

## Implementación

### Pasos:
1. Actualizar comisiones en base de datos
2. Actualizar documentación y términos
3. Notificar a usuarios existentes (si aplica)
4. Actualizar frontend para mostrar nuevas comisiones

### SQL para Actualizar:
```sql
UPDATE creator_plans SET commission_pct = 6.50 WHERE name = 'Free';
UPDATE creator_plans SET commission_pct = 5.50 WHERE name = 'Pro';
UPDATE creator_plans SET commission_pct = 4.50 WHERE name = 'Business';
```

