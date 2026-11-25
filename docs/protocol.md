# Protocolo de comunicación

## 1. Descripción general

La aplicación utiliza dos mecanismos de comunicación para intercambiar información en tiempo real entre el servidor y sus clientes.

| Protocolo | Comunicación | Propósito |
|---|---|---|
| WebSocket | Bidireccional | Interacción entre participantes y servidor. |
| SSE (Server-Sent Events) | Unidireccional | Actualizaciones en tiempo real para la pantalla. |

Ambos mecanismos utilizan JSON para intercambiar información estructurada.

## 2. WebSocket

Se utiliza para la comunicación entre los participantes y el servidor.

Permite que los participantes envíen acciones y reciban respuestas, errores y actualizaciones generadas por otros participantes.

### 2.1. Mensajes del cliente al servidor

Todos los mensajes deben contener un campo `type` que identifique la acción solicitada.

#### Ingresar (`join`)

Registra a un participante en la sesión compartida.

```json
{
  "type": "join",
  "name": "Marcos"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| type | string | Tipo de mensaje: `join`. |
| name | string | Nombre visible del participante. |

El servidor valida el nombre, genera un identificador único y lo asocia a la conexión WebSocket.

#### Proponer productos (`propose_products`)

Solicita incorporar uno o varios productos del catálogo DummyJSON a la lista compartida.

```json
{
  "type": "propose_products",
  "productIds": [1, 5, 12]
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| type | string | Tipo de mensaje: `propose_products`. |
| productIds | number[] | Identificadores de los productos que se desean incorporar. |

Cada propuesta puede contener entre 1 y 10 identificadores.

El servidor consulta los productos en paralelo. Si algunas consultas fallan, incorpora los productos válidos e informa los fallos únicamente al participante que realizó la propuesta.

#### Votar (`vote`)

Registra el voto de un participante sobre un producto.

```json
{
  "type": "vote",
  "productId": 5
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| type | string | Tipo de mensaje: `vote`. |
| productId | number | Identificador del producto que se desea votar. |

Cada participante puede votar una sola vez por producto.

#### Retirar voto (`remove_vote`)

Retira el voto del participante sobre un producto.

```json
{
  "type": "remove_vote",
  "productId": 5
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| type | string | Tipo de mensaje: `remove_vote`. |
| productId | number | Identificador del producto. |

Cada participante únicamente puede retirar sus propios votos.

#### Eliminar producto (`remove_product`)

Solicita eliminar un producto de la lista compartida.

```json
{
  "type": "remove_product",
  "productId": 5
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| type | string | Tipo de mensaje: `remove_product`. |
| productId | number | Identificador del producto que se desea eliminar. |

Solo el participante que propuso originalmente el producto puede eliminarlo.

### 2.2. Mensajes del servidor al cliente

El servidor envía mensajes a los participantes mediante sus conexiones WebSocket.

#### Estado inicial (`initial_state`)

Se envía cuando un participante ingresa correctamente a la sesión.

```json
{
  "type": "initial_state",
  "participantId": "user-123",
  "participants": [],
  "products": [],
  "votes": []
}
```

Contiene el estado completo y actual de la aplicación, incluyendo el identificador asignado al participante, los participantes conectados, los productos y los votos.

#### Actualización del estado (`state_update`)

Se envía cuando ocurre un cambio relevante en la sesión compartida.

```json
{
  "type": "state_update",
  "participants": [],
  "products": [],
  "votes": []
}
```

Contiene el estado actualizado para sincronizar la interfaz de los participantes.

#### Resultado de una acción (`action_result`)

Se envía al participante que realizó una acción cuando es necesario informarle su resultado.

Ejemplo de una propuesta con fallos parciales:

```json
{
  "type": "action_result",
  "action": "propose_products",
  "success": false,
  "added": [1, 5],
  "failed": [
    {
      "productId": 12,
      "reason": "not_found"
    }
  ]
}
```

Informa qué productos se incorporaron correctamente y cuáles no pudieron agregarse, junto con el motivo correspondiente.

Los posibles motivos de fallo de una propuesta incluyen:

- `not_found`: el producto no existe en el catálogo.
- `timeout`: el catálogo no respondió dentro del tiempo establecido.
- `duplicate`: el producto ya se encuentra en la lista compartida.

Los errores de una propuesta se comunican únicamente a quien la realizó.

#### Error (`error`)

Se envía exclusivamente al participante que generó un mensaje inválido o solicitó una acción no permitida.

```json
{
  "type": "error",
  "code": "INVALID_MESSAGE",
  "message": "Formato de mensaje inválido."
}
```

Los posibles códigos incluyen:

- `INVALID_MESSAGE`: formato JSON o estructura del mensaje inválida.
- `UNKNOWN_MESSAGE_TYPE`: tipo de mensaje desconocido.
- `INVALID_FIELD`: campo faltante o valor inválido.
- `NOT_AUTHORIZED`: acción no permitida para el participante.
- `NOT_FOUND`: producto inexistente en la lista compartida.
- `DUPLICATE_VOTE`: el participante ya votó por ese producto.

Los errores no deben interrumpir el funcionamiento del servidor ni afectar a los demás participantes.

## 3. Server-Sent Events (SSE)

Se utiliza para transmitir actualizaciones desde el servidor hacia la pantalla compartida.

La pantalla establece una conexión mediante el endpoint `/events`, utilizando la API `EventSource` del navegador.

### 3.1. Conexión

```http
GET /events
```

El servidor responde utilizando el tipo de contenido `text/event-stream`.

### 3.2. Eventos

#### Estado inicial (`initial_state`)

Se envía cuando la pantalla establece la conexión.

```text
event: initial_state
data: {"participants":[],"products":[],"votes":[]}

```

Contiene el estado completo y actual de la sesión.

#### Actualización del estado (`state_update`)

Se envía cada vez que ocurre un cambio relevante en la lista compartida.

```text
event: state_update
data: {"participants":[],"products":[],"votes":[]}

```

Contiene el estado actualizado para que la pantalla pueda refrescar su información sin recargar la página.

La pantalla no envía acciones ni modifica el estado de la aplicación.

## 4. Sincronización del estado

El servidor es la única fuente de verdad del estado de la aplicación.

- Todas las acciones recibidas se validan y procesan en el servidor.
- Los participantes reciben el estado inicial al ingresar.
- Los participantes reciben actualizaciones cuando se producen cambios relevantes.
- La pantalla recibe el estado inicial y las actualizaciones posteriores mediante SSE.
- El servidor calcula la cantidad de votos y mantiene la consistencia de la lista compartida.
- Los productos incorporados y los votos se reflejan en todos los clientes conectados.

## 5. Validación y manejo de errores

El servidor valida cada mensaje recibido mediante WebSocket.

La validación contempla:

- Formato JSON válido.
- Tipo de mensaje reconocido.
- Presencia de los campos obligatorios.
- Tipos de datos y valores permitidos.
- Límites establecidos para cada operación.
- Permisos del participante.
- Consistencia con el estado actual de la aplicación.

Los mensajes inválidos generan una respuesta de error únicamente al emisor.

El servidor debe continuar funcionando ante mensajes inválidos, errores de comunicación o fallos del catálogo externo.

## 6. Gestión de conexiones

- Cada participante se identifica mediante un ID generado por el servidor y asociado a su conexión WebSocket.
- Cuando un participante se desconecta, el servidor libera los recursos asociados a esa conexión.
- La cantidad de participantes conectados se actualiza y se comunica a los demás clientes.
- Las conexiones SSE se cierran cuando la pantalla se desconecta.
- Los clientes desconectados dejan de recibir actualizaciones.

## 7. Decisiones de comunicación

- WebSocket se utiliza para los participantes porque necesitan comunicación bidireccional.
- SSE se utiliza para la pantalla porque únicamente necesita recibir actualizaciones.
- JSON proporciona un formato común para el intercambio de información.
- El servidor administra el estado centralizado y distribuye las actualizaciones a los clientes conectados.
- No se utiliza Socket.IO ni otro protocolo de comunicación basado en bibliotecas adicionales.
- No se utiliza una base de datos; el estado permanece en memoria mientras el servidor está en ejecución.