### Prompt mejorado

> Necesito que diseñes y ejecutes un **plan incremental para alcanzar al menos un 80% de cobertura en SonarQube**, respetando estrictamente la **estructura del proyecto indicada en `@`** y sin modificar la lógica de negocio existente.
>
> **Alcance y reglas:**
>
> * Debés crear **únicamente tests automatizados** (unitarios, de integración o e2e según corresponda) orientados a maximizar el impacto real en la cobertura reportada por SonarQube.
> * Los tests deben seguir buenas prácticas: claridad, aislamiento, determinismo y alineación con la pirámide de tests.
> * No agregues código productivo salvo mocks, fakes o helpers estrictamente necesarios para testear.
>
> **Metodología obligatoria (iterativa):**
>
> 1. Usá el **MCP server de SonarQube** para analizar el estado inicial del proyecto.
> 2. Identificá los archivos y líneas con **menor cobertura y mayor impacto** en el porcentaje global.
> 3. Proponé un **plan de testeo priorizado** (qué test crear primero y por qué).
> 4. Implementá los tests.
> 5. Ejecutá el **Sonar scan**.
> 6. Re-analizá los resultados vía MCP y validá el progreso.
> 7. Repetí el ciclo hasta **superar efectivamente el 80% de cobertura en SonarQube**.
>
> **Requisitos de validación:**
>
> * Cada iteración debe justificar qué se testeó y cómo impacta en la cobertura.
> * El resultado final debe confirmar explícitamente que SonarQube reporta ≥ 80%.
> * Si existen archivos imposibles o no razonables de testear, documentalos y justificá el criterio.
>
> El objetivo no es solo “subir números”, sino lograr una cobertura **real, sostenible y alineada con SonarQube**.