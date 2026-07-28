package mercury;

import io.appium.java_client.AppiumBy;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.ios.IOSDriver;
import org.openqa.selenium.NoSuchElementException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static mercury.MercuryClient.env;

/**
 * FAILING EXAMPLE TEST — opens Settings, then looks for a menu item that DOES
 * NOT exist. The lookup fails, the process exits 1 (CI marks it red) but the
 * device is STILL released, so it never stays stuck as reserved.
 * Usage: mvn -q compile exec:java -Dexec.mainClass=mercury.SettingsTestFail
 * <p>
 * BAŞARISIZ ÖRNEK TEST — Ayarlar'ı açar, VAR OLMAYAN bir menü öğesi arar.
 * Bulunamayınca exit 1 ile biter (CI kırmızı) ama cihaz YİNE DE bırakılır,
 * asla rezerve takılı kalmaz.
 */
public class SettingsTestFail {

    public static void main(String[] args) throws Exception {
        String runName = env("MERCURY_RUN",
            "settings-fail-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")));

        try {
            AppiumSession.withSession(runName, (driver, type) -> {
                // Step 1: open Settings / Adım 1: Ayarlar'ı aç
                if ("ios".equals(type)) {
                    ((IOSDriver) driver).activateApp("com.apple.Preferences");
                }
                else {
                    ((AndroidDriver) driver).activateApp("com.android.settings");
                }
                System.out.println("Settings opened / Ayarlar açıldı");

                // Step 2: look for a menu that does not exist — INTENTIONAL FAILURE.
                // Adım 2: olmayan bir menü ara — KASITLI HATA.
                driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5)); // fail fast
                String xpath = "ios".equals(type)
                    ? "//XCUIElementTypeStaticText[@name='Nonexistent Menu Item']"
                    : "//android.widget.TextView[@text='Nonexistent Menu Item']";
                driver.findElement(AppiumBy.xpath(xpath)); // ← throws / hata fırlatır

                System.out.println("This line is never reached / Bu satıra asla gelinmez");
            });
        }
        catch (NoSuchElementException e) {
            System.out.println();
            System.out.println("❌ TEST FAILED (expected) / TEST BAŞARISIZ (beklenen)");
            System.out.println("Reason / Sebep: element not found");
            System.out.println("Note / Not: device was still released above / cihaz yine de yukarıda bırakıldı");
            System.exit(1);
        }
    }
}
