package mercury;

import io.appium.java_client.AppiumBy;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.ios.IOSDriver;
import org.openqa.selenium.WebElement;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static mercury.MercuryClient.env;

/**
 * PASSING EXAMPLE TEST — opens Settings, taps into a sub-screen (iOS: "General"),
 * verifies it, exits 0. Run flips to "Finished" on the Builds page.
 * Usage: appium running on :4723, then
 *   mvn -q compile exec:java -Dexec.mainClass=mercury.SettingsTestPass
 * <p>
 * BAŞARILI ÖRNEK TEST — Ayarlar'ı açar, alt ekrana girer (iOS: "Genel"),
 * doğrular, exit 0 ile biter. Builds sayfasında "Finished" olur.
 */
public class SettingsTestPass {

    public static void main(String[] args) throws Exception {
        String runName = env("MERCURY_RUN",
            "settings-pass-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")));

        AppiumSession.withSession(runName, (driver, type) -> {
            if ("ios".equals(type)) {
                // Step 1: open Settings / Adım 1: Ayarlar'ı aç
                ((IOSDriver) driver).activateApp("com.apple.Preferences");
                System.out.println("Settings opened / Ayarlar açıldı");

                // Step 2: tap "General" ("Genel" on Turkish devices)
                driver.findElement(AppiumBy.xpath(
                    "//XCUIElementTypeCell[.//XCUIElementTypeStaticText[@name='General' or @name='Genel']]"
                )).click();
                System.out.println("Tapped 'General' / 'Genel'e tıklandı");

                // Step 3: verify the General screen / Adım 3: Genel ekranını doğrula
                driver.findElement(AppiumBy.xpath(
                    "//XCUIElementTypeNavigationBar[@name='General' or @name='Genel']"
                ));
                System.out.println("General screen verified / Genel ekranı doğrulandı");
            }
            else {
                // Step 1: open Settings / Adım 1: Ayarlar'ı aç
                AndroidDriver android = (AndroidDriver) driver;
                android.activateApp("com.android.settings");
                System.out.println("Settings opened / Ayarlar açıldı");

                // Step 2: verify Settings is in the foreground / Ayarlar önde mi?
                String pkg = android.getCurrentPackage();
                if (pkg == null || !pkg.contains("settings")) {
                    throw new AssertionError("Settings not in foreground (got " + pkg + ")");
                }

                // Step 3: tap the first visible entry (language independent)
                // Adım 3: görünen ilk ayar satırına tıkla (dil bağımsız)
                WebElement first = driver.findElement(AppiumBy.xpath("(//android.widget.TextView)[1]"));
                System.out.printf("Tapped '%s' / '%s' tıklandı%n", first.getText(), first.getText());
                first.click();
            }

            System.out.println();
            System.out.println("✅ TEST PASSED / TEST BAŞARILI");
        });
    }
}
