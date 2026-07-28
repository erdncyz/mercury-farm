package mercury;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Mercury Automation API client — mirrors examples/automation-ruby/mercury_client.rb.
 * Full documentation: docs/automation-api.md
 * <p>
 * Mercury Otomasyon API istemcisi — examples/automation-ruby/mercury_client.rb ile birebir.
 * Tam doküman: docs/automation-api.md
 * <p>
 * Required env vars / Zorunlu ortam değişkenleri:
 * MERCURY_BASE_URL (e.g./örn. https://YOUR_DOMAIN), MERCURY_TOKEN
 */
public class MercuryClient {

    /** Reservation result / Rezervasyon sonucu — keep groupId for release! */
    public record Reservation(String groupId, List<JsonObject> devices) {}

    private final String baseUrl;
    private final String token;
    private final HttpClient http = HttpClient.newHttpClient();
    private final Gson gson = new Gson();

    public MercuryClient() {
        this(requireEnv("MERCURY_BASE_URL"), requireEnv("MERCURY_TOKEN"));
    }

    public MercuryClient(String baseUrl, String token) {
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.token = token;
    }

    /**
     * Reserve devices; the run appears on the Builds page under {@code run}.
     * Two modes: amount+type (filter) OR serials (specific devices, ignores amount/type).
     * <p>
     * Cihaz ayırır; koşum Builds sayfasında {@code run} adıyla görünür.
     * İki mod: amount+type (filtre) VEYA serials (belirli cihazlar; amount/type yok sayılır).
     */
    public Reservation reserve(String run, int timeoutSeconds, int amount,
                               String type, List<String> serials, String runUrl) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("run", run);
        params.put("timeout", String.valueOf(timeoutSeconds));
        if (serials != null && !serials.isEmpty()) {
            params.put("serials", String.join(",", serials));
        }
        else {
            params.put("amount", String.valueOf(amount));
            params.put("need_amount", "true");
            // android | ios — always set for platform-specific runs, otherwise ANY
            // free device (including the other platform) can be picked.
            // android | ios — platforma özel koşularda MUTLAKA ver, yoksa boştaki
            // herhangi bir cihaz (diğer platform dahil) seçilebilir.
            if (type != null && !type.isEmpty()) {
                params.put("type", type);
            }
        }
        if (runUrl != null && !runUrl.isEmpty()) {
            params.put("runUrl", runUrl);
        }

        JsonObject body = request("GET", "/api/v1/autotests", params, null);
        JsonObject group = body.getAsJsonObject("group");
        List<JsonObject> devices = new ArrayList<>();
        group.getAsJsonArray("devices").forEach(e -> devices.add(e.getAsJsonObject()));
        if (devices.isEmpty()) {
            throw new IllegalStateException("No device captured / Cihaz ayrılamadı");
        }
        return new Reservation(group.get("id").getAsString(), devices);
    }

    /**
     * Put device into automation mode. Android → address for `adb connect`;
     * iOS → value for the appium:webDriverAgentUrl capability.
     * <p>
     * Cihazı automation moduna alır. Android → `adb connect` adresi;
     * iOS → appium:webDriverAgentUrl capability değeri.
     */
    public String useDevice(String serial) {
        JsonObject body = new JsonObject();
        body.addProperty("serial", serial);
        return request("POST", "/api/v1/autotests/useDevice", Map.of(), body)
            .get("remoteConnectUrl").getAsString();
    }

    /**
     * Release the group and all devices; run flips to "Finished" on Builds.
     * Always call from a finally block!
     * <p>
     * Grubu ve tüm cihazları bırakır; Builds'de koşum "Finished" olur.
     * Her zaman finally bloğunda çağır!
     */
    public void release(String groupId) {
        if (groupId == null) {
            return;
        }
        request("DELETE", "/api/v1/autotests", Map.of("group", groupId), null);
    }

    private JsonObject request(String method, String path, Map<String, String> params, JsonObject body) {
        try {
            StringBuilder qs = new StringBuilder();
            for (Map.Entry<String, String> e : params.entrySet()) {
                qs.append(qs.isEmpty() ? "?" : "&")
                  .append(URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8))
                  .append('=')
                  .append(URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8));
            }
            HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(baseUrl + path + qs))
                .header("Accept", "application/json")
                .header("Authorization", "Bearer " + token);
            if (body != null) {
                b.header("Content-Type", "application/json")
                 .method(method, HttpRequest.BodyPublishers.ofString(gson.toJson(body)));
            }
            else {
                b.method(method, HttpRequest.BodyPublishers.noBody());
            }
            HttpResponse<String> res = http.send(b.build(), HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() < 200 || res.statusCode() >= 300) {
                throw new RuntimeException(
                    "Mercury API " + method + " " + path + " -> HTTP " + res.statusCode() + ": " + res.body());
            }
            String text = res.body();
            return (text == null || text.isEmpty()) ? new JsonObject() : gson.fromJson(text, JsonObject.class);
        }
        catch (RuntimeException e) {
            throw e;
        }
        catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    static String requireEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isEmpty()) {
            throw new IllegalStateException("Missing env var / Eksik ortam değişkeni: " + name);
        }
        return value;
    }

    static String env(String name, String fallback) {
        String value = System.getenv(name);
        return (value == null || value.isEmpty()) ? fallback : value;
    }

    static List<String> envSerials() {
        List<String> out = new ArrayList<>();
        for (String s : env("MERCURY_SERIALS", "").split(",")) {
            if (!s.strip().isEmpty()) {
                out.add(s.strip());
            }
        }
        return out;
    }
}
