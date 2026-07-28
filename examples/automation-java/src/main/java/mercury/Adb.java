package mercury;

/** Tiny adb helper / Küçük adb yardımcısı. */
final class Adb {
    private Adb() {}

    /**
     * Android: adb must connect on the MACHINE where Appium runs.
     * Android: adb, Appium'un çalıştığı MAKİNEDE bağlanmalı.
     */
    static void connect(String remote) {
        try {
            Process p = new ProcessBuilder("adb", "connect", remote).inheritIO().start();
            if (p.waitFor() != 0) {
                throw new RuntimeException("adb connect failed / başarısız: " + remote);
            }
        }
        catch (RuntimeException e) {
            throw e;
        }
        catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
