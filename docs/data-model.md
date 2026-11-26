# Modelo de datos

## Entidades

### Participant

Representa a una persona conectada.

| Atributo | Tipo | Descripción |
|---|---|---|
| `id` | string | UUID generado por el servidor para el ingreso actual. |
| `name` | string | Nombre visible, normalizado y único entre participantes conectados. |

### Product

Representa un producto del catálogo incorporado a la lista compartida.

| Atributo | Tipo | Descripción |
|---|---|---|
| `id` | number | Identificador original del producto en DummyJSON. |
| `title` | string | Título recibido del catálogo. |
| `price` | number | Precio recibido del catálogo. |
| `thumbnail` | string | URL de imagen recibida del catálogo. |
| `proposedBy` | string | ID del participante que lo propuso. |

### Vote

Representa un voto individual.

| Atributo | Tipo | Descripción |
|---|---|---|
| `participantId` | string | ID del participante que votó. |
| `productId` | number | ID del producto votado. |

Un participante puede votar por varios productos, pero solo una vez por cada uno. Un producto puede recibir votos de varias personas.

## Estado en memoria

El estado se administra sin base de datos mediante:

- `participants`: `Map<string, Participant>` con los participantes conectados, indexados por ID.
- `products`: `Map<number, Product>` con los productos de la lista, indexados por ID de catálogo.
- `votes`: `Vote[]` con un registro por voto.

Al desconectarse un participante, se lo quita de `participants`, pero sus votos permanecen en `votes`. Al eliminar un producto, se quita de `products` y se eliminan los votos que lo referencian. El estado completo se pierde cuando se detiene el servidor.

## Elementos que no son entidades persistidas

- **Catálogo:** servicio externo DummyJSON; no forma parte del estado compartido.
- **Propuesta:** acción que envía entre 1 y 10 IDs; no se almacena después de procesarse.
- **Lista compartida:** colección global representada por `products`; no requiere una entidad adicional.

## Decisiones actuales y límite conocido

- Los productos conservan el ID de DummyJSON y registran a quien los propuso.
- Mientras el proponente está conectado, solo él puede eliminar el producto. Tras su desconexión, puede hacerlo cualquier participante conectado.
- La identidad de reconexión todavía no se recupera: cada `join` genera un ID nuevo. El mecanismo seguro para recuperar la identidad sigue pendiente.
