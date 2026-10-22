# Contexto para continuar AppFinanciera — cierre de sesión y preparación de Stage 3

> **SEMILLA ABSORBIDA (Etapa 0, 23/09/2026):** el contenido de este documento fue integrado en `context/dominio.md` como fuente del modelo funcional. Se conserva como referencia histórica; no es la fuente de trabajo. La secuencia "Stage 3/Stage 2" quedó reemplazada por el roadmap de etapas 0–4 (`ROADMAP.md`).

> Respaldo del documento de contexto producido el 19/09/2026. Fuente de verdad sobre **uso real y visión** de AppFinanciera. La auditoría (`REPORT-02.md`) describe el código; este documento describe la realidad. Se consulta junto con `context/AppFinanciera-Stage3.md` de `personal-system` (coordinador del proyecto).

Posible cadena de recuperación: `REPORT-02.md` (auditoría, repo) → este documento (uso real y visión) → `context/AppFinanciera-Stage3.md` (coordinador: borrador de diseño + preguntas pendientes P1–P8).

---

## 1. Estado actual

El `REPORT-02.md` correspondiente a la auditoría de Stage 2 ya fue generado y revisado.

La auditoría fue de carácter read-only y no realizó modificaciones en código ni datos.

El objetivo de esta sesión es **dejar registrado el contexto real de uso y la visión futura de AppFinanciera**, para que la próxima sesión pueda comenzar directamente con el diseño de Stage 3.

**No implementar Stage 3 todavía.**

Primero debe consolidarse el contexto, analizarse el modelo actual y diseñarse la etapa. La implementación solo debe comenzar después de que el diseño sea revisado y aprobado.

## 2. Objetivo real de AppFinanciera

AppFinanciera tiene dos dimensiones que deben mantenerse separadas:

### Uso actual

Es la herramienta financiera que utilizamos actualmente para:

- registrar ingresos;
- registrar gastos;
- manejar gastos fijos;
- manejar gastos compartidos;
- visualizar información financiera;
- llevar el balance correspondiente a determinados gastos compartidos.

### Visión futura

La intención a largo plazo es que AppFinanciera pueda convertirse en una aplicación general que otras personas puedan descargar y utilizar.

La aplicación debería permitir eventualmente:

- crear una cuenta;
- crear grupos;
- compartir gastos con otras personas;
- definir cómo se dividen determinados gastos;
- configurar gastos fijos;
- registrar productos;
- visualizar estadísticas por producto/categoría;
- manejar tarjetas;
- manejar préstamos o adelantos;
- manejar distintos tipos de gastos compartidos;
- configurar el comportamiento financiero del grupo.

Esto es **visión futura**, no alcance inmediato de Stage 3.

No asumir que todo debe implementarse ahora.

## 3. Uso actual real

Actualmente la aplicación es utilizada por dos personas, cada una con su propia cuenta.

Las áreas principales son:

- ingresos;
- gastos;
- gastos fijos;
- gastos compartidos;
- visualización.

### Ingresos actuales

Existen:

- Sueldo
- Bandas
- Freelance

El sueldo representa el ingreso mensual del trabajo fijo.

Bandas representa ingresos obtenidos por actuaciones.

Freelance se registra correctamente, pero actualmente existe un problema en la visualización de estos ingresos.

Este problema forma parte del trabajo a revisar, pero no debe confundirse con el modelo conceptual de ingresos.

## 4. Gastos fijos compartidos

Los gastos fijos incluyen cosas como:

- alquiler;
- electricidad;
- agua;
- suscripciones;
- otros gastos recurrentes.

Pueden ser:

- personales;
- compartidos.

Actualmente los gastos fijos compartidos se manejan **50/50**.

Cuando se registra una factura:

1. se registra el gasto;
2. se registra quién lo pagó;
3. se determina cuánto corresponde a cada persona;
4. se acumula el balance;
5. la persona que debe dinero puede ver a quién debe;
6. al realizar el pago/ajuste, el balance queda saldado.

Este mecanismo **sí genera una deuda/balance real**.

El balance corresponde específicamente a los gastos fijos compartidos.

## Cierre mensual

El uso real hasta ahora es que estos balances se resuelven.

La aplicación debe conservar el historial aunque el balance termine en cero.

No asumir que el sistema debe eliminar el histórico al cerrar el mes.

Conceptualmente debe existir una diferencia entre:

- histórico de lo ocurrido;
- balance actualmente pendiente.

## 5. Configuración futura de porcentajes

Actualmente el uso es 50/50.

Sin embargo, sería conveniente que el modelo interno no quede limitado técnicamente a 50/50.

La idea futura es poder soportar configuraciones como:

- 50/50;
- 60/40;
- 70/30;
- etc.

La interfaz actual puede continuar mostrando 50/50.

No es necesario implementar ahora una interfaz completa de porcentajes.

Pero al diseñar Stage 3, analizar si conviene que la estructura de datos ya sea compatible con este concepto.

La regla es:

**modelo suficientemente flexible, interfaz sencilla.**

## 6. Gastos diarios compartidos

Esta parte es especialmente importante.

