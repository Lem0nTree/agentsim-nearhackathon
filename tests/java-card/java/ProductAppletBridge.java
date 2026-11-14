package agentsim.sim;

import agentsim.card.AgentSimApplet;
import com.licel.jcardsim.base.Simulator;
import javacard.framework.AID;
import javacard.framework.Applet;
import javacard.framework.APDU;
import java.io.*;
import java.lang.reflect.Field;
import com.licel.jcardsim.base.SimulatorRuntime;

/** Hex APDU pipe to a PC-only jCardSim instance. Never connects to PC/SC hardware. */
public final class ProductAppletBridge {
    public static final class OtherApplet extends Applet {
        private OtherApplet() { register(); }
        public static void install(byte[] b, short o, byte l) { new OtherApplet(); }
        public void process(APDU apdu) { }
    }
    private static byte[] decode(String value) {
        if (value.length() < 8 || value.length() > 522 || (value.length() & 1) != 0 || !value.matches("[0-9a-fA-F]+"))
            throw new IllegalArgumentException("APDU_HEX");
        byte[] bytes = new byte[value.length()/2];
        for (int i=0;i<bytes.length;i++) bytes[i]=(byte)Integer.parseInt(value.substring(i*2,i*2+2),16);
        return bytes;
    }
    private static String encode(byte[] bytes) {
        StringBuilder out = new StringBuilder();
        for (byte b:bytes) out.append(String.format("%02x",b & 255));
        return out.toString();
    }
    public static void main(String[] args) throws Exception {
        // Keep dependency diagnostics off the machine-readable protocol channel.
        PrintStream protocol = System.out;
        System.setOut(System.err);
        Simulator simulator = new Simulator();
        byte[] aidBytes = {(byte)0xf0,0x41,0x47,0x53,0x49,0x4d,0x07,0x01};
        AID aid = new AID(aidBytes,(short)0,(byte)aidBytes.length);
        byte[] params = decode(args[0]);
        simulator.installApplet(aid,AgentSimApplet.class,params,(short)0,(byte)params.length);
        byte[] otherBytes={(byte)0xf0,0x41,0x47,0x53,0x49,0x4d,0x07,0x02};
        AID other=new AID(otherBytes,(short)0,(byte)otherBytes.length);
        simulator.installApplet(other,OtherApplet.class);
        if (!simulator.selectApplet(aid)) throw new IllegalStateException("APPLET_SELECT");
        protocol.println("READY product-applet-p256"); protocol.flush();
        BufferedReader input = new BufferedReader(new InputStreamReader(System.in,"UTF-8"));
        String line;
        while ((line=input.readLine())!=null) {
            if (line.equals("CHECK_INPUT_WIPED")) {
                // Off-track simulator-only inspection; reports no contents.
                Field runtimeField=Simulator.class.getDeclaredField("runtime"); runtimeField.setAccessible(true);
                SimulatorRuntime runtime=(SimulatorRuntime)runtimeField.get(simulator);
                Object applet=runtime.lookupApplet(aid).getApplet();
                Field field=AgentSimApplet.class.getDeclaredField("incoming"); field.setAccessible(true);
                byte[] data=(byte[])field.get(applet); boolean zero=true;
                for (byte b:data) if (b != 0) zero=false;
                protocol.println(zero ? "INPUT_WIPED" : "INPUT_NOT_WIPED");
            } else if (line.equals("DESELECT")) {
                if (!simulator.selectApplet(other) || !simulator.selectApplet(aid)) throw new IllegalStateException("APPLET_RESELECT");
                protocol.println("DESELECT_OK");
            } else if (line.equals("RESET")) {
                simulator.reset();
                if (!simulator.selectApplet(aid)) throw new IllegalStateException("APPLET_RESELECT");
                protocol.println("RESET_OK");
            } else {
                protocol.println(encode(simulator.transmitCommand(decode(line))));
            }
            protocol.flush();
        }
    }
}
