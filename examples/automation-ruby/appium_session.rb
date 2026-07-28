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

def with_mercury_appium_session(run_name:)
  client  = MercuryClient.new
  requested_type = ENV['MERCURY_TYPE']
  serials = ENV['MERCURY_SERIALS'].to_s.split(',').map(&:strip).reject(&:empty?)

  # 1) Reserve a device / Cihaz ayır
  reservation = client.reserve(
    run: run_name,
    run_url: ENV['CI_JOB_URL'],
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

    caps =
      if type == 'ios'
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
        system('adb', 'connect', remote) || raise('adb connect failed / başarısız')
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
      appium_lib: {server_url: ENV.fetch('APPIUM_URL', 'http://127.0.0.1:4723')}
    )
    driver = core.start_driver
    driver.manage.timeouts.implicit_wait = 10 # element bekleme / element wait (s)
    begin
      yield driver, type
    ensure
      driver.quit
    end
  ensure
    # 4) ALWAYS release, even when the test fails.
    # 4) Test patlasa bile cihaz HER DURUMDA bırakılır.
    client.release(group_id)
    puts "Released group / Grup bırakıldı: #{group_id}"
  end
end
