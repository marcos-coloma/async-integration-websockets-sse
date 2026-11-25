# Data Model

## 1. Entidades principales

### Participant

Representa a una persona conectada que puede proponer productos y votar.

| Atributo | Tipo | Descripción |
|---|---|---|
| id | string | Identificador único del participante. |
| name | string | Nombre visible del participante. |

### Product

Representa un producto del catálogo externo que fue incorporado a la lista compartida.

| Atributo | Tipo | Descripción |
|---|---|---|
| id | number | Identificador original del producto en DummyJSON. |
| title | string | Nombre del producto. |
| price | number | Precio del producto. |
| thumbnail | string | Imagen del producto. |
| proposedBy | string | Identificador del participante que lo propuso. |

### Vote

Representa el voto de un participante sobre un producto.

| Atributo | Tipo | Descripción |
|---|---|---|
| participantId | string | Identificador del participante que votó. |
| productId | number | Identificador del producto votado. |

## 2. Relaciones

- Un participante puede proponer uno o varios productos.
- Cada producto incorporado pertenece a la lista compartida y registra quién lo propuso.
- Un participante puede votar por varios productos.
- Un producto puede recibir votos de varios participantes.
- Un participante solo puede votar una vez por cada producto.

La relación entre participantes y productos mediante los votos es de muchos a muchos.

## 3. Estado en memoria

El servidor mantiene el estado de la aplicación en memoria, sin utilizar una base de datos.

Se utilizan las siguientes estructuras:

- `participants`: colección de participantes conectados, identificados por su ID.
- `products`: colección global de productos incorporados, identificados por el ID de DummyJSON.
- `votes`: colección de votos agrupados por participante, donde cada participante tiene un conjunto de productos votados.

## 4. Elementos que no constituyen entidades

- **Catálogo:** fuente externa de productos proporcionada por DummyJSON. No forma parte del estado de dominio.
- **Propuesta:** acción mediante la cual un participante envía uno o varios IDs de productos. No se almacena como entidad.
- **Lista compartida:** colección global de productos administrada por el servidor. No requiere una entidad independiente en esta versión.

## 5. Decisiones de diseño

- Se utiliza una única lista compartida para todos los participantes.
- Los productos conservan el identificador original de DummyJSON.
- Cada producto registra a su proponente mediante `proposedBy`.
- Solo el participante que propuso un producto puede eliminarlo.
- Los votos se representan mediante una colección independiente de los productos.
- El estado se pierde cuando el servidor deja de ejecutarse, ya que no existe persistencia.