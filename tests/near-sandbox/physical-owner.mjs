import { openCard } from '../../card/host/pcsc.mjs';
import { grantBytes, controlBytes, verifyOwner, p256PublicKey } from '../../src/protocol.mjs';

// PIN is read only from the controlling terminal and never put in argv or env.
export async function promptOwnerPin(input = process.stdin, output = process.stderr) {
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    throw Error('OWNER_PIN_TTY_REQUIRED');
  }
  output.write('Owner PIN: ');
  const secret = [];
  try {
    input.setRawMode(true);
    input.resume();
    await new Promise((resolve, reject) => {
      const cleanup = () => {
        input.off('data', onData);
        input.off('error', onError);
        input.off('end', onEnd);
      };
      const finish = fn => value => { cleanup(); fn(value); };
      const done = finish(resolve);
      const fail = finish(reject);
      const onError = () => fail(Error('OWNER_PIN_INPUT'));
      const onEnd = () => fail(Error('OWNER_PIN_INPUT'));
      function onData(chunk) {
        for (const ch of chunk) {
          if (ch === 3 || ch === 4) return fail(Error('OWNER_PIN_CANCELLED'));
          if (ch === 13 || ch === 10) return done();
          if (ch === 8 || ch === 127) { secret.pop(); continue; }
          if (ch < 32 || ch > 126 || secret.length >= 16) return fail(Error('OWNER_PIN_INPUT'));
          secret.push(ch);
        }
      }
      input.on('data', onData);
      input.once('error', onError);
      input.once('end', onEnd);
    });
    if (secret.length < 6 || secret.length > 16) throw Error('OWNER_PIN_LENGTH');
    return Buffer.from(secret);
  } finally {
    secret.fill(0);
    input.setRawMode(false);
    input.pause();
    output.write('\n');
  }
}

export async function openPhysicalOwner({
  reader, expectedAID, pinnedPublicKey, promptPin = promptOwnerPin, connectCard = openCard
}) {
  if (typeof reader !== 'string' || !reader.trim() ||
      !/^(?:[0-9a-fA-F]{2}){5,16}$/.test(expectedAID ?? '') ||
      !/^(02|03)[0-9a-f]{64}$/.test(pinnedPublicKey ?? '')) {
    throw Error('OWNER_CARD_CONFIGURATION');
  }
  p256PublicKey(pinnedPublicKey); // Reject an invalid point before opening a reader.
  const card = await connectCard({ reader, expectedAID });
  let pin;
  try {
    const key = await card.publicKey();
    if (key !== pinnedPublicKey) throw Error('OWNER_PUBLIC_KEY_MISMATCH');
    pin = await promptPin();
    if (!Buffer.isBuffer(pin) || pin.length < 6 || pin.length > 16) throw Error('OWNER_PIN_LENGTH');
    let closed = false;
    const sign = async bytes => {
      if (closed) throw Error('OWNER_CLOSED');
      const { signature, publicKey } = await card.sign(bytes, pin);
      if (publicKey !== pinnedPublicKey || !verifyOwner(bytes, signature, pinnedPublicKey)) {
        throw Error('OWNER_SIGNATURE_INVALID');
      }
      return signature;
    };
    return Object.freeze({
      publicKey: pinnedPublicKey,
      source: 'Physical SIM',
      expectedAID: expectedAID.toUpperCase(),
      selectStatus: card.selectStatus,
      signGrant: grant => sign(grantBytes(grant)),
      signControl: control => sign(controlBytes(control)),
      close: () => {
        if (!closed) {
          closed = true;
          pin.fill(0);
          card.close();
        }
      }
    });
  } catch (error) {
    if (Buffer.isBuffer(pin)) pin.fill(0);
    card.close();
    throw error;
  }
}