Actualmente un gasto diario puede ser:

### Personal

Solo pertenece al usuario que lo registra.

### Compartido

Es visible para ambas personas.

Ejemplo:

Se realiza una compra en supermercado con productos del hogar.

El gasto compartido sirve como:

- registro;
- historial;
- información para ambos;
- dato para visualización.

Pero **NO genera deuda ni balance entre las personas**.

Esto es intencional.

No queremos que el visualizador muestre constantemente algo como:

> "Debés $X"

por cada gasto diario compartido.

Tampoco queremos generar una sensación de deuda en el uso cotidiano de la aplicación.

En nuestro grupo actual **no se utilizará nunca el balance para gastos diarios compartidos**.

Sin embargo, la estructura general de la aplicación puede contemplar que otros grupos o usuarios quieran utilizar un mecanismo de balance.

Por lo tanto:

- nuestro grupo actual: gasto compartido diario = registro;
- otros grupos futuros: podrían eventualmente activar balance;
- esto debería ser una posibilidad de configuración, no una obligación.

No convertir esto en una deuda visible en el visualizador actual.

## 7. Gastos extraordinarios compartidos / dinero a recuperar

Existe otro caso diferente al gasto diario compartido.

Ejemplo:

Compro un mueble para la casa y corresponde dividirlo 50/50.

Yo pago todo.

Mi pareja luego me devuelve su parte.

Otro ejemplo:

Compro una entrada para un amigo.

El amigo me devuelve posteriormente su parte.

Estos casos no deberían registrarse como:

> ingreso personal.

El dinero recibido posteriormente es una **recuperación de dinero adelantado / reintegro / settlement**, no un ingreso nuevo.

Por lo tanto, conceptualmente debe existir una categoría o módulo diferente para:

**dinero a recuperar de otra persona.**

Debe poder aplicarse tanto a:

- pareja;
- amigo;
- familiar;
- otra persona del grupo.

Esto es diferente de:

- ingreso;
- gasto diario compartido sin balance;
- gasto fijo compartido.

Analizar durante Stage 3 cuál es la mejor forma de modelarlo.

No asumir todavía el nombre técnico definitivo.

## 8. Tarjeta de crédito

Actualmente la tarjeta de crédito no está implementada como módulo específico.

El funcionamiento real actual es:

1. se utiliza la tarjeta;
2. posteriormente se revisan los gastos;
3. se determina qué parte corresponde a la otra persona;
4. se realiza el ajuste manual.

Esto debería evolucionar eventualmente hacia un **módulo propio de tarjeta**.

No necesariamente debe existir integración bancaria.

El objetivo es poder representar correctamente:

- gastos realizados con tarjeta;
- quién realizó el gasto;
- qué parte corresponde a otra persona;
- cuánto queda por recuperar;
- pagos/ajustes posteriores.

No tratar la devolución de la parte de la tarjeta como ingreso.

Debe formar parte del modelo de recuperaciones/settlements.

## 9. Transferencias actuales

La colección/lógica de `transferencias` encontrada en la auditoría corresponde a un intento anterior de implementar este concepto.

Actualmente **no se utiliza**.

No debe considerarse una funcionalidad central del modelo financiero actual.

Analizar si corresponde:

- marcarla como obsoleta;
- retirar progresivamente su uso;
- limpiar la lógica asociada;
- mantenerla temporalmente por compatibilidad histórica.

Pero no construir Stage 3 alrededor de esta funcionalidad.

## 10. Configuración futura de la aplicación

Existe una idea de producto importante para el futuro:

Una sección de configuración, posiblemente accesible mediante una "ruedita", donde el grupo/usuario pueda configurar cómo quiere utilizar determinadas funcionalidades.

Ejemplos:

- porcentaje de división de gastos compartidos;
- 50/50, 60/40, etc.;
- mostrar balance o no;
- activar/desactivar determinados comportamientos;
- editar gastos fijos;
- configurar participantes;
- otras reglas financieras del grupo.

Esto permitiría que la aplicación tenga un modelo general más flexible sin obligar a todos los usuarios a utilizar todas las funcionalidades.

Ejemplo conceptual:

### Grupo actual

- Gastos diarios compartidos: sin balance.
- Gastos fijos compartidos: 50/50 + balance.
- Recuperaciones: activas.
- Tarjeta: futura.

### Otro grupo

Podría eventualmente:

- usar 60/40;
- activar balances para gastos compartidos;
- utilizar otras personas como participantes;
- tener otra configuración.

Esto debe considerarse **visión de producto futura**.

No implementar toda esta configuración ahora.

## 11. Visualizador

El visualizador debe respetar las diferencias semánticas entre los tipos de movimiento.

Actualmente interesa visualizar:

- gastos personales;
- gastos diarios compartidos;
- gastos fijos personales;
- gastos fijos compartidos;
- ingresos reales.

No debe convertir automáticamente todos los movimientos compartidos en deuda.

Especialmente:

**gasto diario compartido ≠ deuda.**

Y:

**reintegro/recuperación ≠ ingreso.**

