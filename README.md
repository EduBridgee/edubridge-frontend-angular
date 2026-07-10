<table>
<tr>
<td style="vertical-align: top; width: 100px; padding-right: 15px; border: none;">
<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ45DITH77up1n8tb7Bx2n7TO8tBq4I65ZIuw&s" align="left" alt="UPC Logo">
</td>
<td style="vertical-align: top; border: none;">
<h1>Universidad Peruana de Ciencias Aplicadas</h1>
<h2>Fundamentos de Data Science</h2>
<p><strong>Carrera:</strong> Ciencias de la Computación</p>
<p><strong>Sección:</strong> 3226</p>
<p><strong>Profesora:</strong> Nérida Isabel Manrique Tunque</p>
</td>
</tr>
</table>

## Integrantes

| Código | Apellidos, nombres |
| :--- | :--- |
| U202313446 | Flores Burga, Austin Bryan |
| U202318279 | Flores Mamani, Diego Alejandro |
| U202320608 | Toledo Mamani, Wilber Franz |
| U202312323 | Sotero Chávez, André Alessandro |

**Grupo:** 1  
**Año:** 2026

---

## 1. Introducción

El presente repositorio contiene el desarrollo del Trabajo Final (TB2) para el curso de Fundamentos de Data Science. El objetivo principal de este proyecto es analizar el conjunto de datos de tendencias de videos de YouTube correspondiente a Canadá (`CAvideos_cc50_202101.csv`). Se busca extraer conocimiento descriptivo y predictivo que permita a creadores de contenido y analistas de marketing comprender los patrones de comportamiento de los usuarios, las variables que impulsan la visibilidad de un video y predecir su éxito en la plataforma. 

Para lograrlo, se ha aplicado estrictamente la metodología **CRISP-DM** (Cross-Industry Standard Process for Data Mining), abarcando desde la comprensión del negocio y de los datos, hasta el modelado y la evaluación de resultados.

---

## 2. Metodología CRISP-DM

El análisis se ha dividido metodológicamente de la siguiente manera:

### 2.1 Comprensión y Preparación de los Datos
Durante las fases II y III de CRISP-DM, se llevaron a cabo rigurosos procesos de limpieza y estructuración de los datos en el cuaderno `upc-2026-01-3226-grupo1-tb2_8.ipynb`:
* **Manejo de asimetría:** La variable objetivo `views` presentó una fuerte asimetría positiva y valores atípicos reales correspondientes a "videos virales". En lugar de eliminar estos registros valiosos, se aplicó una transformación logarítmica (`log1p`) para normalizar la distribución sin pérdida de información, garantizando la viabilidad del modelado predictivo.
* **Agrupación de categorías:** Para reducir la dimensionalidad y evitar la dispersión de los coeficientes, se agruparon 17 categorías originales de YouTube en 5 grupos temáticos consolidados (Entretenimiento, Música, Informativo, Estilo de vida, Deportes y juegos).
* **Prevención de fuga de datos (Data Leakage):** Se evaluó y descartó la variable `engagement_ratio` que contenía `views` en su denominador, evitando así un sobreajuste artificial que habría invalidado los modelos. Igualmente, la variable `state` fue excluida de los predictores por no discriminar la variable objetivo, evadiendo la generación innecesaria de 12 variables ficticias (ruido estadístico).
* **Consolidación:** Se generó un conjunto de datos resultante, `CAvideos_limpio.csv`, asegurando que el entrenamiento se realice con un registro único por video (su primer día en tendencia).

### 2.2 Modelado y Evaluación
En la fase IV de CRISP-DM, se plantearon dos enfoques de modelado supervisado para responder a la viabilidad de predecir el desempeño de un video.

#### Modelo 1: Regresión Lineal Múltiple (Predicción de Vistas)
* **Objetivo:** Predecir de manera continua la cantidad de vistas (en escala logarítmica).
* **Resultados:** El modelo explicó aproximadamente el 10% de la variabilidad de los datos ($R^2 \approx 0.099$, validado mediante K-Fold obteniendo un promedio de $0.088 \pm 0.006$).
* **Conclusión:** Aunque la exactitud para estimar el número preciso de vistas individuales es baja (debido a la altísima variabilidad inherente en el consumo de medios), el modelo permitió identificar los factores estadísticos (como las categorías musicales y de entretenimiento) que se asocian de manera concluyente a un mayor alcance general.

#### Modelo 2: Regresión Logística (Predicción de Viralidad)
* **Objetivo:** Estimar la probabilidad de que un video cruce el umbral específico de visualizaciones que lo clasifica como viral, planteando la predicción como un problema de clasificación binaria (viral / no viral).
* **Técnica empleada:** Se implementó un ajuste de balance de clases (`class_weight='balanced'`) para combatir el desbalance inherente (solo el ~10.9% de los videos logran la "viralidad" en este set).
* **Resultados:** El modelo priorizó la detección (Recall $\approx 52\%$) asumiendo una baja precisión puntual ($\approx 14\%$). El área bajo la curva (ROC-AUC) alcanzó un valor estable de $\approx 0.66$.
* **Validación Práctica:** El análisis de discriminación por deciles demostró que el 10% de los videos con mayor probabilidad predicha por el modelo poseen una tasa de éxito real aproximadamente 8 veces superior en comparación al 10% de los videos con menor probabilidad predicha.

---

## 3. Conclusiones Principales

1. **La temática determina la tracción base:** Existe una relación altamente significativa entre el grupo temático de un video y su nivel de visitas. La categoría de *Música* presenta la mayor probabilidad intrínseca de éxito y viralidad, mientras que el contenido *Informativo* tiene la probabilidad más baja.
2. **Utilidad analítica del modelo:** El modelo de Regresión Logística desarrollado no debe considerarse un predictor determinista aislado; por el contrario, su principal valor operativo para el negocio reside en su capacidad de servir como un **filtro estadístico de priorización** ("scoring").
3. **Limitaciones inherentes a la metadata:** El alcance predictivo limitado ($\sim 10\%$ de la variabilidad explicada) revela que variables como el título, los *likes* y las etiquetas no son determinantes por sí solas. Gran parte del éxito de un video se fundamenta en características latentes que la metadata estructurada no logra capturar directamente (tales como la calidad de producción audiovisual, el atractivo de la miniatura, la eficacia de la promoción externa y las preferencias internas del algoritmo de recomendación de YouTube).

---

## 4. Trabajo Futuro

Para escalar la magnitud del proyecto y robustecer la capacidad predictiva de los sistemas desarrollados, se plantea la siguiente hoja de ruta:
* Implementar modelos de ensamble avanzado, tales como *Random Forest* o *Gradient Boosting*, los cuales poseen mayor flexibilidad para captar relaciones y patrones no lineales en los datos.
* Enriquecer la fase de preprocesamiento de características (feature engineering) incluyendo técnicas de Procesamiento de Lenguaje Natural (NLP) sobre los campos de título, descripción y extracción de sentimiento en los comentarios interactuando directamente con la API de YouTube.
* Extender la arquitectura del análisis de manera comparativa sobre los conjuntos de datos correspondientes a otras regiones disponibles (por ejemplo: Estados Unidos, Gran Bretaña, Alemania) para validar de manera empírica la capacidad de generalización de los hallazgos descritos.
* Considerar la extracción de variables exógenas mediante redes neuronales convolucionales aplicadas a las miniaturas ("thumbnails") de los videos para su posterior inclusión en los modelos tabulares.
