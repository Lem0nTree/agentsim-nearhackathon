import { check, controlBytes, grantBytes, softwareOwner, verifyOwner } from './protocol.mjs';

// Stored investigation evidence, not a live connection check or hardware attestation.
export const CURRENT_CARD_PROFILE = Object.freeze({
  evidenceDate: '2026-10-31',
  source: 'tools/globalplatformpro/memory-probe/INVESTIGATION.md',
  freePersistentBytes: 44864,
  diagnosticAppletLifecycle: 'verified',
  p256Signing: 'unavailable-in-observed-probes',
  eccRetestedAfterCleanup: true,
  hardwareProvenance: 'unverified',
});

/** Explicit backend selection. New hardware requires its own implemented adapter. */
export function createOwnerSigner({ backend } = {}) {
  check(backend === 'software' || backend === 'current-card', 'OWNER_BACKEND');
  // Do not generate a software key as a fallback for a requested card signer.
  check(backend === 'software', 'OWNER_SIGNER_UNSUPPORTED');
  const owner = softwareOwner();
  const signCanonical = async bytes => {
    const signature = await owner.sign(bytes);
    check(verifyOwner(bytes, signature, owner.publicKey), 'OWNER_SIGNER_SIGNATURE');
    return signature;
  };
  return Object.freeze({
    kind: owner.kind,
    publicKey: owner.publicKey,
    algorithm: 'P-256/SHA-256',
    signatureEncoding: 'ieee-p1363',
    hardwareProvenance: 'unverified',
    // Canonicalization happens before yielding; later caller edits are not signed.
    signGrant: grant => signCanonical(grantBytes(grant)),
    signControl: command => signCanonical(controlBytes(command)),
  });
}
