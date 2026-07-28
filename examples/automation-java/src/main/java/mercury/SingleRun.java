package mercury;

import com.google.gson.JsonObject;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static mercury.MercuryClient.env;
import static mercury.MercuryClient.envSerials;

/**
 * SINGLE RUN — reserve one device, connect, run your tests, release.
 * Usage / Çalıştırma:
 *   export MERCURY_BASE_URL=https://YOUR_DOMAIN
 *   export MERCURY_TOKEN=...           (UI &gt; Settings &gt; Keys &gt; Access Tokens)
 *   export MERCURY_TYPE=android        (android | ios)
 *   # specific device / belirli cihaz: export MERCURY_SERIALS=R58N42ABCDE
 *   mvn -q compile exec:java -Dexec.mainClass=mercury.SingleRun
 * <p>
 * TEKLİ KOŞUM — tek cihaz ayır, bağlan, testini koştur, bırak.
 * Çoklu/paralel koşum için / For parallel run: {@link ParallelRun}
 */
public class SingleRun {

    public static void main(String[] args) throws Exception {
        MercuryClient client = new MercuryClient();
        List<String> serials = envSerials();
        String runName = env("MERCURY_RUN",
            "single-run-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")));

        MercuryClient.Reservation reservation = client.reserve(
            runName,                                            // Builds page name / Builds sayfasındaki isim
            Integer.parseInt(env("MERCURY_TIMEOUT", "600")),    // seconds / saniye
            1,
            env("MERCURY_TYPE", null),                          // android | ios
            serials.isEmpty() ? List.of() : serials.subList(0, 1),
            env("CI_JOB_URL", null)                             // optional clickable link / opsiyonel link
        );

        String groupId = reservation.groupId();
        JsonObject device = reservation.devices().get(0);
        String serial = device.get("serial").getAsString();
        System.out.printf("Reserved / Ayrıldı: %s (%s / %s) — group=%s%n",
            serial, device.get("model").getAsString(), device.get("version").getAsString(), groupId);

        try {
            String remote = client.useDevice(serial);
            System.out.println("remoteConnectUrl: " + remote);

            if ("ios".equals(env("MERCURY_TYPE", ""))) {
                // iOS: pass to Appium capability, no extra connect step.
                // iOS: Appium capability'sine ver, ekstra bağlantı adımı yok.
                System.out.println("Appium capability: appium:webDriverAgentUrl = " + remote);
            }
            else {
                Adb.connect(remote); // Appium capability: appium:udid = remote
            }

            // ---- YOUR TESTS RUN HERE / TESTLERİN BURADA KOŞAR -----------------
            // Open your Appium session here; run shows as "Running" on Builds.
            // Appium session'ını burada aç; koşum Builds'de "Running" görünür.
            Thread.sleep(Integer.parseInt(env("MERCURY_HOLD_SECONDS", "30")) * 1000L);
            // -------------------------------------------------------------------
        }
        finally {
            client.release(groupId); // always released / her durumda bırakılır
            System.out.println("Released group / Grup bırakıldı: " + groupId);
        }
    }
}
