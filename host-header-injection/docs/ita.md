# Host Header Injection: Demo di un Account Takeover Completo

> **Attenzione:**
>
> [DISCLAIMER] Questo progetto ha esclusivamente scopo didattico e mira a dimostrare una vulnerabilità crittografica. Non è destinato ad alcun uso malevolo. L'autore non è responsabile per eventuali usi impropri delle informazioni o del codice forniti.

[🇬🇧](/host-header-injection/README.md)

Benvenuto/a\! Questo demo interattivo ti guiderà attraverso un attacco completo, end-to-end, di tipo **Host Header Injection**. Giocherai sia il ruolo dell'utente che quello dell'attaccante per capire come una singola vulnerabilità, apparentemente piccola, possa portare a un takeover totale dell'account.

Vedremo come un attaccante può ingannare un server per fargli inviare un link di reset password malevolo, rubare il token segreto e infine usare quel token per cambiare la password della vittima e bloccarla fuori dal proprio account.

Iniziamo.

## 🚀 Lo Scenario

Il nostro demo è composto da tre parti:

1.  **L'Applicazione della Vittima (`vulnerable-server.js`)**: Un server Node.js con una funzionalità di reset password. La sua falla critica è che si fida dell'header `Host` delle richieste in arrivo per generare i link di reset. Vedremo i suoi log in **blu** 🔵.
2.  **Il Server dell'Attaccante (`attacker-server.js`)**: Un server Node.js malevolo controllato dall'attaccante. Il suo unico compito è ascoltare le richieste in arrivo e registrare qualsiasi token segreto riesca a catturare. Vedremo i suoi log in **rosso** 🔴.
3.  **L'Interfaccia Frontend (`index.html`)**: Una semplice pagina web dove un utente si recherebbe per richiedere il reset della password. Questo è il punto di ingresso per l'intero processo.

## ✅ Prerequisiti

Prima di iniziare, assicurati di avere installato quanto segue:

  * Node.js (v18 o superiore)
  * `pnpm` (puoi sostituirlo con `npm` o `yarn` nei comandi)

## 🛠️ Configurazione

Per prima cosa, prepariamo il progetto e installiamo tutte le dipendenze.

1.  **Installa le Dipendenze del Backend**:
    Naviga nella directory `backend` e installa i pacchetti richiesti.

    ```bash
    cd backend
    pnpm install
    ```

2.  **Installa le Dipendenze del Frontend**:
    Naviga nella directory `frontend` e installa i suoi pacchetti.

    ```bash
    cd ../frontend
    pnpm install
    ```

## 🎬 Esecuzione del Demo: Una Scena in 4 Atti

Ora che tutto è installato, eseguiamo la simulazione. Procederemo passo dopo passo.

### Atto I: L'Utente Legittimo

Per prima cosa, vediamo come l'applicazione *dovrebbe* funzionare.

1.  **Avvia i Server**:
    Vai nella directory `backend`. Useremo il comodo script `start` per lanciare contemporaneamente sia il server vulnerabile che quello dell'attaccante.

    ```bash
    # Nella directory /backend
    pnpm start
    ```

    Dovresti vedere sia i log in **blu** 🔵 del `[VULNERABLE SERVER]` che quelli in **rosso** 🔴 del `[ATTACKER'S SERVER]`, a indicare che sono in esecuzione.

2.  **Avvia il Frontend**:
    In una **nuova finestra del terminale**, naviga nella directory `frontend` e avvia il server di sviluppo di Vite.

    ```bash
    # Nella directory /frontend
    pnpm dev
    ```

    Vite ti fornirà un URL locale (solitamente `http://localhost:5173`). Apri questo URL nel tuo browser.

3.  **Richiedi un Reset della Password**:
    Nel browser, vedrai l'interfaccia utente. L'email `user@victim.com` è già compilata. Clicca il pulsante **"Initiate Password Reset"**. L'interfaccia confermerà che la richiesta è stata inviata.

4.  **Controlla i Log**:
    Guarda il terminale del backend. Vedrai un log ben formattato in **blu** 🔵 che simula l'invio dell'email. Nota il link al suo interno: punta correttamente a `http://localhost:3000/...`. Questo è il comportamento atteso e legittimo.

