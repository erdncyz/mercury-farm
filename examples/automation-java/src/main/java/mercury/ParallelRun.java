package mercury;

import com.google.gson.JsonObject;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static mercury.MercuryClient.env;
import static mercury.MercuryClient.envSerials;

/**
 * PARALLEL RUN — reserve N devices in one group, drive each in its own thread,
 * release the group once at the end.
 * Usage / Çalıştırma:
 *   export MERCURY_BASE_URL=... MERCURY_TOKEN=... MERCURY_TYPE=android
 *   export MERCURY_AMOUNT=2            (non-admins max 2 / admin değilsen en fazla 2)
 *   # specific devices / belirli cihazlar: export MERCURY_SERIALS=SERIAL_A,SERIAL_B
 *   mvn -q compile exec:java -Dexec.mainClass=mercury.ParallelRun
 * <p>
 * ÇOKLU (PARALEL) KOŞUM — N cihazı tek grupta ayır, her cihazı ayrı thread'de
 * koştur, sonunda grubu tek seferde bırak. Tekli için / single run: {@link SingleRun}
 */
public class ParallelRun {

    public static void main(String[] args) throws Exception {
        MercuryClient client = new MercuryClient();
        List<String> serials = envSerials();
        String runName = env("MERCURY_RUN",
            "parallel-run-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")));

        MercuryClient.Reservation reservation = client.reserve(
            runName,
            Integer.parseInt(env("MERCURY_TIMEOUT", "900")),
            Integer.parseInt(env("MERCURY_AMOUNT", "2")),
            env("MERCURY_TYPE", null),
            serials,                                            // if given, exactly these / verildiyse tam bunlar
            env("CI_JOB_URL", null)
        );

        String groupId = reservation.groupId();
        List<JsonObject> devices = reservation.devices();
        System.out.printf("Group %s — %d devices%n", groupId, devices.size());

        ExecutorService pool = Executors.newFixedThreadPool(devices.size());
        try {
            List<Future<?>> futures = new ArrayList<>();
            for (JsonObject device : devices) {
                futures.add(pool.submit(() -> {
                    String serial = device.get("serial").getAsString();
                    String remote = client.useDevice(serial);
                    System.out.printf("[%s] remoteConnectUrl: %s%n", serial, remote);

                    if ("ios".equals(env("MERCURY_TYPE", ""))) {
                        System.out.printf("[%s] Appium capability: appium:webDriverAgentUrl = %s%n", serial, remote);
                    }
                    else {
                        Adb.connect(remote);
                        // Note: for parallel Appium sessions use different appium:systemPort
                        // values or a separate Appium port per device.
                        // Not: paralel Appium session'ları için farklı appium:systemPort
                        // değerleri ver ya da cihaz başına ayrı Appium portu aç.
                    }

                    // ---- TESTS FOR THIS DEVICE / BU CİHAZIN TESTLERİ ------------
                    Thread.sleep(Integer.parseInt(env("MERCURY_HOLD_SECONDS", "30")) * 1000L);
                    // --------------------------------------------------------------
                    System.out.printf("[%s] done / tamamlandı%n", serial);
                    return null;
                }));
            }

            int errors = 0;
            for (Future<?> f : futures) {
                try {
                    f.get();
                }
                catch (Exception e) {
                    errors++;
                    System.err.println("ERROR / HATA: " + e.getCause());
                }
            }
            if (errors > 0) {
                throw new RuntimeException(errors + " devices had errors / cihazda hata oluştu");
            }
        }
        finally {
            pool.shutdownNow();
            client.release(groupId); // one call frees the whole group / tek çağrı tüm grubu bırakır
            System.out.println("Released group / Grup bırakıldı: " + groupId);
        }
    }
}
