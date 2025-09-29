# Ajuda i Guia d’Usuari

1.  [Com començar ràpidament](#quickstart)
2.  [Conceptes bàsics](#concepts)
3.  [Planificador](#scheduler)
4.  [Infants](#kids)
5.  [Matèries](#matters)
6.  [Avui i Ara/Següent](#today)
7.  [Configuració](#settings)
8.  [Compartir / Exportar i Importar](#share)
9.  [Instal·lació i mode fora de línia](#pwa)
10. [PMF i Resolució de problemes](#faq)
11. [Dades i Privadesa](#privacy)
12. [Contacte](#contact)

<a id="quickstart"></a>

## Com començar ràpidament

1.  Ves a [Matèries](/matters) i crea els teus temes/activitats. Dona’ls un nom, un color i (opcionalment) un rang de dates durant el qual estiguin actius.
2.  Ves a [Infants](/kids), afegeix cada infant (l’app genera un avatar automàticament).
3.  Obre el [Planificador](/timetable-scheduler), tria un infant i fes clic a les cel·les buides per afegir-hi matèries. Arrossega per moure; arrossega les barres fines de dalt o baix per redimensionar.
4.  Ajusta la teva setmana a [Configuració](/settings) (hores d’inici/final, dies amagats, inici de setmana).
5.  Usa [Avui](/today) per veure un resum del dia (o la vista Ara/Següent a l’inici).

<a id="concepts"></a>

## Conceptes bàsics

### Infants

Persones per a qui planifiques. Cada infant té un nom i un avatar. Els horaris són per infant.

### Matèries

Temes/activitats amb un color i opcionalment dates d’activitat (inici/final). Els blocs de l’horari fan referència a una matèria.

### Configuració

Ajustos globals: hores visibles, dies amagats i dia d’inici de la setmana. Això defineix la graella del planificador.

<a id="scheduler"></a>

## Planificador

El planificador mostra una graella setmanal. Les columnes són els dies de la setmana (respectant els dies amagats i l’inici de setmana escollit). Les files són franges horàries (increments de 5 minuts). L’interval vertical visible es controla des de Configuració.

-   **Afegir un bloc:** fes clic en una cel·la buida → selecciona una matèria al popup.
-   **Moure:** arrossega el bloc a qualsevol lloc, fins i tot entre dies.
-   **Redimensionar:** arrossega la nansa fina a dalt o baix. Els blocs s’ajusten a increments de 5 minuts.
-   **Eliminar:** fes clic a la icona 🗑️ d’un bloc i confirma.
-   **Ressaltat al passar-hi el cursor:** la fila sota el cursor es ressalta subtilment per facilitar l’arrossegament.
-   **Dates de la matèria:** només es considera “activa” entre les dates d’inici i final; això afecta les vistes Avui/Ara.

Consell: si no veus les franges del matí/vespre que esperaves, amplia l’interval visible a [Configuració](/settings).

<a id="kids"></a>

## Infants

-   **Afegir / editar / eliminar** infants a [Infants](/kids).
-   Els avatars es generen automàticament; el selector mostra avatars i noms — fes clic a un per seleccionar-lo.
-   Els horaris són per infant. Canvia d’infant amb el selector d’avatars a la part superior del Planificador.

<a id="matters"></a>

## Matèries

-   Crea/edita matèries a [Matèries](/matters).
-   L’**interval de dates** (inici/final) és opcional i controla quan la matèria es considera activa.
-   El color s’utilitza per donar estil als blocs; mantén una paleta consistent per llegibilitat.

<a id="today"></a>

## Avui i Ara/Següent

La vista [Avui](/today) mostra un sol dia amb un marcador en temps real de “l’hora actual”. La targeta de cada infant també mostra **Ara** (amb una barra de progrés) i la **Següent** matèria — només si aquestes matèries estan dins del seu rang de dates.

-   Canvia de dia amb ◀︎ / ▶︎ a la vista Avui; fes servir “Avui” per tornar a la data actual.
-   Si no hi ha res passant “ara”, només veuràs la “següent” matèria (si n’hi ha).

<a id="settings"></a>

## Configuració

-   **Hores del planificador:** estableix l’hora d’inici i final visibles de la graella.
-   **Dies visibles:** amaga/mostra dies (p. ex., caps de setmana).
-   **Inici de setmana:** tria quin dia comença la setmana; el planificador reordena les columnes en conseqüència.

L’app valida les hores perquè l’hora de final sigui sempre després de l’hora d’inici.

<a id="share"></a>

## Compartir / Exportar i Importar

Fes servir el botó **Compartir** (icona de compartir) per exportar els horaris dels infants seleccionats més les matèries utilitzades i la configuració global en un enllaç. En navegadors compatibles s’obre el full de compartició natiu; si no, es mostra un enllaç per copiar.

### Què s’exporta

-   Infants seleccionats
-   Només les _matèries utilitzades_ als seus horaris
-   Configuració global (hores, dies amagats, inici de setmana)

### Comportament de la importació

-   **Infants:** s’afegeixen si són nous; si un infant ja existeix (per nom o ID segons implementació), es manté i el seu horari és _sobreescrit_ pel importat.
-   **Matèries:** es comparen per nom; les noves s’afegeixen, les existents es reutilitzen. Les dates d’inici/final s’amplien només si l’interval entrant és més extens.
-   **Configuració:** l’hora d’inici només baixa si la nova és anterior; l’hora final només puja si la nova és posterior; els dies amagats i l’inici de setmana es fusionen de manera coherent.

També pots enganxar un enllaç amb `#data=…` a la barra d’adreces; la porta d’importació de l’app et deixarà triar què vols importar.

<a id="pwa"></a>

## Instal·lació i mode fora de línia

-   Fes clic a **Instal·lar l’App** (quan s’ofereixi) per afegir-la al teu dispositiu.
-   L’app funciona sense connexió; les teves dades romanen en aquest dispositiu (emmagatzematge local).

<a id="faq"></a>

## PMF i Resolució de problemes

**Els meus blocs no mostren hores molt d’hora o molt tard.** Augmenta les hores visibles a [Configuració](/settings).

**No puc deixar un bloc exactament on vull.** Els blocs s’ajusten a increments de 5 minuts. Prova de deixar-lo prop de l’hora desitjada.

**No apareix res a Ara/Següent.** Comprova les dates d’inici/final de la matèria i la data d’avui. Les matèries fora del seu rang s’ignoren.

**No puc veure/compartir l’enllaç d’exportació.** Alguns navegadors bloquegen el full de compartició natiu; l’app mostra un enllaç copiable al modal.

**Com puc restablir-ho tot?** Fes servir els controls d’emmagatzematge del lloc del teu navegador per esborrar l’emmagatzematge local d’aquesta app (això esborra totes les dades).

<a id="privacy"></a>

## Dades i Privadesa

Totes les dades (infants, matèries, horaris, configuració) es guarden a l’emmagatzematge local del teu navegador. No s’envia res a un servidor tret que comparteixis explícitament un enllaç d’exportació amb algú.

<a id="contact"></a>

## Contacte

Dubtes, idees o informes d’errors? Pots contactar en qualsevol moment:

-   [📧 Correu — jmtalarn+timetablepwa@gmail.com](mailto:jmtalarn+timetablepwa@gmail.com)
-   [𝕏 / Twitter — @jmtalarn](https://x.com/jmtalarn)
-   [Bluesky — @jmtalarn.com](https://bsky.app/profile/jmtalarn.com)
-   [LinkedIn — /in/jmtalarn](https://www.linkedin.com/in/jmtalarn)
