package no.hials.vr;

import com.google.gson.Gson;
import com.oculusvr.capi.Hmd;
import static com.oculusvr.capi.OvrLibrary.ovrTrackingCaps.*;

import com.oculusvr.capi.OvrQuaternionf;
import com.oculusvr.capi.OvrVector3f;
import com.oculusvr.capi.TrackingState;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Scanner;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

/**
 * WebSocket server that provides tracking info Dependencies are: JOVR, GSON and
 * Java_WebSockets
 *
 * @author Lars Ivar Hatledal
 */
public class OculusWS {

    private static final int port = 8888;
    private static long id = 0;
    private static SensorData latestData = new SensorData(0, 0, 0, 0, 0, 0, 0, 0);
    private static boolean run = true;

    /**
     * Program starting point
     *
     * @param args the command line arguments
     * @throws java.net.UnknownHostException
     */
    public static void main(String[] args) throws UnknownHostException {
        Hmd.initialize();

        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            throw new IllegalStateException(e);
        }

        Hmd hmd = Hmd.create(0);

        if (hmd == null) {
            throw new IllegalStateException("Unable to initialize HMD");
        }

        hmd.configureTracking(ovrTrackingCap_Orientation
                | ovrTrackingCap_MagYawCorrection
                | ovrTrackingCap_Position, 0);

        Thread t1 = new Thread(new SensorFetcher(hmd));
        t1.start();

        OculusSocket oculusSocket = new OculusSocket(port);
        oculusSocket.start();

        System.out.println("Press 'q' to quit..");
        System.out.println("");
        Scanner sc = new Scanner(System.in);
        while (run) {
            if (sc.nextLine().trim().equals("q")) {
                run = false;
            }
        }
        try {
            oculusSocket.stop();
        } catch (IOException | InterruptedException ex) {
            Logger.getLogger(OculusWS.class.getName()).log(Level.SEVERE, null, ex);
        }

        try {
            t1.join();
        } catch (InterruptedException ex) {
            Logger.getLogger(OculusWS.class.getName()).log(Level.SEVERE, null, ex);
        }
        
        hmd.destroy();
        Hmd.shutdown();
    }

    private static class OculusSocket extends WebSocketServer {

        private final Gson gson = new Gson();

        public OculusSocket(int port) throws UnknownHostException {
            super(new InetSocketAddress(port));
            System.out.println("Websocket server running... Listning on port " + port);
        }

        @Override
        public void onOpen(WebSocket ws, ClientHandshake ch) {
            DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
            Date date = new Date();
            System.out.println("");
            System.out.println(dateFormat.format(date) + " : " + ws.getRemoteSocketAddress() + " connected!");
            System.out.println("");
        }

        @Override
        public void onClose(WebSocket ws, int i, String string, boolean bln) {
            DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
            Date date = new Date();
            System.out.println(dateFormat.format(date) + " : " + ws.getRemoteSocketAddress() + " disconnected!");
        }

        @Override
        public void onError(WebSocket ws, Exception excptn) {
            DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
            Date date = new Date();
            System.out.println(dateFormat.format(date) + " : " + ws.getRemoteSocketAddress() + " error!");
        }

        @Override
        public void onMessage(WebSocket ws, String string) {
            ws.send(gson.toJson(latestData.asArray()));
        }
    }

    private static class SensorFetcher implements Runnable {

        private final Hmd hmd;

        public SensorFetcher(Hmd hmd) {
            this.hmd = hmd;
        }

        @Override
        public void run() {
            while (run) {
                TrackingState sensorState = hmd.getSensorState(Hmd.getTimeInSeconds());

                OvrVector3f pos = sensorState.HeadPose.Pose.Position;
                OvrQuaternionf quat = sensorState.HeadPose.Pose.Orientation;

                double px = pos.x;
                double py = pos.y;
                double pz = pos.z;

                double qx = quat.x;
                double qy = quat.y;
                double qz = quat.z;
                double qw = quat.w;

                latestData = new SensorData(id++, px, py, pz, qx, qy, qz, qw);
                //System.out.println(latestData);

                try {
                    Thread.sleep(1);
                } catch (InterruptedException ex) {
                    Logger.getLogger(OculusWS.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        }
    }

    private static class SensorData {

        private final long id;
        private final double px, py, pz, qx, qy, qz, qw;

        public SensorData(long id, double px, double py, double pz, double qx, double qy, double qz, double qw) {
            this.id = id;
            this.px = px;
            this.py = py;
            this.pz = pz;
            this.qx = qx;
            this.qy = qy;
            this.qz = qz;
            this.qw = qw;
        }

        public long getId() {
            return id;
        }

        public double[] asArray() {
            return new double[]{id, px, py, pz, qx, qy, qz, qw};
        }

        @Override
        public String toString() {
            return String.format("Position: %.3f  %.3f  %.3f | Quat:  %.3f  %.3f  %.3f  %.3f", px, py, pz, qx, qy, qz, qw);
        }
    }
}
