# SSRF: Una Demo sulla Fiducia Mal Riposta

> **Avviso:**
>
> Questo progetto è solo a scopo didattico. È progettato per essere eseguito in sicurezza sulla tua macchina locale per dimostrare una vulnerabilità di tipo Server-Side Request Forgery (SSRF). Non utilizzare queste tecniche per attività malevole.

[🇬🇧](/server-side-request-forgery/README.md)

Benvenuto nel Laboratorio SSRF\! Questa demo interattiva ti guiderà attraverso un classico attacco di **Server-Side Request Forgery**. Vedrai come una funzionalità apparentemente innocua—recuperare un'immagine del profilo da un URL—possa essere sfruttata per attaccare e spegnere un server interno e protetto.

Assumeremo il ruolo di un utente normale e poi di un attaccante per capire come la fiducia nell'input dell'utente possa portare a compromissioni critiche dell'infrastruttura.

## 🚀 Lo Scenario

Il nostro ambiente demo è composto da tre parti che girano in locale e simulano un'architettura applicativa reale:

1.  **L'Applicazione Vulnerabile (`vulnerable-app`)**: Un server Node.js con una funzionalità per aggiornare l'immagine del profilo di un utente da un URL. La sua falla critica è che si fida ciecamente di qualsiasi URL gli venga fornito, effettuando una richiesta da parte del server stesso. Vedremo i suoi log in **blu** 🔵.
2.  **L'API Interna (`internal-api`)**: Un servizio di back-office privato simulato che non dovrebbe *mai* essere esposto su Internet. Contiene un pericoloso endpoint di "shutdown". Vedremo i suoi log in **giallo** 🟡.
3.  **L'Interfaccia Utente Frontend (`vulnerable-app/frontend`)**: Una pagina web semplice e pulita che fornisce l'interfaccia utente per interagire con l'applicazione vulnerabile.

## ✅ Prerequisiti

Prima di iniziare, assicurati di avere installato quanto segue:

  * Node.js (v18 o superiore)
  * Un gestore di pacchetti compatibile con `npm` (es. `npm`, `pnpm`, `yarn`)

## 🛠️ Setup

Per prima cosa, installiamo tutte le dipendenze del progetto. Apri un terminale nella cartella principale del progetto.

1.  **Installa le dipendenze di `internal-api`**:

    ```bash
    cd internal-api
    npm install
    ```

2.  **Installa le dipendenze del backend di `vulnerable-app`**:

    ```bash
    cd ../vulnerable-app/backend
    npm install
    ```

3.  **Installa le dipendenze del frontend di `vulnerable-app`**:

    ```bash
    cd ../frontend
    npm install
    ```

## 🎬 Eseguire la Demo: Un'Opera in 3 Atti

Ora che tutto è installato, eseguiamo la simulazione. Avrai bisogno di **tre finestre di terminale separate**.

### Atto I: Il Percorso Legittimo (Happy Path)

Per prima cosa, vediamo come l'applicazione è progettata per funzionare correttamente.

1.  **Avvia l'API Interna (Terminale 1)**:
    Naviga nella cartella `internal-api` e avvia il server.

    ```bash
    # Nella cartella /internal-api
    npm start
    ```

    Dovresti vedere il log **giallo** 🟡 `[INTERNAL API]` che conferma che è in esecuzione sulla porta 8081.

2.  **Avvia il Backend Vulnerabile (Terminale 2)**:
    Naviga nella cartella `vulnerable-app/backend` e avvia il server dell'applicazione principale.

    ```bash
    # Nella cartella /vulnerable-app/backend
    npm start
    ```

    Dovresti vedere il log **blu** 🔵 `[VULNERABLE SERVER]` che conferma che è in esecuzione sulla porta 8080.

3.  **Avvia il Frontend (Terminale 3)**:
    Naviga nella cartella `vulnerable-app/frontend` e avvia il server di sviluppo di Vite.

    ```bash
    # Nella cartella /vulnerable-app/frontend
    npm run dev
    ```

    Vite ti fornirà un URL locale (solitamente `http://localhost:5173`). Apri questo URL nel tuo browser.

4.  **Esegui un'Azione Legittima**:
    Nell'interfaccia utente del browser, inserisci l'URL di un'immagine reale. Ad esempio: `https://images.pexels.com/photos/2071873/pexels-photo-2071873.jpeg`. Clicca su **"Update Profile Picture"**.

