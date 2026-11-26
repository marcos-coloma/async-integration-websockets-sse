# Protocolo de comunicación

## Transporte

Los participantes se conectan al servidor por WebSocket en `/ws`. La pantalla compartida usa Server-Sent Events (SSE) en `GET /events`. Los mensajes y los datos de los eventos se serializan como JSON. El servidor mantiene la fuente de verdad y envía el estado completo en cada actualización.

## Mensajes WebSocket: cliente a servidor

Todos los mensajes deben ser objetos JSON con un campo `type`. El servidor valida cada mensaje. Los identificadores de producto deben ser enteros positivos.

### `join`

Registra al participante en la conexión actual.

```json
{ "type": "join", "name": "Marcos" }
```

`name` debe tener entre 1 y 20 caracteres después de quitar espacios al principio y al final. Los nombres deben ser únicos entre quienes están conectados; la comparación no distingue mayúsculas de minúsculas. El servidor asigna el ID.

Un segundo `join` en la misma conexión se rechaza. Las acciones distintas de `join` requieren que el participante haya ingresado. Estos rechazos no cierran la conexión.

### `change_name`

Cambia el nombre del participante de la conexión actual. `name` usa las mismas reglas de longitud y unicidad que en `join`.

```json
{ "type": "change_name", "name": "Nuevo nombre" }
```

### `propose_products`

Solicita agregar entre 1 y 10 productos. El servidor consulta el catálogo en paralelo; los datos incorporados provienen del catálogo, no del mensaje del cliente.

```json
{ "type": "propose_products", "productIds": [1, 5, 12] }
```

Un producto existente o que ya está siendo agregado se informa como duplicado. Esto incluye IDs repetidos en el mismo pedido y propuestas concurrentes. Los fallos se reportan individualmente; los productos válidos pueden agregarse aunque otros fallen.

### `vote`

Registra un voto. Cada participante puede votar una vez por producto.

```json
{ "type": "vote", "productId": 5 }
```

### `remove_vote`

Retira el voto del participante sobre el producto indicado. La operación es idempotente: si no había voto, se acepta sin cambiar el estado.

```json
{ "type": "remove_vote", "productId": 5 }
```

### `remove_product`

Elimina un producto de la lista y también elimina sus votos asociados. Si quien lo propuso sigue conectado, solo esa persona puede quitarlo. Si ya se desconectó, cualquier participante conectado puede hacerlo.

```json
{ "type": "remove_product", "productId": 5 }
```

## Mensajes WebSocket: servidor a participantes

### `initial_state`

Se envía al participante después de un `join` válido. Incluye el ID generado para esa conexión y el estado completo.

```json
{
  "type": "initial_state",
  "participantId": "uuid",
  "participants": [{ "id": "uuid", "name": "Marcos" }],
  "products": [],
  "votes": []
}
```

### `state_update`

Se envía a los participantes conectados cuando cambia el estado. Contiene siempre las colecciones completas de participantes, productos y votos. Quien acaba de ingresar recibe `initial_state` en lugar de un `state_update` duplicado.

```json
{
  "type": "state_update",
  "participants": [],
  "products": [],
  "votes": []
}
```

### `action_result`

Confirma una acción al participante que la solicitó. Se usa para `change_name`, `propose_products`, `vote`, `remove_vote` y `remove_product`.

```json
{
  "type": "action_result",
  "action": "propose_products",
  "success": true,
  "added": [1, 5],
  "failed": [{ "productId": 12, "reason": "not_found" }]
}
```

En una propuesta, `success` es `true` si se agregó al menos un producto. `added` contiene los IDs agregados y `failed` los fallidos. Los motivos posibles son `not_found`, `timeout`, `duplicate` y `unavailable`. Los fallos de una propuesta solo se envían a quien la realizó.

Retirar un voto inexistente produce `action_result` con éxito, pero no genera una actualización del estado porque nada cambió.

### `error`

Se envía solo al cliente que originó el error. Los códigos que puede recibir son:

| Código | Significado |
|---|---|
| `INVALID_JSON` | El contenido no se puede interpretar como JSON. |
| `INVALID_MESSAGE` | El mensaje no es un objeto con un campo `type` de texto. |
| `UNKNOWN_MESSAGE` | El tipo de mensaje no está reconocido. |
| `INVALID_FIELDS` | Faltan campos o sus valores no cumplen el formato esperado. |
| `NOT_AUTHORIZED` | Falta ingresar, se repitió `join` o la acción no está permitida. |
| `NAME_TAKEN` | Ya hay un participante conectado con ese nombre, sin distinguir mayúsculas. |
| `NOT_FOUND` | El producto no existe en la lista para la acción solicitada. |
| `DUPLICATE_VOTE` | El participante ya votó por ese producto. |
| `INTERNAL_ERROR` | Ocurrió un error inesperado al procesar el mensaje. |

Ejemplo:

```json
{ "type": "error", "code": "INVALID_FIELDS", "message": "Message contains missing or invalid fields." }
```

Los errores del catálogo durante una propuesta se informan en `failed`, no como `error` general.

## Eventos SSE: servidor a pantalla

La conexión se abre con `GET /events` y responde con `Content-Type: text/event-stream`. SSE es unidireccional: la pantalla no envía acciones.

### `initial_state`

Se envía inmediatamente al abrir la conexión:

```text
event: initial_state
data: {"participants":[],"products":[],"votes":[]}
```

### `state_update`

Se envía con el estado completo cuando se agrega, quita o actualiza un producto, se registra o retira un voto, cambia un nombre o se conecta/desconecta un participante.

```text
event: state_update
data: {"participants":[],"products":[],"votes":[]}
```

## Estado y conexiones

- `participants` contiene a quienes están conectados. Al desconectarse una persona, se la quita de esta colección y se notifica el cambio.
- Los votos se guardan como registros `{ "participantId": "...", "productId": 5 }`. Se conservan aunque el participante se desconecte.
- El estado vive en memoria y se pierde al detener el servidor.
- La conexión WebSocket identifica al participante hasta que se cierra. La recuperación de identidad al reconectar todavía no está implementada.
- WebSocket permite enviar acciones y recibir respuestas; SSE entrega novedades a la pantalla sin mantener un canal de envío desde ella.
