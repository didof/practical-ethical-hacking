# Practical Ethical Hacking: Raccolta di Demo Pratiche

[🇬🇧](/README.md)

Benvenuto/a nel repository **Practical Ethical Hacking**\! Questo progetto si fonda sulla convinzione che il modo migliore per imparare a costruire applicazioni sicure sia capire come possono essere violate. Questa è una raccolta curata di dimostrazioni pratiche e funzionanti di vulnerabilità di cybersicurezza comuni (e meno comuni).

Ogni demo è un progetto autonomo, progettato per essere eseguito localmente, permettendoti di giocare il ruolo di un attaccante in un ambiente sicuro e controllato. Il nostro obiettivo non è solo mostrare che una vulnerabilità esiste, ma fornire una narrazione passo-passo che riveli come può essere sfruttata e, soprattutto, come prevenirla.

## 🚀 Demo Disponibili

Questa raccolta è in continua crescita. Ecco le dimostrazioni attualmente disponibili:

| Demo                                                       | Descrizione                                                                                                      | Stato      |
| :--------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :--------- |
| `host-header-injection`                                    | Uno scenario di account takeover completo che dimostra come sfruttare la fiducia nell'header `Host`.              | ✅ Eseguibile |
| `length-extension-attack-with-prevention`                  | Un attacco crittografico che mostra come una firma MAC ingenua, basata su `SHA256(chiave + dati)`, può essere falsificata. | ✅ Eseguibile |

## 🛠️ Come Iniziare

Ogni demo in questo repository è progettato per essere eseguito in modo indipendente. Il flusso di lavoro generale è semplice:

1.  **Clona il Repository**:

    ```bash
    git clone https://github.com/didof/practical-ethical-hacking.git
    cd practical-ethical-hacking
    ```

2.  **Naviga in un Demo**:
    Scegli una vulnerabilità che vuoi esplorare ed entra nella sua directory con `cd`.

    ```bash
    # Esempio per il demo di Host Header Injection
    cd host-header-injection
    ```

3.  **Segui il README Locale**:
    Ogni directory di un demo contiene il proprio file `README.md` con istruzioni dettagliate su come configurare l'ambiente, eseguire la simulazione e comprendere il flusso dell'attacco.

## ⚠️ Avvertenza

I contenuti di questo repository sono destinati esclusivamente a scopi didattici e di ricerca etica. Le dimostrazioni vengono eseguite in un ambiente locale e controllato. Non tentare di utilizzare queste tecniche su alcun sistema per il quale non si disponga di un'autorizzazione esplicita e scritta. L'accesso non autorizzato a sistemi informatici è illegale. L'autore non è responsabile per qualsiasi uso improprio delle informazioni fornite.

## 🔬 Panoramica dei Demo

Ecco qualche dettaglio in più su ogni scenario.

### 🛡️ Host Header Injection

  * **Vulnerabilità**: Un'applicazione web costruisce URL per funzioni critiche (come il reset delle password) utilizzando l'header `Host`, che è controllabile dall'utente, proveniente dalla richiesta HTTP.
  * **Impatto**: Questo demo ti guida attraverso un takeover completo dell'account. Inganerai il server per fargli generare un link di reset password che punta a un server sotto il tuo controllo, permettendoti di intercettare il token segreto di reset e cambiare la password della vittima.
  * **[Esplora il Demo](/host-header-injection/)**

### ⛓️ Length Extension Attack (SHA256)

  * **Vulnerabilità**: Una falla crittografica nei sistemi che creano codici di autenticazione dei messaggi (MAC) semplicemente calcolando l'hash di una chiave segreta concatenata con i dati (`SHA256(secret + message)`).
  * **Impatto**: Questo demo mostra come un attaccante, senza conoscere la chiave segreta, possa prendere una firma e un messaggio validi esistenti, aggiungere i propri dati malevoli e forgiare una nuova firma valida per il messaggio combinato. Questo rompe l'integrità dei dati autenticati. Il demo include anche un'implementazione sicura che usa HMAC per confronto.
  * **[Esplora il Demo](/length-extension-attack-with-prevention/)**

## 📄 Licenza

Questo progetto è distribuito con Licenza MIT - vedi il file `LICENSE` per i dettagli.