5.  **Controlla i Log**:
    Guarda il tuo **Terminale 2**. Il log **blu** 🔵 `[VULNERABLE SERVER]` mostrerà che ha ricevuto e recuperato con successo l'URL dell'immagine. Il terminale di `[INTERNAL API]` rimane silenzioso. Tutto funziona come previsto.

### Atto II: L'Attacco

Ora, sfruttiamo la fiducia mal riposta. Useremo la stessa interfaccia utente, ma forniremo un URL malevolo che punta a una risorsa interna.

1.  **Prepara l'Input Malevolo**:
    Torna all'interfaccia utente del browser. Questa volta, inserisci l'URL dell'endpoint pericoloso del nostro server interno:

    ```
    http://localhost:8081/api/v1/system/shutdown
    ```

2.  **Lancia l'Attacco**:
    Clicca sul pulsante **"Update Profile Picture"**. L'interfaccia potrebbe mostrare un errore (il che è previsto), ma il vero danno è già stato fatto lato server.

### Atto III: L'Impatto

Il server vulnerabile ha ricevuto il nostro URL malevolo e ha diligentemente effettuato una richiesta verso di esso.

1.  **Assisti alla Compromissione**:
    Controlla immediatamente i tuoi terminali.

      * **Terminale 2 (Server Vulnerabile)**: Il log **blu** 🔵 mostra che ha tentato di effettuare un fetch da `http://localhost:8081/...`.
      * **Terminale 1 (API Interna)**: Questo è il momento "Aha\!". Il server **giallo** 🟡, che prima era silenzioso, stamperà un grande e drammatico riquadro di avviso **rosso**: `!!! SHUTDOWN SIGNAL RECEIVED !!!`.

2.  **Conferma lo Shutdown**:
    Il processo del server `internal-api` terminerà immediatamente dopo aver registrato il messaggio. Hai usato con successo il server esposto pubblicamente come proxy per attaccare e spegnere un servizio interno protetto.

L'attacco è completato.

## 💥 L'Impatto Generale: Molto Più di un Semplice Shutdown

Per rendere la demo più chiara, il nostro payload malevolo si limita a spegnere il server interno. Nel mondo reale, una vulnerabilità SSRF può essere usata per una pletora di attacchi devastanti:

  * **Scansione della Rete Interna**: Un attaccante può usare il server vulnerabile come pivot per scansionare la rete interna, scoprendo altre macchine e servizi (es. `http://10.0.0.5`, `http://localhost:9200` per Elasticsearch).
  * **Furto di Credenziali Cloud**: Su piattaforme cloud come AWS, GCP o Azure, gli attaccanti possono richiedere URL di metadati (come `http://169.254.169.254/`) per rubare chiavi segrete, token e variabili d'ambiente, portando a una completa acquisizione dell'account cloud.
  * **Esfiltrazione di Dati**: Prendendo di mira database interni, file server o pannelli di amministrazione che potrebbero non avere autenticazione, un attaccante può leggere file sensibili (`file:///etc/passwd`) o esfiltrare dati dei clienti.

## 🛡️ La Soluzione: Zero Fiducia nell'Input dell'Utente

Come possiamo prevenire tutto ciò? La soluzione si basa su un principio fondamentale della sicurezza: **Non fidarsi mai ciecamente dell'input controllabile dall'utente per operazioni lato server.**

Il server deve convalidare che l'URL richiesto appartenga a un dominio esterno e fidato. La migliore pratica è utilizzare una **allowlist** (lista di permessi).

**Il Codice Vulnerabile (`vulnerable-app/backend/server.js`):**

```javascript
// Il server si fida ciecamente dell'URL controllato dall'utente.
const { url } = req.body;
const response = await fetch(url); // Questa è la parte pericolosa.
```

**Il Codice Sicuro:**

```javascript
import { URL } from 'url'; // Modulo nativo di Node.js

const { url } = req.body;

// 1. Definisci una allowlist di domini fidati.
const ALLOWED_DOMAINS = [
  'images.pexels.com',
  'unsplash.com',
  'i.imgur.com'
];

// 2. Esegui il parsing dell'URL e valida il suo hostname.
const parsedUrl = new URL(url);
if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
  // 3. Se il dominio non è nella lista, rifiuta la richiesta.
  return res.status(400).json({ error: 'Untrusted domain.' });
}

// 4. Procedi solo se il dominio è fidato.
const response = await fetch(url);
```

Implementando una allowlist rigorosa, il server non può più essere ingannato per effettuare richieste a domini interni o non autorizzati, neutralizzando di fatto la minaccia SSRF.