### Atto II: La Sonda dell'Attaccante (L'Iniezione)

Ora, indossiamo il nostro cappello da "black hat". Un attaccante non userà l'interfaccia utente. Userà uno strumento come `curl` per creare una richiesta malevola.

1.  **Crea la Richiesta Malevola**:
    Apri una **terza finestra del terminale**. Invieremo una richiesta `POST` al server vulnerabile, ma inietteremo il nostro header `Host` che punta al server del nostro attaccante (`localhost:9090`).

    Copia ed esegui il seguente comando:

    ```bash
    curl -X POST http://localhost:3000/request-password-reset \
    -H "Content-Type: application/json" \
    -H "Host: localhost:9090" \
    -d '{"email":"user@victim.com"}'
    ```

2.  **Assisti all'Inganno**:
    Torna immediatamente al terminale del backend. Vedrai una **nuova email simulata** registrata nei log. Ma guarda attentamente\! Il server, fidandosi del nostro finto header `Host`, ha creato un link di reset password che ora punta al server dell'attaccante: `http://localhost:9090/...`.

    Il server è stato ingannato con successo.

### Atto III: La Trappola Scatta (Cattura del Token)

Il link malevolo è stato generato. Nel mondo reale, la vittima lo riceverebbe in un'email. Simuliamo la vittima che clicca su di esso.

1.  **Clicca il Link Malevolo**:
    Dal terminale del backend, copia l'URL malevolo (`http://localhost:9090/reset-password?token=...`) dal log della seconda email.

2.  **Incollalo nella barra degli indirizzi del tuo browser e premi Invio.**

3.  **Controlla il Log dell'Attaccante**:
    Torna al terminale del backend. Nel momento in cui premi Invio, il server dell'attaccante prende vita\! Vedrai un log rosso acceso 🔴 che conferma la **CATTURA DEL TOKEN**. Ti fornirà anche il prossimo comando necessario per completare l'attacco.

### Atto IV: Il Colpo di Grazia (Account Takeover)

L'attaccante ora possiede la chiave del regno: il token segreto. Il passo finale è usarlo.

1.  **Usa il Token Rubato**:
    Il log dell'attaccante ha già stampato l'esatto comando `curl` necessario. Include il token rubato e una nuova password (`hackedPassword123`).

    Copia quel comando `curl` finale dal log **rosso** 🔴 ed eseguilo nel tuo terminale.

    ```bash
    # Questo comando è stampato nel log del tuo attaccante
    curl -X POST http://localhost:3000/reset-password -H "Content-Type: application/json" -d '{"token":"[IL_TOKEN_CATTURATO]","newPassword":"hackedPassword123"}'
    ```

2.  **Conferma il Takeover**:
    Guarda il terminale del backend per l'ultima volta. Vedrai un log **blu** 🔵 con un agghiacciante avvertimento in **giallo** 🟡:

    `ACCOUNT TAKEOVER! Password for user with token "..." has been changed to "hackedPassword123"!`

L'attacco è completo. La password dell'utente è stata cambiata a sua insaputa e l'attaccante ha il pieno controllo dell'account.

## 🛡️ La Soluzione

Come possiamo prevenire tutto questo? La soluzione è semplice ma cruciale:

**Non fidarsi mai dell'input controllabile dall'utente per operazioni sensibili alla sicurezza.** L'header `Host` è un input dell'utente.

Il server deve conoscere il proprio dominio. Invece di usare l'header, bisogna usare un valore di configurazione fisso.

**Il Codice Vulnerabile (`vulnerable-server.js`):**

```javascript
// L'applicazione si fida ciecamente dell'header 'Host' controllato dall'utente
const host = req.headers.host;
const resetLink = `http://${host}/reset-password?token=${token}`;
```

**Il Codice Sicuro:**

```javascript
// L'applicazione usa un valore di configurazione fisso e affidabile
const APP_BASE_URL = 'http://localhost:3000'; // In produzione: 'https://tuo-dominio-reale.com'
const resetLink = `${APP_BASE_URL}/reset-password?token=${token}`;
```

Applicando questa modifica, non importa cosa un attaccante inserisca nell'header `Host`, il link generato sarà sempre corretto e sicuro.