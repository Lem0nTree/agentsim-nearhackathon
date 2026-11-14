package agentsim.card;

import javacard.framework.*;
import javacard.security.*;

/** P-256 signer. PIN is supplied in GlobalPlatform install parameters. */
public final class AgentSimApplet extends Applet {
    private static final byte[] P = {
        (byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,0,0,0,1,0,0,0,0,0,0,0,0,
        0,0,0,0,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff};
    private static final byte[] A = {
        (byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,0,0,0,1,0,0,0,0,0,0,0,0,
        0,0,0,0,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xfc};
    private static final byte[] B = {
        0x5a,(byte)0xc6,0x35,(byte)0xd8,(byte)0xaa,0x3a,(byte)0x93,(byte)0xe7,(byte)0xb3,(byte)0xeb,(byte)0xbd,0x55,0x76,(byte)0x98,(byte)0x86,(byte)0xbc,
        0x65,0x1d,0x06,(byte)0xb0,(byte)0xcc,0x53,(byte)0xb0,(byte)0xf6,0x3b,(byte)0xce,0x3c,0x3e,0x27,(byte)0xd2,0x60,0x4b};
    private static final byte[] G = {
        4,0x6b,0x17,(byte)0xd1,(byte)0xf2,(byte)0xe1,0x2c,0x42,0x47,(byte)0xf8,(byte)0xbc,(byte)0xe6,(byte)0xe5,0x63,(byte)0xa4,0x40,(byte)0xf2,
        0x77,0x03,0x7d,(byte)0x81,0x2d,(byte)0xeb,0x33,(byte)0xa0,(byte)0xf4,(byte)0xa1,0x39,0x45,(byte)0xd8,(byte)0x98,(byte)0xc2,(byte)0x96,
        0x4f,(byte)0xe3,0x42,(byte)0xe2,(byte)0xfe,0x1a,0x7f,(byte)0x9b,(byte)0x8e,(byte)0xe7,(byte)0xeb,0x4a,0x7c,0x0f,(byte)0x9e,0x16,
        0x2b,(byte)0xce,0x33,0x57,0x6b,0x31,0x5e,(byte)0xce,(byte)0xcb,(byte)0xb6,0x40,0x68,0x37,(byte)0xbf,0x51,(byte)0xf5};
    private static final byte[] R = {
        (byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,0,0,0,0,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,(byte)0xff,
        (byte)0xbc,(byte)0xe6,(byte)0xfa,(byte)0xad,(byte)0xa7,0x17,(byte)0x9e,(byte)0x84,(byte)0xf3,(byte)0xb9,(byte)0xca,(byte)0xc2,(byte)0xfc,0x63,0x25,0x51};
    private final KeyPair pair;
    private final Signature signer;
    private final OwnerPIN pin;
    private final byte[] active;
    private final short[] total;
    private final byte[] incoming;

    private AgentSimApplet(byte[] data, short pinOffset, byte pinLength) {
        ECPublicKey pub = (ECPublicKey)KeyBuilder.buildKey(KeyBuilder.TYPE_EC_FP_PUBLIC, (short)256, false);
        ECPrivateKey priv = (ECPrivateKey)KeyBuilder.buildKey(KeyBuilder.TYPE_EC_FP_PRIVATE, (short)256, false);
        curve(pub); curve(priv);
        pair = new KeyPair(pub, priv);
        pair.genKeyPair();
        signer = Signature.getInstance(Signature.ALG_ECDSA_SHA_256, false);
        pin = new OwnerPIN((byte)3, (byte)16);
        pin.update(data, pinOffset, pinLength);
        incoming = JCSystem.makeTransientByteArray((short)255, JCSystem.CLEAR_ON_DESELECT);
        active = JCSystem.makeTransientByteArray((short)1, JCSystem.CLEAR_ON_DESELECT);
        total = JCSystem.makeTransientShortArray((short)1, JCSystem.CLEAR_ON_DESELECT);
        register();
    }

    private static void curve(ECKey key) {
        key.setFieldFP(P,(short)0,(short)32); key.setA(A,(short)0,(short)32);
        key.setB(B,(short)0,(short)32); key.setG(G,(short)0,(short)65);
        key.setR(R,(short)0,(short)32); key.setK((short)1);
    }

    public static void install(byte[] data, short offset, byte length) {
        short end = (short)(offset + (short)(length & 0xff));
        if (offset >= end) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        short pos = offset;
        short aidLen = (short)(data[pos++] & 0xff); pos += aidLen;
        if (pos >= end) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        short controlLen = (short)(data[pos++] & 0xff); pos += controlLen;
        if (pos >= end) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        short appLen = (short)(data[pos++] & 0xff);
        if (appLen < 7 || (short)(pos + appLen) != end) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        byte pinLength = data[pos++];
        if (pinLength < 6 || pinLength > 16 || appLen != (short)(pinLength + 1)) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        new AgentSimApplet(data, pos, pinLength);
    }
    public void deselect() { pin.reset(); active[0] = 0; total[0] = 0; }

    public void process(APDU apdu) {
        if (selectingApplet()) return;
        byte instruction = apdu.getBuffer()[ISO7816.OFFSET_INS];
        try { processCommand(apdu); }
        catch (RuntimeException error) { active[0] = 0; total[0] = 0; pin.reset(); throw error; }
        finally {
            // No command needs its input after processing. Clear PIN material promptly,
            // including on bad length or header; leave response-producing APDUs intact.
            Util.arrayFillNonAtomic(incoming, (short)0, (short)incoming.length, (byte)0);
            byte[] buffer = apdu.getBuffer();
            if (instruction == (byte)0x20)
                Util.arrayFillNonAtomic(buffer, ISO7816.OFFSET_CDATA,
                    (short)(buffer.length - ISO7816.OFFSET_CDATA), (byte)0);
        }
    }
    private void processCommand(APDU apdu) {
        byte[] buffer = apdu.getBuffer();
        if (buffer[ISO7816.OFFSET_CLA] != (byte)0x80) ISOException.throwIt(ISO7816.SW_CLA_NOT_SUPPORTED);
        if (buffer[ISO7816.OFFSET_P1] != 0 || buffer[ISO7816.OFFSET_P2] != 0) ISOException.throwIt(ISO7816.SW_INCORRECT_P1P2);
        byte instruction = buffer[ISO7816.OFFSET_INS];
        short received = apdu.setIncomingAndReceive();
        short length = apdu.getIncomingLength();
        short offset = apdu.getOffsetCdata();
        if (length > 240) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        short copied = 0;
        while (received > 0) {
            if ((short)(copied + received) > length) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
            Util.arrayCopyNonAtomic(buffer, offset, incoming, copied, received);
            copied += received;
            if (copied == length) break;
            received = apdu.receiveBytes(offset);
        }
        if (copied != length) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        offset = 0;
        switch (instruction) {
            case 0x10: // SEC1 uncompressed public key. Private key has no export command.
                if (length != 0) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
                short size = ((ECPublicKey)pair.getPublic()).getW(buffer, (short)0);
                apdu.setOutgoingAndSend((short)0, size);
                return;
            case 0x20:
                active[0] = 0; total[0] = 0;
                if (length < 6 || length > 16) { pin.reset(); ISOException.throwIt(ISO7816.SW_WRONG_LENGTH); }
                if (!pin.check(incoming,offset,(byte)length)) ISOException.throwIt((short)(0x63c0 | pin.getTriesRemaining()));
                return;
            case 0x30:
                if (!pin.isValidated()) ISOException.throwIt(ISO7816.SW_SECURITY_STATUS_NOT_SATISFIED);
                if (length != 0) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
                signer.init(pair.getPrivate(), Signature.MODE_SIGN);
                active[0] = 1; total[0] = 0;
                return;
            case 0x32:
            case 0x34:
                if (!pin.isValidated()) ISOException.throwIt(ISO7816.SW_SECURITY_STATUS_NOT_SATISFIED);
                if (active[0] != 1) ISOException.throwIt(ISO7816.SW_CONDITIONS_NOT_SATISFIED);
                if (length == 0 || (short)(total[0]+length) > 4096) {
                    active[0] = 0; pin.reset(); ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
                }
                total[0] += length;
                if (instruction == 0x32) { signer.update(incoming,offset,length); return; }
                // ALG_ECDSA_SHA_256 hashes the streamed canonical message exactly once.
                active[0] = 0;
                pin.reset();
                short signatureLength = signer.sign(incoming,offset,length,buffer,(short)0);
                apdu.setOutgoingAndSend((short)0,signatureLength);
                return;
            default: ISOException.throwIt(ISO7816.SW_INS_NOT_SUPPORTED);
        }
    }
}
