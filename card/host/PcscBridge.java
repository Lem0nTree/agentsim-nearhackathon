import javax.smartcardio.*;
import java.io.*;
import java.util.*;
/** PC/SC pipe. SELECT only the explicitly supplied application AID. */
public final class PcscBridge {
  static byte[] hex(String s) { if (!s.matches("(?i)([0-9a-f]{2})+")) throw new IllegalArgumentException("invalid hex"); byte[] b=new byte[s.length()/2]; for(int i=0;i<b.length;i++) b[i]=(byte)Integer.parseInt(s.substring(i*2,i*2+2),16); return b; }
  static String hex(byte[] b) { StringBuilder s=new StringBuilder(); for(byte x:b) s.append(String.format("%02x",x&255)); return s.toString(); }
  public static void main(String[] args) throws Exception {
    if(args.length!=2) throw new IllegalArgumentException("Expected exact reader name and AID");
    byte[] aid=hex(args[1]); if(aid.length<5||aid.length>16) throw new IllegalArgumentException("AID must be 5-16 bytes");
    CardTerminal found=null; for(CardTerminal t:TerminalFactory.getDefault().terminals().list()) if(t.getName().equals(args[0])) { if(found!=null) throw new IllegalStateException("ambiguous reader"); found=t; }
    if(found==null) throw new IllegalStateException("reader not found: "+args[0]);
    Card card=found.connect("*");
    try {
      CardChannel ch=card.getBasicChannel(); ResponseAPDU select=ch.transmit(new CommandAPDU(0,0xa4,4,0,aid));
      System.out.println("SELECT "+hex(select.getBytes())); System.out.flush();
      if(select.getSW()!=0x9000) return;
      BufferedReader in=new BufferedReader(new InputStreamReader(System.in,"UTF-8")); String line;
      while((line=in.readLine())!=null) { if(line.equals("QUIT")) break; byte[] cmd=hex(line); if(cmd.length<4 || (cmd[0]&255)!=0x80 || !Arrays.asList(0x10,0x20,0x30,0x32,0x34).contains(cmd[1]&255)) throw new IllegalArgumentException("unsupported APDU"); System.out.println(hex(ch.transmit(new CommandAPDU(cmd)).getBytes())); System.out.flush(); }
    } finally { card.disconnect(false); }
  }
}
