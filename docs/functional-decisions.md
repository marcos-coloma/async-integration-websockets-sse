# Decisiones funcionales — TP4 Node.js

Este documento registra las reglas funcionales acordadas y su estado actual. Los puntos indicados como pendientes no se consideran implementados.

## 1. Nombres de participantes

- Se quitan los espacios al principio y al final.
- Se aceptan nombres de 1 a 20 caracteres después de normalizarlos.
- Los nombres deben ser únicos entre participantes conectados. La comparación no distingue mayúsculas de minúsculas.
- La misma regla se aplica al ingresar y al cambiar el nombre.

## 2. Desconexión de participantes y votos

Cuando un participante se desconecta, se elimina de la colección de participantes conectados, pero sus votos se conservan hasta que finalice la sesión. La desconexión no elimina sus productos.

## 3. Productos propuestos por participantes desconectados

- Mientras el proponente esté conectado, solo él puede eliminar el producto.
- Si el proponente se desconecta, cualquier participante conectado puede eliminarlo.
- Al quitar un producto, se eliminan también todos sus votos.

## 4. Reconexión

La decisión funcional es que una persona que vuelve recupere su identidad y sus votos. **No está implementado todavía:** falta definir un mecanismo seguro para reconocerla entre conexiones. El estado actual crea un ID para cada ingreso y no recupera la identidad al reconectar.

## 5. Representación de votos

Los votos se representan como registros individuales con `participantId` y `productId`. Cada participante puede registrar un solo voto por producto.

## 6. Contenido de `state_update`

Cada actualización incluye el estado completo: participantes conectados, productos y votos. No se envían deltas.

## 7. Resultado de propuestas parciales

Una propuesta se considera exitosa si se agregó al menos un producto. `added` contiene los IDs agregados y `failed` informa cada ID que falló y su motivo. Los fallos posibles son `not_found`, `timeout`, `duplicate` y `unavailable`.

Las consultas de una propuesta se realizan en paralelo. Un mismo producto no se agrega dos veces, incluso si otra propuesta concurrente ya lo está consultando.

## 8. Acciones antes de ingresar y segundo `join`

Las acciones distintas de `join` se rechazan con `NOT_AUTHORIZED` antes del ingreso, pero la conexión permanece abierta. Un segundo `join` en la misma conexión también se rechaza sin cerrar la conexión.

## 9. Cambio de nombre

El nombre se cambia con el mensaje independiente `change_name`. El servidor valida las mismas reglas de longitud y unicidad que en `join`, actualiza el participante y distribuye el estado nuevo.

## 10. Retirar un voto inexistente

Retirar un voto inexistente sobre un producto válido es una operación idempotente: se acepta, no cambia el estado y no produce una actualización de estado. Si el producto no existe, el servidor devuelve `NOT_FOUND`.

## Resumen del estado

| Tema | Decisión o estado |
|---|---|
| Nombres | 1–20 caracteres tras quitar espacios exteriores; únicos entre conectados, sin distinguir mayúsculas |
| Votos al desconectarse | Se conservan |
| Productos de proponentes desconectados | Cualquier participante conectado puede eliminarlos |
| Reconexión | Recuperar identidad; mecanismo pendiente y funcionalidad no implementada |
| Representación de votos | Registros individuales |
| `state_update` | Estado completo |
| Éxito parcial | `true` si se agregó al menos uno |
| Acciones antes de `join` | Rechazar y mantener conexión abierta |
| Cambio de nombre | Mensaje independiente `change_name` |
| Retirar voto inexistente | Aceptar sin cambiar ni emitir actualización |
| Eliminar producto | Eliminar también sus votos |

## Criterios de implementación

1. Mantener al servidor como única fuente de verdad.
2. Respetar la separación entre dominio, aplicación, infraestructura e interfaces.
3. Mantener el estado en memoria, sin base de datos.
4. Mantener sincronizados participantes conectados, productos y votos.
5. Reflejar las reglas implementadas en `protocol.md` y `data-model.md`.
