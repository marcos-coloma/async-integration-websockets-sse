# Decisiones funcionales — TP4 Node.js

Este documento registra las decisiones funcionales acordadas para el desarrollo del TP4.

Está destinado a una IA que colaborará en el diseño, implementación y revisión del proyecto.

**Instrucción:** respetar estas decisiones. No asumir respuestas para los puntos pendientes ni modificar estas reglas sin consultar primero.

## 1. Desconexión de participantes y votos

**Decisión: B — Los votos se conservan.**

Cuando un participante se desconecta:
- Se elimina de la colección de participantes conectados.
- Sus votos permanecen en la sesión.
- Sus votos se conservan hasta que finalice la sesión.

La desconexión no implica que el participante haya abandonado su decisión.

## 2. Productos propuestos por participantes desconectados

**Decisión: B — Cualquier participante puede eliminarlos.**

- Mientras el proponente esté conectado, solamente él puede eliminar el producto.
- Si el proponente se desconecta, cualquier participante conectado puede eliminarlo.
- El producto no se elimina automáticamente cuando su proponente se desconecta.

## 3. Reconexión de participantes

**Decisión: B — Se recupera la identidad anterior.**

Cuando un participante vuelve a conectarse:
- Recupera su identidad anterior.
- Conserva sus votos.
- No debe crearse como un participante completamente nuevo.

**Pendiente de diseño:** definir el mecanismo que permitirá reconocer al participante después de una desconexión.

No asumir que basta con conservar el ID generado durante la conexión anterior: debe existir una forma de recuperarlo de manera segura.

## 4. Representación de los votos

**Decisión: A — Registros individuales.**


## 5. Contenido de `state_update`

**Decisión: A — Estado completo.**

Cada mensaje `state_update` debe contener el estado completo y actualizado de la aplicación:
- Participantes conectados.
- Productos incorporados.
- Votos registrados.

No se enviarán únicamente los datos que cambiaron.

Esto permite que los clientes mantengan su representación sincronizada con la fuente de verdad del servidor.

## 6. Resultado de propuestas parciales

**Decisión: A — Éxito si se incorporó al menos un producto.**

Cuando una propuesta contiene varios productos:
- Si se incorpora al menos uno, `success` será `true`.
- Los productos que no pudieron incorporarse se informarán en `failed`.
- Si no se incorpora ninguno, `success` será `false`.

Ejemplo: se solicitan tres productos, se incorporan dos y uno falla. La operación se considera exitosa parcialmente.

## 7. Acciones antes de ingresar

**Decisión: A — Rechazar sin cerrar la conexión.**

Si un cliente intenta ejecutar una acción antes de enviar correctamente `join`:
- El servidor rechaza la operación.
- Devuelve un error `NOT_AUTHORIZED`.
- Mantiene abierta la conexión WebSocket.

El cliente puede completar el ingreso posteriormente.

## 8. Cambio de nombre y segundo `join`

**Decisión: permitir cambiar el nombre mediante una operación independiente.**

- Un segundo mensaje `join` en la misma conexión debe rechazarse.
- El cambio de nombre se realiza mediante un nuevo mensaje `change_name`.
- El servidor identifica al participante utilizando la conexión WebSocket.
- El servidor actualiza el nombre y notifica el cambio al resto de los clientes.

Ejemplo de mensaje:

```json
{
  "type": "change_name",
  "name": "Nuevo nombre"
}
```

`change_name` todavía debe incorporarse formalmente al protocolo y contemplarse en la validación y los casos de uso.

## 9. Retirar un voto inexistente

**Decisión: B — Operación idempotente.**

Si un participante intenta retirar un voto que no existe:
- La operación se acepta.
- No se modifica el estado.
- No se devuelve un error por la ausencia del voto.

## 10. Eliminación de productos y sus votos

**Decisión: A — Eliminar también los votos asociados.**

Cuando se elimina un producto:
- Se elimina el producto de la lista compartida.
- Se eliminan todos los votos asociados a ese producto.

No deben quedar votos que hagan referencia a productos inexistentes.

---

## Resumen de decisiones

| N.º | Tema | Decisión |
|---|---|---|
| 1 | Votos al desconectarse | Se conservan |
| 2 | Productos de proponentes desconectados | Cualquier participante puede eliminarlos |
| 3 | Reconexión | Recupera identidad y votos |
| 4 | Representación de votos | Pendiente |
| 5 | `state_update` | Estado completo |
| 6 | Éxito parcial | `true` si se agregó al menos uno |
| 7 | Acciones antes de `join` | Rechazar y mantener conexión |
| 8 | Cambio de nombre | Mensaje independiente `change_name` |
| 9 | Retirar voto inexistente | Operación idempotente |
| 10 | Eliminar producto | Eliminar también sus votos |

## Consideraciones para el desarrollo

1. Mantener el servidor como única fuente de verdad.
2. Respetar la separación entre dominio, aplicación, infraestructura e interfaces.
3. No introducir persistencia en base de datos: el estado continúa siendo en memoria.
4. Mantener sincronizados los participantes conectados, productos y votos.
5. Reflejar las decisiones en `data-model.md`, `protocol.md` y `architecture.md` cuando corresponda.
6. No implementar funcionalidades adicionales por iniciativa propia sin evaluar primero su impacto en la consigna y consultar cuando impliquen nuevas decisiones funcionales.


