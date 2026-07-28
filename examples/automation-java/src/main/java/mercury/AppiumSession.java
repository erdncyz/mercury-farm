package mercury;

import com.google.gson.JsonObject;
import io.appium.java_client.AppiumDriver;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.options.UiAutomator2Options;
import io.appium.java_client.ios.IOSDriver;
import io.appium.java_client.ios.options.XCUITestOptions;

import java.net.URL;
import java.time.Duration;
import java.util.List;

import static mercury.MercuryClient.env;
import static mercury.MercuryClient.envSerials;

/**
 * Shared helper for the example tests: reserve 1 device on Mercury, open an
 * Appium session, hand the driver to the test, then quit + release ALWAYS.
 * Appium server must be running: appium --address 127.0.0.1 --port 4723
 * <p>
 * Örnek testler için ortak yardımcı: Mercury'den 1 cihaz ayırır, Appium
 * session'ı açar, driver'ı teste verir; sonunda HER DURUMDA quit + release.
 * Appium server çalışıyor olmalı: appium --address 127.0.0.1 --port 4723
 */
public final class AppiumSession {

    @FunctionalInterface
    public interface TestBody {
        void run(AppiumDriver driver, String type) throws Exception;
    }

    private AppiumSession() {}

    public static void withSession(String runName, TestBody body) throws Exception {
        MercuryClient client = new MercuryClient();
        String type = env("MERCURY_TYPE", "android"); // android | ios
        List<String> serials = envSerials();

        // 1) Reserve a device / Cihaz ayır
        MercuryClient.Reservation reservation = client.reserve(
            runName,
            Integer.parseInt(env("MERCURY_TIMEOUT", "600")),
            1,
            type,
            serials.isEmpty() ? List.of() : serials.subList(0, 1),
            env("CI_JOB_URL", null)
        );
        String groupId = reservation.groupId();
        JsonObject device = reservation.devices().get(0);
        String serial = device.get("serial").getAsString();
        System.out.printf("Reserved / Ayrıldı: %s (%s) — group=%s%n",
            serial, device.get("model").getAsString(), groupId);

        try {
            // 2) Automation mode + connect address / Automation modu + bağlantı adresi
            String remote = client.useDevice(serial);
            System.out.println("remoteConnectUrl: " + remote);

            URL appiumUrl = new URL(env("APPIUM_URL", "http://127.0.0.1:4723"));
            AppiumDriver driver;
            if ("ios".equals(type)) {
                // iOS: Appium dials WDA directly / Appium WDA'ya doğrudan bağlanır
                XCUITestOptions options = new XCUITestOptions()
                    .setUdid(serial)
                    .setNewCommandTimeout(Duration.ofSeconds(300));
                options.setCapability("appium:webDriverAgentUrl", remote);
                driver = new IOSDriver(appiumUrl, options);
            }
            else {
                Adb.connect(remote);
                UiAutomator2Options options = new UiAutomator2Options()
                    .setUdid(remote)
                    .setNewCommandTimeout(Duration.ofSeconds(300))
                    .setNoReset(true);
                driver = new AndroidDriver(appiumUrl, options);
            }

            // 3) Run the test / Testi koştur — run shows as "Running" on Builds.
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
            try {
                body.run(driver, type);
            }
            finally {
                driver.quit();
            }
        }
        finally {
            // 4) ALWAYS release / Test patlasa bile HER DURUMDA bırakılır
            client.release(groupId);
            System.out.println("Released group / Grup bırakıldı: " + groupId);
        }
    }
}