El diseño de Stage 3 debe tener estas diferencias conceptuales presentes.

## 12. Firestore y acceso read-only

Durante el siguiente ciclo puede ser útil que OpenCode tenga acceso de **solo lectura** a Firestore.

El objetivo sería permitir:

- inspeccionar la estructura real de las colecciones;
- observar documentos reales;
- entender cómo están representados actualmente los grupos;
- entender usuarios y relaciones;
- detectar inconsistencias entre modelo teórico y datos reales;
- analizar datos reales para validar el diseño;
- comprender mejor cómo impactarían los cambios en la aplicación.

Esto solo debe hacerse si realmente aporta valor al diseño y al análisis.

**No dar acceso de escritura.**

No modificar datos reales desde OpenCode.

Si el acceso read-only no aporta una diferencia significativa respecto de la información ya disponible, no implementarlo simplemente por tenerlo.

## 13. Datos reales

La auditoría inicial identificó varias cuestiones que ahora deben analizarse teniendo en cuenta el uso real.

Entre ellas:

- visualización incorrecta de Freelance;
- diferencias entre modelos de gastos compartidos;
- reintegros actualmente contabilizados como ingresos;
- estructura de gastos fijos;
- posibles duplicaciones;
- lógica antigua de transferencias;
- diferencias entre datos reales y modelo conceptual.

La siguiente etapa debe priorizar la **corrección semántica del modelo** antes que agregar funcionalidades.

El objetivo no es hacer una app más compleja.

El objetivo es que los datos representen correctamente lo que realmente sucede.

## 14. Principio de diseño

Mantener esta regla:

> La aplicación debe poder representar correctamente la realidad financiera sin obligar al usuario a utilizar toda la complejidad disponible.

Por eso:

- el modelo puede ser flexible;
- la configuración puede ser futura;
- el usuario actual puede utilizar solamente una parte;
- el visualizador debe mostrar solamente información útil;
- no generar deuda artificial;
- no convertir recuperaciones en ingresos;
- no construir funcionalidades solo porque técnicamente son posibles.

## 15. Alcance de Stage 3

La próxima conversación debe comenzar por:

### DISEÑAR STAGE 3

No comenzar directamente a modificar código.

Primero:

1. Leer `REPORT-02.md`.
2. Leer el contexto actual del proyecto.
3. Incorporar toda la información de este documento.
4. Comparar la auditoría técnica con el uso real.
5. Identificar diferencias entre:

   - modelo actual;
   - modelo deseado;
   - funcionalidades futuras.

6. Definir qué debe corregirse.
7. Definir qué debe mantenerse.
8. Definir qué debe quedar obsoleto.
9. Definir qué debe posponerse.
10. Diseñar el modelo conceptual de datos.
11. Determinar qué cambios mínimos necesita la aplicación.
12. Determinar si el acceso read-only a Firestore aporta valor.
13. Presentar una propuesta de Stage 3 para aprobación.

No implementar hasta que la propuesta sea aprobada.

## 16. Criterio para cerrar Stage 3

Stage 3 no se considera terminado simplemente porque haya código funcionando.

Debe quedar claro:

- qué representa cada tipo de movimiento;
- qué genera balance;
- qué no genera balance;
- qué es ingreso;
- qué es gasto;
- qué es recuperación;
- cómo funcionan los gastos fijos;
- cómo funciona el histórico;
- cómo se representa una deuda real;
- qué parte es específica del grupo actual;
- qué parte forma parte del modelo general de la aplicación.

La meta es dejar una base suficientemente correcta para poder pasar a la implementación y posteriormente utilizar datos reales con confianza.

## 17. Regla permanente de despliegue

Toda modificación de la aplicación debe seguir:

**Local → Staging → Producción → Verificación**

Nunca asumir que una modificación está terminada solo porque funciona localmente.

Después de producción debe verificarse que el comportamiento real sea correcto.

No modificar producción directamente.

## 18. Relación con el Organizador Personal

Recordar que AppFinanciera es un proyecto separado.

El Organizador Personal:

- coordina;
- define prioridades;
- analiza;
- propone;
- registra decisiones;
- controla el estado.

AppFinanciera:

- implementa;
- prueba;
- modifica código;
- trabaja sobre Firestore;
- genera sus propios reportes.

El cierre de Finanzas en el Organizador **no implica terminar AppFinanciera como producto**.

Una vez alcanzada la capacidad mínima necesaria para que el Organizador pueda utilizar datos financieros confiables, AppFinanciera puede continuar desarrollándose como producto independiente.

## 19. Próximo paso

En la próxima sesión:

**No empezar programando.**

Comenzar por el diseño de Stage 3 utilizando este contexto y `REPORT-02.md` como base.

La secuencia esperada es:

**LEER → ANALIZAR → DISEÑAR → PROPONER → USUARIO DECIDE → PLANIFICAR → USUARIO APRUEBA → EJECUTAR**

La propuesta debe separar claramente:

- correcciones necesarias;
- cambios estructurales;
- funcionalidades nuevas;
- mejoras futuras;
- ideas de producto.

No mezclar todo en una única etapa de implementación.