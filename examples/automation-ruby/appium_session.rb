# ==============================================================================
# Shared helper for the example tests: reserve 1 device on Mercury, open an
# Appium session, yield the driver to the test, then quit + release ALWAYS.
# Requires the Appium client gem:  gem install appium_lib_core
# Appium server must be running:   appium --address 127.0.0.1 --port 4723
#
# ==============================================================================
# Örnek testler için ortak yardımcı: Mercury'den 1 cihaz ayırır, Appium
# session'ı açar, driver'ı teste verir; sonunda HER DURUMDA quit + release.
# Appium client gem'i gerekir:      gem install appium_lib_core
# Appium server çalışıyor olmalı:   appium --address 127.0.0.1 --port 4723
require_relative 'mercury_client'
require 'appium_lib_core'

def mercury_ios_wda_url(remote)
  remote.start_with?('http://', 'https://') ? remote : "http://#{remote}"
end

# EN: adb connect must run on the machine where the Appium SERVER runs.
#     Local Appium (default)   -> connect here.
#     Central Appium (remote)  -> run it on the Appium host over SSH when
#     MERCURY_ADB_SSH=user@host is set; otherwise assume the Appium host is
#     already connected and only warn.
# TR: adb connect, Appium SERVER'ın çalıştığı makinede koşmalı.
#     Lokal Appium (varsayılan) -> burada bağlan.
#     Merkezi Appium (uzak)      -> MERCURY_ADB_SSH=user@host verildiyse
#     komut SSH ile Appium hostunda çalışır; verilmediyse bağlantının
#     Appium hostunda hazır olduğu varsayılır ve sadece uyarı basar.
def mercury_android_adb_connect(remote, appium_url)
  appium_host = URI(appium_url).host
  if ['127.0.0.1', 'localhost', '::1'].include?(appium_host)
    system('adb', 'connect', remote) || raise('adb connect failed / başarısız')
  elsif !ENV['MERCURY_ADB_SSH'].to_s.empty?
    ssh_target = ENV['MERCURY_ADB_SSH']
    system('ssh', ssh_target, "adb connect #{remote}") ||
      raise("ssh #{ssh_target} 'adb connect #{remote}' failed / başarısız")
  else
    warn "[warn] APPIUM_URL uzak (#{appium_host}): 'adb connect #{remote}' Appium hostunda çalışmış olmalı. " \
         'Otomatik yaptırmak için MERCURY_ADB_SSH=user@host tanımla / must already be connected on the Appium host.'
  end
end

def with_mercury_appium_session(run_name:)
  client  = MercuryClient.new
  requested_type = ENV['MERCURY_TYPE']
  serials = ENV['MERCURY_SERIALS'].to_s.split(',').map(&:strip).reject(&:empty?)

  # 1) Reserve a device / Cihaz ayır
  reservation = client.reserve(
    run: run_name,
    run_url: ENV['CI_JOB_URL'],
    project: ENV['MERCURY_PROJECT'],   # groups runs on Builds / Builds'de koşumları gruplar
    timeout: Integer(ENV.fetch('MERCURY_TIMEOUT', '600')),
    amount: 1,
    type: requested_type || 'android',
    serials: serials.first(1)
  )
  group_id = reservation[:group_id]
  device   = reservation[:devices].first
  serial   = device['serial']
  type     = client.device_type(device, requested: requested_type)
  puts "Reserved / Ayrıldı: #{serial} (#{device['model']} / #{device['version']}) — group=#{group_id}"

  begin
    # 2) Automation mode + connect address / Automation modu + bağlantı adresi
    remote = client.use_device(serial)
    puts "remoteConnectUrl: #{remote}"
    appium_url = ENV.fetch('APPIUM_URL', 'http://127.0.0.1:4723')

    caps =
      if type == 'ios'
        remote = mercury_ios_wda_url(remote)
        {
          platformName: 'iOS',
          'appium:automationName' => 'XCUITest',
          'appium:udid' => serial,
          # iOS: Appium dials WDA directly, no extra connect step.
          # iOS: Appium WDA'ya doğrudan bağlanır, ek adım yok.
          'appium:webDriverAgentUrl' => remote,
          'appium:newCommandTimeout' => 300
        }
      else
        # Android: adb must connect on the machine where Appium runs.
        # Android: adb, Appium'un çalıştığı makinede bağlanmalı.
        mercury_android_adb_connect(remote, appium_url)
        {
          platformName: 'Android',
          'appium:automationName' => 'UiAutomator2',
          'appium:udid' => remote,
          'appium:newCommandTimeout' => 300,
          'appium:noReset' => true
        }
      end

    # 3) Appium session — run shows as "Running" on Builds, watch it live.
    # 3) Appium session — koşum Builds'de "Running" görünür, canlı izlenebilir.
    core = Appium::Core.for(
      caps: caps,
      appium_lib: {server_url: appium_url}
    )
    driver = core.start_driver
    driver.manage.timeouts.implicit_wait = 10 # element bekleme / element wait (s)
    begin
      yield driver, type
    ensure
      driver.quit
    end
  ensure
    # 4) ALWAYS release, even when the test fails. $! reports the outcome as
    #    a PASSED/FAILED badge, and the scenario shows under the run on Builds.
    # 4) Test patlasa bile cihaz HER DURUMDA bırakılır. $! sonucu PASSED/FAILED
    #    rozeti olur; senaryo Builds'de koşumun altında listelenir.
    begin
      client.report_scenarios(group_id, [{ name: run_name, status: $! ? 'failed' : 'passed' }])
    rescue StandardError => e
      warn "scenario report warning / senaryo raporu uyarısı: #{e.message}"
    end
    client.release(group_id, result: $! ? 'failed' : 'passed')
    puts "Released group / Grup bırakıldı: #{group_id}"
  end
end
